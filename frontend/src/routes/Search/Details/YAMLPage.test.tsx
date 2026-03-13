/* Copyright Contributors to the Open Cluster Management project */
import { useFleetK8sWatchResource } from '@stolostron/multicluster-sdk'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import { SearchDetailsContext } from './DetailsPage'
import YAMLPage from './YAMLPage'

jest.mock('../components/YamlEditor/YAMLEditor', () => {
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
  it('Renders YAML Page with error', async () => {
    const context: Partial<SearchDetailsContext> = {
      resourceLoading: false,
      resourceError: 'Unexpected error occurred',
      name: 'test-pod',
      namespace: 'test-namespace',
      cluster: 'local-cluster',
      kind: 'Pod',
      apiversion: 'v1',
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
})
