/* Copyright Contributors to the Open Cluster Management project */

import {
    ClusterCurator,
    ClusterCuratorApiVersion,
    ClusterCuratorKind,
    Namespace,
    NamespaceApiVersion,
    NamespaceKind,
    Secret,
    SecretApiVersion,
    SecretKind,
} from '@open-cluster-management/resources'
import { Provider } from '@open-cluster-management/ui-components/lib/AcmProvider'
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { clusterCuratorsState, namespacesState, secretsState } from '../../../atoms'
import { nockAnsibleTower, nockCreate, nockIgnoreRBAC } from '../../../lib/nock-util'
import { clickByPlaceholderText, clickByText, typeByPlaceholderText, waitForNock } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { AnsibleTowerJobTemplateList } from '@open-cluster-management/resources/src/ansible-job'
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
    stringData: {
        host: 'https://ansible-tower-web-svc-tower.com',
        token: 'abcd',
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
            prehook: [{ name: 'job_1', extra_vars: {} }],
            posthook: [{ name: 'job_1', extra_vars: {} }],
        },
        upgrade: {
            towerAuthSecret: 'ansible-test-secret',
            prehook: [{ name: 'job_1', extra_vars: {} }],
            posthook: [{ name: 'job_1', extra_vars: {} }],
        },
        scale: {
            towerAuthSecret: 'ansible-test-secret',
            prehook: [],
            posthook: [],
        },
        destroy: {
            towerAuthSecret: 'ansible-test-secret',
            prehook: [],
            posthook: [],
        },
    },
}

const mockAnsibleCredential = {
    towerHost: 'https://ansible-tower-web-svc-tower.com/api/v2/job_templates/',
    token: 'abcd',
}

const mockTemplateList: AnsibleTowerJobTemplateList = {
    results: [
        {
            name: 'job_1',
        },
    ],
}

describe('add ansible job template page', () => {
    beforeEach(() => {
        nockIgnoreRBAC()
    })

    it('should create a curator template', async () => {
        render(<AddAnsibleTemplateTest />)

        // template information
        nockAnsibleTower(mockAnsibleCredential, mockTemplateList)
        await typeByPlaceholderText('template.create.placeholder', mockClusterCurator.metadata.name!)
        await clickByPlaceholderText('credentials:credentialsForm.ansibleCredentials.placeholder')
        await clickByText(mockSecret.metadata.name!)
        await clickByText('common:next')

        // install templates
        await clickByText('template.job.placeholder', 0)
        await clickByPlaceholderText('cluster:template.modal.name.placeholder', 0)
        await clickByText(mockTemplateList.results![0].name!, 0)
        await clickByText('common:save')
        await clickByText('template.job.placeholder', 1)
        await clickByPlaceholderText('cluster:template.modal.name.placeholder', 0)
        await clickByText(mockTemplateList.results![0].name!, 1)
        await clickByText('common:save')
        await clickByText('common:next')

        // upgrade templates
        await clickByText('template.job.placeholder', 0)
        await clickByPlaceholderText('cluster:template.modal.name.placeholder', 0)
        await clickByText(mockTemplateList.results![0].name!, 0)
        await clickByText('common:save')
        await clickByText('template.job.placeholder', 1)
        await clickByPlaceholderText('cluster:template.modal.name.placeholder', 0)
        await clickByText(mockTemplateList.results![0].name!, 1)
        await clickByText('common:save')
        await clickByText('common:next')

        // add template
        const createNock = nockCreate(mockClusterCurator)
        nockAnsibleTower(mockAnsibleCredential, mockTemplateList)
        await clickByText('common:add')
        await waitForNock(createNock)
    })
})
