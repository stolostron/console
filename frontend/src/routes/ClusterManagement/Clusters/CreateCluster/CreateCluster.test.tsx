import React from 'react'
import { render, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route } from 'react-router-dom'
import { NavigationPath } from '../../../../NavigationPath'
import CreateClusterPage from './CreateCluster'

import { nockList, nockGet, nockPatch, nockOptions, nockCreate } from '../../../../lib/nock-util'
import {
    Project,
    ProjectApiVersion,
    ProjectKind,
    ProjectRequest,
    ProjectRequestApiVersion,
    ProjectRequestKind,
} from '../../../../resources/project'
import { BareMetalAsset, BareMetalAssetApiVersion, BareMetalAssetKind } from '../../../../resources/bare-metal-asset'
import { ClusterImageSet, ClusterImageSetApiVersion, ClusterImageSetKind } from '../../../../resources/cluster-image-set'
import { ProviderConnection, 
        ProviderConnectionApiVersion, 
        ProviderConnectionKind, 
        packProviderConnection} from '../../../../resources/provider-connection'
import {
    ClusterDeployment,
    ClusterDeploymentApiVersion,
    ClusterDeploymentKind,
} from '../../../../resources/cluster-deployment'
import { Secret, SecretApiVersion, SecretKind } from '../../../../resources/secret'

import {cloneDeep} from 'lodash'

const clusterName = 'test'
const projectNamespace = 'test-bare-metal-asset-namespace'

const mockClusterDeployment: ClusterDeployment = {
    apiVersion: ClusterDeploymentApiVersion,
    kind: ClusterDeploymentKind,
    metadata: {
        labels: {
            cloud: 'AWS',
            region: 'us-east-1',
            vendor: 'OpenShift',
        },
        name: clusterName,
        namespace: clusterName,
    },
    spec: {
        baseDomain: 'dev02.test-chesterfield.com',
        clusterName: clusterName,
        installed: false,
        platform: {
            aws: {
                credentialsSecretRef: {
                    name: 'test-cluster-aws-creds',
                },
                region: 'us-east-1',
            },
        },
        provisioning: {
            imageSetRef: {
                name: 'img4.5.15-x86-64',
            },
            installConfigSecretRef: {
                name: 'test-cluster-install-config',
            },
            sshPrivateKeySecretRef: {
                name: 'test-cluster-ssh-private-key',
            },
        },
        pullSecretRef: {
            name: 'test-cluster-pull-secret',
        },
    },
}

const clusterImageSet: ClusterImageSet = {
    apiVersion: ClusterImageSetApiVersion,
    kind: ClusterImageSetKind,
    metadata: {
        name: 'ocp-release43',
    },
    spec: {
        releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.3.40-x86_64'
    },
}
const mockClusterImageSet = [clusterImageSet]

const providerConnection: ProviderConnection = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    metadata: {
        name: 'connection',
        namespace: clusterName,
        labels: {
          'cluster.open-cluster-management.io/provider': 'bmc'
        }
    },
    spec: {
        libvirtURI: 'qemu+ssh://libvirtURI',
        sshKnownHosts: ['sshKnownHosts'],
        imageMirror: 'image.mirror:123/abc',
        bootstrapOSImage: 'bootstrapOSImage',
        clusterOSImage: 'clusterOSImage',
        additionalTrustBundle: '-----BEGIN CERTIFICATE-----\ncertdata\n-----END CERTIFICATE-----',
        baseDomain: 'base.domain',
        pullSecret: '{"pullSecret":"secret"}',
        sshPrivatekey: '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----',
        sshPublickey: 'ssh-rsa AAAAB1 fake@email.com',
    },
}
const mockProviderConnection = [packProviderConnection({ ...providerConnection })]


