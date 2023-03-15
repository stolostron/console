/* Copyright Contributors to the Open Cluster Management project */
import { makeStyles } from '@mui/styles'
import { PageSection, Modal, ModalVariant } from '@patternfly/react-core'
import { AcmErrorBoundary, AcmPage, AcmPageContent, AcmPageHeader, Provider } from '../../../../../ui-components'
import Handlebars from 'handlebars'
import { cloneDeep, get, keyBy, set } from 'lodash'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'
import 'monaco-editor/esm/vs/editor/editor.all.js'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
// include monaco editor
import MonacoEditor from 'react-monaco-editor'
import { generatePath, useHistory } from 'react-router-dom'
import TemplateEditor from '../../../../../components/TemplateEditor'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { createCluster } from '../../../../../lib/create-cluster'
import { DOC_LINKS } from '../../../../../lib/doc-util'
import { PluginContext } from '../../../../../lib/PluginContext'
import { NavigationPath, useBackCancelNavigation } from '../../../../../NavigationPath'
import {
  ClusterCurator,
  createClusterCurator,
  createResource as createResourceTool,
  IResource,
  ProviderConnection,
  Secret,
} from '../../../../../resources'
import { useCanJoinClusterSets, useMustJoinClusterSet } from '../../ClusterSets/components/useCanJoinClusterSets'
// template/data
import { append, arrayItemHasKey, setAvailableConnections } from './controlData/ControlDataHelpers'
import endpointTemplate from './templates/endpoints.hbs'
import hiveTemplate from './templates/hive-template.hbs'
import hypershiftTemplate from './templates/assisted-installer/hypershift-template.hbs'
import cimTemplate from './templates/assisted-installer/cim-template.hbs'
import aiTemplate from './templates/assisted-installer/ai-template.hbs'
import { Warning, WarningContext, WarningContextType } from './Warning'
import {
  HypershiftAgentContext,
  useHypershiftContextValues,
} from './components/assisted-installer/hypershift/HypershiftAgentContext'

import './style.css'
import getControlDataAWS from './controlData/ControlDataAWS'
import getControlDataGCP from './controlData/ControlDataGCP'
import getControlDataAZR from './controlData/ControlDataAZR'
import getControlDataVMW from './controlData/ControlDataVMW'
import getControlDataOST from './controlData/ControlDataOST'
import getControlDataRHV from './controlData/ControlDataRHV'
import getControlDataHypershift from './controlData/ControlDataHypershift'
import getControlDataCIM from './controlData/ControlDataCIM'
import getControlDataAI from './controlData/ControlDataAI'
import { CredentialsForm } from '../../../../Credentials/CredentialsForm'
import { GetProjects } from '../../../../../components/GetProjects'
import { useSharedAtoms, useRecoilState, useRecoilValue, useSharedSelectors } from '../../../../../shared-recoil'
import {
  ClusterInfrastructureType,
  HostInventoryInfrastructureType,
  getCredentialsTypeForClusterInfrastructureType,
} from '../ClusterInfrastructureType'

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

