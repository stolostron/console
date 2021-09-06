/* Copyright Contributors to the Open Cluster Management project */
import { patchResource, deleteResource, getResource, listNamespacedResources } from '../../../../resources'
import { AcmPageContent } from '@open-cluster-management/ui-components'
import { Card, CardBody, PageSection } from '@patternfly/react-core'
import isMatch from 'lodash/isMatch'
import { CIM } from 'openshift-assisted-ui-lib'
import { useState } from 'react'

import { useRecoilValue, waitForAll } from 'recoil'
import { agentsState, bareMetalHostsState } from '../../../../atoms'
import { NavigationPath } from '../../../../NavigationPath'
import { onEditBMH } from './utils'

const { InfraEnvAgentTable, EditBMHModal, AGENT_BMH_HOSTNAME_LABEL_KEY } = CIM

type HostsTabProps = {
    infraEnv: CIM.InfraEnvK8sResource
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

const HostsTab: React.FC<HostsTabProps> = ({ infraEnv }) => {
    const [agents, bareMetalHosts] = useRecoilValue(waitForAll([agentsState, bareMetalHostsState]))
    const [editBMH, setEditBMH] = useState<CIM.BareMetalHostK8sResource>()
    const infraAgents = agents.filter((a) =>
        isMatch(a.metadata.labels, infraEnv.status?.agentLabelSelector?.matchLabels)
    )

    return (
        <AcmPageContent id="hosts">
            <PageSection>
                <Card>
                    <CardBody>
                        <InfraEnvAgentTable
                            agents={infraAgents}
                            bareMetalHosts={bareMetalHosts}
                            infraEnv={infraEnv}
                            getClusterDeploymentLink={({ name }) => NavigationPath.clusterDetails.replace(':id', name)}
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
                            onDeleteHost={async (agent, bmh) => {
                                if (agent) {
                                    await deleteResource(agent).promise
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
                            onEdit={onEditBMH(editBMH)}
                            fetchSecret={fetchSecret}
                            fetchNMState={fetchNMState}
                        />
                    </CardBody>
                </Card>
            </PageSection>
        </AcmPageContent>
    )
}

export default HostsTab
