/* Copyright Contributors to the Open Cluster Management project */

import { Provider } from '@open-cluster-management/ui-components/lib/AcmProvider'
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { clusterCuratorsState, namespacesState, secretsState } from '../../../atoms'
import { nockCreate, nockIgnoreRBAC } from '../../../lib/nock-util'
import { clickByPlaceholderText, clickByText, typeByPlaceholderText, waitForNock } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { ClusterCurator, ClusterCuratorApiVersion, ClusterCuratorKind } from '../../../resources/cluster-curator'
import { Namespace, NamespaceApiVersion, NamespaceKind } from '../../../resources/namespace'
import { Secret, SecretApiVersion, SecretKind } from '../../../resources/secret'
import AnsibleAutomationsFormPage from './AnsibleAutomationsForm'

const mockNamespaces: Namespace[] = [
    {
        apiVersion: NamespaceApiVersion,
        kind: NamespaceKind,
        metadata: { name: 'namespace1' },
    },
]

const mockSecret: Secret = {
    apiVersion: SecretApiVersion,
    kind: SecretKind,
    metadata: {
        name: 'ansible-test-secret',
        namespace: 'namespace-1',
        labels: {
            'cluster.open-cluster-management.io/type': Provider.ansible,
            'cluster.open-cluster-management.io/credentials': '',
        },
    },
}

function AddAnsibleTemplateTest() {
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(namespacesState, mockNamespaces)
                snapshot.set(secretsState, [mockSecret])
                snapshot.set(clusterCuratorsState, [mockClusterCurator])
            }}
        >
            <MemoryRouter initialEntries={[NavigationPath.addAnsibleAutomation]}>
                <Route component={(props: any) => <AnsibleAutomationsFormPage {...props} />} />
            </MemoryRouter>
        </RecoilRoot>
    )
}

const mockClusterCurator: ClusterCurator = {
    apiVersion: ClusterCuratorApiVersion,
    kind: ClusterCuratorKind,
    metadata: {
        name: 'test-curator',
        namespace: 'namespace-1',
    },
    spec: {
        install: {
            towerAuthSecret: 'ansible-test-secret',
            prehook: [{ name: 'test-job-install' }],
            posthook: [{ name: 'test-job-install' }],
        },
        upgrade: {
            towerAuthSecret: 'ansible-test-secret',
            prehook: [{ name: 'test-job-upgrade' }],
            posthook: [{ name: 'test-job-upgrade' }],
        },
        scale: {
            towerAuthSecret: 'ansible-test-secret',
            prehook: [{ name: 'test-job-scale' }],
            posthook: [{ name: 'test-job-scale' }],
        },
        destroy: {
            towerAuthSecret: 'ansible-test-secret',
            prehook: [{ name: 'test-job-destroy' }],
            posthook: [{ name: 'test-job-destroy' }],
        },
    },
}

describe('add ansible job template page', () => {
    beforeEach(() => nockIgnoreRBAC())

    it('should create a curator template', async () => {
        render(<AddAnsibleTemplateTest />)

        // template information
        await typeByPlaceholderText('template.create.placeholder', mockClusterCurator.metadata.name)
        await clickByPlaceholderText('credentials:credentialsForm.ansibleCredentials.placeholder')
        await clickByText(mockSecret.metadata.name)
        await clickByText('common:next')

        // install templates
        await typeByPlaceholderText('template.job.placeholder', mockClusterCurator.spec.install.prehook[0].name, 0)
        await typeByPlaceholderText('template.job.placeholder', mockClusterCurator.spec.install.prehook[0].name, 1)
        await clickByText('common:next')

        // upgrade templates
        await typeByPlaceholderText('template.job.placeholder', mockClusterCurator.spec.upgrade.prehook[0].name, 0)
        await typeByPlaceholderText('template.job.placeholder', mockClusterCurator.spec.upgrade.prehook[0].name, 1)
        await clickByText('common:next')

        // scale templates
        await typeByPlaceholderText('template.job.placeholder', mockClusterCurator.spec.scale.prehook[0].name, 0)
        await typeByPlaceholderText('template.job.placeholder', mockClusterCurator.spec.scale.prehook[0].name, 1)
        await clickByText('common:next')

        // destroy templates
        await typeByPlaceholderText('template.job.placeholder', mockClusterCurator.spec.destroy.prehook[0].name, 0)
        await typeByPlaceholderText('template.job.placeholder', mockClusterCurator.spec.destroy.prehook[0].name, 1)
        await clickByText('common:next')

        // add template
        const createNock = nockCreate(mockClusterCurator)
        await clickByText('common:add')
        await waitForNock(createNock)
    })
})
