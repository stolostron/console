/* Copyright Contributors to the Open Cluster Management project */
import { patchResource, deleteResource, getResource, listNamespacedResources } from '../../../../resources'
import { AcmPageContent } from '@open-cluster-management/ui-components'
import { Card, CardBody, PageSection } from '@patternfly/react-core'
import { CIM } from 'openshift-assisted-ui-lib'
import { useState } from 'react'

import { NavigationPath } from '../../../../NavigationPath'
import { onEditBMH } from './utils'
import EditAgentModal from '../../Clusters/ManagedClusters/components/cim/EditAgentModal'
import { DOC_VERSION } from '../../../../lib/doc-util'

const { InfraEnvAgentTable, EditBMHModal, AGENT_BMH_HOSTNAME_LABEL_KEY, AgentAlerts } = CIM

type HostsTabProps = {
    infraEnv: CIM.InfraEnvK8sResource
    infraAgents: CIM.AgentK8sResource[]
    bareMetalHosts: CIM.BareMetalHostK8sResource[]
}

const fetchSecret = (namespace: string, name: string) =>
    getResource({ apiVersion: 'v1', kind: 'Secret', metadata: { namespace, name } }).promise

const fetchNMState = async (namespace: string, bmhName: string) => {
    const nmStates = await listNamespacedResources(
        { apiVersion: 'agent-install.openshift.io/v1beta1', kind: 'NMStateConfig', metadata: { namespace } },
        [AGENT_BMH_HOSTNAME_LABEL_KEY]
    ).promise
    return nmStates.find((nm) => nm.metadata?.labels?.[AGENT_BMH_HOSTNAME_LABEL_KEY] === bmhName)
}

const HostsTab: React.FC<HostsTabProps> = ({ infraEnv, infraAgents, bareMetalHosts }) => {
    const [editBMH, setEditBMH] = useState<CIM.BareMetalHostK8sResource>()
    const [editAgent, setEditAgent] = useState<CIM.AgentK8sResource | undefined>()

    return (
        <AcmPageContent id="hosts">
            <PageSection>
                <AgentAlerts infraEnv={infraEnv} bareMetalHosts={bareMetalHosts} docVersion={DOC_VERSION} />
                <Card>
                    <CardBody>
                        <InfraEnvAgentTable
                            agents={infraAgents}
                            bareMetalHosts={bareMetalHosts}
                            infraEnv={infraEnv}
                            getClusterDeploymentLink={({ name }) => NavigationPath.clusterDetails.replace(':id', name)}
                            onEditHost={setEditAgent}
                            onApprove={(agent) => {
                                patchResource(agent, [
                                    {
                                        op: 'replace',
                                        path: '/spec/approved',
                                        value: true,
                                    },
                                ])
                            }}
                            canDelete={(agent, bmh) => !!agent || !!bmh}
                            onDeleteHost={async (agent, bareMetalHost) => {
                                let bmh = bareMetalHost
                                if (agent) {
                                    await deleteResource(agent).promise
                                    const bmhName = agent.metadata.labels?.[AGENT_BMH_HOSTNAME_LABEL_KEY]
                                    if (bmhName) {
                                        bmh = bareMetalHosts.find(
                                            ({ metadata }) =>
                                                metadata.name === bmhName &&
                                                metadata.namespace === agent.metadata.namespace
                                        )
                                    }
                                }
                                if (bmh) {
                                    await deleteResource(bmh).promise
                                    deleteResource({
                                        apiVersion: 'v1',
                                        kind: 'Secret',
                                        metadata: {
                                            namespace: bmh.metadata.namespace,
                                            name: bmh.spec.bmc.credentialsName,
                                        },
                                    })

                                    const nmState = await fetchNMState(bmh.metadata.namespace, bmh.metadata.name)
                                    if (nmState) {
                                        await deleteResource(nmState).promise
                                    }
                                }
                            }}
                            onEditBMH={setEditBMH}
                        />
                        <EditBMHModal
                            infraEnv={infraEnv}
                            bmh={editBMH}
                            isOpen={!!editBMH}
                            onClose={() => setEditBMH(undefined)}
                            onEdit={onEditBMH}
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
