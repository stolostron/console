/* Copyright Contributors to the Open Cluster Management project */
import { css } from '@emotion/css'
import { Modal, ModalVariant, PageSection } from '@patternfly/react-core'
import Handlebars from 'handlebars'
import { cloneDeep, get, keyBy, set } from 'lodash'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'
import 'monaco-editor/esm/vs/editor/editor.all.js'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AcmErrorBoundary, AcmPage, AcmPageContent, AcmPageHeader, Provider } from '../../../../../ui-components'
// include monaco editor
import MonacoEditor from 'react-monaco-editor'
import { generatePath, useNavigate } from 'react-router-dom-v5-compat'
import TemplateEditor from '../../../../../components/TemplateEditor'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { createCluster } from '../../../../../lib/create-cluster'
import { DOC_LINKS } from '../../../../../lib/doc-util'
import { PluginContext } from '../../../../../lib/PluginContext'
import { NavigationPath, useBackCancelNavigation } from '../../../../../NavigationPath'
import {
  ClusterCurator,
  createClusterCurator,
  IResource,
  ProviderConnection,
  Secret,
  SubscriptionOperator,
} from '../../../../../resources'
import { createResource as createResourceTool } from '../../../../../resources/utils'
import { useCanJoinClusterSets, useMustJoinClusterSet } from '../../ClusterSets/components/useCanJoinClusterSets'
// template/data
import {
  HypershiftAgentContext,
  useHypershiftContextValues,
} from './components/assisted-installer/hypershift/HypershiftAgentContext'
import { append, arrayItemHasKey, getName, setAvailableConnections } from './controlData/ControlDataHelpers'
import aiTemplate from './templates/assisted-installer/ai-template.hbs'
import cimTemplate from './templates/assisted-installer/cim-template.hbs'
import hypershiftTemplate from './templates/assisted-installer/hypershift-template.hbs'
import kubevirtTemplate from './templates/kubevirt-template.hbs'
import nutanixAiTemplate from './templates/assisted-installer/nutanix-ai-template.hbs'
import nutanixCimTemplate from './templates/assisted-installer/nutanix-cim-template.hbs'
import clusterCuratorTemplate from './templates/cluster-curator.hbs'
import endpointTemplate from './templates/endpoints.hbs'
import hiveTemplate from './templates/hive-template.hbs'
import { Warning, WarningContext, WarningContextType } from './Warning'

import jsyaml from 'js-yaml'
import { useProjects } from '../../../../../hooks/useProjects'
import { useRecoilValue, useSharedAtoms, useSharedSelectors } from '../../../../../shared-recoil'
import { CredentialsForm } from '../../../../Credentials/CredentialsForm'
import {
  ClusterInfrastructureType,
  getCredentialsTypeForClusterInfrastructureType,
  HostInventoryInfrastructureType,
} from '../ClusterInfrastructureType'
import { useAllClusters } from '../components/useAllClusters'
import getControlDataAI from './controlData/ControlDataAI'
import getControlDataAWS from './controlData/ControlDataAWS'
import getControlDataAZR from './controlData/ControlDataAZR'
import getControlDataCIM from './controlData/ControlDataCIM'
import getControlDataGCP from './controlData/ControlDataGCP'
import getControlDataHypershift from './controlData/ControlDataHypershift'
import { getControlDataKubeVirt } from './controlData/ControlDataKubeVirt'
import getControlDataOST from './controlData/ControlDataOST'
import getControlDataVMW from './controlData/ControlDataVMW'
import './style.css'
import { VALID_DNS_LABEL } from '../../../../../components/TemplateEditor/utils/validation-types'
// Register the custom 'and' helper
Handlebars.registerHelper('and', function (a, b) {
  return a && b
})
Handlebars.registerHelper('gt', function (value1, value2) {
  return value1 > value2
})
// Filter out empty entries
Handlebars.registerHelper('filter', function (array: any[]) {
  return array.filter((item: string) => item && item.trim() !== '')
})
// Get length of array
Handlebars.registerHelper('length', function (array) {
  return Array.isArray(array) ? array.length : 0
})

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

const wizardBody = css({
  '& .pf-v5-c-wizard__outer-wrap .pf-v5-c-wizard__main .pf-v5-c-wizard__main-body': {
    height: '100%',
  },
})

