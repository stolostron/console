import React from 'react'
import { render } from '@testing-library/react'
import { NodesPoolsTable } from './NodesPools'
import { NodeInfo } from '../../../../lib/ManagedClusterInfo'

test('nodes table', () => {
    const nodes:NodeInfo[] = [
        {
            name: 'node1'
        }
    ]

    const { getByText } = render(<NodesPoolsTable nodes={nodes}  refresh={()=>{}}/>)
    expect(getByText(nodes[0].name!)).toBeInTheDocument()
})