const bareMetalAsset: BareMetalAsset = {
    apiVersion: BareMetalAssetApiVersion,
    kind: BareMetalAssetKind,
    metadata: {
        name: 'test-bare-metal-asset-001',
        namespace: projectNamespace,
    },
    spec: {
        bmc: {
            address: 'example.com:80',
            credentialsName: 'secret-test-bare-metal-asset',
        },
        bootMACAddress: '00:90:7F:12:DE:7F',
    },
}
const mockBareMetalAssets = Array.from({length: 5}, (val, inx) => {
    const mockedBma = cloneDeep(bareMetalAsset)
    mockedBma.metadata.name = `test-bare-metal-asset-${inx}`
    mockedBma.spec.bmc.credentialsName = `secret-test-bare-metal-asset-${inx}`
    return mockedBma
})

const bmaSecret: Secret = {
    kind: SecretKind,
    apiVersion: SecretApiVersion,
    metadata: {
        name: 'test-bma-bmc-secret',
        namespace: 'test-bare-metal-asset-namespace',
    },
    data: { password: btoa('pass'), username: btoa('user') },
}

const bmaSecretRes: Secret = {
    kind: SecretKind,
    apiVersion: SecretApiVersion,
    metadata: {
        namespace: 'test-bare-metal-asset-namespace',
        name: 'test-bma-bmc-secret',
    },
    data: { password: btoa('pass'), username: btoa('user') },
}

const mockBareMetalSecrets = Array.from({length: 5}, (val, inx) => {
    const mockedSecret = cloneDeep(bmaSecret)
    mockedSecret.metadata.name = `secret-test-bare-metal-asset-${inx}`
    return mockedSecret
})

//////////////////////////////// CREATE MOCKS //////////////////////////////////////////
const mockBareMetalAssets2 = Array.from({length: 3}, (val, inx) => {
    const mockedBma = cloneDeep(bareMetalAsset)
    mockedBma.metadata.name = `test-bare-metal-asset-${inx}`
    mockedBma.spec.bmc.credentialsName = `secret-test-bare-metal-asset-${inx}`
    return mockedBma
})

const mockProject: ProjectRequest = {
    apiVersion: ProjectRequestApiVersion,
    kind: ProjectRequestKind,
    metadata: { name: projectNamespace },
}

const mockProjectResponse: Project = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: {
        name: projectNamespace,
    },
}

const mockBareMetalAssets3 = Array.from({length: 2}, (val, inx) => {
    const mockedBma = cloneDeep(bareMetalAsset)
    mockedBma.metadata.name = `test-bare-metal-asset-${inx+3}`
    mockedBma.spec.bmc.credentialsName = `test-bare-metal-asset-${inx+3}-bmc-secret`
    return mockedBma
})

const createBmaSecretReq = Array.from({length: 2}, (val, inx) => {
    const mockedSecret = cloneDeep(bmaSecret)
    mockedSecret.metadata.name = `test-bare-metal-asset-${inx+3}-bmc-secret`
    delete mockedSecret.data
    mockedSecret.stringData = { password: 'pass', username: 'user' }
    return mockedSecret
})

const createBmaSecretRes = Array.from({length: 2}, (val, inx) => {
    const mockedSecret = cloneDeep(bmaSecretRes)
    mockedSecret.metadata.name = `test-bare-metal-asset-${inx+3}-bmc-secret`
    mockedSecret.data = { password: btoa('pass'), username: btoa('user') }
    return mockedSecret
})


///////////////////////////////// TESTS /////////////////////////////////////////////////////

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
    withTranslation: () => (Component: any) => {
        Component.defaultProps = { ...Component.defaultProps, t: () => '' }
        return Component
    },
}))

