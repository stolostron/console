/* Copyright Contributors to the Open Cluster Management project */
import { useState, useMemo } from 'react'
import { Card, CardBody, PageSection } from '@patternfly/react-core'
import { AcmPageContent } from '../../../../ui-components'
import { CIM } from 'openshift-assisted-ui-lib'
import { BulkActionModel, IBulkActionModelProps } from '../../../../components/BulkActionModel'
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
    useOnDeleteHost,
} from '../../Clusters/ManagedClusters/CreateCluster/components/assisted-installer/utils'
import { isBMPlatform } from '../utils'

const {
    HostsNotShowingLink,
    InfraEnvAgentTable,
    EditBMHModal,
    getAgentsHostsNames,
    AgentAlerts,
    DiscoveryTroubleshootingModal,
} = CIM

type HostsTabProps = {
    infraEnv: CIM.InfraEnvK8sResource
    infraAgents: CIM.AgentK8sResource[]
    agentClusterInstalls: CIM.AgentClusterInstallK8sResource[]
    bareMetalHosts: CIM.BareMetalHostK8sResource[]
    aiConfigMap: CIM.ConfigMapK8sResource
    infraNMStates?: CIM.NMStateK8sResource[]
    isProvisioningNetworkDisabled: boolean
}

const HostsTab: React.FC<HostsTabProps> = ({
    infraEnv,
    infraAgents,
    agentClusterInstalls,
    bareMetalHosts,
    aiConfigMap,
    infraNMStates = [],
    isProvisioningNetworkDisabled,
}) => {
    const [editBMH, setEditBMH] = useState<CIM.BareMetalHostK8sResource>()
    const [editAgent, setEditAgent] = useState<CIM.AgentK8sResource | undefined>()
    const [isDiscoveryHintModalOpen, setDiscoveryHintModalOpen] = useState(false)
    const [bulkModalProps, setBulkModalProps] = useState<IBulkActionModelProps<CIM.AgentK8sResource> | { open: false }>(
        { open: false }
    )
    const onDeleteHost = useOnDeleteHost(setBulkModalProps, bareMetalHosts, undefined, infraNMStates)
    const onUnbindHost = useOnUnbindHost(setBulkModalProps, undefined, undefined)

    const usedHostnames = useMemo(() => getAgentsHostsNames(infraAgents, bareMetalHosts), [bareMetalHosts, infraAgents])

    return (
        <>
            <BulkActionModel<CIM.AgentK8sResource> {...bulkModalProps} />
            <AcmPageContent id="hosts">
                <PageSection>
                    <AgentAlerts
                        infraEnv={infraEnv}
                        bareMetalHosts={bareMetalHosts}
                        docVersion={DOC_VERSION}
                        aiConfigMap={aiConfigMap}
                    />
                    {!!infraAgents.length && (
                        <Card isPlain isCompact>
                            <CardBody>
                                <HostsNotShowingLink
                                    key="hosts-not-showing"
                                    setDiscoveryHintModalOpen={setDiscoveryHintModalOpen}
                                />
                                {isDiscoveryHintModalOpen && (
                                    <DiscoveryTroubleshootingModal
                                        isOpen={isDiscoveryHintModalOpen}
                                        setDiscoveryHintModalOpen={setDiscoveryHintModalOpen}
                                    />
                                )}
                            </CardBody>
                        </Card>
                    )}
                    <Card>
                        <CardBody>
                            <InfraEnvAgentTable
                                agents={infraAgents}
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
                                isBMPlatform={isBMPlatform(infraEnv)}
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
                                isProvisioningNetworkDisabled={isProvisioningNetworkDisabled}
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
