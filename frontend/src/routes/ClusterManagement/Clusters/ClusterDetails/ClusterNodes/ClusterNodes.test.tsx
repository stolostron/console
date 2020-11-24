import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { NodePoolsPageContent } from './ClusterNodes'
import { ManagedClusterInfo, ManagedClusterInfoApiVersion, ManagedClusterInfoKind } from '../../../../../resources/managed-cluster-info'
import { MemoryRouter } from 'react-router-dom'
import { mockBadRequestStatus, nockNamespacedList } from '../../../../../lib/nock-util'
import userEvent from '@testing-library/user-event'

const mockManagedClusterInfo: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: { name: 'test-cluster', namespace: 'test-cluster' },
    status: {
        nodeList: [
            {
                name: "ip-10-0-134-240.ec2.internal",
                labels: {
                    "beta.kubernetes.io/instance-type": "m5.xlarge",
                    "failure-domain.beta.kubernetes.io/region": "us-west-1",
                    "failure-domain.beta.kubernetes.io/zone": "us-east-1c",
                    "node-role.kubernetes.io/worker": "",
                    "node.kubernetes.io/instance-type": "m5.xlarge"
                },
                conditions: [
                    {
                        "status": "True",
                        "type": "Ready"
                    }
                ]
            },
            {
                name: "ip-10-0-130-30.ec2.internal",
                labels: {
                    "beta.kubernetes.io/instance-type": "m5.xlarge",
                    "failure-domain.beta.kubernetes.io/region": "us-east-1",
                    "failure-domain.beta.kubernetes.io/zone": "us-east-1a",
                    "node-role.kubernetes.io/master": "",
                    "node.kubernetes.io/instance-type": "m5.xlarge"
                },
                capacity: {
                    "cpu": "4",
                    "memory": "15944104Ki"
                },
                conditions: [
                    {
                        "status": "True",
                        "type": "Ready"
                    }
                ]
            },
            {
                name: "ip-10-0-151-254.ec2.internal",
                labels: {
                    "beta.kubernetes.io/instance-type": "m5.xlarge",
                    "failure-domain.beta.kubernetes.io/region": "us-south-1",
                    "failure-domain.beta.kubernetes.io/zone": "us-east-1b",
                    "node-role.kubernetes.io/master": "",
                    "node.kubernetes.io/instance-type": "m5.xlarge"
                },
                capacity: {
                    "cpu": "4",
                    "memory": "8194000Pi"
                },
                conditions: [
                    {
                        "status": "True",
                        "type": "Ready"
                    }
                ]
            },
        ]
    }
}


const mockManagedeClusterInfo1: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: { name: 'test-cluster1', namespace: 'test-cluster' },
}

const mockManageedClusterInfolist: ManagedClusterInfo[] = [
    mockManagedeClusterInfo1,
    mockManagedClusterInfo,
]



describe('cluster nodes page', () => {
    test('should render the table with cluster nodes', async () => {
       nockNamespacedList(mockManagedClusterInfo, mockManageedClusterInfolist)
        const { getByText } = render(
            <MemoryRouter>
               <NodePoolsPageContent
                name={mockManagedClusterInfo.metadata.name!}
                namespace={mockManagedClusterInfo.metadata.namespace!}
                />
            </MemoryRouter>
        )
       
        await waitFor(() => expect(getByText( mockManagedClusterInfo.status?.nodeList?.[0].name!)).toBeInTheDocument())
        userEvent.click(getByText('Role'))
        await waitFor(() => expect(getByText( mockManagedClusterInfo.status?.nodeList?.[0].name!)).toBeInTheDocument())
        userEvent.click(getByText('Region'))
        await waitFor(() => expect(getByText( mockManagedClusterInfo.status?.nodeList?.[0].name!)).toBeInTheDocument())
    })

    test('should show error if the connections fail to query', async () => {
        nockNamespacedList(mockManagedClusterInfo, mockBadRequestStatus)
        const { getByText } = render(
            <MemoryRouter>
               <NodePoolsPageContent
                name={mockManagedClusterInfo.metadata.name!}
                namespace={mockManagedClusterInfo.metadata.namespace!}
                />
            </MemoryRouter>
        )
        await waitFor(() => expect(getByText('Bad request')).toBeInTheDocument())
    })
})