export default function CreateCluster(props: { infrastructureType: ClusterInfrastructureType }) {
  const { infrastructureType } = props
  const history = useHistory()
  const { back, cancel } = useBackCancelNavigation()
  const { agentClusterInstallsState, infraEnvironmentsState, managedClustersState, secretsState, settingsState } =
    useSharedAtoms()
  const {
    ansibleCredentialsValue,
    clusterCuratorSupportedCurationsValue,
    providerConnectionsValue,
    validClusterCuratorTemplatesValue,
  } = useSharedSelectors()
  const secrets = useRecoilValue(secretsState)
  const providerConnections = useRecoilValue(providerConnectionsValue)
  const ansibleCredentials = useRecoilValue(ansibleCredentialsValue)
  const { isACMAvailable } = useContext(PluginContext)
  const templateEditorRef = useRef<null>()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newSecret, setNewSecret] = useState<Secret>()

  const { projects } = GetProjects()

  // setup translation
  const { t } = useTranslation()
  const generateBreadCrumb = (hcType: string, path: any) => {
    return {
      text: t('Control plane type - {{hcType}}', { hcType: hcType }),
      to: path,
    }
  }
  const controlPlaneBreadCrumbBM = generateBreadCrumb('Host Inventory', NavigationPath.createBMControlPlane)
  const controlPlaneBreadCrumbAWS = generateBreadCrumb('AWS', NavigationPath.createAWSControlPlane)

  const hostsBreadCrumb = { text: t('Hosts'), to: NavigationPath.createDiscoverHost }

  const settings = useRecoilValue(settingsState)
  const supportedCurations = useRecoilValue(clusterCuratorSupportedCurationsValue)
  const managedClusters = useRecoilValue(managedClustersState)
  const validCuratorTemplates = useRecoilValue(validClusterCuratorTemplatesValue)
  const [selectedConnection, setSelectedConnection] = useState<ProviderConnection>()
  const onControlChange = useCallback(
    (control: any) => {
      if (control.id === 'connection') {
        if (newSecret && control.setActive) {
          control.setActive(newSecret.metadata.name)
        }
        setSelectedConnection(providerConnections.find((provider) => control.active === provider.metadata.name))
      }
    },
    [providerConnections, setSelectedConnection, newSecret]
  )
  const [agentClusterInstalls] = useRecoilState(agentClusterInstallsState)
  const [infraEnvs] = useRecoilState(infraEnvironmentsState)
  const [warning, setWarning] = useState<WarningContextType>()
  const hypershiftValues = useHypershiftContextValues()

  // if a connection is added outside of wizard, add it to connection selection
  const [connectionControl, setConnectionControl] = useState()
  useEffect(() => {
    if (connectionControl) {
      setAvailableConnections(connectionControl, secrets)
      onControlChange(connectionControl)
    }
  }, [connectionControl, onControlChange, secrets])

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
      const matchedAgentClusterInstall = agentClusterInstalls.find((mc) => mc.metadata?.name === clusterName)

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
        const automationCredentials = createResources.filter((resource) => isAutomationCredential(resource)) as Secret[]

        // add source labels to secrets, add backup labels
        createResources.forEach((resource) => {
          if (resource.kind === 'Secret') {
            set(resource, 'metadata.labels["cluster.open-cluster-management.io/backup"]', 'cluster')
            const resourceName = resource?.metadata?.name

            // install-config is not copied; toweraccess secrets already include these labels
            if (resourceName && !(resourceName.includes('install-config') || resourceName.includes('toweraccess-'))) {
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
          const namespace = cluster?.metadata?.namespace
          if (!noRedirect && clusterName && namespace) {
            setTimeout(() => {
              history.push(
                generatePath(NavigationPath.clusterDetails, {
                  name: clusterName,
                  namespace,
                })
              )
            }, 2000)
          }
        }

        return status
      }
    }
  }

  // cancel button
  const cancelCreate = cancel(NavigationPath.clusters)

  //compile templates
  let template = Handlebars.compile(hiveTemplate)
  Handlebars.registerPartial('endpoints', Handlebars.compile(endpointTemplate))
  Handlebars.registerHelper('arrayItemHasKey', arrayItemHasKey)
  Handlebars.registerHelper('append', append)

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
      case 'templateName': {
        const availableData = validCuratorTemplates
        // TODO: Need to keep namespace information
        control.available = availableData.map((curatorTemplate) => curatorTemplate.metadata.name)
        control.availableData = availableData
        control.availableSecrets = ansibleCredentials
        break
      }
      case 'supportedCurations':
        control.active = cloneDeep(supportedCurations)
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
                const isAssistedFlow = map.InfraEnv
                createResource(resourceJSON, true, t('Saving cluster draft...'), t('Cluster draft saved')).then(
                  (status) => {
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
                  }
                )
                return
              }
            }
            resolve('ERROR')
          })
        }
        break
    }
  }

  useEffect(() => {
    if (
      (infrastructureType === HostInventoryInfrastructureType.CIM ||
        infrastructureType === HostInventoryInfrastructureType.CIMHypershift) &&
      !isInfraEnvAvailable
    ) {
      setWarning({
        title: t('cim.infra.missing.warning.title'),
        text: t('cim.infra.missing.warning.text'),
        linkText: t('cim.infra.manage.link'),
        linkTo: NavigationPath.infraEnvironments,
      })
    } else {
      setWarning(undefined)
    }
  }, [infrastructureType, isInfraEnvAvailable, t])

  let controlData: any[] = []
  const breadcrumbs = [
    { text: t('Clusters'), to: NavigationPath.clusters },
    { text: t('Infrastructure'), to: NavigationPath.createCluster },
  ]

  const backButtonOverride = back(NavigationPath.clusters)

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen)
  }
  switch (infrastructureType) {
    case Provider.aws:
      breadcrumbs.push(controlPlaneBreadCrumbAWS)
      controlData = getControlDataAWS(
        t,
        handleModalToggle,
        true,
        settings.awsPrivateWizardStep === 'enabled',
        settings.singleNodeOpenshift === 'enabled',
        isACMAvailable
      )
      break
    case Provider.gcp:
      controlData = getControlDataGCP(
        t,
        handleModalToggle,
        true,
        isACMAvailable,
        settings.singleNodeOpenshift === 'enabled'
      )
      break
    case Provider.azure:
      controlData = getControlDataAZR(
        t,
        handleModalToggle,
        true,
        isACMAvailable,
        settings.singleNodeOpenshift === 'enabled'
      )
      break
    case Provider.vmware:
      controlData = getControlDataVMW(
        t,
        handleModalToggle,
        true,
        isACMAvailable,
        settings.singleNodeOpenshift === 'enabled'
      )
      break
    case Provider.openstack:
      controlData = getControlDataOST(
        t,
        handleModalToggle,
        true,
        isACMAvailable,
        settings.singleNodeOpenshift === 'enabled'
      )
      break
    case Provider.redhatvirtualization:
      controlData = getControlDataRHV(t, handleModalToggle, true, isACMAvailable)
      break
    case HostInventoryInfrastructureType.CIMHypershift:
      template = Handlebars.compile(hypershiftTemplate)
      controlData = getControlDataHypershift(t, handleModalToggle, <Warning />, true, isACMAvailable)
      breadcrumbs.push(controlPlaneBreadCrumbBM)
      break
    case HostInventoryInfrastructureType.CIM:
      template = Handlebars.compile(cimTemplate)
      controlData = getControlDataCIM(t, handleModalToggle, <Warning />, isACMAvailable)
      breadcrumbs.push(controlPlaneBreadCrumbBM)
      break
    case HostInventoryInfrastructureType.AI:
      template = Handlebars.compile(aiTemplate)
      controlData = getControlDataAI(t, handleModalToggle, isACMAvailable)
      breadcrumbs.push(controlPlaneBreadCrumbBM, hostsBreadCrumb)
      break
  }

  breadcrumbs.push({ text: t('page.header.create-cluster'), to: NavigationPath.emptyPath })

  // cluster set dropdown won't update without this
  if (canJoinClusterSets === undefined || mustJoinClusterSet === undefined) {
    return null
  }

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
          breadcrumb={breadcrumbs}
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
                <Modal
                  variant={ModalVariant.large}
                  showClose={false}
                  isOpen={isModalOpen}
                  aria-labelledby="modal-wizard-label"
                  aria-describedby="modal-wizard-description"
                  onClose={handleModalToggle}
                  hasNoBodyWrapper
                >
                  <CredentialsForm
                    namespaces={projects}
                    isEditing={false}
                    isViewing={false}
                    credentialsType={getCredentialsTypeForClusterInfrastructureType(infrastructureType)}
                    handleModalToggle={handleModalToggle}
                    hideYaml={true}
                    newCredentialCallback={setNewSecret}
                  />
                </Modal>
                <TemplateEditor
                  wizardClassName={classes.wizardBody}
                  type={'cluster'}
                  title={t('Cluster YAML')}
                  monacoEditor={<MonacoEditor />}
                  controlData={controlData}
                  template={template}
                  portals={Portals}
                  createControl={{
                    createResource,
                    cancelCreate,
                    pauseCreate: () => {},
                    creationStatus: creationStatus?.status,
                    creationMsg: creationStatus?.messages,
                    resetStatus: () => {
                      setCreationStatus(undefined)
                    },
                    backButtonOverride,
                  }}
                  logging={process.env.NODE_ENV !== 'production'}
                  i18n={t}
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
