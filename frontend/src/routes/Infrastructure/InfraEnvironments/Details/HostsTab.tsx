/* Copyright Contributors to the Open Cluster Management project */
import { useState, useMemo, useCallback } from 'react'
import { Card, CardBody, PageSection } from '@patternfly/react-core'
import { AcmPageContent } from '@stolostron/ui-components'
import { CIM } from 'openshift-assisted-ui-lib'
import { BulkActionModel, IBulkActionModelProps } from '../../../../components/BulkActionModel'
import { DOC_VERSION } from '../../../../lib/doc-util'
import EditAgentModal from '../../Clusters/ManagedClusters/components/cim/EditAgentModal'
import { useOnUnbindHost } from '../../Clusters/ManagedClusters/CreateCluster/components/assisted-installer/unbindHost'
import {
    fetchNMState,
    fetchSecret,
    getClusterDeploymentLink,
    onApproveAgent,
    onChangeBMHHostname,
    onMassDeleteHost,
    onSaveAgent,
    onSaveBMH,
    useNMStatesOfNamespace,
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
    bareMetalHosts: CIM.BareMetalHostK8sResource[]
    aiConfigMap: CIM.ConfigMapK8sResource
}

const HostsTab: React.FC<HostsTabProps> = ({ infraEnv, infraAgents, bareMetalHosts, aiConfigMap }) => {
    const [editBMH, setEditBMH] = useState<CIM.BareMetalHostK8sResource>()
    const [editAgent, setEditAgent] = useState<CIM.AgentK8sResource | undefined>()
    const [isDiscoveryHintModalOpen, setDiscoveryHintModalOpen] = useState(false)
    const [bulkModalProps, setBulkModalProps] = useState<IBulkActionModelProps<CIM.AgentK8sResource> | { open: false }>(
        { open: false }
    )
    const nmStates = useNMStatesOfNamespace(infraEnv.metadata.namespace)
    const onDeleteHost = useOnDeleteHost(setBulkModalProps, bareMetalHosts, undefined, nmStates)
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
                                bareMetalHosts={bareMetalHosts}
                                infraEnv={infraEnv}
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
                                isOpen={!!editBMH}
                                onClose={() => setEditBMH(undefined)}
                                onEdit={onSaveBMH}
                                fetchSecret={fetchSecret}
                                fetchNMState={fetchNMState}
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
