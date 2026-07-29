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
    const textarea = getByLabelText('Description') as HTMLTextAreaElement

    userEvent.click(getByRole('button', { name: /clear/i }))
    expect(textarea.value).toBe('')

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

    userEvent.click(getByRole('button', { name: /save/i }))
    await waitFor(() => expect(nockScope.isDone()).toBeTruthy())
  })

  test('bold button inserts markdown syntax', async () => {
    const { getByLabelText } = render(<EditDescription resource={resource} close={() => {}} />)
    const textarea = getByLabelText('Description') as HTMLTextAreaElement

    userEvent.clear(textarea)
    userEvent.type(textarea, 'test')

    textarea.setSelectionRange(0, 4)

    userEvent.click(getByLabelText('Bold'))

    await waitFor(() => expect(textarea.value).toBe('**test**'))
  })

  test('italic button inserts markdown syntax', async () => {
    const { getByLabelText } = render(<EditDescription resource={resource} close={() => {}} />)
    const textarea = getByLabelText('Description') as HTMLTextAreaElement

    userEvent.clear(textarea)
    userEvent.type(textarea, 'word')

    textarea.setSelectionRange(0, 4)

    userEvent.click(getByLabelText('Italic'))

    await waitFor(() => expect(textarea.value).toBe('*word*'))
  })

  test('link button inserts markdown link syntax', async () => {
    const { getByLabelText } = render(<EditDescription resource={resource} close={() => {}} />)
    const textarea = getByLabelText('Description') as HTMLTextAreaElement

    userEvent.clear(textarea)
    userEvent.type(textarea, 'click here')

    textarea.setSelectionRange(0, 10)

    userEvent.click(getByLabelText('Link'))

    await waitFor(() => expect(textarea.value).toBe('[click here](url)'))
  })

  test('list button inserts list marker at start of text', async () => {
    const { getByLabelText } = render(<EditDescription resource={resource} close={() => {}} />)
    const textarea = getByLabelText('Description') as HTMLTextAreaElement

    userEvent.clear(textarea)

    textarea.setSelectionRange(0, 0)

    userEvent.click(getByLabelText('List'))

    await waitFor(() => expect(textarea.value).toBe('- '))
  })

  test('list button inserts newline list marker mid-text', async () => {
    const { getByLabelText } = render(<EditDescription resource={resource} close={() => {}} />)
    const textarea = getByLabelText('Description') as HTMLTextAreaElement

    userEvent.clear(textarea)
    userEvent.type(textarea, 'item')

    textarea.setSelectionRange(4, 4)

    userEvent.click(getByLabelText('List'))

    await waitFor(() => expect(textarea.value).toBe('item\n- '))
  })

  test('clear button clears the textarea', async () => {
    const { getByLabelText } = render(<EditDescription resource={resource} close={() => {}} />)
    const textarea = getByLabelText('Description') as HTMLTextAreaElement

    expect(textarea.value).toBe('Initial description')

    userEvent.click(getByLabelText('Clear'))

    await waitFor(() => expect(textarea.value).toBe(''))
  })

  test('preview button toggles between edit and preview mode', async () => {
    const { getByLabelText, queryByLabelText } = render(<EditDescription resource={resource} close={() => {}} />)
    const textarea = getByLabelText('Description') as HTMLTextAreaElement
    expect(textarea).toBeVisible()

    userEvent.click(getByLabelText('Preview'))

    await waitFor(() => expect(textarea.style.visibility).toBe('hidden'))

    userEvent.click(queryByLabelText('Edit')!)

    await waitFor(() => expect(textarea.style.visibility).toBe('visible'))
  })

  test('resets preview mode when reopened with a different resource', async () => {
    const otherResource: IResource = {
      apiVersion: ManagedClusterApiVersion,
      kind: ManagedClusterKind,
      metadata: {
        name: 'other-cluster',
        annotations: { [CLUSTER_DESCRIPTION_ANNOTATION]: 'Other description' },
      },
    }

    const { getByLabelText, rerender } = render(<EditDescription resource={resource} close={() => {}} />)
    const textarea = getByLabelText('Description') as HTMLTextAreaElement

    userEvent.click(getByLabelText('Preview'))
    await waitFor(() => expect(textarea.style.visibility).toBe('hidden'))

    rerender(<EditDescription resource={otherResource} close={() => {}} />)

    await waitFor(() => {
      expect(textarea.value).toBe('Other description')
      expect(textarea.style.visibility).toBe('visible')
    })
  })

  test('preview shows placeholder when description is empty', async () => {
    const emptyResource: IResource = {
      apiVersion: ManagedClusterApiVersion,
      kind: ManagedClusterKind,
      metadata: { name: 'test-cluster' },
    }
    const { getByLabelText, getByText } = render(<EditDescription resource={emptyResource} close={() => {}} />)

    userEvent.click(getByLabelText('Preview'))

    await waitFor(() => expect(getByText('-')).toBeInTheDocument())
  })

  test('cancel button calls close', () => {
    const closeFn = jest.fn()
    const { getByRole } = render(<EditDescription resource={resource} close={closeFn} />)

    getByRole('button', { name: /cancel/i }).click()

    expect(closeFn).toHaveBeenCalled()
  })

  test('shows errors on save failure', async () => {
    const { getByLabelText, getByRole, findByText } = render(<EditDescription resource={resource} close={() => {}} />)
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
      mockBadRequestStatus,
      400
    )

    userEvent.click(getByRole('button', { name: /save/i }))
    await waitFor(() => expect(nockScope.isDone()).toBeTruthy())
    expect(await findByText('Bad request.')).toBeInTheDocument()
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
