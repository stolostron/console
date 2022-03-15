/* Copyright Contributors to the Open Cluster Management project */
import { AcmErrorBoundary, AcmPageContent, AcmPage, AcmPageHeader } from '@stolostron/ui-components'
import { PageSection } from '@patternfly/react-core'
import Handlebars from 'handlebars'
import { get, keyBy } from 'lodash'
import { useContext, useState, useRef, useEffect } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { useRecoilState } from 'recoil'
// include monaco editor
import MonacoEditor from 'react-monaco-editor'
import 'monaco-editor/esm/vs/editor/editor.all.js'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'
import { useHistory, useLocation } from 'react-router-dom'
import TemplateEditor from 'temptifly'
import 'temptifly/dist/styles.css'
//import TemplateEditor from 'C:/Users/jswanke/git2/temptifly/src' //'temptifly'
import { DOC_LINKS } from '../../../../../lib/doc-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { useCanJoinClusterSets, useMustJoinClusterSet } from '../../ClusterSets/components/useCanJoinClusterSets'
// template/data
import { getControlData } from './controlData/ControlData'
import { setAvailableConnections, arrayItemHasKey } from './controlData/ControlDataHelpers'
import './style.css'
import hiveTemplate from './templates/hive-template.hbs'
import endpointTemplate from './templates/endpoints.hbs'
import {
    secretsState,
    managedClustersState,
    clusterCuratorsState,
    agentClusterInstallsState,
    infraEnvironmentsState,
    settingsState,
} from '../../../../../atoms'
import { makeStyles } from '@material-ui/styles'
import { ClusterCurator, filterForTemplatedCurators, createClusterCurator } from '../../../../../resources'
import { createCluster } from '../../../../../lib/create-cluster'
import { ProviderConnection, unpackProviderConnection } from '../../../../../resources'
import { Secret } from '../../../../../resources'
import { createResource as createResourceTool } from '../../../../../resources'
import { WarningContext, WarningContextType, Warning } from './Warning'
import { CIM } from 'openshift-assisted-ui-lib'
import { PluginContext } from '../../../../../lib/PluginContext'

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
            providerConnection.metadata?.labels?.['cluster.open-cluster-management.io/type'] === 'ans'
    )

    const [settings] = useRecoilState(settingsState)

    const [managedClusters] = useRecoilState(managedClustersState)
    const [clusterCurators] = useRecoilState(clusterCuratorsState)
    const curatorTemplates = filterForTemplatedCurators(clusterCurators)
    const [selectedTemplate, setSelectedTemplate] = useState('')
    const [selectedConnection, setSelectedConnection] = useState<ProviderConnection>()
    const [agentClusterInstalls] = useRecoilState(agentClusterInstallsState)
    const [infraEnvs] = useRecoilState(infraEnvironmentsState)
    const [warning, setWarning] = useState<WarningContextType>()

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
        resourceJSON: { createResources: any[] },
        noRedirect: boolean,
        inProgressMsg?: string,
        completedMsg?: string
    ) => {
        if (resourceJSON) {
            const { createResources } = resourceJSON
            const map = keyBy(createResources, 'kind')
            const clusterName = get(map, 'ClusterDeployment.metadata.name')

            // return error if cluster name is already used
            const matchedManagedCluster = managedClusters.find((mc) => mc.metadata.name === clusterName)
            const matchedAgentClusterInstall = agentClusterInstalls.find((mc) => mc.metadata.name === clusterName)

            if (matchedManagedCluster || matchedAgentClusterInstall) {
                setCreationStatus({
                    status: 'ERROR',
                    messages: [{ message: `The cluster name is already used by another cluster.` }],
                })
                return 'ERROR'
            } else {
                // check if Template is selected
                if (selectedTemplate !== '') {
                    // set installAttemptsLimit to 0
                    createResources.forEach((resource) => {
                        if (resource.kind === 'ClusterDeployment') {
                            resource.spec.installAttemptsLimit = 0
                        }
                    })
                }

                // add source labels to secrets, add backup labels
                createResources.forEach((resource) => {
                    if (resource.kind === 'Secret') {
                        resource!.metadata.labels! = { 'cluster.open-cluster-management.io/backup': 'cluster' }

                        if (!resource!.metadata!.name.includes('install-config')) {
                            resource!.metadata!.labels['cluster.open-cluster-management.io/copiedFromNamespace'] =
                                selectedConnection?.metadata.namespace!
                            resource!.metadata.labels!['cluster.open-cluster-management.io/copiedFromSecretName'] =
                                selectedConnection?.metadata.name!
                        }
                    }
                })

                const progressMessage = inProgressMsg ? [inProgressMsg] : []
                setCreationStatus({ status: 'IN_PROGRESS', messages: progressMessage })

                // creates managedCluster, deployment, secrets etc...
                const { status, messages } = await createCluster(createResources)

                if (status === 'ERROR') {
                    setCreationStatus({ status, messages })
                } else if (status !== 'ERROR' && selectedTemplate !== '') {
                    setCreationStatus({
                        status: 'IN_PROGRESS',
                        messages: ['Running automation...'],
                    })
                    // get template, modifty it and create curator cluster namespace
                    const currentTemplate = curatorTemplates.find(
                        (template) => template.metadata.name === selectedTemplate
                    )
                    const currentTemplateMutable: ClusterCurator = JSON.parse(JSON.stringify(currentTemplate))
                    if (currentTemplateMutable.spec?.install?.towerAuthSecret)
                        currentTemplateMutable.spec.install.towerAuthSecret = 'toweraccess'
                    if (currentTemplateMutable.spec?.scale?.towerAuthSecret)
                        currentTemplateMutable.spec.scale.towerAuthSecret = 'toweraccess'
                    if (currentTemplateMutable.spec?.upgrade?.towerAuthSecret)
                        currentTemplateMutable.spec.upgrade.towerAuthSecret = 'toweraccess'
                    if (currentTemplateMutable.spec?.destroy?.towerAuthSecret)
                        currentTemplateMutable.spec.destroy.towerAuthSecret = 'toweraccess'
                    delete currentTemplateMutable.metadata.creationTimestamp
                    delete currentTemplateMutable.metadata.resourceVersion

                    currentTemplateMutable!.metadata.name = createResources[0].metadata.namespace
                    currentTemplateMutable!.metadata.namespace = createResources[0].metadata.namespace
                    currentTemplateMutable!.spec!.desiredCuration = 'install'

                    createClusterCurator(currentTemplateMutable)

                    // get ansible secret, modifty it and create it in cluster namespace
                    const ansibleSecret = ansibleCredentials.find(
                        (secret) => secret.metadata.name === currentTemplate?.spec?.install?.towerAuthSecret
                    )

                    if (ansibleSecret === undefined) {
                        setCreationStatus({
                            status: 'ERROR',
                            messages: [
                                'Your Ansible Automation Platform credential was deleted. Create a new template with an Ansible Automation Platform credential.',
                            ],
                        })
                        return status
                    }

                    const ansibleSecretMutable: Secret = JSON.parse(JSON.stringify(ansibleSecret))
                    ansibleSecretMutable!.metadata.name = 'toweraccess'
                    ansibleSecretMutable!.metadata.namespace = createResources[0].metadata.namespace
                    ansibleSecretMutable!.metadata.labels!['cluster.open-cluster-management.io/copiedFromNamespace'] =
                        ansibleSecret?.metadata.namespace!
                    ansibleSecretMutable!.metadata.labels!['cluster.open-cluster-management.io/copiedFromSecretName'] =
                        ansibleSecret?.metadata.name!

                    delete ansibleSecretMutable.metadata.creationTimestamp
                    delete ansibleSecretMutable.metadata.resourceVersion
                    delete ansibleSecretMutable.metadata.labels!['cluster.open-cluster-management.io/credentials']

                    createResourceTool<Secret>(ansibleSecretMutable)
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

    // setup translation
    const { t } = useTranslation()
    const i18n = (key: string, arg: any) => {
        return t(key, arg)
    }

    //compile templates
    const template = Handlebars.compile(hiveTemplate)
    Handlebars.registerPartial('endpoints', Handlebars.compile(endpointTemplate))
    Handlebars.registerHelper('arrayItemHasKey', arrayItemHasKey)

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
            case 'templateName':
                control.available = curatorTemplates.map((template) => {
                    const ansibleSecret = ansibleCredentials.find(
                        (secret) => secret.metadata.name === template?.spec?.install?.towerAuthSecret
                    )
                    if (ansibleSecret !== undefined) {
                        return template.metadata.name
                    }
                })
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
                                    'Saving cluster draft...',
                                    'Cluster draft saved'
                                ).then((status) => {
                                    if (status === 'ERROR') {
                                        resolve(status)
                                    } else {
                                        setTimeout(() => {
                                            resolve(status)
                                            setCreationStatus(undefined)
                                            history.push(
                                                NavigationPath.editCluster
                                                    .replace(':namespace', clusterNamespace as string)
                                                    .replace(':name', clusterName as string),
                                                { initialStep: isAssistedFlow ? 'hosts-discovery' : 'hosts-selection' }
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
            if (control.active?.includes('CIM') && !isInfraEnvAvailable) {
                setWarning({
                    title: t('cim.infra.missing.warning.title'),
                    text: t('cim.infra.missing.warning.text'),
                    linkText: t('cim.infra.manage.link'),
                    linkTo: NavigationPath.infraEnvironments,
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
                    <PageSection className="pf-c-content" variant="light" isFilled type="wizard">
                        <WarningContext.Provider value={warning}>
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
                        </WarningContext.Provider>
                    </PageSection>
                </AcmPageContent>
            </AcmErrorBoundary>
        </AcmPage>
    )
}
