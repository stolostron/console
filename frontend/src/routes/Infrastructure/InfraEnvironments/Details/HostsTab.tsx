/* Copyright Contributors to the Open Cluster Management project */
import { useState, useMemo } from 'react'
import { Card, CardBody, PageSection } from '@patternfly/react-core'
import { AcmPageContent } from '../../../../ui-components'
import { BulkActionModal, BulkActionModalProps } from '../../../../components/BulkActionModal'
import { DOC_VERSION } from '../../../../lib/doc-util'
import { useOnUnbindHost } from '../../Clusters/ManagedClusters/CreateCluster/components/assisted-installer/unbindHost'
import {
  fetchSecret,
  getClusterDeploymentLink,
  onApproveAgent,
  onChangeBMHHostname,
  onMassDeleteHost,
  onChangeHostname,
  onSaveBMH,
  useAssistedServiceConfigMap,
  useOnDeleteHost,
} from '../../Clusters/ManagedClusters/CreateCluster/components/assisted-installer/utils'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import {
  AgentAlerts,
  AgentK8sResource,
  BareMetalHostK8sResource,
  EditAgentModal,
  EditBMHModal,
  InfoAndTroubleshootingNotification,
  InfraEnvAgentTable,
  getAgentsHostsNames,
  onAgentChangeHostname,
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
        <PageSection hasBodyWrapper={false}>
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
                onChangeHostname={onChangeHostname}
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
              {editAgent && (
                <EditAgentModal
                  agent={editAgent}
                  usedHostnames={usedHostnames}
                  onClose={() => setEditAgent(undefined)}
                  onSave={onAgentChangeHostname([editAgent], bareMetalHosts, onChangeHostname, onChangeBMHHostname)}
                />
              )}
            </CardBody>
          </Card>
        </PageSection>
      </AcmPageContent>
    </>
  )
}

export default HostsTab
