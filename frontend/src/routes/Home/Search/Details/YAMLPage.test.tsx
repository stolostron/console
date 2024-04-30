/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory } from 'history'
import { Router } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../lib/nock-util'
import YAMLPage, { EditorActionBar, EditorHeaderBar } from './YAMLPage'

jest.mock('../../../../components/YamlEditor', () => {
  // Mock the editor as there are lots of test errors with monaco
  return function YamlEditor() {
    return <div />
  }
})

beforeEach(async () => {
  nockIgnoreRBAC()
  nockIgnoreApiPaths()
})

describe('YAMLPage', () => {
  it('Renders YAML page header correctly', async () => {
    const history = createMemoryHistory()
    render(
      <RecoilRoot>
        <Router location={history.location} navigator={history}>
          <EditorHeaderBar cluster={'local-cluster'} namespace={'test-namespace'} />
        </Router>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly with editor header
    await waitFor(() => expect(screen.queryByText('local-cluster')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('test-namespace')).toBeTruthy())
  })

  it('Renders YAML page header correctly for non-namespaced resource', async () => {
    const history = createMemoryHistory()
    render(
      <RecoilRoot>
        <Router location={history.location} navigator={history}>
          <EditorHeaderBar cluster={'local-cluster'} namespace={''} />
        </Router>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly with editor header
    await waitFor(() => expect(screen.queryByText('local-cluster')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Resource is not namespaced')).toBeTruthy())
  })

  it('Renders YAML page action bar correctly', async () => {
    const history = createMemoryHistory()
    render(
      <RecoilRoot>
        <Router location={history.location} navigator={history}>
          <EditorActionBar
            cluster={'local-cluster'}
            kind={'Pod'}
            apiversion={'v1'}
            name={'test-pod'}
            namespace={'test-namespace'}
            resourceYaml={''}
            setResourceYaml={() => {}}
            handleResize={() => {}}
            setResourceVersion={() => {}}
          />
        </Router>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly with editor header
    await waitFor(() => expect(screen.queryByText('Save')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Reload')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Cancel')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Download')).toBeTruthy())
  })

  it('Renders YAML Page with error', async () => {
    const history = createMemoryHistory()
    render(
      <RecoilRoot>
        <Router location={history.location} navigator={history}>
          <YAMLPage
            resource={null}
            loading={false}
            error={'Unexpected error occurred'}
            name={'test-pod'}
            namespace={'test-namespace'}
            cluster={'local-cluster'}
            kind={'Pod'}
            apiversion={'v1'}
            setResourceVersion={() => {}}
          />
        </Router>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly with editor header
    await waitFor(() => expect(screen.queryByText('Unexpected error occurred')).toBeTruthy())
  })

  it('Renders YAML Page in loading state', async () => {
    const history = createMemoryHistory()
    render(
      <RecoilRoot>
        <Router location={history.location} navigator={history}>
          <YAMLPage
            resource={null}
            loading={true}
            error={''}
            name={'test-pod'}
            namespace={'test-namespace'}
            cluster={'local-cluster'}
            kind={'Pod'}
            apiversion={'v1'}
            setResourceVersion={() => {}}
          />
        </Router>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly with editor header
    await waitFor(() => expect(screen.queryByText('Loading')).toBeTruthy())
  })

  jest.mock('react-router-dom', () => {
    const originalModule = jest.requireActual('react-router-dom')
    return {
      __esModule: true,
      ...originalModule,
      useLocation: () => ({
        pathname: '/multicloud/home/search/resources/yaml',
        search: '?cluster=local-cluster&kind=Pod&apiversion=v1&namespace=test-namespace&name=test-pod',
        state: {
          from: '/multicloud/home/search',
          scrollToLine: 2,
        },
      }),
    }
  })

  it('Renders YAML Page correctly', async () => {
    const history = createMemoryHistory()
    render(
      <RecoilRoot>
        <Router location={history.location} navigator={history}>
          <YAMLPage
            resource={{
              kind: 'Pod',
              apiVersion: 'v1',
              metadata: {
                name: 'test-pod',
                namespace: 'test-namespace',
              },
            }}
            loading={false}
            error={''}
            name={'test-pod'}
            namespace={'test-namespace'}
            cluster={'local-cluster'}
            kind={'Pod'}
            apiversion={'v1'}
            setResourceVersion={() => {}}
          />
        </Router>
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
    const history = createMemoryHistory()
    render(
      <RecoilRoot>
        <Router location={history.location} navigator={history}>
          <YAMLPage
            resource={{
              kind: 'Pod',
              apiVersion: 'v1',
              metadata: {
                name: 'test-pod',
                namespace: 'test-namespace',
              },
            }}
            loading={false}
            error={''}
            name={'test-pod'}
            namespace={'test-namespace'}
            cluster={'local-cluster'}
            kind={'Pod'}
            apiversion={'v1'}
            setResourceVersion={() => {}}
          />
        </Router>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly
    await waitFor(() => expect(screen.queryByText('local-cluster')).toBeTruthy())

    const downloadBtn = screen.getByText('Download')
    await waitFor(() => expect(downloadBtn).toBeTruthy())
    userEvent.click(downloadBtn)
  })
})
