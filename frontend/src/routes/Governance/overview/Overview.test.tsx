import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { policiesState } from '../../../atoms'
import { waitForText } from '../../../lib/test-util'
import { Policy, PolicyApiVersion, PolicyKind } from '../../../resources'
import { IGovernanceData, IPolicy } from '../useGovernanceData'
import GovernanceOverview from './Overview'

const policy0: IPolicy = {
    apiVersion: PolicyApiVersion,
    kind: PolicyKind,
    metadata: {
        name: 'policy-0',
        namespace: 'policy-0-ns',
    },
    spec: {
        disabled: false,
        remediationAction: '',
    },
    status: {},
    clusterRisks: { high: 0, medium: 0, low: 0, unknown: 0, synced: 0 },
}

const mockEmptyGovernanceData: IGovernanceData = {
    policies: [],
    policyRisks: { high: 0, medium: 0, low: 0, unknown: 0, synced: 0 },
    clusterRisks: { high: 0, medium: 0, low: 0, unknown: 0, synced: 0 },
    clusterMap: {},
    categories: { risks: { high: 0, medium: 0, low: 0, unknown: 0, synced: 0 }, groups: [] },
    standards: { risks: { high: 0, medium: 0, low: 0, unknown: 0, synced: 0 }, groups: [] },
    controls: { risks: { high: 0, medium: 0, low: 0, unknown: 0, synced: 0 }, groups: [] },
}

const mockGovernanceDataNoRisks: IGovernanceData = {
    policies: [policy0],
    policyRisks: { high: 0, medium: 0, low: 0, unknown: 0, synced: 0 },
    clusterRisks: { high: 0, medium: 0, low: 0, unknown: 0, synced: 0 },
    clusterMap: {},
    categories: { risks: { high: 0, medium: 0, low: 0, unknown: 0, synced: 0 }, groups: [] },
    standards: { risks: { high: 0, medium: 0, low: 0, unknown: 0, synced: 0 }, groups: [] },
    controls: { risks: { high: 0, medium: 0, low: 0, unknown: 0, synced: 0 }, groups: [] },
}

const mockGovernanceDataWithRisks: IGovernanceData = {
    policies: [policy0],
    policyRisks: { high: 1, medium: 0, low: 0, unknown: 0, synced: 0 },
    clusterRisks: { high: 1, medium: 0, low: 0, unknown: 0, synced: 0 },
    clusterMap: {},
    categories: { risks: { high: 0, medium: 0, low: 0, unknown: 0, synced: 0 }, groups: [] },
    standards: { risks: { high: 0, medium: 0, low: 0, unknown: 0, synced: 0 }, groups: [] },
    controls: { risks: { high: 0, medium: 0, low: 0, unknown: 0, synced: 0 }, groups: [] },
}

export const mockEmptyPolicy: Policy[] = []
export const mockPolicy: Policy[] = [policy0]

describe('Overview Page', () => {
    test('Should render empty Overview page with create policy message correctly', async () => {
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policiesState, mockEmptyPolicy)
                }}
            >
                <MemoryRouter>
                    <GovernanceOverview governanceData={mockEmptyGovernanceData} />
                </MemoryRouter>
            </RecoilRoot>
        )

        await waitForText('Use the button below to create a policy.')
    })
    test('Should render empty Overview page with manage policies message correctly', async () => {
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policiesState, mockEmptyPolicy)
                }}
            >
                <MemoryRouter>
                    <GovernanceOverview governanceData={mockGovernanceDataNoRisks} />
                </MemoryRouter>
            </RecoilRoot>
        )

        await waitForText('Use the button below to manage policies.')
    })

    test('Should render Policies page correctly', async () => {
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policiesState, mockPolicy)
                }}
            >
                <MemoryRouter>
                    <GovernanceOverview governanceData={mockGovernanceDataWithRisks} />
                </MemoryRouter>
            </RecoilRoot>
        )
    })
})
