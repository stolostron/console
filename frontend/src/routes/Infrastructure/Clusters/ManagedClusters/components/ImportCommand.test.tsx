/* Copyright Contributors to the Open Cluster Management project */

import { Cluster, ClusterStatus, Secret, SecretApiVersion, SecretKind } from '../../../../../resources'
import { render, screen, waitFor } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { mockBadRequestStatus, nockGet, nockIgnoreApiPaths } from '../../../../../lib/nock-util'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { ImportCommandContainer } from './ImportCommand'

const mockSecretResponse: Secret = {
  apiVersion: SecretApiVersion,
  kind: SecretKind,
  metadata: {
    name: 'test-cluster-import',
    namespace: 'test-cluster',
  },
  data: { 'crds.yaml': 'crd yaml', 'import.yaml': 'import yaml' },
  type: 'Opaque',
}

const mockCluster: Cluster = {
  name: 'test-cluster',
  displayName: 'test-cluster',
  namespace: 'test-cluster',
  uid: 'test-cluster-uid',
  status: ClusterStatus.pendingimport,
  distribution: {
    k8sVersion: '1.19',
    ocp: undefined,
    displayVersion: '1.19',
    isManagedOpenShift: false,
  },
  labels: undefined,
  nodes: undefined,
  kubeApiServer: '',
  consoleURL: '',
  hasAutomationTemplate: false,
  hive: {
    isHibernatable: true,
    clusterPool: undefined,
    secrets: {
      installConfig: '',
    },
  },
  isHive: false,
  isManaged: true,
  isCurator: false,
  isHostedCluster: false,
  isSNOCluster: false,
  owner: {},
  kubeconfig: '',
  kubeadmin: '',
  isHypershift: false,
  isRegionalHubCluster: false,
}

describe('ImportCommandContainer', () => {
  beforeEach(() => nockIgnoreApiPaths())
  const Component = () => {
    return (
      <RecoilRoot>
        <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
          <ImportCommandContainer />
        </ClusterContext.Provider>
      </RecoilRoot>
    )
  }

  test('renders import command', async () => {
    const getSecretNock = nockGet(mockSecretResponse)
    render(<Component />)

    await waitFor(() => expect(screen.getByRole('progressbar')).toBeInTheDocument())
    await waitFor(() => expect(getSecretNock.isDone()).toBeTruthy())
    await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull())
    // await waitFor(() => expect(screen.getByTestId('pending-import-notification')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByTestId('import-command')).toBeInTheDocument())
  })

  test('renders error state', async () => {
    const getSecretNock = nockGet(mockSecretResponse, mockBadRequestStatus)
    render(<Component />)

    await waitFor(() => expect(screen.getByRole('progressbar')).toBeInTheDocument())
    await waitFor(() => expect(getSecretNock.isDone()).toBeTruthy())
    await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull(), { timeout: 10500 })
    await waitFor(() => expect(screen.getByText(mockBadRequestStatus.message)).toBeInTheDocument())
  })
})
