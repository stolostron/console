/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { secretsState } from '../../../../../atoms'
import { clickByTestId } from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { CreateInfrastructure } from './CreateInfrastructure'

import {
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
    Secret,
} from '../../../../../resources'

const providerConnectionAws: ProviderConnection = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    metadata: {
        name: 'connectionAws',
        namespace: 'default',
        labels: {
            'cluster.open-cluster-management.io/type': 'aws',
        },
    },
    stringData: {
        aws_access_key_id: 'fake-aws-key-id',
        aws_secret_access_key: 'fake-aws-secret-access-key',
        baseDomain: '',
        pullSecret: '{"pullSecret":"secret"}',
        'ssh-privatekey': '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----',
        'ssh-publickey': 'ssh-rsa AAAAB1 fake@email.com',
    },
    type: 'Opaque',
}

describe('CreateInfrastructure', () => {
    const Component = () => {
        return (
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(secretsState, [providerConnectionAws as Secret])
                }}
            >
                <MemoryRouter initialEntries={[NavigationPath.createInfrastructure]}>
                    <Route path={NavigationPath.createInfrastructure}>
                        <CreateInfrastructure />
                    </Route>
                </MemoryRouter>
            </RecoilRoot>
        )
    }

    test('can select aws', async () => {
        render(<Component />)
        await clickByTestId('aws')
    })

    test('can select baremetal', async () => {
        render(<Component />)
        await clickByTestId('baremetal')
    })

    test('can select google', async () => {
        render(<Component />)
        await clickByTestId('google')
    })

    test('can select azure', async () => {
        render(<Component />)
        await clickByTestId('azure')
    })

    test('can select openstack', async () => {
        render(<Component />)
        await clickByTestId('openstack')
    })

    test('can select rhv', async () => {
        render(<Component />)
        await clickByTestId('rhv')
    })

    test('can select vsphere', async () => {
        render(<Component />)
        await clickByTestId('vsphere')
    })
})
