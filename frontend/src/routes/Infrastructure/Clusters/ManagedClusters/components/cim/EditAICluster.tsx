/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useMemo } from 'react'
import { RouteComponentProps, StaticContext, useHistory, generatePath } from 'react-router'
import { CIM } from 'openshift-assisted-ui-lib'
import { ClusterDeploymentWizardStepsType, ClusterImageSetK8sResource } from 'openshift-assisted-ui-lib/cim'
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
} from '../../CreateCluster/components/assisted-installer/utils'
import EditAgentModal from './EditAgentModal'
import { NavigationPath } from '../../../../../../NavigationPath'
import { useTranslation } from '../../../../../../lib/acm-i18next'
import { getInfraEnvNMStates, isBMPlatform } from '../../../../InfraEnvironments/utils'
import { BulkActionModal, BulkActionModalProps } from '../../../../../../components/BulkActionModal'
import { useSharedAtoms, useSharedRecoil, useRecoilValue } from '../../../../../../shared-recoil'
import { DOC_VERSION } from '../../../../../../lib/doc-util'

const {
  ClusterDeploymentWizard,
  FeatureGateContextProvider,
  ACM_ENABLED_FEATURES,
  LoadingState,
  getAgentsHostsNames,
  isAgentOfInfraEnv,
} = CIM

const TEMPLATE_EDITOR_OPEN_COOKIE = 'yaml'

type EditAIClusterProps = RouteComponentProps<{ namespace: string; name: string }, StaticContext>

const EditAICluster: React.FC<EditAIClusterProps> = ({
  match: {
    params: { namespace, name },
  },
  location: { search },
}) => {
  const searchParams = new URLSearchParams(search)
  const { t } = useTranslation()
  const [patchingHoldInstallation, setPatchingHoldInstallation] = useState(true)
  const history = useHistory()
  const { agentsState, clusterImageSetsState, nmStateConfigsState, infrastructuresState } = useSharedAtoms()
  const [editAgent, setEditAgent] = useState<CIM.AgentK8sResource | undefined>()
  const { waitForAll } = useSharedRecoil()
  const [clusterImageSets, agents, nmStateConfigs, infrastructures] = useRecoilValue(
    waitForAll([clusterImageSetsState, agentsState, nmStateConfigsState, infrastructuresState])
  )
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

  const onSaveDetails = (values: CIM.ClusterDeploymentDetailsValues) => {
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
    BulkActionModalProps<CIM.AgentK8sResource | CIM.BareMetalHostK8sResource> | { open: false }
  >({ open: false })
  const onDeleteHost = useOnDeleteHost(setBulkModalProps, [], agentClusterInstall, infraNMStates)

  const hostActions = {
    onEditHost: (agent: CIM.AgentK8sResource) => {
      setEditAgent(agent)
    },
    onEditRole: (agent: CIM.AgentK8sResource, role: string | undefined) => {
      return patchResource(agent as IResource, [
        {
          op: 'replace',
          path: '/spec/role',
          value: role,
        },
      ]).promise as Promise<CIM.AgentK8sResource>
    },
    onDeleteHost,
    onSetInstallationDiskId: (agent: CIM.AgentK8sResource, diskId: string) => {
      return patchResource(agent as IResource, [
        {
          op: 'replace',
          path: '/spec/installation_disk_id',
          value: diskId,
        },
      ]).promise as Promise<CIM.AgentK8sResource>
    },
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

  const onFinish = async () => {
    const res = await patchResource(agentClusterInstall as IResource, [
      // effectively, the property gets deleted instead of holding "false" value by that change
      {
        op:
          agentClusterInstall?.spec?.holdInstallation || agentClusterInstall?.spec?.holdInstallation === false
            ? 'replace'
            : 'add',
        path: '/spec/holdInstallation',
        value: false,
      },
    ]).promise

    history.push(generatePath(NavigationPath.clusterDetails, { name, namespace }))
    return res as CIM.AgentClusterInstallK8sResource
  }

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
            <BulkActionModal<CIM.AgentK8sResource | CIM.BareMetalHostK8sResource> {...bulkModalProps} />
            <FeatureGateContextProvider features={ACM_ENABLED_FEATURES}>
              <ClusterDeploymentWizard
                className="cluster-deployment-wizard"
                clusterImages={clusterImageSets as ClusterImageSetK8sResource[]}
                clusterDeployment={clusterDeployment}
                agentClusterInstall={agentClusterInstall}
                agents={agents}
                usedClusterNames={[] /* We are in Edit flow - cluster name can not be changed. */}
                onClose={history.goBack}
                onSaveDetails={onSaveDetails}
                onSaveNetworking={(values) => onSaveNetworking(agentClusterInstall, values)}
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
                onFinish={onFinish}
                aiConfigMap={aiConfigMap}
                infraEnv={infraEnv}
                initialStep={(searchParams.get('initialStep') as ClusterDeploymentWizardStepsType) || undefined}
                fetchInfraEnv={fetchInfraEnv}
                isBMPlatform={isBMPlatform(infrastructures[0])}
                isPreviewOpen={isPreviewOpen}
                setPreviewOpen={setPreviewOpen}
                fetchManagedClusters={fetchManagedClusters}
                fetchKlusterletAddonConfig={fetchKlusterletAddonConfig}
                onCreateBmcByYaml={importYaml}
                docVersion={DOC_VERSION}
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
