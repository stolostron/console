/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { ProviderID } from '../../../../lib/providers'
import { clickByText, typeByPlaceholderText, waitForTestId, waitForText } from '../../../../lib/test-util'
import {
    AnsibleTowerSecret,
    AnsibleTowerSecretApiVersion,
    AnsibleTowerSecretKind,
} from '../../../../resources/ansible-tower-secret'
import { FeatureGate, FeatureGateApiVersion, FeatureGateKind } from '../../../../resources/feature-gate'
import {
    MultiClusterHub,
    MultiClusterHubApiVersion,
    MultiClusterHubKind,
} from '../../../../resources/multi-cluster-hub'
import { CreateProviderWizard } from './CreateProviderWizard'

const projects: string[] = ['default']

const featureGate: FeatureGate = {
    apiVersion: FeatureGateApiVersion,
    kind: FeatureGateKind,
    metadata: {
        name: '',
        namespace: '',
    },
}

const multiClusterHubs: MultiClusterHub[] = [
    {
        apiVersion: MultiClusterHubApiVersion,
        kind: MultiClusterHubKind,
        metadata: {
            name: '',
            namespace: '',
        },
    },
]

const ansSecrets: AnsibleTowerSecret[] = [
    {
        apiVersion: AnsibleTowerSecretApiVersion,
        kind: AnsibleTowerSecretKind,
        metadata: {
            name: 'ansible-tower-secret',
            namespace: 'test-namespace',
            labels: {
                'cluster.open-cluster-management.io/provider': ProviderID.ANS,
            },
        },
        data: {
            metadata: 'aG9zdDogdGVzdAp0b2tlbjogdGVzdAo=',
        },
    },
]

describe('provider wizard page', () => {
    beforeEach(async () => {
        render(
            <CreateProviderWizard
                projects={projects}
                discoveryFeatureGate={featureGate}
                multiClusterHubs={multiClusterHubs}
                ansibleSecrets={ansSecrets}
            />
        )
    })

    it('should load page and namespace', async () => {
        await waitForText('addConnection.wizard.title')
        await waitForText('addConnection.wizard.credentialtype')
        await waitForTestId('ansible.card')
        await waitForTestId('provider.card')
        await clickByText('addConnection.namespaceName.placeholder')
        await waitForText('default')
    })

    it('should configure forms for select credentials', async () => {
        await clickByText('Infrastructure Provider')
        await typeByPlaceholderText('addConnection.connectionName.placeholder', 'test-connection')
        await clickByText('addConnection.namespaceName.placeholder')
        await clickByText('default')
        await clickByText('Next')
        await waitForText('addConnection.providerName.label')
        await clickByText('Back')
        await clickByText('Ansible Tower')
        await clickByText('Next')
        await waitForText('addConnection.ansible.secretname.label')
    })
})
