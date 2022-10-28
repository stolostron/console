/* Copyright Contributors to the Open Cluster Management project */

import {
    ManagedClusterSetBinding,
    ManagedClusterSetBindingApiVersion,
    ManagedClusterSetBindingKind,
    Namespace,
    NamespaceApiVersion,
    NamespaceKind,
} from '../../../../../resources'
import { render } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { managedClusterSetBindingsState, namespacesState } from '../../../../../atoms'
import { nockCreate, nockDelete, nockIgnoreRBAC } from '../../../../../lib/nock-util'
import { mockManagedClusterSet } from '../../../../../lib/test-metadata'
import {
    clickByPlaceholderText,
    clickByText,
    typeByText,
    waitForNock,
    waitForNocks,
    waitForText,
} from '../../../../../lib/test-util'
import { ClusterSetActionDropdown } from './ClusterSetActionDropdown'

const firstNamespace: Namespace = {
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: {
        name: 'first-namespace',
    },
}

const secondNamespace: Namespace = {
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: {
        name: 'second-namespace',
    },
}

const thirdNamespace: Namespace = {
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: {
        name: 'third-namespace',
    },
}

const firstNamespaceBinding: ManagedClusterSetBinding = {
    apiVersion: ManagedClusterSetBindingApiVersion,
    kind: ManagedClusterSetBindingKind,
    metadata: {
        name: mockManagedClusterSet.metadata.name!,
        namespace: firstNamespace.metadata.name!,
    },
    spec: {
        clusterSet: mockManagedClusterSet.metadata.name!,
    },
}

const createSecondNamespaceBinding: ManagedClusterSetBinding = {
    apiVersion: ManagedClusterSetBindingApiVersion,
    kind: ManagedClusterSetBindingKind,
    metadata: {
        name: mockManagedClusterSet.metadata.name!,
        namespace: secondNamespace.metadata.name!,
    },
    spec: {
        clusterSet: mockManagedClusterSet.metadata.name!,
    },
}

const Component = () => (
    <RecoilRoot
        initializeState={(snapshot) => {
            snapshot.set(namespacesState, [firstNamespace, secondNamespace, thirdNamespace])
            snapshot.set(managedClusterSetBindingsState, [firstNamespaceBinding])
        }}
    >
        <ClusterSetActionDropdown managedClusterSet={mockManagedClusterSet} isKebab={false} />
    </RecoilRoot>
)

describe('ClusterSetActionDropdown', () => {
    beforeEach(() => {
        nockIgnoreRBAC()
        render(<Component />)
    })
    test('can edit managed cluster set bindings for a cluster set', async () => {
        await clickByText('Actions')
        await clickByText('Edit namespace bindings')

        // verify existing binding is selected
        await waitForText(firstNamespaceBinding.metadata.namespace!)
        await clickByPlaceholderText('Select namespaces')

        // unselect existing binding
        await clickByText(firstNamespaceBinding.metadata.namespace!, 1)

        await clickByText(createSecondNamespaceBinding.metadata.namespace!)

        const deleteNock = await nockDelete(firstNamespaceBinding)
        const createNock = nockCreate(createSecondNamespaceBinding)

        await clickByText('Save')
        await waitForNocks([deleteNock, createNock])
    })
    test('delete action should delete the managed cluster set', async () => {
        const nock = await nockDelete(mockManagedClusterSet)
        await clickByText('Actions')
        await clickByText('Delete cluster set')
        await typeByText(
            `Confirm by typing "${mockManagedClusterSet.metadata.name!}" below:`,
            mockManagedClusterSet.metadata.name!
        )
        await clickByText('Delete')
        await waitForNock(nock)
    })
})
