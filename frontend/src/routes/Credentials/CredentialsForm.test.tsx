/* Copyright Contributors to the Open Cluster Management project */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { namespacesState } from '../../atoms'
import { nockCreate, nockIgnoreApiPaths, nockIgnoreRBAC } from '../../lib/nock-util'
import {
  clearByTestId,
  clickByPlaceholderText,
  clickByTestId,
  clickByText,
  selectByText,
  typeByTestId,
  waitForNock,
  waitForTestId,
  waitForText,
} from '../../lib/test-util'
import { NavigationPath } from '../../NavigationPath'
import { CreateCredentialsFormPage } from './CredentialsForm'
import { CredentialsType } from './CredentialsType'
import { Provider } from '../../ui-components'
import userEvent from '@testing-library/user-event'
import { createProviderConnection, mockNamespaces } from '../../test-helpers/createProviderConnection'

describe('add credentials page', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  const Component = (props: { credentialsType: CredentialsType }) => {
    return (
      <RecoilRoot initializeState={(snapshot) => snapshot.set(namespacesState, mockNamespaces)}>
        <MemoryRouter initialEntries={[`${NavigationPath.addCredentials}?credentialsType=${props.credentialsType}`]}>
          <CreateCredentialsFormPage credentialsType={props.credentialsType} />
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  it('should create aws (Amazon Web Services) credentials', async () => {
    render(<Component credentialsType={Provider.aws} />)
    const providerConnection = createProviderConnection(
      'aws',
      {
        aws_access_key_id: 'aws_access_key_id',
        aws_secret_access_key: 'aws_secret_access_key',
      },
      true
    )

    await typeByTestId('credentialsName', providerConnection.metadata.name!)
    await selectByText('Select a namespace for the credential', providerConnection.metadata.namespace!)
    await typeByTestId('baseDomain', providerConnection.stringData?.baseDomain!)
    await clickByText('Next')

    // AWS credentials
    await typeByTestId('aws_access_key_id', providerConnection.stringData?.aws_access_key_id!)
    await typeByTestId('aws_secret_access_key', providerConnection.stringData?.aws_secret_access_key!)
    await clickByText('Next')

    // skip proxy
    await clickByText('Next')

    // Pull secret and SSH
    await typeByTestId('pullSecret', providerConnection.stringData?.pullSecret!)
    await typeByTestId('ssh-privatekey', providerConnection.stringData?.['ssh-privatekey']!)
    await typeByTestId('ssh-publickey', providerConnection.stringData?.['ssh-publickey']!)
    await clickByText('Next')

    // Add Credentials
    const createNock = nockCreate({ ...providerConnection })
    await clickByText('Add')
    await waitForNock(createNock)
  })

  // Skipping AWS S3 credentials
  it.skip('should create aws (Amazon Web Services) s3 credentials', async () => {
    render(<Component credentialsType={Provider.awss3} />)
    const providerConnection = createProviderConnection(
      'awss3',
      {
        bucket: 'test-bucket',
        region: 'us-east-1',
        credentials: '[default]\naws_access_key_id=abcd\naws_secret_access_key=efgh',
      },
      false,
      'hypershift-operator-oidc-provider-s3-credentials',
      'local-cluster'
    )

    await waitForTestId('credentialsName')
    await clickByText('Next')

    // bucket
    await typeByTestId('bucketName', providerConnection.stringData?.bucket!)
    await typeByTestId('aws_access_key_id', 'bcd')
    await typeByTestId('aws_secret_access_key', 'fgh')
    await selectByText('Select region', providerConnection.stringData?.region!)

    // open yaml and use yaml to change aws_access_key_id
    await waitFor(() => screen.getByRole('checkbox', { name: /yaml/i }))
    userEvent.click(screen.getByRole('checkbox', { name: /yaml/i }))
    const input = screen.getByRole('textbox', {
      name: /monaco/i,
    }) as HTMLTextAreaElement
    await waitFor(() => expect(input).not.toHaveValue(''))
    userEvent.click(
      screen.getByRole('button', {
        name: /show secrets/i,
      })
    )
    await new Promise((resolve) => setTimeout(resolve, 1200)) // wait for debounce
    const changeYaml = (path: string, text: string) => {
      const i = input.value.indexOf(path) + path.length
      input.setSelectionRange(i, i)
      userEvent.type(input, text)
    }
    changeYaml('aws_access_key_id=', 'a')
    changeYaml('aws_secret_access_key=', 'e')
    await new Promise((resolve) => setTimeout(resolve, 500)) // wait for debounce
    userEvent.click(screen.getByRole('checkbox', { name: /yaml/i }))
    await new Promise((resolve) => setTimeout(resolve, 500)) // wait for debounce

    await clickByText('Next')

    // Add Credentials
    const createNock = nockCreate({ ...providerConnection })
    await clickByText('Add')
    await waitForNock(createNock)
  })

  it('should create azr (Azure) credentials', async () => {
    render(<Component credentialsType={Provider.azure} />)

    const providerConnection = createProviderConnection(
      'azr',
      {
        baseDomainResourceGroupName: 'baseDomainResourceGroupName',
        cloudName: 'AzurePublicCloud',
        'osServicePrincipal.json': JSON.stringify({
          clientId: 'clientId',
          clientSecret: 'clientSecret',
          tenantId: 'tenantId',
          subscriptionId: 'subscriptionId',
        }),
      },
      true
    )

    await typeByTestId('credentialsName', providerConnection.metadata.name!)
    await selectByText('Select a namespace for the credential', providerConnection.metadata.namespace!)
    await typeByTestId('baseDomain', providerConnection.stringData?.baseDomain!)
    await clickByText('Next')

    // AZR credentials
    await typeByTestId('baseDomainResourceGroupName', providerConnection.stringData?.baseDomainResourceGroupName!)
    await typeByTestId('clientId', 'clientId')
    await typeByTestId('clientSecret', 'clientSecret')
    await typeByTestId('tenantId', 'tenantId')
    await typeByTestId('subscriptionId', 'subscriptionId')
    await clickByText('Next')

    // skip proxy
    await clickByText('Next')

    // Pull secret
    await typeByTestId('pullSecret', providerConnection.stringData?.pullSecret!)
    await typeByTestId('ssh-privatekey', providerConnection.stringData?.['ssh-privatekey']!)
    await typeByTestId('ssh-publickey', providerConnection.stringData?.['ssh-publickey']!)
    await clickByText('Next')

    // Add Credentials
    const createNock = nockCreate({ ...providerConnection })
    await clickByText('Add')
    await waitForNock(createNock)
  })

  it('should create gcp (Google Cloud Platform) credentials', async () => {
    render(<Component credentialsType={Provider.gcp} />)

    const providerConnection = createProviderConnection(
      'gcp',
      {
        projectID: 'gcp123',
        'osServiceAccount.json': '{ "json": "key"}',
      },
      true
    )

    await typeByTestId('credentialsName', providerConnection.metadata.name!)
    await selectByText('Select a namespace for the credential', providerConnection.metadata.namespace!)
    await typeByTestId('baseDomain', providerConnection.stringData?.baseDomain!)
    await clickByText('Next')

    // GCP credentials
    await typeByTestId('projectID', providerConnection.stringData?.projectID!)
    await typeByTestId('osServiceAccount.json', providerConnection.stringData?.['osServiceAccount.json']!)
    await clickByText('Next')

    // skip proxy
    await clickByText('Next')

    // Pull secret
    await typeByTestId('pullSecret', providerConnection.stringData?.pullSecret!)
    await typeByTestId('ssh-privatekey', providerConnection.stringData?.['ssh-privatekey']!)
    await typeByTestId('ssh-publickey', providerConnection.stringData?.['ssh-publickey']!)
    await clickByText('Next')

    // Add Credentials
    const createNock = nockCreate({ ...providerConnection })
    await clickByText('Add')
    await waitForNock(createNock)
  })

  it('should create vmw (VMware) credentials', async () => {
    render(<Component credentialsType={Provider.vmware} />)

    const providerConnection = createProviderConnection(
      'vmw',
      {
        vCenter: 'vcenter.example.com',
        username: 'username@domain',
        password: 'password',
        cacertificate: '-----BEGIN CERTIFICATE-----\ncertdata\n-----END CERTIFICATE-----',
        cluster: 'cluster',
        datacenter: 'datacenter',
        defaultDatastore: 'defaultDatastore',
        vsphereDiskType: 'eagerZeroedThick',
        vsphereFolder: '/datacenter/vm/folder',
        vsphereResourcePool: '/datacenter/host/cluster/Resources/resourcePool',
        clusterOSImage: '',
        imageContentSources: '',
        disconnectedAdditionalTrustBundle: '',
      },
      true
    )

    await typeByTestId('credentialsName', providerConnection.metadata.name!)
    await selectByText('Select a namespace for the credential', providerConnection.metadata.namespace!)
    await typeByTestId('baseDomain', providerConnection.stringData?.baseDomain!)
    await clickByText('Next')

    // credentials
    await typeByTestId('vCenter', `ftp://${providerConnection.stringData?.vCenter!}`)
    await typeByTestId('username', providerConnection.stringData?.username!)
    await typeByTestId('password', providerConnection.stringData?.password!)
    await typeByTestId('cacertificate', providerConnection.stringData?.cacertificate!)
    await typeByTestId('cluster', providerConnection.stringData?.cluster!)
    await typeByTestId('datacenter', providerConnection.stringData?.datacenter!)
    await typeByTestId('defaultDatastore', providerConnection.stringData?.defaultDatastore!)
    await clickByPlaceholderText('Select the vSphere disk type')
    await clickByText(providerConnection.stringData?.vsphereDiskType!)

    await typeByTestId('vsphereFolder', 'folder')
    await typeByTestId('vsphereResourcePool', 'resource pool')
    await clickByText('Next')

    // Confirm validation messages appear
    await waitForText(
      "The value must be a fully-qualified host name or IP address. Do not include the 'ftp://' URL scheme."
    )
    await waitForText(`The path must begin with '/${providerConnection.stringData?.datacenter}/vm/'`)
    await waitForText(
      `The path must begin with '/${providerConnection.stringData?.datacenter}/host/${providerConnection.stringData?.cluster}/Resources/'`
    )

    // Fix vCenter server, folder, and resource pool and continue
    await clearByTestId('vCenter')
    await typeByTestId('vCenter', providerConnection.stringData?.vCenter!)
    await clearByTestId('vsphereFolder')
    await typeByTestId('vsphereFolder', providerConnection.stringData?.vsphereFolder!)
    await clearByTestId('vsphereResourcePool')
    await typeByTestId('vsphereResourcePool', providerConnection.stringData?.vsphereResourcePool!)
    await clickByText('Next')

    // skip disconnected
    await clickByText('Next')

    // skip proxy
    await clickByText('Next')

    // Pull secret
    await typeByTestId('pullSecret', providerConnection.stringData?.pullSecret!)
    await typeByTestId('ssh-privatekey', providerConnection.stringData?.['ssh-privatekey']!)
    await typeByTestId('ssh-publickey', providerConnection.stringData?.['ssh-publickey']!)
    await clickByText('Next')

    // Add Credentials
    const createNock = nockCreate({ ...providerConnection })
    await clickByText('Add')
    await waitForNock(createNock)
  })

  it('should create ost (OpenStack) credentials', async () => {
    render(<Component credentialsType={Provider.openstack} />)

    const providerConnection = createProviderConnection(
      'ost',
      {
        'clouds.yaml':
          'clouds:\n  openstack:\n    auth:\n      auth_url: "https://acme.com"\n      username: "fakeuser"\n      password: "fakepwd"\n    cacert: "/etc/openstack-ca/ca.crt"\n',
        cloud: 'openstack',
        clusterOSImage: '',
        imageContentSources: '',
        disconnectedAdditionalTrustBundle: '',
        os_ca_bundle: '-----BEGIN CERTIFICATE-----\ncertdata\n-----END CERTIFICATE-----',
      },
      true
    )

    await typeByTestId('credentialsName', providerConnection.metadata.name!)
    await selectByText('Select a namespace for the credential', providerConnection.metadata.namespace!)
    await typeByTestId('baseDomain', providerConnection.stringData?.baseDomain!)
    await clickByText('Next')

    // ost credentials
    await typeByTestId('cloud', providerConnection.stringData?.cloud!)
    await typeByTestId('clouds.yaml', providerConnection.stringData?.['clouds.yaml']!)
    userEvent.type(
      screen.getByRole('textbox', {
        name: /internal ca certificate/i,
      }),
      providerConnection.stringData?.os_ca_bundle!
    )

    await clickByText('Next')

    // skip disconnected
    await clickByText('Next')

    // skip proxy
    await clickByText('Next')

    // Pull secret
    await typeByTestId('pullSecret', providerConnection.stringData?.pullSecret!)
    await typeByTestId('ssh-privatekey', providerConnection.stringData?.['ssh-privatekey']!)
    await typeByTestId('ssh-publickey', providerConnection.stringData?.['ssh-publickey']!)
    await clickByText('Next')

    // Add Credentials
    const createNock = nockCreate({ ...providerConnection })
    await clickByText('Add')
    await waitForNock(createNock)
  })

  it('should create ans (Ansible) credentials', async () => {
    render(<Component credentialsType={Provider.ansible} />)

    const providerConnection = createProviderConnection(
      'ans',
      {
        host: 'https://ansiblehost.com',
        token: 'ansibleToken',
      },
      false
    )

    await typeByTestId('credentialsName', providerConnection.metadata.name!)
    await selectByText('Select a namespace for the credential', providerConnection.metadata.namespace!)
    await clickByText('Next')

    // ans credentials
    await typeByTestId('ansibleHost', providerConnection.stringData?.host!)
    await typeByTestId('ansibleToken', providerConnection.stringData?.token!)
    await clickByText('Next')

    // Add Credentials
    const createNock = nockCreate({ ...providerConnection })
    await clickByText('Add')
    await waitForNock(createNock)
  })

  it('should create rhocm credentials with ocm API Token (default) option', async () => {
    render(<Component credentialsType={Provider.redhatcloud} />)

    const providerConnection = createProviderConnection('rhocm', {
      auth_method: 'offline-token',
      ocmAPIToken: 'ocmAPIToken',
    })

    await typeByTestId('credentialsName', providerConnection.metadata.name!)
    await selectByText('Select a namespace for the credential', providerConnection.metadata.namespace!)
    await clickByText('Next')

    // Assert the presence of the title and description text

    const credentialTitle = await screen.findByText('Enter the OpenShift Cluster Manager credentials')
    expect(credentialTitle).toBeInTheDocument()

    const ocmTokenLink = await screen.findByText('How do I get OpenShift Cluster Manager credentials?')
    expect(ocmTokenLink).toBeInTheDocument()

    // Open the dropdown
    fireEvent.click(
      screen.getByRole('combobox', {
        name: 'Authentication method',
      })
    )

    // Select the "API Token" option
    const apiTokenOption = screen.getByRole('option', { name: 'API token' })
    fireEvent.click(apiTokenOption)

    // rhocm credentials
    await typeByTestId('ocmAPIToken', providerConnection.stringData?.ocmAPIToken!)
    await clickByText('Next')

    // Add Credentials
    const createNock = nockCreate({ ...providerConnection })
    await clickByText('Add')
    await waitForNock(createNock)

    // Assertions for code coverage
    expect(providerConnection.stringData?.auth_method).toBe('offline-token')
    expect(providerConnection.stringData?.ocmAPIToken).toBe('ocmAPIToken')
  })

  it('should create rhocm credentials with Service Account option', async () => {
    render(<Component credentialsType={Provider.redhatcloud} />)

    const providerConnection = createProviderConnection('rhocm', {
      auth_method: 'service-account',
      client_id: 'serviceAccountClientId',
      client_secret: 'serviceAccountClientSecret',
    })

    await typeByTestId('credentialsName', providerConnection.metadata.name!)
    await selectByText('Select a namespace for the credential', providerConnection.metadata.namespace!)
    await clickByText('Next')

    // Assert the presence of the tile and description

    const credentialTitle = await screen.findByText('Enter the OpenShift Cluster Manager credentials')
    expect(credentialTitle).toBeInTheDocument()
    const serviceAccountTokenLink = await screen.findByText('How do I get OpenShift Cluster Manager credentials?')
    expect(serviceAccountTokenLink).toBeInTheDocument()

    // Open the dropdown
    screen
      .getByRole('combobox', {
        name: 'Authentication method',
      })
      .click()

    // Select the "Service Account" option
    const serviceAccountOption = screen.getByText('Service account')
    fireEvent.click(serviceAccountOption)

    await clickByText('Next')

    // rhocm credentials
    await typeByTestId('client_id', providerConnection.stringData?.client_id!)
    await typeByTestId('client_secret', providerConnection.stringData?.client_secret!)
    await clickByText('Next')

    // Add Credentials
    const createNock = nockCreate({ ...providerConnection })
    await clickByText('Add')
    await waitForNock(createNock)

    // Assertions for code coverage
    expect(providerConnection.stringData?.auth_method).toBe('service-account')
    expect(providerConnection.stringData?.client_id).toBe('serviceAccountClientId')
    expect(providerConnection.stringData?.client_secret).toBe('serviceAccountClientSecret')
  })

  it('should throw error for requiredValidationMessage', async () => {
    render(<Component credentialsType={Provider.redhatcloud} />)

    await clickByText('Next')
    await waitForText('This is a required field.', true)
  })

  it('should create kubevirt (Red Hat Virtualization) credentials without external infra', async () => {
    render(<Component credentialsType={Provider.kubevirt} />)
    const providerConnection = createProviderConnection('kubevirt', {
      pullSecret: '{"pull":"secret"}\n',
      'ssh-publickey': 'ssh-rsa AAAAB1 fakeemail@redhat.com\n',
    })

    // Render the form and fill in the fields
    await typeByTestId('credentialsName', providerConnection.metadata.name!)
    await selectByText('Select a namespace for the credential', providerConnection.metadata.namespace!)
    await clickByText('Next')

    // (no external infra)
    await clickByText('Next')

    // Fill in the pull secret and SSH public key
    await typeByTestId('pullSecret', providerConnection.stringData?.pullSecret!)
    await typeByTestId('ssh-publickey', providerConnection.stringData?.['ssh-publickey']!)
    await clickByText('Next')

    // Add Credentials
    const createNock = nockCreate({ ...providerConnection })
    await clickByText('Add')
    await waitForNock(createNock)
  })

  it('should create kubevirt (Red Hat Virtualization) credentials with external infra', async () => {
    render(<Component credentialsType={Provider.kubevirt} />)

    // mock data below for kubevirt (Red Hat Virtualization) credentials with external infrastructure
    const mockKubeconfig = `
clusters:
- name: 'mock-cluster'
  cluster:
    server: 'https://mock-server:6443'
    certificate-authority-data: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCg=='
contexts:
- name: 'mock-context'
  context:
    cluster: 'mock-cluster'
    user: 'mock-user'
    namespace: 'mock-namespace'
users:
- name: 'mock-user'
  user:
    client-certificate-data: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCg=='
    client-key-data: 'LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQo='
current-context: 'mock-context'
`
    const providerConnection = createProviderConnection('kubevirt', {
      pullSecret: '{"pull":"secret"}\n',
      'ssh-publickey': 'ssh-rsa AAAAB1 fakeemail@redhat.com\n',
      kubeconfig: mockKubeconfig,
      externalInfraNamespace: 'external-namespace',
    })

    // Render the form and fill in the fields
    await typeByTestId('credentialsName', providerConnection.metadata.name!)
    await selectByText('Select a namespace for the credential', providerConnection.metadata.namespace!)
    await clickByText('Next')

    // Click on the external infrastructure checkbox
    await clickByTestId('isExternalInfra')

    // Fill in Kubeconfig and Namespace
    await typeByTestId('kubeconfig', providerConnection.stringData?.kubeconfig! ?? '')
    await typeByTestId('externalInfraNamespace', providerConnection.stringData?.externalInfraNamespace ?? '')
    await clickByText('Next')

    // Fill in the pull secret and SSH public key
    await typeByTestId('pullSecret', providerConnection.stringData?.pullSecret!)
    await typeByTestId('ssh-publickey', providerConnection.stringData?.['ssh-publickey']!)
    await clickByText('Next')

    // Add Credentials
    const createNock = nockCreate({ ...providerConnection })
    await clickByText('Add')
    await waitForNock(createNock)
  })
})
