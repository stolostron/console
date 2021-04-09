/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import React from 'react'
import {
    clickByText,
    typeByPlaceholderText,
    waitForLabelText,
    waitForTestId,
    waitForText,
} from '../../../../lib/test-util'
import { FeatureGate, FeatureGateApiVersion, FeatureGateKind } from '../../../../resources/feature-gate'
import {
    MultiClusterHub,
    MultiClusterHubApiVersion,
    MultiClusterHubKind,
} from '../../../../resources/multi-cluster-hub'
import {
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
} from '../../../../resources/provider-connection'
import { CreateProviderWizard } from './CreateProviderWizard'

const providerConnection: ProviderConnection = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    metadata: {
        name: '',
        namespace: '',
    },
}

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

describe('create provider wizard ', () => {
    beforeEach(async () => {
        render(
            <CreateProviderWizard
                projects={projects}
                discoveryFeatureGate={featureGate}
                multiClusterHubs={multiClusterHubs}
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

        await waitForLabelText('addConnection.ansible.secretname.label')
    })
})
