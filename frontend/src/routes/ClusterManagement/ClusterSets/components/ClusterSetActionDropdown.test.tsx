/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
// import { Scope } from 'nock/types'
import { RecoilRoot } from 'recoil'
import { nockDelete, nockIgnoreRBAC } from '../../../../lib/nock-util'
// import { rbacDelete } from '../../../../lib/rbac-util'
import { clickByText, waitForNock, typeByText } from '../../../../lib/test-util'
import { mockManagedClusterSet } from '../../../../lib/test-metadata'
import { ClusterSetActionDropdown } from './ClusterSetActionDropdown'

const Component = () => (
    <RecoilRoot initializeState={(snapshot) => {}}>
        <ClusterSetActionDropdown managedClusterSet={mockManagedClusterSet} isKebab={false} />
    </RecoilRoot>
)

describe('ClusterSetActionDropdown', () => {
    beforeEach(() => {
        nockIgnoreRBAC()
        render(<Component />)
    })
    test('delete action should delete the managed cluster set', async () => {
        const nock = nockDelete(mockManagedClusterSet)
        await clickByText('actions')
        await clickByText('set.delete')
        await typeByText('type.to.confirm', 'confirm')
        await clickByText('delete')
        await waitForNock(nock)
    })
})
