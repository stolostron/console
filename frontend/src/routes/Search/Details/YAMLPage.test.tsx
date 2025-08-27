/* Copyright Contributors to the Open Cluster Management project */
import { useFleetK8sWatchResource } from '@stolostron/multicluster-sdk/lib/api/useFleetK8sWatchResource'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import { SearchDetailsContext } from './DetailsPage'
import YAMLPage, { EditorActionBar, EditorHeaderBar } from './YAMLPage'

jest.mock('../../../components/YamlEditor', () => {
  // Mock the editor as there are lots of test errors with monaco
  return function YamlEditor() {
    return <div />
  }
})

jest.mock('@stolostron/multicluster-sdk/lib/api/useFleetK8sWatchResource', () => ({
  useFleetK8sWatchResource: jest.fn(),
}))

beforeEach(async () => {
  nockIgnoreRBAC()
  nockIgnoreApiPaths()

  // Reset mocks
  ;(useFleetK8sWatchResource as jest.Mock).mockReturnValue([null, false, null])
})

describe('YAMLPage', () => {
  it('Renders YAML page header correctly', async () => {
    render(
      <RecoilRoot>
        <MemoryRouter>
          <EditorHeaderBar cluster={'local-cluster'} namespace={'test-namespace'} />
        </MemoryRouter>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly with editor header
    await waitFor(() => expect(screen.queryByText('local-cluster')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('test-namespace')).toBeTruthy())
  })

  it('Renders YAML page header correctly for non-namespaced resource', async () => {
    render(
      <RecoilRoot>
        <MemoryRouter>
          <EditorHeaderBar cluster={'local-cluster'} namespace={''} />
        </MemoryRouter>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly with editor header
    await waitFor(() => expect(screen.queryByText('local-cluster')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Resource is not namespaced')).toBeTruthy())
  })

  it('Renders YAML page action bar correctly', async () => {
    render(
      <RecoilRoot>
        <MemoryRouter>
          <EditorActionBar
            cluster={'local-cluster'}
            kind={'Pod'}
            apiversion={'v1'}
            name={'test-pod'}
            namespace={'test-namespace'}
            isHubClusterResource={true}
            resourceYaml={''}
            setResourceYaml={() => {}}
            handleResize={() => {}}
            setResourceVersion={() => {}}
            stale={false}
            setStale={() => {}}
          />
        </MemoryRouter>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly with editor header
    await waitFor(() => expect(screen.queryByText('Save')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Reload')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Cancel')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Download')).toBeTruthy())
  })

  it('Renders YAML Page with error', async () => {
    const context: Partial<SearchDetailsContext> = {
      resourceLoading: false,
      resourceError: 'Unexpected error occurred',
      name: 'test-pod',
      namespace: 'test-namespace',
      cluster: 'local-cluster',
      kind: 'Pod',
      apiversion: 'v1',
      setResourceVersion: () => {},
    }
    render(
      <RecoilRoot>
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<YAMLPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly with editor header
    await waitFor(() => expect(screen.queryByText('Unexpected error occurred')).toBeTruthy())
  })

  it('Renders YAML Page in loading state', async () => {
    const context: Partial<SearchDetailsContext> = {
      resourceLoading: true,
      resourceError: '',
      name: 'test-pod',
      namespace: 'test-namespace',
      cluster: 'local-cluster',
      kind: 'Pod',
      apiversion: 'v1',
      setResourceVersion: () => {},
    }
    render(
      <RecoilRoot>
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<YAMLPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly with editor header
    await waitFor(() => expect(screen.queryByText('Loading')).toBeTruthy())
  })

  jest.mock('react-router-dom-v5-compat', () => {
    const originalModule = jest.requireActual('react-router-dom-v5-compat')
    return {
      __esModule: true,
      ...originalModule,
      useLocation: () => ({
        pathname: '/multicloud/search/resources/yaml',
        search: '?cluster=local-cluster&kind=Pod&apiversion=v1&namespace=test-namespace&name=test-pod',
        state: {
          from: '/multicloud/search',
          scrollToLine: 2,
        },
      }),
    }
  })

  it('Renders YAML Page correctly', async () => {
    const context: Partial<SearchDetailsContext> = {
      resource: {
        kind: 'Pod',
        apiVersion: 'v1',
        metadata: {
          name: 'test-pod',
          namespace: 'test-namespace',
        },
      },
      resourceLoading: false,
      resourceError: '',
      isHubClusterResource: true,
      name: 'test-pod',
      namespace: 'test-namespace',
      cluster: 'local-cluster',
      kind: 'Pod',
      apiversion: 'v1',
      setResourceVersion: () => {},
    }
    render(
      <RecoilRoot>
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<YAMLPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly
    await waitFor(() => expect(screen.queryByText('local-cluster')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Save')).toBeTruthy())
  })

  jest.mock('file-saver', () => {
    return {
      saveAs: jest.fn((_blob: Blob, filename) => {
        return filename
      }),
    }
  })
  global.URL.createObjectURL = jest.fn()
  it('Renders YAML Page correctly & downloads yaml', async () => {
    const context: Partial<SearchDetailsContext> = {
      resource: {
        kind: 'Pod',
        apiVersion: 'v1',
        metadata: {
          name: 'test-pod',
          namespace: 'test-namespace',
        },
      },
      resourceLoading: false,
      resourceError: '',
      isHubClusterResource: true,
      name: 'test-pod',
      namespace: 'test-namespace',
      cluster: 'local-cluster',
      kind: 'Pod',
      apiversion: 'v1',
      setResourceVersion: () => {},
    }
    render(
      <RecoilRoot>
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<YAMLPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly
    await waitFor(() => expect(screen.queryByText('local-cluster')).toBeTruthy())

    const downloadBtn = screen.getByText('Download')
    await waitFor(() => expect(downloadBtn).toBeTruthy())
    userEvent.click(downloadBtn)
  })

  it('Detects stale resource when watch returns updated resource', async () => {
    // Mock watch hook to return updated resource
    ;(useFleetK8sWatchResource as jest.Mock).mockReturnValue([
      { metadata: { resourceVersion: '12346' } }, // Updated resource version
      true, // watchLoaded
      null, // watchError
    ])

    const context: Partial<SearchDetailsContext> = {
      resource: {
        kind: 'Pod',
        apiVersion: 'v1',
        metadata: {
          name: 'test-pod',
          namespace: 'test-namespace',
          resourceVersion: '12345', // Original resource version
        },
      },
      resourceLoading: false,
      resourceError: '',
      isHubClusterResource: true,
      name: 'test-pod',
      namespace: 'test-namespace',
      cluster: 'local-cluster',
      kind: 'Pod',
      apiversion: 'v1',
      setResourceVersion: () => {},
    }

    render(
      <RecoilRoot>
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<YAMLPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Test that stale alert appears when resource versions differ
    await waitFor(() => expect(screen.queryByText('This object has been updated.')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Click reload to see the new version.')).toBeTruthy())
  })

  it('Does not show stale alert when watch has error', async () => {
    // Mock watch hook to return error
    ;(useFleetK8sWatchResource as jest.Mock).mockReturnValue([
      null,
      true, // watchLoaded
      'Watch error occurred', // watchError
    ])

    const context: Partial<SearchDetailsContext> = {
      resource: {
        kind: 'Pod',
        apiVersion: 'v1',
        metadata: {
          name: 'test-pod',
          namespace: 'test-namespace',
          resourceVersion: '12345',
        },
      },
      resourceLoading: false,
      resourceError: '',
      isHubClusterResource: true,
      name: 'test-pod',
      namespace: 'test-namespace',
      cluster: 'local-cluster',
      kind: 'Pod',
      apiversion: 'v1',
      setResourceVersion: () => {},
    }

    render(
      <RecoilRoot>
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<YAMLPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Test that stale alert does not appear when there's a watch error
    expect(screen.queryByText('This object has been updated.')).toBeFalsy()
  })
})
