/* Copyright Contributors to the Open Cluster Management project */
import { useState, useMemo } from 'react'
import { Card, CardBody, PageSection } from '@patternfly/react-core'
import { AcmPageContent } from '../../../../ui-components'
import { BulkActionModal, BulkActionModalProps } from '../../../../components/BulkActionModal'
import { DOC_VERSION } from '../../../../lib/doc-util'
import EditAgentModal from '../../Clusters/ManagedClusters/components/cim/EditAgentModal'
import { useOnUnbindHost } from '../../Clusters/ManagedClusters/CreateCluster/components/assisted-installer/unbindHost'
import {
  fetchSecret,
  getClusterDeploymentLink,
  onApproveAgent,
  onChangeBMHHostname,
  onMassDeleteHost,
  onSaveAgent,
  onSaveBMH,
  useAssistedServiceConfigMap,
  useOnDeleteHost,
} from '../../Clusters/ManagedClusters/CreateCluster/components/assisted-installer/utils'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import {
  AgentAlerts,
  AgentK8sResource,
  BareMetalHostK8sResource,
  EditBMHModal,
  InfoAndTroubleshootingNotification,
  InfraEnvAgentTable,
  getAgentsHostsNames,
} from '@openshift-assisted/ui-lib/cim'
import { useInfraEnvironmentDetailsContext } from './InfraEnvironmentDetailsPage'

const HostsTab: React.FC = () => {
  const {
    infraEnv,
    infraAgents,
    agentClusterInstalls,
    bareMetalHosts,
    infraNMStates = [],
  } = useInfraEnvironmentDetailsContext()
  const { agentMachinesState } = useSharedAtoms()
  const agentMachines = useRecoilValue(agentMachinesState)
  const [editBMH, setEditBMH] = useState<BareMetalHostK8sResource>()
  const [editAgent, setEditAgent] = useState<AgentK8sResource | undefined>()
  const [bulkModalProps, setBulkModalProps] = useState<
    BulkActionModalProps<AgentK8sResource | BareMetalHostK8sResource> | { open: false }
  >({ open: false })
  const onDeleteHost = useOnDeleteHost(setBulkModalProps, bareMetalHosts, undefined, infraNMStates)
  const onUnbindHost = useOnUnbindHost(setBulkModalProps, undefined, undefined)

  const usedHostnames = useMemo(() => getAgentsHostsNames(infraAgents, bareMetalHosts), [bareMetalHosts, infraAgents])
  const assistedServiceConfigMap = useAssistedServiceConfigMap()

  return (
    <>
      <BulkActionModal<AgentK8sResource | BareMetalHostK8sResource> {...bulkModalProps} />
      <AcmPageContent id="hosts">
        <PageSection>
          <Card isPlain>
            <AgentAlerts infraEnv={infraEnv} bareMetalHosts={bareMetalHosts} docVersion={DOC_VERSION} />
            {!!assistedServiceConfigMap && (
              <InfoAndTroubleshootingNotification assistedServiceConfigMap={assistedServiceConfigMap} />
            )}
          </Card>
          <br />
          <Card>
            <CardBody>
              <InfraEnvAgentTable
                agents={infraAgents}
                agentMachines={agentMachines}
                agentClusterInstalls={agentClusterInstalls}
                bareMetalHosts={bareMetalHosts}
                infraEnv={infraEnv}
                nmStates={infraNMStates}
                getClusterDeploymentLink={getClusterDeploymentLink}
                onEditHost={setEditAgent}
                onApprove={onApproveAgent}
                onDeleteHost={onDeleteHost}
                onEditBMH={setEditBMH}
                onUnbindHost={onUnbindHost}
                onChangeHostname={onSaveAgent}
                onChangeBMHHostname={onChangeBMHHostname}
                onMassDeleteHost={onMassDeleteHost}
              />
              <EditBMHModal
                infraEnv={infraEnv}
                bmh={editBMH}
                nmStates={infraNMStates}
                isOpen={!!editBMH}
                onClose={() => setEditBMH(undefined)}
                onEdit={onSaveBMH}
                fetchSecret={fetchSecret}
                usedHostnames={usedHostnames}
              />
              <EditAgentModal agent={editAgent} setAgent={setEditAgent} usedHostnames={usedHostnames} />
            </CardBody>
          </Card>
        </PageSection>
      </AcmPageContent>
    </>
  )
}

export default HostsTab
