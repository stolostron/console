/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useMemo } from 'react'
import { PathParam, generatePath, useLocation, useNavigate, useParams } from 'react-router-dom-v5-compat'
import {
  ACM_ENABLED_FEATURES,
  AgentK8sResource,
  BareMetalHostK8sResource,
  ClusterDeploymentDetailsValues,
  ClusterDeploymentWizard,
  ClusterDeploymentWizardStepsType,
  ClusterImageSetK8sResource,
  FeatureGateContextProvider,
  LoadingState,
  getAgentsHostsNames,
  isAgentOfInfraEnv,
} from '@openshift-assisted/ui-lib/cim'
import { PageSection, Switch } from '@patternfly/react-core'
import { AcmErrorBoundary, AcmPageContent, AcmPage, AcmPageHeader } from '../../../../../../ui-components'

import { IResource, patchResource } from '../../../../../../resources'
import {
  fetchSecret,
  getClusterDeploymentLink,
  getOnCreateBMH,
  getOnSaveISOParams,
  onApproveAgent,
  onDiscoveryHostsNext,
  onHostsNext,
  onSaveAgent,
  onSaveBMH,
  onSaveNetworking,
  useClusterDeployment,
  useAgentClusterInstall,
  fetchInfraEnv,
  fetchManagedClusters,
  fetchKlusterletAddonConfig,
  useOnDeleteHost,
  useAssistedServiceConfigMap,
  useClusterDeploymentInfraEnv,
  importYaml,
  onSetInstallationDiskId,
  useProvisioningConfiguration,
  onEditFinish,
} from '../../CreateCluster/components/assisted-installer/utils'
import EditAgentModal from './EditAgentModal'
import { NavigationPath } from '../../../../../../NavigationPath'
import { useTranslation } from '../../../../../../lib/acm-i18next'
import { getInfraEnvNMStates } from '../../../../InfraEnvironments/utils'
import { BulkActionModal, BulkActionModalProps } from '../../../../../../components/BulkActionModal'
import { useSharedAtoms, useRecoilValue } from '../../../../../../shared-recoil'
import { DOC_VERSION } from '../../../../../../lib/doc-util'

const TEMPLATE_EDITOR_OPEN_COOKIE = 'yaml'

