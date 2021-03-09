/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BareMetalAssetsPage from './BareMetalAssetsPage'
import { nockDelete, nockCreate } from '../../lib/nock-util'
import { BareMetalAsset } from '../../resources/bare-metal-asset'
import { ResourceAttributes, SelfSubjectAccessReview } from '../../resources/self-subject-access-review'
import { Scope } from 'nock/types'
import { RecoilRoot } from 'recoil'
import { bareMetalAssetsState } from '../../atoms'
import {
    clickByLabel,
    clickByRole,
    clickByText,
    waitForNock,
    waitForNocks,
    waitForText,
} from '../../lib/test-util'

const bareMetalAsset: BareMetalAsset = {
    apiVersion: 'inventory.open-cluster-management.io/v1alpha1',
    kind: 'BareMetalAsset',
    metadata: {
        name: 'test-bare-metal-asset-001',
        namespace: 'test-bare-metal-asset-namespace',
    },
    spec: {
        bmc: {
            address: 'example.com:80',
            credentialsName: 'secret-test-bare-metal-asset',
        },
        bootMACAddress: '00:90:7F:12:DE:7F',
    },
}

function nockcreateSelfSubjectAccesssRequest(resourceAttributes: ResourceAttributes, allowed: boolean = true) {
    return nockCreate(
        {
            apiVersion: 'authorization.k8s.io/v1',
            kind: 'SelfSubjectAccessReview',
            metadata: {},
            spec: {
                resourceAttributes,
            },
        } as SelfSubjectAccessReview,
        {
            apiVersion: 'authorization.k8s.io/v1',
            kind: 'SelfSubjectAccessReview',
            metadata: {},
            spec: {
                resourceAttributes,
            },
            status: {
                allowed,
            },
        } as SelfSubjectAccessReview
    )
}

function clusterCreationResourceAttributes() {
    return {
        resource: 'managedclusters',
        verb: 'create',
        group: 'cluster.open-cluster-management.io',
    } as ResourceAttributes
}

const mockBareMetalAssets = [bareMetalAsset]

function nockCreateSelfSubjectAccesssRequest(resourceAttributes: ResourceAttributes, allowed: boolean = true) {
    return nockCreate(
        {
            apiVersion: 'authorization.k8s.io/v1',
            kind: 'SelfSubjectAccessReview',
            metadata: {},
            spec: {
                resourceAttributes,
            },
        } as SelfSubjectAccessReview,
        {
            apiVersion: 'authorization.k8s.io/v1',
            kind: 'SelfSubjectAccessReview',
            metadata: {},
            spec: {
                resourceAttributes,
            },
            status: {
                allowed,
            },
        } as SelfSubjectAccessReview
    )
}

function getEditBMAResourceAttributes(name: string, namespace: string) {
    return {
        name,
        namespace,
        group: 'inventory.open-cluster-management.io',
        resource: 'baremetalassets',
        verb: 'patch',
    } as ResourceAttributes
}

function getDeleteBMAResourceAttributes(name: string, namespace: string) {
    return {
        name,
        namespace,
        group: 'inventory.open-cluster-management.io',
        resource: 'baremetalassets',
        verb: 'delete',
    } as ResourceAttributes
}

function nocksAreDone(nocks: Scope[]) {
    for (const nock of nocks) {
        if (!nock.isDone()) return false
    }
    return true
}

describe('bare metal asset page', () => {
    test('bare metal assets page renders', async () => {
        const clusterNock = nockcreateSelfSubjectAccesssRequest(clusterCreationResourceAttributes())

        render(
            <RecoilRoot initializeState={(snapshot) => snapshot.set(bareMetalAssetsState, mockBareMetalAssets)}>
                <MemoryRouter>
                    <BareMetalAssetsPage />
                </MemoryRouter>
            </RecoilRoot>
        )
        await waitFor(() => expect(clusterNock.isDone()).toBeTruthy())
        await waitForText(mockBareMetalAssets[0].metadata.name!)
    })

    test('can delete asset from overflow menu', async () => {
        const deleteNock = nockDelete(mockBareMetalAssets[0])
        const clusterNock = nockcreateSelfSubjectAccesssRequest(clusterCreationResourceAttributes())
        const rbacNocks: Scope[] = [
            nockCreateSelfSubjectAccesssRequest(
                getEditBMAResourceAttributes('test-bare-metal-asset-001', 'test-bare-metal-asset-namespace')
            ),
            nockCreateSelfSubjectAccesssRequest(
                getDeleteBMAResourceAttributes('test-bare-metal-asset-001', 'test-bare-metal-asset-namespace')
            ),
        ]
        render(
            <RecoilRoot initializeState={(snapshot) => snapshot.set(bareMetalAssetsState, mockBareMetalAssets)}>
                <MemoryRouter>
                    <BareMetalAssetsPage />
                </MemoryRouter>
            </RecoilRoot>
        )

        await waitFor(() => expect(clusterNock.isDone()).toBeTruthy())
        await waitForText(mockBareMetalAssets[0].metadata!.name!)
        await clickByLabel('Actions', 0) // Click the action button on the first table row
        await waitFor(() => expect(nocksAreDone(rbacNocks)).toBeTruthy())
        await waitForNocks(rbacNocks)
        await clickByText('bareMetalAsset.rowAction.deleteAsset.title')
        await clickByText('common:delete')
        await waitForNock(deleteNock)
    })

    test('can delete asset(s) from batch action menu', async () => {
        const clusterNock = nockcreateSelfSubjectAccesssRequest(clusterCreationResourceAttributes())
        const deleteNock = nockDelete(mockBareMetalAssets[0])

        const { getAllByText } = render(
            <RecoilRoot initializeState={(snapshot) => snapshot.set(bareMetalAssetsState, mockBareMetalAssets)}>
                <MemoryRouter>
                    <BareMetalAssetsPage />
                </MemoryRouter>
            </RecoilRoot>
        )

        await waitFor(() => expect(clusterNock.isDone()).toBeTruthy())
        await waitForText(mockBareMetalAssets[0].metadata!.name!)
        await waitFor(() => expect(getAllByText(mockBareMetalAssets[0].metadata.name!).length > 0)) // check for asset in doc
        await clickByRole('checkbox', 1) // Select first item
        await clickByText('bareMetalAsset.bulkAction.deleteAsset')
        await clickByText('common:delete')
        await waitForNock(deleteNock)
    })
})
