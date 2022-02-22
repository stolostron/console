/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { nockGet } from '../../../../lib/nock-util'
import { waitForNocks, waitForText } from '../../../../lib/test-util'
import { PolicyTemplateDetails } from './PolicyTemplateDetails'

jest.mock('../../../../components/YamlEditor', () => {
    // TODO replace with actual YAML Page when Monaco editor is imported correctly
    return function YamlEditor() {
        return <div />
    }
})

const getResourceRequest = {
    apiVersion: 'view.open-cluster-management.io/v1beta1',
    kind: 'ManagedClusterView',
    metadata: {
        name: '232423625a3c9b73ebda9c52cb40cfac908f1ca1',
        namespace: 'test-cluster',
        labels: {
            viewName: '232423625a3c9b73ebda9c52cb40cfac908f1ca1',
        },
    },
    spec: {
        scope: {
            name: 'policy-set-with-1-placement-policy-1',
            resource: 'configurationpolicy.policy.open-cluster-management.io.v1',
        },
    },
}

const getResourceResponse = {
    apiVersion: 'view.open-cluster-management.io/v1beta1',
    kind: 'ManagedClusterView',
    metadata: {
        name: '232423625a3c9b73ebda9c52cb40cfac908f1ca1',
        namespace: 'test-cluster',
        labels: {
            viewName: '232423625a3c9b73ebda9c52cb40cfac908f1ca1',
        },
    },
    spec: {
        scope: {
            name: 'policy-set-with-1-placement-policy-1',
            resource: 'configurationpolicy.policy.open-cluster-management.io.v1',
        },
    },
    status: {
        conditions: [
            {
                message: 'Watching resources successfully',
                reason: 'GetResourceProcessing',
                status: 'True',
                type: 'Processing',
            },
        ],
        result: {
            apiVersion: 'policy.open-cluster-management.io/v1',
            kind: 'ConfigurationPolicy',
            metadata: {
                labels: {
                    'cluster-name': 'test-cluster',
                    'cluster-namespace': 'test-cluster',
                    'policy.open-cluster-management.io/cluster-name': 'test-cluster',
                    'policy.open-cluster-management.io/cluster-namespace': 'test-cluster',
                },
                name: 'policy-set-with-1-placement-policy-1',
                namespace: 'test-cluster',
                uid: '36c5e139-0982-428f-9248-7da6fc3d97e2',
            },
            spec: {
                namespaceSelector: { exclude: ['kube-*'], include: ['default'] },
                'object-templates': [
                    {
                        complianceType: 'musthave',
                        objectDefinition: { apiVersion: 'v1', kind: 'Namespace', metadata: { name: 'test' } },
                    },
                ],
                remediationAction: 'inform',
                severity: 'low',
            },
            status: {
                compliancyDetails: [
                    {
                        Compliant: 'Compliant',
                        Validity: {},
                        conditions: [
                            {
                                lastTransitionTime: '2022-02-22T13:32:41Z',
                                message:
                                    'namespaces [test] found as specified, therefore this Object template is compliant',
                                reason: 'K8s `must have` object already exists',
                                status: 'True',
                                type: 'notification',
                            },
                        ],
                    },
                ],
                compliant: 'Compliant',
                relatedObjects: [
                    {
                        compliant: 'Compliant',
                        object: { apiVersion: 'v1', kind: 'namespaces', metadata: { name: 'test' } },
                        reason: 'Resource found as expected',
                        cluster: 'test-cluster',
                    },
                ],
            },
        },
    },
}

describe('Policy Template Details content', () => {
    test('Should render Policy Template Details Page content correctly', async () => {
        const getResourceNock = nockGet(getResourceRequest, getResourceResponse)
        render(
            <RecoilRoot>
                <MemoryRouter>
                    <PolicyTemplateDetails
                        clusterName={'test-cluster'}
                        apiGroup={'policy.open-cluster-management.io'}
                        apiVersion={'v1'}
                        kind={'ConfigurationPolicy'}
                        templateName={'policy-set-with-1-placement-policy-1'}
                    />
                </MemoryRouter>
            </RecoilRoot>
        )

        // Wait for delete resource requests to finish
        await waitForNocks([getResourceNock])

        // wait template description section to load correctly
        await waitForText('Template details')
        await waitForText('policy-set-with-1-placement-policy-1')
        await waitForText('test-cluster')
        await waitForText('ConfigurationPolicy')
        await waitForText(
            '[{"Compliant":"Compliant","Validity":{},"conditions":[{"lastTransitionTime":"2022-02-22T13:32:41Z","message":"namespaces [test] found as specified, therefore this Object template is compliant","reason":"K8s `must have` object already exists","status":"True","type":"notification"}]}]'
        )

        // wait for template yaml to load correctly
        await waitForText('Template yaml')

        // wait for related resources table to load correctly
        await waitForText('Related resources')
        await waitForText('test')
        await waitForText('namespaces')
        await waitForText('v1')
        await waitForText('No violations')
        await waitForText('Resource found as expected')
    })
})
