/* Copyright Contributors to the Open Cluster Management project */

import { IResource, ManagedClusterApiVersion, ManagedClusterKind } from '../../../../../resources'
import { render, waitFor } from '@testing-library/react'
import { mockBadRequestStatus, nockIgnoreApiPaths, nockPatch } from '../../../../../lib/nock-util'
import { EditLabels } from './EditLabels'
import { clickElement, typeElement } from '~/lib/test-util'

const resource: IResource = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: { name: 'test-cluster', labels: { abc: '123' } },
}

describe('EditLabels', () => {
  beforeEach(() => nockIgnoreApiPaths())
  test('can add and remove labels', async () => {
    const { getByTestId, getByText } = render(<EditLabels resource={resource} close={() => {}} />)
    expect(getByText('abc=123')).toBeInTheDocument()
    await clickElement(getByTestId('label-input-button'))
    await typeElement(getByTestId('labels-input'), `foo=bar{enter}`)
    const nockScope = nockPatch(resource, [
      { op: 'remove', path: `/metadata/labels/abc` },
      { op: 'add', path: `/metadata/labels/abc`, value: '123' },
      { op: 'add', path: `/metadata/labels/foo`, value: 'bar' },
    ])
    await clickElement(getByText('Save'))
    await waitFor(() => expect(nockScope.isDone()).toBeTruthy())
  })

  test('shows errors', async () => {
    const resource: IResource = {
      apiVersion: ManagedClusterApiVersion,
      kind: ManagedClusterKind,
      metadata: { name: 'test-cluster', labels: { abc: '123' } },
    }
    const { getByText } = render(<EditLabels resource={resource} close={() => {}} />)
    expect(getByText('abc=123')).toBeInTheDocument()
    const nockScope = nockPatch(
      resource,
      [
        { op: 'remove', path: `/metadata/labels/abc` },
        { op: 'add', path: `/metadata/labels/abc`, value: '123' },
      ],
      mockBadRequestStatus
    )
    await clickElement(getByText('Save'))
    await waitFor(() => expect(nockScope.isDone()).toBeTruthy())
    waitFor(() => expect('There was bad data sent for accessing resources.').toBeInTheDocument())
  })

  test('can add and remove labels without labels on resource', async () => {
    resource.metadata!.labels = {}
    const { queryByText, getByTestId, getByText } = render(<EditLabels resource={resource} close={() => {}} />)
    await clickElement(getByTestId('label-input-button'))
    await typeElement(getByTestId('labels-input'), `foo=bar{enter}`)
    expect(getByText('foo=bar')).toBeVisible()
    await clickElement(getByTestId(`remove-foo`))
    expect(queryByText('foo=bar')).toBeNull()
  })
})