export default function CreateCluster(props: { infrastructureType: ClusterInfrastructureType }) {
  const { infrastructureType } = props
  const navigate = useNavigate()
  const { back, cancel } = useBackCancelNavigation()
  const allClusters = useAllClusters(true)
  const {
    agentClusterInstallsState,
    infraEnvironmentsState,
    managedClustersState,
    namespacesState,
    secretsState,
    settingsState,
    subscriptionOperatorsState,
  } = useSharedAtoms()
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

  const { projects } = useProjects()

  // setup translation
  const { t } = useTranslation()
  const generateBreadCrumb = (hcType: string, path: any) => {
    return {
      text: t('Control plane type - {{hcType}}', { hcType: hcType }),
      to: path,
    }
  }
  const controlPlaneBreadCrumbKubeVirt = generateBreadCrumb(
    'OpenShift Virtualization',
    NavigationPath.createKubeVirtControlPlane
  )
  const controlPlaneBreadCrumbBM = generateBreadCrumb('Host Inventory', NavigationPath.createBMControlPlane)
  const controlPlaneBreadCrumbNutanix = generateBreadCrumb('Nutanix', NavigationPath.createCluster)
  const controlPlaneBreadCrumbAWS = generateBreadCrumb('AWS', NavigationPath.createAWSControlPlane)

  const hostsBreadCrumb = { text: t('Hosts'), to: NavigationPath.createDiscoverHost }

  const settings = useRecoilValue(settingsState)
  const supportedCurations = useRecoilValue(clusterCuratorSupportedCurationsValue)
  const managedClusters = useRecoilValue(managedClustersState)
  const namespaces = useRecoilValue(namespacesState)
  const validCuratorTemplates = useRecoilValue(validClusterCuratorTemplatesValue)

  const subscriptionOperators = useRecoilValue(subscriptionOperatorsState)
  const isKubevirtEnabled = useMemo(() => {
    return (
      subscriptionOperators.findIndex(
        (operator: SubscriptionOperator) => operator.metadata.name === 'kubevirt-hyperconverged'
      ) > -1
    )
  }, [subscriptionOperators])

  const [selectedConnection, setSelectedConnection] = useState<ProviderConnection>()
  const onControlChange = useCallback(
    (control: any) => {
      if (control.id === 'connection') {
        if (newSecret && control.setActive) {
          const secretName = newSecret.metadata.name!
          if (control.available?.includes(secretName)) {
            control.setActive(newSecret.metadata.name)
            setNewSecret(undefined) // override with the new secret once
          }
        }
        setSelectedConnection(providerConnections.find((provider) => control.active === provider.metadata.name))
      } else if (control.id === 'kubevirt-operator-alert') {
        control.hidden = isKubevirtEnabled
      }
    },
    [providerConnections, setSelectedConnection, newSecret, isKubevirtEnabled]
  )
  const agentClusterInstalls = useRecoilValue(agentClusterInstallsState)
  const infraEnvs = useRecoilValue(infraEnvironmentsState)
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

  // If KubeVirt operator is installed/uninstalled toggle the Alert via control data
  const [kubeVirtOperatorControl, setKubeVirtOperatorControl] = useState<any>()
  useEffect(() => {
    if (kubeVirtOperatorControl) {
      onControlChange(kubeVirtOperatorControl)
    }
  }, [isKubevirtEnabled, kubeVirtOperatorControl, onControlChange])

  const localCluster = useMemo(() => allClusters.find((cls) => cls.name === 'local-cluster'), [allClusters])

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
      const clusterNamespace = cluster?.metadata?.namespace ?? 'clusters'

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
          const namespace = cluster?.metadata?.namespace ?? null
          if (!noRedirect && clusterName && clusterNamespace) {
            setTimeout(() => {
              navigate(
                generatePath(NavigationPath.clusterDetails, {
                  name: clusterName,
                  namespace: namespace,
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
  Handlebars.registerPartial('clusterCurator', Handlebars.compile(clusterCuratorTemplate))
  Handlebars.registerHelper('arrayItemHasKey', arrayItemHasKey)
  Handlebars.registerHelper('append', append)
  Handlebars.registerHelper('getName', getName)
  Handlebars.registerHelper('escapeYAML', (value) => jsyaml.dump(Array.isArray(value) ? value[0] : value))

  const { canJoinClusterSets } = useCanJoinClusterSets()
  const mustJoinClusterSet = useMustJoinClusterSet()

  const KubeVirtNamespaceRegExp = new RegExp(VALID_DNS_LABEL)

  function validateKubeVirtNamespace(active: any, _controlData: any, templateObjectMap: any) {
    if (templateObjectMap['<<main>>'].HostedCluster[0]) {
      const { name, namespace } = templateObjectMap['<<main>>'].HostedCluster[0].$raw.metadata
      if (name === namespace) return t('hosted.cluster.namespace.error')
      if (namespace && managedClusters.some((mc: any) => mc?.metadata?.name === namespace)) {
        return t('namespace.exists.error')
      }
      if (!KubeVirtNamespaceRegExp.test(active)) {
        return t('import.form.invalid.dns.label')
      }
    }
  }

  function validateAdditionalNetworks(active: string) {
    const parts = active.split('/')
    if (parts.length !== 2) {
      return t('Value must be in <namespace>/<name> format.')
    }

    const [namespace, name] = parts
    const dnsLabelRegex = new RegExp(VALID_DNS_LABEL)

    if (!dnsLabelRegex.test(namespace) || namespace.length > 63) {
      return t('namespace.invalid.dns.label')
    }

    if (!dnsLabelRegex.test(name) || name.length > 63) {
      return t('name.invalid.dns.label')
    }

    return undefined
  }

  function onControlInitialize(control: any) {
    switch (control.id) {
      case 'connection':
        setConnectionControl(control)
        break
      case 'namespace':
        if (infrastructureType === Provider.kubevirt) {
          control.validation = { contextTester: validateKubeVirtNamespace }
          //  only include namespaces that do not correspond to an existing managed cluster
          const hostedClusterNamespaces = namespaces.filter(
            (ns) => !managedClusters.find((mc) => mc.metadata.name === ns.metadata.name)
          )
          control.active = 'clusters'
          control.available = ['clusters', ...hostedClusterNamespaces.map((hcn) => hcn.metadata.name)]
        }
        break
      case 'additionalNetworks':
        if (infrastructureType === Provider.kubevirt) {
          control.validation = {
            contextTester: validateAdditionalNetworks,
            required: false,
          }
        }
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
      case 'kubevirt-operator-alert':
        setKubeVirtOperatorControl(control)
        break
      case 'reviewSave':
        control.mutation = () => {
          return new Promise((resolve) => {
            if (templateEditorRef.current) {
              const resourceJSON = (templateEditorRef.current as any)?.getResourceJSON()
              if (resourceJSON) {
                const { createResources } = resourceJSON
                const map = keyBy(createResources, 'kind')
                const clusterName =
                  get(map, 'ClusterDeployment.metadata.name') || get(map, 'HostedCluster.metadata.name')
                const clusterNamespace =
                  get(map, 'ClusterDeployment.metadata.namespace') || get(map, 'HostedCluster.metadata.name')
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
                        navigate({
                          pathname: generatePath(NavigationPath.editCluster, {
                            namespace: clusterNamespace!,
                            name: clusterName!,
                          }),
                          search: `?${params.toString()}`,
                        })
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
        infrastructureType === HostInventoryInfrastructureType.CIMHypershift ||
        infrastructureType === HostInventoryInfrastructureType.NutanixCIM) &&
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
    case HostInventoryInfrastructureType.CIMHypershift:
      template = Handlebars.compile(hypershiftTemplate)
      controlData = getControlDataHypershift(t, handleModalToggle, <Warning />, false, isACMAvailable)
      breadcrumbs.push(controlPlaneBreadCrumbBM)
      break
    case HostInventoryInfrastructureType.CIM:
      template = Handlebars.compile(cimTemplate)
      controlData = getControlDataCIM(t, handleModalToggle, <Warning />, isACMAvailable)
      breadcrumbs.push(controlPlaneBreadCrumbBM)
      break
    case HostInventoryInfrastructureType.NutanixCIM:
      template = Handlebars.compile(nutanixCimTemplate)
      controlData = getControlDataCIM(t, handleModalToggle, <Warning />, isACMAvailable, true)
      breadcrumbs.push(controlPlaneBreadCrumbNutanix)
      break
    case HostInventoryInfrastructureType.NutanixAI:
      template = Handlebars.compile(nutanixAiTemplate)
      controlData = getControlDataAI(t, handleModalToggle, isACMAvailable, true)
      breadcrumbs.push(controlPlaneBreadCrumbNutanix)
      break
    case HostInventoryInfrastructureType.AI:
      template = Handlebars.compile(aiTemplate)
      controlData = getControlDataAI(t, handleModalToggle, isACMAvailable)
      breadcrumbs.push(controlPlaneBreadCrumbBM, hostsBreadCrumb)
      break
    case Provider.kubevirt:
      template = Handlebars.compile(kubevirtTemplate)
      controlData = getControlDataKubeVirt(t, handleModalToggle, <Warning />, isACMAvailable, localCluster)
      breadcrumbs.push(controlPlaneBreadCrumbKubeVirt)
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
                  wizardClassName={wizardBody}
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
