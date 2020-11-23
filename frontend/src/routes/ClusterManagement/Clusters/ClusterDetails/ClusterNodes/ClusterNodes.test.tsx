import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { NodePoolsPageContent, NodesPoolsTable } from './ClusterNodes'
import { NodeInfo, ManagedClusterInfo, ManagedClusterInfoApiVersion, ManagedClusterInfoKind } from '../../../../../resources/managed-cluster-info'
import { MemoryRouter } from 'react-router-dom'
import { mockBadRequestStatus, nockList } from '../../../../../lib/nock-util'

const mockNodeInfo: NodeInfo[] = [
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
            "failure-domain.beta.kubernetes.io/region": "us-east-1",
            "failure-domain.beta.kubernetes.io/zone": "us-east-1b",
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
    
]

const mockManagedClusterInfo: ManagedClusterInfo ={
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: { name: 'test-cluster', namespace: 'test-cluster' },
}

describe('cluster nodes page', () => {
    test('should render the table with cluster nodes', async () => {
        // nockList({ apiVersion: ClusterManagementAddOnApiVersion, kind: ClusterManagementAddOnKind }, mockclusterManagementAddOns)
        // nockList({ apiVersion: ManagedClusterAddOnApiVersion, kind: ManagedClusterAddOnKind }, mockmanagedClusterAddOns)
        const { getByText } = render(
            <MemoryRouter>
                <NodesPoolsTable
                nodes={mockNodeInfo}
                refresh={() => {}}
                />
            </MemoryRouter>
        )
        await waitFor(() => expect(getByText(mockNodeInfo[0].name!)).toBeInTheDocument())
    })

    test('should show error if the connections fail to query', async () => {
        nockList(mockManagedClusterInfo, mockBadRequestStatus)
       // console.log("error: ", err)
        const { getByText } = render(
            <MemoryRouter>
               <NodePoolsPageContent
                name={'test-cluster'}
                namespace={'test-cluster'}
                />
            </MemoryRouter>
        )
        await waitFor(() => expect(getByText('Bad request')).toBeInTheDocument())
    })
})