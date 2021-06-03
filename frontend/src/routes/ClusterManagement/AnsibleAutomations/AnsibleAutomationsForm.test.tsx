/* Copyright Contributors to the Open Cluster Management project */

import { Provider } from '@open-cluster-management/ui-components/lib/AcmProvider'
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { clusterCuratorsState, namespacesState, secretsState } from '../../../atoms'
import { nockCreate, nockIgnoreRBAC } from '../../../lib/nock-util'
import {
    clickByPlaceholderText,
    clickByText,
    typeByPlaceholderText,
    typeByTestId,
    waitForNock,
} from '../../../lib/test-util'
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
            prehook: [{ name: 'test-job-pre-install', extra_vars: {} }],
            posthook: [{ name: 'test-job-post-install', extra_vars: {} }],
        },
        upgrade: {
            towerAuthSecret: 'ansible-test-secret',
            prehook: [{ name: 'test-job-pre-upgrade', extra_vars: {} }],
            posthook: [{ name: 'test-job-post-upgrade', extra_vars: {} }],
        },
        scale: {
            towerAuthSecret: 'ansible-test-secret',
            prehook: [{ name: 'test-job-pre-scale', extra_vars: {} }],
            posthook: [{ name: 'test-job-post-scale', extra_vars: {} }],
        },
        destroy: {
            towerAuthSecret: 'ansible-test-secret',
            prehook: [{ name: 'test-job-pre-destroy', extra_vars: {} }],
            posthook: [{ name: 'test-job-post-destroy', extra_vars: {} }],
        },
    },
}

describe('add ansible job template page', () => {
    beforeEach(() => nockIgnoreRBAC())

    it('should create a curator template', async () => {
        render(<AddAnsibleTemplateTest />)

        // template information
        await typeByPlaceholderText('template.create.placeholder', mockClusterCurator.metadata.name!)
        await clickByPlaceholderText('credentials:credentialsForm.ansibleCredentials.placeholder')
        await clickByText(mockSecret.metadata.name!)
        await clickByText('common:next')

        // install templates
        await clickByText('template.job.placeholder', 0)
        await typeByTestId('job-name', mockClusterCurator.spec!.install!.prehook![0].name)
        await clickByText('common:save')
        await clickByText('template.job.placeholder', 1)
        await typeByTestId('job-name', mockClusterCurator.spec!.install!.posthook![0].name)
        await clickByText('common:save')
        await clickByText('common:next')

        // upgrade templates
        await clickByText('template.job.placeholder', 0)
        await typeByTestId('job-name', mockClusterCurator.spec!.upgrade!.prehook![0].name)
        await clickByText('common:save')
        await clickByText('template.job.placeholder', 1)
        await typeByTestId('job-name', mockClusterCurator.spec!.upgrade!.posthook![0].name)
        await clickByText('common:save')
        await clickByText('common:next')

        // scale templates
        await clickByText('template.job.placeholder', 0)
        await typeByTestId('job-name', mockClusterCurator.spec!.scale!.prehook![0].name)
        await clickByText('common:save')
        await clickByText('template.job.placeholder', 1)
        await typeByTestId('job-name', mockClusterCurator.spec!.scale!.posthook![0].name)
        await clickByText('common:save')
        await clickByText('common:next')

        // destroy templates
        await clickByText('template.job.placeholder', 0)
        await typeByTestId('job-name', mockClusterCurator.spec!.destroy!.prehook![0].name)
        await clickByText('common:save')
        await clickByText('template.job.placeholder', 1)
        await typeByTestId('job-name', mockClusterCurator.spec!.destroy!.posthook![0].name)
        await clickByText('common:save')
        await clickByText('common:next')

        // add template
        const createNock = nockCreate(mockClusterCurator)
        await clickByText('common:add')
        await waitForNock(createNock)
    })
})
