/* Copyright Contributors to the Open Cluster Management project */
import {
  Namespace,
  NamespaceApiVersion,
  NamespaceKind,
  ProviderConnection,
  ProviderConnectionApiVersion,
  ProviderConnectionKind,
  ProviderConnectionStringData,
} from '../../resources'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { namespacesState } from '../../atoms'
import { nockCreate, nockIgnoreApiPaths, nockIgnoreRBAC } from '../../lib/nock-util'
import {
  clearByTestId,
  clickByPlaceholderText,
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

const mockNamespaces: Namespace[] = ['namespace1', 'namespace2', 'namespace3', 'local-cluster'].map((name) => ({
  apiVersion: NamespaceApiVersion,
  kind: NamespaceKind,
  metadata: { name },
}))

export function createProviderConnection(
  provider: string,
  stringData: ProviderConnectionStringData,
  common = false,
  name?: string,
  namespace?: string
): ProviderConnection {
  return {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    type: 'Opaque',
    metadata: {
      name: name ? name : `${provider}-connection`,
      namespace: namespace ? namespace : mockNamespaces[0].metadata.name,
      labels: {
        'cluster.open-cluster-management.io/type': provider,
        'cluster.open-cluster-management.io/credentials': '',
      },
    },
    stringData: common
      ? {
          ...stringData,
          ...{
            baseDomain: 'baseDomain',
            pullSecret: '{"pull":"secret"}\n',
            'ssh-privatekey': '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----\n',
            'ssh-publickey': 'ssh-rsa AAAAB1 fakeemail@redhat.com\n',
            httpProxy: '',
            httpsProxy: '',
            noProxy: '',
            additionalTrustBundle: '',
          },
        }
      : stringData,
  }
}

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
      { aws_access_key_id: 'aws_access_key_id', aws_secret_access_key: 'aws_secret_access_key' },
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

  it('should create aws (Amazon Web Services) s3 credentials', async () => {
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
        username: 'username',
        password: 'password',
        cacertificate: '-----BEGIN CERTIFICATE-----\ncertdata\n-----END CERTIFICATE-----',
        cluster: 'cluster',
        datacenter: 'datacenter',
        defaultDatastore: 'defaultDatastore',
        vsphereDiskType: 'eagerZeroedThick',
        vsphereFolder: '/datacenter/vm/folder',
        vsphereResourcePool: '/datacenter/host/cluster/Resources/resourcePool',
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

  it('should create rhv (Red Hat Virtualization) credentials', async () => {
    render(<Component credentialsType={Provider.redhatvirtualization} />)

    const providerConnection = createProviderConnection(
      'redhatvirtualization',
      {
        ovirt_url: 'rhv_url',
        ovirt_fqdn: 'rhv_fqdn',
        ovirt_username: 'username',
        ovirt_password: 'password',
        ovirt_ca_bundle: '-----BEGIN CERTIFICATE-----\ncertdata\n-----END CERTIFICATE-----',
      },
      true
    )

    await typeByTestId('credentialsName', providerConnection.metadata.name!)
    await selectByText('Select a namespace for the credential', providerConnection.metadata.namespace!)
    await typeByTestId('baseDomain', providerConnection.stringData?.baseDomain!)
    await clickByText('Next')

    // credentials
    await typeByTestId('ovirt_url', providerConnection.stringData?.ovirt_url!)
    await typeByTestId('ovirt_fqdn', providerConnection.stringData?.ovirt_fqdn!)
    await typeByTestId('ovirt_username', providerConnection.stringData?.ovirt_username!)
    await typeByTestId('ovirt_password', providerConnection.stringData?.ovirt_password!)
    await typeByTestId('ovirt_ca_bundle', providerConnection.stringData?.ovirt_ca_bundle!)
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
          'clouds:\n  openstack:\n    auth:\n      auth_url: "https://acme.com"\n      username: "fakeuser"\n      password: "fakepwd"\n      cacert: "/etc/openstack-ca/ca.crt"\n',
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

  it('should create rhocm credentials', async () => {
    render(<Component credentialsType={Provider.redhatcloud} />)

    const providerConnection = createProviderConnection('rhocm', {
      ocmAPIToken: 'ocmAPIToken',
    })

    await typeByTestId('credentialsName', providerConnection.metadata.name!)
    await selectByText('Select a namespace for the credential', providerConnection.metadata.namespace!)
    await clickByText('Next')

    // rhocm credentials
    await typeByTestId('ocmAPIToken', providerConnection.stringData?.ocmAPIToken!)
    await clickByText('Next')

    // Add Credentials
    const createNock = nockCreate({ ...providerConnection })
    await clickByText('Add')
    await waitForNock(createNock)
  })

  it('should throw error for requiredValidationMessage', async () => {
    render(<Component credentialsType={Provider.redhatcloud} />)

    await clickByText('Next')
    await waitForText('This is a required field.', true)
  })
})
