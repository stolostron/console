/* Copyright Contributors to the Open Cluster Management project */
import { makeStyles } from '@material-ui/styles'
import { PageSection } from '@patternfly/react-core'
import { AcmErrorBoundary, AcmPage, AcmPageContent, AcmPageHeader } from '../../../../../ui-components'
import Handlebars from 'handlebars'
import { get, keyBy, set } from 'lodash'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'
import 'monaco-editor/esm/vs/editor/editor.all.js'
import { CIM } from 'openshift-assisted-ui-lib'
import { useContext, useEffect, useRef, useState } from 'react'
// include monaco editor
import MonacoEditor from 'react-monaco-editor'
import { useHistory, useLocation } from 'react-router-dom'
import { useRecoilState, useRecoilValue } from 'recoil'
import TemplateEditor from '../../../../../components/TemplateEditor'
import {
    agentClusterInstallsState,
    infraEnvironmentsState,
    managedClustersState,
    secretsState,
    settingsState,
} from '../../../../../atoms'
import { clusterCuratorTemplatesValue } from '../../../../../selectors'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { createCluster } from '../../../../../lib/create-cluster'
import { DOC_LINKS } from '../../../../../lib/doc-util'
import { PluginContext } from '../../../../../lib/PluginContext'
import { NavigationPath } from '../../../../../NavigationPath'
import {
    ClusterCurator,
    createClusterCurator,
    createResource as createResourceTool,
    IResource,
    ProviderConnection,
    Secret,
    unpackProviderConnection,
} from '../../../../../resources'
import { useCanJoinClusterSets, useMustJoinClusterSet } from '../../ClusterSets/components/useCanJoinClusterSets'
// template/data
import { getControlData } from './controlData/ControlData'
import { append, arrayItemHasKey, setAvailableConnections } from './controlData/ControlDataHelpers'
import endpointTemplate from './templates/endpoints.hbs'
import hiveTemplate from './templates/hive-template.hbs'
import { Warning, WarningContext, WarningContextType } from './Warning'
import {
    HypershiftAgentContext,
    useHypershiftContextValues,
} from './components/assisted-installer/hypershift/HypershiftAgentContext'

import './style.css'

const { isAIFlowInfraEnv } = CIM

interface CreationStatus {
    status: string
    messages: any[] | null
}

// where to put Create/Cancel buttons
const Portals = Object.freeze({
    editBtn: 'edit-button-portal-id',
    createBtn: 'create-button-portal-id',
    cancelBtn: 'cancel-button-portal-id',
})

const useStyles = makeStyles({
    wizardBody: {
        '& .pf-c-wizard__outer-wrap .pf-c-wizard__main .pf-c-wizard__main-body': {
            height: '100%',
        },
    },
})

