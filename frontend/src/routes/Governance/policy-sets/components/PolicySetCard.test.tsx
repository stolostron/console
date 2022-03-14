/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { waitForText } from '../../../../lib/test-util'
import { Placement, PlacementBinding, PlacementRule, PolicySet } from '../../../../resources'
import PolicySetCard from './PolicySetCard'

const policySet: PolicySet = {
    apiVersion: 'policy.open-cluster-management.io/v1beta1',
    kind: 'PolicySet',
    metadata: {
        annotations: {
            'kubectl.kubernetes.io/last-applied-configuration':
                '{"apiVersion":"policy.open-cluster-management.io/v1","kind":"PolicySet","metadata":{"annotations":{},"name":"policy-set-with-1-placement","namespace":"test"},"spec":{"description":"Policy set with a single Placement and PlacementBinding.","policies":["policy-set-with-1-placement-policy-1","policy-set-with-1-placement-policy-2"]}}\n',
        },
        creationTimestamp: '2022-02-23T12:34:35Z',
        name: 'policy-set-with-1-placement',
        namespace: 'test',
        uid: '20761783-5b48-4f9c-b12c-d5a6b2fac4b5',
    },
    spec: {
        description: 'Policy set with a single Placement and PlacementBinding.',
        policies: ['policy-set-with-1-placement-policy-1', 'policy-set-with-1-placement-policy-2'],
    },
    status: {
        compliant: 'Compliant',
        placement: [{ placement: 'policy-set-with-1-placement', placementBinding: 'policy-set-with-1-placement' }],
    },
}

export const mockPolicySets: PolicySet[] = []
export const mockPlacements: Placement[] = []
export const mockPlacementRules: PlacementRule[] = []
export const mockPlacementBindings: PlacementBinding[] = []

describe('Policy Set Card', () => {
    test('Should render Policy Set Card content correctly', async () => {
        render(
            <RecoilRoot>
                <MemoryRouter>
                    <PolicySetCard policySet={policySet} selectedCardID={''} setSelectedCardID={() => {}} />
                </MemoryRouter>
            </RecoilRoot>
        )

        // wait card title - PolicySet name
        await waitForText('policy-set-with-1-placement')
        // wait card desc - PolicySet desc
        await waitForText('Policy set with a single Placement and PlacementBinding.')
        // wait card compliance status
        await waitForText('No violations')
    })
})