describe('CreateCluster', () => {
    const Component = () => {
        return (
            <MemoryRouter initialEntries={[NavigationPath.createCluster]}>
                <Route path={NavigationPath.createCluster}>
                    <CreateClusterPage />
                </Route>
            </MemoryRouter>
        )
    }
    
    test('can create bare metal cluster', async () => {
      
      // simulated resources
        const listImageSetsNock = nockList(clusterImageSet, mockClusterImageSet)
        const listConnections = nockList(providerConnection, mockProviderConnection, [
            'cluster.open-cluster-management.io/cloudconnection=',
        ])
        window.scrollBy = ()=>{}
        const listHosts = nockList(bareMetalAsset, mockBareMetalAssets)
        const getSecret0 = nockGet(mockBareMetalSecrets[0])
        const getSecret1 = nockGet(mockBareMetalSecrets[1])
        const getSecret2 = nockGet(mockBareMetalSecrets[2])
        const getSecret3 = nockGet(mockBareMetalSecrets[3])
        const getSecret4 = nockGet(mockBareMetalSecrets[4])
        
        // create the form
        const { getByTestId, getByPlaceholderText, getByText, container,  getAllByRole, debug } = render(<Component />)
        
        // start filling in the form
        userEvent.type(getByTestId('eman'), clusterName!)
        userEvent.click(getByTestId('cluster.create.baremetal.subtitle'))
        
        // wait for tables/combos to fill in
        await waitFor(() => expect(listImageSetsNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listConnections.isDone()).toBeTruthy())
        await waitFor(() => expect(listHosts.isDone()).toBeTruthy())
        await waitFor(() => expect(getSecret0.isDone()).toBeTruthy())
        await waitFor(() => expect(getSecret1.isDone()).toBeTruthy())
        await waitFor(() => expect(getSecret2.isDone()).toBeTruthy())
        await waitFor(() => expect(getSecret3.isDone()).toBeTruthy())
        await waitFor(() => expect(getSecret4.isDone()).toBeTruthy())

        // finish the form
        await waitFor(() => expect(getByTestId('imageSet')))
        userEvent.type(getByTestId('imageSet'), clusterImageSet.spec.releaseImage!)
        container.querySelector<HTMLButtonElement>('.pf-c-select__toggle')?.click()
        getAllByRole('option')[0].click()
        //userEvent.type(getByPlaceholderText('creation.ocp.cloud.select.connection'), providerConnection.metadata.name!)
        userEvent.click(container.querySelector('[name="check-all"]'))
        userEvent.type(getByTestId('provisioningNetworkCIDR'), '10.4.5.3')
        userEvent.type(getByTestId('dnsVIP'), `10.0.0.3{enter}`)
        
        
        // nocks for cluster creation
        // creates 2 less bmas so that backend creates those 2
        const listBmas = nockList(bareMetalAsset, mockBareMetalAssets2)
        const projectNock = nockCreate(mockProject, mockProjectResponse)
        const secretCreateNock1 = nockCreate(createBmaSecretReq[0], createBmaSecretRes[0])
        const secretCreateNock2 = nockCreate(createBmaSecretReq[1], createBmaSecretRes[1])
        const bmaCreateNock1 = nockCreate(mockBareMetalAssets3[0])
        const bmaCreateNock2 = nockCreate(mockBareMetalAssets3[1])
        
        // click create button
        userEvent.click(getByTestId('create-button-portal-id-btn'))

        // make sure created        
        await waitFor(() => expect(getByText('success.create.creating')).toBeInTheDocument())
        
        await waitFor(() => expect(listBmas.isDone()).toBeTruthy())
        await waitFor(() => expect(projectNock.isDone()).toBeTruthy())
        // two bmas will be created
        await waitFor(() => expect(secretCreateNock1.isDone()).toBeTruthy())
        await waitFor(() => expect(secretCreateNock2.isDone()).toBeTruthy())
        await waitFor(() => expect(bmaCreateNock1.isDone()).toBeTruthy())
        await waitFor(() => expect(bmaCreateNock2.isDone()).toBeTruthy())
        await new Promise((r) => setTimeout(r, 5000));        

//  console.log('here')
//        screen.debug(debug(), 2000000)        
//  console.log('there')        
        
    })
    
})