export default function CreateClusterPage() {
    const history = useHistory()
    const location = useLocation()
    const [secrets] = useRecoilState(secretsState)
    const { isACMAvailable } = useContext(PluginContext)
    const templateEditorRef = useRef<null>()

    // setup translation
    const { t } = useTranslation()
    const i18n = (key: string, arg: any) => {
        return t(key, arg)
    }

    // if a connection is added outside of wizard, add it to connection selection
    const [connectionControl, setConnectionControl] = useState()
    useEffect(() => {
        if (connectionControl) {
            setAvailableConnections(connectionControl, secrets)
        }
    }, [connectionControl, secrets])

    const providerConnections = secrets.map(unpackProviderConnection)
    const ansibleCredentials = providerConnections.filter(
        (providerConnection) =>
            providerConnection.metadata?.labels?.['cluster.open-cluster-management.io/type'] === 'ans' &&
            !providerConnection.metadata?.labels?.['cluster.open-cluster-management.io/copiedFromSecretName']
    )

    const [settings] = useRecoilState(settingsState)
    type Curation = 'install' | 'upgrade' | 'scale' | 'destroy'
    const basicCurations: Curation[] = ['install', 'upgrade']
    const allCurations: Curation[] = [...basicCurations, 'scale', 'destroy']
    const supportedCurations = settings.ansibleIntegration === 'enabled' ? allCurations : basicCurations

    const [managedClusters] = useRecoilState(managedClustersState)
    const curatorTemplates = useRecoilValue(clusterCuratorTemplatesValue)
    const [, setSelectedTemplate] = useState('')
    const [selectedConnection, setSelectedConnection] = useState<ProviderConnection>()
    const [agentClusterInstalls] = useRecoilState(agentClusterInstallsState)
    const [infraEnvs] = useRecoilState(infraEnvironmentsState)
    const [warning, setWarning] = useState<WarningContextType>()
    const hypershiftValues = useHypershiftContextValues()

    // Is there a way how to get this without fetching all InfraEnvs?
    const isInfraEnvAvailable = !!infraEnvs?.length

    const classes = useStyles()
    // create portals for buttons in header
    const switches = (
        <div className="switch-controls">
            <div id={Portals.editBtn} />
        </div>
    )

    const portals = (
        <div className="portal-controls">
            <div id={Portals.cancelBtn} />
            <div id={Portals.createBtn} />
        </div>
    )

    // create button
    const [creationStatus, setCreationStatus] = useState<CreationStatus>()
    const createResource = async (
        resourceJSON: { createResources: IResource[] },
        noRedirect: boolean,
        inProgressMsg?: string,
        completedMsg?: string
    ) => {
        if (resourceJSON) {
            const { createResources } = resourceJSON
            const map = keyBy(createResources, 'kind')
            const cluster = map?.ClusterDeployment || map?.HostedCluster
            const clusterName = cluster?.metadata?.name

            // return error if cluster name is already used
            const matchedManagedCluster = managedClusters.find((mc) => mc.metadata.name === clusterName)
            const matchedAgentClusterInstall = agentClusterInstalls.find((mc) => mc.metadata.name === clusterName)

            if (matchedManagedCluster || matchedAgentClusterInstall) {
                setCreationStatus({
                    status: 'ERROR',
                    messages: [{ message: t('The cluster name is already used by another cluster.') }],
                })
                return 'ERROR'
            } else {
                const isClusterCurator = (resource: any) => {
                    return resource.kind === 'ClusterCurator'
                }
                const isAutomationCredential = (resource: any) => {
                    return resource.kind === 'Secret' && resource.metadata.name.startsWith('toweraccess-')
                }
                const clusterResources = createResources.filter(
                    (resource) => !(isClusterCurator(resource) || isAutomationCredential(resource))
                )
                const clusterCurator = createResources.find((resource) => isClusterCurator(resource)) as ClusterCurator
                const automationCredentials = createResources.filter((resource) =>
                    isAutomationCredential(resource)
                ) as Secret[]

                // Check if an 'install' curation will be run
                if (clusterCurator?.spec?.desiredCuration === 'install') {
                    // set installAttemptsLimit to 0
                    clusterResources.forEach((resource) => {
                        if (resource?.kind === 'ClusterDeployment') {
                            set(resource, 'spec.installAttemptsLimit', 0)
                        }
                    })
                }

                // add source labels to secrets, add backup labels
                createResources.forEach((resource) => {
                    if (resource.kind === 'Secret') {
                        set(resource, 'metadata.labels["cluster.open-cluster-management.io/backup"]', 'cluster')
                        const resourceName = resource?.metadata?.name

                        // install-config is not copied; toweraccess secrets already include these labels
                        if (
                            resourceName &&
                            !(resourceName.includes('install-config') || resourceName.includes('toweraccess-'))
                        ) {
                            set(
                                resource,
                                'metadata.labels["cluster.open-cluster-management.io/copiedFromNamespace"]',
                                selectedConnection?.metadata.namespace!
                            )
                            set(
                                resource,
                                'metadata.labels["cluster.open-cluster-management.io/copiedFromSecretName"]',
                                selectedConnection?.metadata.name!
                            )
                        }
                    }
                })

                const progressMessage = inProgressMsg ? [inProgressMsg] : []
                setCreationStatus({ status: 'IN_PROGRESS', messages: progressMessage })

                // creates managedCluster, deployment, secrets etc...
                const { status, messages } = await createCluster(clusterResources)

                if (status === 'ERROR') {
                    setCreationStatus({ status, messages })
                } else if (status !== 'ERROR' && clusterCurator) {
                    setCreationStatus({
                        status: 'IN_PROGRESS',
                        messages: [t('Setting up automation...')],
                    })

                    createClusterCurator(clusterCurator)
                    automationCredentials.forEach((ac) => createResourceTool<Secret>(ac))
                }

                // redirect to created cluster
                if (status === 'DONE') {
                    const finishMessage = completedMsg ? [completedMsg] : []
                    setCreationStatus({ status, messages: finishMessage })
                    if (!noRedirect) {
                        setTimeout(() => {
                            history.push(NavigationPath.clusterDetails.replace(':id', clusterName as string))
                        }, 2000)
                    }
                }

                return status
            }
        }
    }

    // cancel button
    const cancelCreate = () => {
        history.push(NavigationPath.clusters)
    }

    //compile templates
    const template = Handlebars.compile(hiveTemplate)
    Handlebars.registerPartial('endpoints', Handlebars.compile(endpointTemplate))
    Handlebars.registerHelper('arrayItemHasKey', arrayItemHasKey)
    Handlebars.registerHelper('append', append)

    // if opened from bma page, pass selected bma's to editor
    const urlParams = new URLSearchParams(location.search.substring(1))
    const bmasParam = urlParams.get('bmas')
    const requestedUIDs = bmasParam ? bmasParam.split(',') : []
    const fetchControl = bmasParam
        ? {
              isLoaded: true,
              fetchData: { requestedUIDs },
          }
        : null

    const { canJoinClusterSets } = useCanJoinClusterSets()
    const mustJoinClusterSet = useMustJoinClusterSet()
    function onControlInitialize(control: any) {
        switch (control.id) {
            case 'connection':
                setConnectionControl(control)
                break
            case 'clusterSet':
                if (control.available) {
                    control.available = canJoinClusterSets?.map((mcs) => mcs.metadata.name) ?? []
                    control.validation.required = mustJoinClusterSet ?? false
                }
                break
            case 'infrastructure':
                control?.available?.forEach((provider: any) => {
                    const providerData: any = control?.availableMap[provider]
                    providerData?.change?.insertControlData?.forEach((ctrl: any) => {
                        if (ctrl.id === 'connection') {
                            setAvailableConnections(ctrl, secrets)
                        }
                    })
                })
                break
            case 'templateName': {
                const availableData = curatorTemplates.filter((curatorTemplate) =>
                    supportedCurations.every(
                        // each curation with any hooks must have a secret reference and the secret must exist
                        (curation) =>
                            !(
                                curatorTemplate?.spec?.[curation]?.prehook?.length ||
                                curatorTemplate?.spec?.[curation]?.posthook?.length
                            ) ||
                            (curatorTemplate?.spec?.[curation]?.towerAuthSecret &&
                                ansibleCredentials.find(
                                    (secret) =>
                                        secret.metadata.name === curatorTemplate?.spec?.[curation]?.towerAuthSecret &&
                                        secret.metadata.namespace === curatorTemplate.metadata.namespace
                                ))
                    )
                )
                // TODO: Need to keep namespace information
                control.available = availableData.map((curatorTemplate) => curatorTemplate.metadata.name)
                control.availableData = availableData
                control.availableSecrets = ansibleCredentials
                break
            }
            case 'supportedCurations':
                control.active = supportedCurations
                break
            case 'singleNodeFeatureFlag':
                if (settings.singleNodeOpenshift === 'enabled') {
                    control.active = true
                }
                break
            case 'reviewSave':
                control.mutation = () => {
                    return new Promise((resolve) => {
                        if (templateEditorRef.current) {
                            const resourceJSON = (templateEditorRef.current as any)?.getResourceJSON()
                            if (resourceJSON) {
                                const { createResources } = resourceJSON
                                const map = keyBy(createResources, 'kind')
                                const clusterName = get(map, 'ClusterDeployment.metadata.name')
                                const clusterNamespace = get(map, 'ClusterDeployment.metadata.namespace')
                                const isAssistedFlow = isAIFlowInfraEnv(map.InfraEnv)
                                createResource(
                                    resourceJSON,
                                    true,
                                    t('Saving cluster draft...'),
                                    t('Cluster draft saved')
                                ).then((status) => {
                                    if (status === 'ERROR') {
                                        resolve(status)
                                    } else {
                                        setTimeout(() => {
                                            const params = new URLSearchParams({
                                                initialStep: isAssistedFlow ? 'hosts-discovery' : 'hosts-selection',
                                            })
                                            resolve(status)
                                            setCreationStatus(undefined)
                                            history.push(
                                                `${NavigationPath.editCluster
                                                    .replace(':namespace', clusterNamespace as string)
                                                    .replace(':name', clusterName as string)}?${params.toString()}`
                                            )
                                        }, 250)
                                    }
                                })
                                return
                            }
                        }
                        resolve('ERROR')
                    })
                }
                break
        }
    }

    // cluster set dropdown won't update without this
    if (canJoinClusterSets === undefined || mustJoinClusterSet === undefined) {
        return null
    }

    function onControlChange(control: any) {
        switch (control.id) {
            case 'templateName':
                setSelectedTemplate(control.active)
                break
            case 'connection':
                setSelectedConnection(providerConnections.find((provider) => control.active === provider.metadata.name))
                break
        }
    }

    const onControlSelect = (control: any) => {
        if (control.controlId === 'infrastructure') {
            if (
                (control.active?.includes('CIM') || control.active?.includes('CIM-Hypershift')) &&
                !isInfraEnvAvailable
            ) {
                setWarning({
                    title: t('cim.infra.missing.warning.title'),
                    text: t('cim.infra.missing.warning.text'),
                    linkText: t('cim.infra.manage.link'),
                    linkTo: NavigationPath.infraEnvironments,
                })
            } else if (control.active?.includes('BMC')) {
                setWarning({
                    title: t('bareMetalAsset.warning.title'),
                    text: t('bareMetalAsset.warning.text'),
                    linkText: t('Learn more'),
                    linkTo: DOC_LINKS.CREATE_CLUSTER_ON_PREMISE,
                    isExternalLink: true,
                })
            } else {
                setWarning(undefined)
            }
        }
    }

    const controlData = getControlData(
        <Warning />,
        onControlSelect,
        settings.awsPrivateWizardStep === 'enabled',
        settings.singleNodeOpenshift === 'enabled',
        isACMAvailable /* includeKlusterletAddonConfig */
    )

    return (
        <AcmPage
            header={
                <AcmPageHeader
                    title={t('page.header.create-cluster')}
                    titleTooltip={
                        <>
                            {t('page.header.create-cluster.tooltip')}
                            <a
                                href={DOC_LINKS.CREATE_CLUSTER}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'block', marginTop: '4px' }}
                            >
                                {t('learn.more')}
                            </a>
                        </>
                    }
                    breadcrumb={[
                        { text: t('Clusters'), to: NavigationPath.clusters },
                        { text: t('page.header.create-cluster'), to: '' },
                    ]}
                    switches={switches}
                    actions={portals}
                />
            }
        >
            <AcmErrorBoundary>
                <AcmPageContent id="create-cluster">
                    <PageSection variant="light" isFilled type="wizard">
                        <WarningContext.Provider value={warning}>
                            <HypershiftAgentContext.Provider value={hypershiftValues}>
                                <TemplateEditor
                                    wizardClassName={classes.wizardBody}
                                    type={'cluster'}
                                    title={'Cluster YAML'}
                                    monacoEditor={<MonacoEditor />}
                                    controlData={controlData}
                                    template={template}
                                    portals={Portals}
                                    fetchControl={fetchControl}
                                    createControl={{
                                        createResource,
                                        cancelCreate,
                                        pauseCreate: () => {},
                                        creationStatus: creationStatus?.status,
                                        creationMsg: creationStatus?.messages,
                                        resetStatus: () => {
                                            setCreationStatus(undefined)
                                        },
                                    }}
                                    logging={process.env.NODE_ENV !== 'production'}
                                    i18n={i18n}
                                    onControlInitialize={onControlInitialize}
                                    onControlChange={onControlChange}
                                    ref={templateEditorRef}
                                    controlProps={selectedConnection}
                                />
                            </HypershiftAgentContext.Provider>
                        </WarningContext.Provider>
                    </PageSection>
                </AcmPageContent>
            </AcmErrorBoundary>
        </AcmPage>
    )
}
