/* Copyright Contributors to the Open Cluster Management project */
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import YAMLEditor, { findResourceFieldLineNumber } from './YamlEditor'
describe('YamlEditor', () => {
  it('findResourceFieldLineNumber - returns properly', async () => {
    const test = findResourceFieldLineNumber(
      {
        kind: 'Pod',
        apiVersion: 'v1',
        metadata: {
          name: 'alertmanager-main-0',
          namespace: 'openshift-monitoring',
          creationTimestamp: '2022-11-07T11:32:59Z',
          labels: {
            alertmanager: 'main',
          },
        },
      },
      '/metadata/labels'
    )

    expect(test).toEqual(7)
  })

  it('YamlEditor renders properly', async () => {
    const { baseElement } = render(
      <RecoilRoot>
        <MemoryRouter>
          <YAMLEditor
            resourceYAML={
              'kind: Pod\napiVersion: v1\nmetadata:\n  name: test-pod\n  namespace: test-namespace\n  managedFields:\n    - manager: unknown'
            }
            readOnly={false}
            height={250} // in pixels - to be convested to string in memo hook
            setResourceYaml={() => {}}
            defaultScrollToLine={1}
          />
        </MemoryRouter>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly
    await waitFor(() => expect(baseElement.querySelector('textarea')).toHaveTextContent('kind: Pod'))
  })
})