const EditAICluster: React.FC = () => {
  const { search } = useLocation()
  const { name = '', namespace = '' } = useParams<PathParam<NavigationPath.editCluster>>()
  const searchParams = new URLSearchParams(search)
  const { t } = useTranslation()
  const [patchingHoldInstallation, setPatchingHoldInstallation] = useState(true)
  const navigate = useNavigate()
  const { agentsState, clusterImageSetsState, nmStateConfigsState, clusterCuratorsState } = useSharedAtoms()
  const [editAgent, setEditAgent] = useState<AgentK8sResource | undefined>()
  const clusterImageSets = useRecoilValue(clusterImageSetsState)
  const agents = useRecoilValue(agentsState)
  const nmStateConfigs = useRecoilValue(nmStateConfigsState)
  const clusterCurators = useRecoilValue(clusterCuratorsState)
  const aiConfigMap = useAssistedServiceConfigMap()

  const clusterDeployment = useClusterDeployment({ name, namespace })
  const agentClusterInstall = useAgentClusterInstall({ name, namespace })
  const infraEnv = useClusterDeploymentInfraEnv(
    clusterDeployment?.metadata?.name!,
    clusterDeployment?.metadata?.namespace!
  )

  const infraNMStates = useMemo(() => getInfraEnvNMStates(nmStateConfigs, infraEnv), [nmStateConfigs, infraEnv])

  const usedHostnames = useMemo(() => getAgentsHostsNames(agents), [agents])

  const [isPreviewOpen, setPreviewOpen] = useState(!!localStorage.getItem(TEMPLATE_EDITOR_OPEN_COOKIE))
  const provisioningConfigResult = useProvisioningConfiguration()

  const onSaveDetails = (values: ClusterDeploymentDetailsValues) => {
    return patchResource(agentClusterInstall as IResource, [
      {
        op: 'replace',
        path: '/spec/imageSetRef/name',
        value: values.openshiftVersion,
      },
    ]).promise
  }

  // Specific for the AI flow which has single&dedicated InfraEnv per Cluster
  const agentsOfSingleInfraEnvCluster = useMemo(
    () =>
      agents.filter((a) =>
        // TODO(mlibra): extend here once we can "disable" hosts
        isAgentOfInfraEnv(infraEnv, a)
      ),
    [agents, infraEnv]
  )

  const [bulkModalProps, setBulkModalProps] = useState<
    BulkActionModalProps<AgentK8sResource | BareMetalHostK8sResource> | { open: false }
  >({ open: false })
  const onDeleteHost = useOnDeleteHost(setBulkModalProps, [], agentClusterInstall, infraNMStates)

  const hostActions = {
    onEditHost: (agent: AgentK8sResource) => {
      setEditAgent(agent)
    },
    onEditRole: (agent: AgentK8sResource, role: string | undefined) => {
      return patchResource(agent as IResource, [
        {
          op: 'replace',
          path: '/spec/role',
          value: role,
        },
      ]).promise as Promise<AgentK8sResource>
    },
    onDeleteHost,
    onSetInstallationDiskId,
  }

  useEffect(() => {
    const patch = async () => {
      if (agentClusterInstall) {
        try {
          if (!agentClusterInstall.spec?.holdInstallation) {
            await patchResource(agentClusterInstall as IResource, [
              {
                op: agentClusterInstall.spec?.holdInstallation === false ? 'replace' : 'add',
                path: '/spec/holdInstallation',
                value: true,
              },
            ]).promise
          }
        } finally {
          setPatchingHoldInstallation(false)
        }
      }
    }
    patch()
  }, [
    // just once but when the ACI is loaded
    !!agentClusterInstall,
  ])

  const isNutanix = agentClusterInstall?.spec?.platformType === 'Nutanix'

  const clusterCurator = clusterCurators.find((c) => c.metadata?.namespace === namespace)

  return patchingHoldInstallation || !clusterDeployment || !agentClusterInstall ? (
    <LoadingState />
  ) : (
    <AcmPage
      hasDrawer
      header={
        <AcmPageHeader
          breadcrumb={[
            { text: t('Clusters'), to: NavigationPath.clusters },
            {
              text: clusterDeployment?.metadata?.name!,
              to: generatePath(NavigationPath.clusterDetails, { name, namespace }),
            },
            {
              text: t('managed.ai.editCluster.configurationBreadcrumb'),
            },
          ]}
          title={t('managed.ai.editCluster.title')}
          switches={
            <Switch
              label={`YAML: ${isPreviewOpen ? 'On' : 'Off'}`}
              isChecked={isPreviewOpen}
              onChange={(checked) => {
                setPreviewOpen(checked)
                if (checked) {
                  localStorage.setItem(TEMPLATE_EDITOR_OPEN_COOKIE, 'true')
                } else {
                  localStorage.removeItem(TEMPLATE_EDITOR_OPEN_COOKIE)
                }
              }}
            />
          }
        />
      }
    >
      <AcmErrorBoundary>
        <AcmPageContent id="edit-cluster">
          <PageSection variant="light" type="wizard" isFilled>
            <BulkActionModal<AgentK8sResource | BareMetalHostK8sResource> {...bulkModalProps} />
            {/* @ts-expect-error @openshift-assisted/ui-lib needs React 18 updates */}
            <FeatureGateContextProvider features={ACM_ENABLED_FEATURES}>
              <ClusterDeploymentWizard
                className="cluster-deployment-wizard"
                clusterImages={clusterImageSets as ClusterImageSetK8sResource[]}
                clusterDeployment={clusterDeployment}
                agentClusterInstall={agentClusterInstall}
                agents={agents}
                usedClusterNames={[] /* We are in Edit flow - cluster name can not be changed. */}
                onClose={() => navigate(-1)}
                onSaveDetails={onSaveDetails}
                onSaveNetworking={(values) => onSaveNetworking(agentClusterInstall, values, isNutanix)}
                onSaveHostsSelection={(values) =>
                  onHostsNext({ values, clusterDeployment, agents, agentClusterInstall })
                }
                onApproveAgent={onApproveAgent}
                onSaveAgent={onSaveAgent}
                onSaveBMH={onSaveBMH}
                onCreateBMH={
                  infraEnv ? getOnCreateBMH(infraEnv) : undefined
                } /* AI Flow specific. Not called for CIM. */
                onSaveISOParams={
                  infraEnv ? getOnSaveISOParams(infraEnv) : undefined /* AI Flow specific. Not called for CIM. */
                }
                onSaveHostsDiscovery={() =>
                  onDiscoveryHostsNext({
                    clusterDeployment,
                    agents: agentsOfSingleInfraEnvCluster,
                    agentClusterInstall,
                  })
                }
                fetchSecret={fetchSecret}
                infraNMStates={infraNMStates}
                getClusterDeploymentLink={getClusterDeploymentLink}
                hostActions={hostActions}
                onFinish={async () => {
                  const aci = await onEditFinish(agentClusterInstall, clusterCurator)
                  navigate(generatePath(NavigationPath.clusterDetails, { name, namespace }))
                  return aci
                }}
                aiConfigMap={aiConfigMap}
                infraEnv={infraEnv}
                initialStep={(searchParams.get('initialStep') as ClusterDeploymentWizardStepsType) || undefined}
                fetchInfraEnv={fetchInfraEnv}
                isPreviewOpen={isPreviewOpen}
                setPreviewOpen={setPreviewOpen}
                fetchManagedClusters={fetchManagedClusters}
                fetchKlusterletAddonConfig={fetchKlusterletAddonConfig}
                onCreateBmcByYaml={importYaml}
                docVersion={DOC_VERSION}
                provisioningConfigResult={provisioningConfigResult}
                isNutanix={isNutanix}
              />
              <EditAgentModal agent={editAgent} setAgent={setEditAgent} usedHostnames={usedHostnames} />
            </FeatureGateContextProvider>
          </PageSection>
        </AcmPageContent>
      </AcmErrorBoundary>
    </AcmPage>
  )
}

export default EditAICluster
