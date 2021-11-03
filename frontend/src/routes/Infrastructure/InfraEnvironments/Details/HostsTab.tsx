/* Copyright Contributors to the Open Cluster Management project */
import { AcmPageContent } from '@open-cluster-management/ui-components'
import { Card, CardBody, PageSection } from '@patternfly/react-core'
import { CIM } from 'openshift-assisted-ui-lib'
import { useState } from 'react'

import EditAgentModal from '../../Clusters/ManagedClusters/components/cim/EditAgentModal'
import {
    canDeleteAgent,
    fetchNMState,
    fetchSecret,
    getClusterDeploymentLink,
    getOnDeleteHost,
    onApproveAgent,
    onSaveBMH,
} from '../../Clusters/ManagedClusters/CreateCluster/components/assisted-installer/utils'

const { InfraEnvAgentTable, EditBMHModal } = CIM

type HostsTabProps = {
    infraEnv: CIM.InfraEnvK8sResource
    infraAgents: CIM.AgentK8sResource[]
    bareMetalHosts: CIM.BareMetalHostK8sResource[]
}

const HostsTab: React.FC<HostsTabProps> = ({ infraEnv, infraAgents, bareMetalHosts }) => {
    const [editBMH, setEditBMH] = useState<CIM.BareMetalHostK8sResource>()
    const [editAgent, setEditAgent] = useState<CIM.AgentK8sResource | undefined>()

    return (
        <AcmPageContent id="hosts">
            <PageSection>
                <Card>
                    <CardBody>
                        <InfraEnvAgentTable
                            agents={infraAgents}
                            bareMetalHosts={bareMetalHosts}
                            infraEnv={infraEnv}
                            getClusterDeploymentLink={getClusterDeploymentLink}
                            onEditHost={setEditAgent}
                            onApprove={onApproveAgent}
                            canDelete={canDeleteAgent}
                            onDeleteHost={getOnDeleteHost(bareMetalHosts)}
                            onEditBMH={setEditBMH}
                        />
                        <EditBMHModal
                            infraEnv={infraEnv}
                            bmh={editBMH}
                            isOpen={!!editBMH}
                            onClose={() => setEditBMH(undefined)}
                            onEdit={onSaveBMH}
                            fetchSecret={fetchSecret}
                            fetchNMState={fetchNMState}
                        />
                        <EditAgentModal agent={editAgent} setAgent={setEditAgent} />
                    </CardBody>
                </Card>
            </PageSection>
        </AcmPageContent>
    )
}

export default HostsTab
