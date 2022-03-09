/* Copyright Contributors to the Open Cluster Management project */
import { Card, CardBody, PageSection } from '@patternfly/react-core'
import { AcmPageContent } from '@stolostron/ui-components'
import { CIM } from 'openshift-assisted-ui-lib'
import { useMemo, useState } from 'react'
import { BulkActionModel, IBulkActionModelProps } from '../../../../components/BulkActionModel'
import { DOC_VERSION } from '../../../../lib/doc-util'
import EditAgentModal from '../../Clusters/ManagedClusters/components/cim/EditAgentModal'
import {
    useCanUnbindAgent,
    useOnUnbindHost,
} from '../../Clusters/ManagedClusters/CreateCluster/components/assisted-installer/unbindHost'
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

const { InfraEnvAgentTable, EditBMHModal, getAgentsHostsNames, AgentAlerts } = CIM

type HostsTabProps = {
    infraEnv: CIM.InfraEnvK8sResource
    infraAgents: CIM.AgentK8sResource[]
    bareMetalHosts: CIM.BareMetalHostK8sResource[]
    aiConfigMap: CIM.ConfigMapK8sResource
}

const HostsTab: React.FC<HostsTabProps> = ({ infraEnv, infraAgents, bareMetalHosts, aiConfigMap }) => {
    const [editBMH, setEditBMH] = useState<CIM.BareMetalHostK8sResource>()
    const [editAgent, setEditAgent] = useState<CIM.AgentK8sResource | undefined>()
    const [bulkModalProps, setBulkModalProps] = useState<IBulkActionModelProps<CIM.AgentK8sResource> | { open: false }>(
        { open: false }
    )
    const nmStates = useNMStatesOfNamespace(infraEnv.metadata.namespace)
    const onDeleteHost = useOnDeleteHost(setBulkModalProps, bareMetalHosts, undefined, nmStates)
    const onUnbindHost = useOnUnbindHost(setBulkModalProps, undefined, undefined)
    const canUnbindAgent = useCanUnbindAgent(infraEnv)

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
                    <Card>
                        <CardBody>
                            <InfraEnvAgentTable
                                agents={infraAgents}
                                bareMetalHosts={bareMetalHosts}
                                infraEnv={infraEnv}
                                getClusterDeploymentLink={getClusterDeploymentLink}
                                onEditHost={setEditAgent}
                                canEditHost={(agent) => !!agent}
                                onApprove={onApproveAgent}
                                canDelete={(agent?: CIM.AgentK8sResource, bmh?: CIM.BareMetalHostK8sResource) =>
                                    !!nmStates && (!!agent || !!bmh)
                                }
                                onDeleteHost={onDeleteHost as any}
                                onEditBMH={setEditBMH}
                                canUnbindHost={canUnbindAgent}
                                onUnbindHost={onUnbindHost}
                                onChangeHostname={onSaveAgent}
                                onChangeBMHHostname={onChangeBMHHostname}
                                onMassDeleteHost={onMassDeleteHost}
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
