/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { policiesState } from '../../../../atoms'
import { nockIgnoreRBAC } from '../../../../lib/nock-util'
import { waitForText } from '../../../../lib/test-util'
import { Policy } from '../../../../resources'
import PolicyDetailsResults from './PolicyDetailsResults'

const rootPolicy: Policy = {
    apiVersion: 'policy.open-cluster-management.io/v1',
    kind: 'Policy',
    metadata: {
        name: 'policy-set-with-1-placement-policy',
        namespace: 'test',
    },
    spec: {
        disabled: false,
        'policy-templates': [
            {
                objectDefinition: {
                    apiVersion: 'policy.open-cluster-management.io/v1',
                    kind: 'ConfigurationPolicy',
                    metadata: { name: 'policy-set-with-1-placement-policy-1' },
                    spec: {
                        namespaceSelector: { exclude: ['kube-*'], include: ['default'] },
                        remediationAction: 'inform',
                        severity: 'low',
                    },
                },
            },
        ],
        remediationAction: 'inform',
    },
    status: {
        compliant: 'Compliant',
        placement: [
            {
                placement: 'policy-set-with-1-placement',
                placementBinding: 'policy-set-with-1-placement',
                policySet: 'policy-set-with-1-placement',
            },
        ],
        status: [{ clustername: 'local-cluster', clusternamespace: 'local-cluster', compliant: 'Compliant' }],
    },
}

const policy0: Policy = {
    apiVersion: 'policy.open-cluster-management.io/v1',
    kind: 'Policy',
    metadata: {
        name: 'test.policy-set-with-1-placement-policy',
        namespace: 'local-cluster',
        labels: {
            'policy.open-cluster-management.io/cluster-name': 'local-cluster',
            'policy.open-cluster-management.io/cluster-namespace': 'local-cluster',
            'policy.open-cluster-management.io/root-policy': 'test.policy-set-with-1-placement-policy',
        },
    },
    spec: {
        disabled: false,
        'policy-templates': [
            {
                objectDefinition: {
                    apiVersion: 'policy.open-cluster-management.io/v1',
                    kind: 'ConfigurationPolicy',
                    metadata: { name: 'policy-set-with-1-placement-policy-1' },
                    spec: {
                        namespaceSelector: { exclude: ['kube-*'], include: ['default'] },
                        remediationAction: 'inform',
                        severity: 'low',
                    },
                },
            },
        ],
        remediationAction: 'inform',
    },
    status: {
        compliant: 'Compliant',
        details: [
            {
                compliant: 'Compliant',
                history: [
                    {
                        eventName: 'test.policy-set-with-1-placement-policy.16d459c516462fbf',
                        lastTimestamp: '2022-02-16T19:07:46Z',
                        message:
                            'Compliant; notification - namespaces [test] found as specified, therefore this Object template is compliant',
                    },
                ],
                templateMeta: { creationTimestamp: null, name: 'policy-set-with-1-placement-policy-1' },
            },
        ],
    },
}

export const mockPolicy: Policy[] = [rootPolicy, policy0]

// const mockProjects: Project[] = ['namespace1', 'namespace2', 'namespace3'].map((name) => ({
//     apiVersion: ProjectApiVersion,
//     kind: ProjectKind,
//     metadata: { name },
// }))

describe('Policy Details Results', () => {
    beforeEach(async () => {
        nockIgnoreRBAC()
        // nock(process.env.JEST_DEFAULT_HOST as string, { encodedQueryParams: true })
        //     .persist()
        //     .get('/apis/project.openshift.io/v1/projects')
        //     .reply(200, mockProjects)
    })
    test('Should render Policy Details Results Page content correctly', async () => {
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policiesState, mockPolicy)
                }}
            >
                <MemoryRouter>
                    <PolicyDetailsResults policy={rootPolicy} />
                </MemoryRouter>
            </RecoilRoot>
        )

        // wait page load
        await waitForText('Clusters')

        // wait for table cells to load correctly
        await waitForText('local-cluster')
        await waitForText('Without violations')
        await waitForText('policy-set-with-1-placement-policy-1', true)
        await waitForText(
            'notification - namespaces [test] found as specified, therefore this Object template is compliant'
        )
    })
})
