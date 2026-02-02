/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import { TFunction } from 'react-i18next'
import { getResource } from '../../../../../resources/utils'
import { fleetResourceRequest } from '../../../../../resources/utils/fleet-resource-request'
import { YAMLContainer } from './YAMLContainer'

jest.mock('../../../../../resources/utils', () => ({
  getResource: jest.fn(),
}))

jest.mock('../../../../../resources/utils/fleet-resource-request', () => ({
  fleetResourceRequest: jest.fn(),
}))

jest.mock('../../../../../components/SyncEditor/SyncEditor', () => ({
  SyncEditor: ({ editorTitle, resources }: { editorTitle: string; resources: unknown[] }) => (
    <div data-testid="sync-editor" data-editor-title={editorTitle}>
      {resources?.length
        ? `Resource: ${(resources[0] as { metadata?: { name?: string } })?.metadata?.name}`
        : 'No resource'}
    </div>
  ),
}))

const t: TFunction = ((key: string) => key) as TFunction

const mockResource = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: { name: 'foo', namespace: 'test-ns' },
  data: {},
}

describe('YAMLContainer', () => {
  const mockGetResource = getResource as jest.MockedFunction<typeof getResource>
  const mockFleetResourceRequest = fleetResourceRequest as jest.MockedFunction<typeof fleetResourceRequest>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading state initially', () => {
    mockGetResource.mockReturnValue({
      promise: new Promise(() => {}),
    } as ReturnType<typeof getResource>)
    const node = {
      name: 'foo',
      namespace: 'test-ns',
      type: 'secret',
      cluster: 'local-cluster',
      specs: { isDesign: false },
    }
    render(<YAMLContainer node={node} t={t} hubClusterName="local-cluster" />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('fetches resource via getResource when cluster is hub cluster and renders SyncEditor', async () => {
    mockGetResource.mockReturnValue({
      promise: Promise.resolve(mockResource),
      abort: () => new AbortController().abort(),
    } as ReturnType<typeof getResource>)
    const node = {
      name: 'foo',
      namespace: 'test-ns',
      type: 'secret',
      cluster: 'local-cluster',
      specs: { isDesign: false },
    }
    render(<YAMLContainer node={node} t={t} hubClusterName="local-cluster" />)
    await waitFor(() => {
      expect(mockGetResource).toHaveBeenCalledWith({
        apiVersion: '',
        kind: 'secret',
        metadata: { namespace: 'test-ns', name: 'foo' },
      })
    })
    await waitFor(() => {
      expect(screen.getByText(/Resource: foo/)).toBeInTheDocument()
    })
  })

  it('fetches resource via fleetResourceRequest when cluster is remote and renders SyncEditor', async () => {
    mockFleetResourceRequest.mockResolvedValue(mockResource)
    const node = {
      name: 'foo',
      namespace: 'test-ns',
      type: 'secret',
      cluster: 'remote-cluster',
      specs: { isDesign: false },
    }
    render(<YAMLContainer node={node} t={t} hubClusterName="local-cluster" />)
    await waitFor(() => {
      expect(mockFleetResourceRequest).toHaveBeenCalledWith('GET', 'remote-cluster', {
        apiVersion: '',
        kind: 'secret',
        name: 'foo',
        namespace: 'test-ns',
      })
    })
    await waitFor(() => {
      expect(screen.getByText(/Resource: foo/)).toBeInTheDocument()
    })
  })

  it('shows error alert when getResource fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockGetResource.mockReturnValue({
      promise: Promise.reject(new Error('Not found')),
    } as ReturnType<typeof getResource>)
    const node = {
      name: 'foo',
      namespace: 'test-ns',
      type: 'secret',
      cluster: 'local-cluster',
      specs: { isDesign: false },
    }
    render(<YAMLContainer node={node} t={t} hubClusterName="local-cluster" />)
    await waitFor(() => {
      expect(screen.getByText(/Error querying for resource:/)).toBeInTheDocument()
    })
    consoleSpy.mockRestore()
  })

  it('shows error alert when fleetResourceRequest returns errorMessage', async () => {
    mockFleetResourceRequest.mockResolvedValue({ errorMessage: 'Access denied' })
    const node = {
      name: 'foo',
      namespace: 'test-ns',
      type: 'secret',
      cluster: 'remote-cluster',
      specs: { isDesign: false },
    }
    render(<YAMLContainer node={node} t={t} hubClusterName="local-cluster" />)
    await waitFor(() => {
      expect(screen.getByText(/Error querying for resource:/)).toBeInTheDocument()
    })
  })
})
