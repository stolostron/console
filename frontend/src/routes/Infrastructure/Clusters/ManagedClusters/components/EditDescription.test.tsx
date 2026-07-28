/* Copyright Contributors to the Open Cluster Management project */

import { IResource, ManagedClusterApiVersion, ManagedClusterKind } from '../../../../../resources'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockBadRequestStatus, nockIgnoreApiPaths, nockPatch } from '../../../../../lib/nock-util'
import { EditDescription } from './EditDescription'
import { axe } from 'jest-axe'

const CLUSTER_DESCRIPTION_ANNOTATION = 'console.open-cluster-management.io/description'

const resource: IResource = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: {
    name: 'test-cluster',
    annotations: {
      [CLUSTER_DESCRIPTION_ANNOTATION]: 'Initial description',
    },
  },
}

describe('EditDescription', () => {
  beforeEach(() => nockIgnoreApiPaths())

  test('renders with existing description', () => {
    const { getByDisplayValue } = render(<EditDescription resource={resource} close={() => {}} />)
    expect(getByDisplayValue('Initial description')).toBeInTheDocument()
  })

  test('has zero accessibility defects', async () => {
    const { container } = render(<EditDescription resource={resource} close={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  test('can update description', async () => {
    const { getByLabelText, getByRole } = render(<EditDescription resource={resource} close={() => {}} />)
    const textarea = getByLabelText('Description')

    userEvent.clear(textarea)
    userEvent.type(textarea, 'Updated description text')

    const nockScope = nockPatch(
      { apiVersion: resource.apiVersion, kind: resource.kind, metadata: { name: resource.metadata!.name } },
      {
        metadata: {
          annotations: {
            [CLUSTER_DESCRIPTION_ANNOTATION]: 'Updated description text',
          },
        },
      }
    )

    getByRole('button', { name: /save/i }).click()
    await waitFor(() => expect(nockScope.isDone()).toBeTruthy())
  })

  test('can clear description', async () => {
    const { getByLabelText, getByRole } = render(<EditDescription resource={resource} close={() => {}} />)
    const textarea = getByLabelText('Description')

    userEvent.clear(textarea)

    const nockScope = nockPatch(
      { apiVersion: resource.apiVersion, kind: resource.kind, metadata: { name: resource.metadata!.name } },
      {
        metadata: {
          annotations: {
            [CLUSTER_DESCRIPTION_ANNOTATION]: null,
          },
        },
      }
    )

    getByRole('button', { name: /save/i }).click()
    await waitFor(() => expect(nockScope.isDone()).toBeTruthy())
  })

  test('formatting buttons insert markdown syntax', async () => {
    const { getByLabelText, getByLabelText: getByAriaLabel } = render(
      <EditDescription resource={resource} close={() => {}} />
    )
    const textarea = getByLabelText('Description') as HTMLTextAreaElement

    userEvent.clear(textarea)
    userEvent.type(textarea, 'test')

    textarea.setSelectionRange(0, 4)

    const boldButton = getByAriaLabel('Bold')
    userEvent.click(boldButton)

    await waitFor(() => expect(textarea.value).toBe('**test**'))
  })

  test('shows errors on save failure', async () => {
    const { getByLabelText, getByRole } = render(<EditDescription resource={resource} close={() => {}} />)
    const textarea = getByLabelText('Description')

    userEvent.clear(textarea)
    userEvent.type(textarea, 'New description')

    const nockScope = nockPatch(
      { apiVersion: resource.apiVersion, kind: resource.kind, metadata: { name: resource.metadata!.name } },
      {
        metadata: {
          annotations: {
            [CLUSTER_DESCRIPTION_ANNOTATION]: 'New description',
          },
        },
      },
      mockBadRequestStatus
    )

    getByRole('button', { name: /save/i }).click()
    await waitFor(() => expect(nockScope.isDone()).toBeTruthy())
  })

  test('works without existing annotations', () => {
    const resourceWithoutAnnotations: IResource = {
      apiVersion: ManagedClusterApiVersion,
      kind: ManagedClusterKind,
      metadata: {
        name: 'test-cluster',
      },
    }
    const { getByLabelText } = render(<EditDescription resource={resourceWithoutAnnotations} close={() => {}} />)
    const textarea = getByLabelText('Description') as HTMLTextAreaElement
    expect(textarea.value).toBe('')
  })
})
