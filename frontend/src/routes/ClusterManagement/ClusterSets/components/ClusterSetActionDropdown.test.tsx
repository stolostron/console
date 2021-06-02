/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { nockCreate, nockDelete, nockIgnoreRBAC } from '../../../../lib/nock-util'
import {
    clickByText,
    waitForNock,
    waitForNocks,
    typeByText,
    clickByPlaceholderText,
    waitForText,
} from '../../../../lib/test-util'
import { mockManagedClusterSet } from '../../../../lib/test-metadata'
import { namespacesState, managedClusterSetBindingsState } from '../../../../atoms'
import { ClusterSetActionDropdown } from './ClusterSetActionDropdown'
import { Namespace, NamespaceApiVersion, NamespaceKind } from '../../../../resources/namespace'
import {
    ManagedClusterSetBinding,
    ManagedClusterSetBindingApiVersion,
    ManagedClusterSetBindingKind,
} from '../../../../resources/managed-cluster-set-binding'

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
        await clickByText('actions')
        await clickByText('set.edit-bindings')

        // verify existing binding is selected
        await waitForText(firstNamespaceBinding.metadata.namespace!)
        await clickByPlaceholderText('[object Object]')
        // await clickByPlaceholderText('clusterSetBinding.edit.select.placeholder')

        // unselect existing binding
        await clickByText(firstNamespaceBinding.metadata.namespace!, 1)

        await clickByText(createSecondNamespaceBinding.metadata.namespace!)

        const deleteNock = nockDelete(firstNamespaceBinding)
        const createNock = nockCreate(createSecondNamespaceBinding)

        await clickByText('common:save')
        await waitForNocks([deleteNock, createNock])
    })
    test('delete action should delete the managed cluster set', async () => {
        const nock = nockDelete(mockManagedClusterSet)
        await clickByText('actions')
        await clickByText('set.delete')
        await typeByText('type.to.confirm', mockManagedClusterSet.metadata.name!)
        await clickByText('delete')
        await waitForNock(nock)
    })
})
