/* Copyright Contributors to the Open Cluster Management project */

import { createRef, type Ref } from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { SyncEditorDiff, type SyncEditorDiffHandle, type SyncEditorDiffProps } from './SyncEditorDiff'

const mockResizeCallback = jest.fn()

jest.mock('@react-hook/resize-observer')

import useResizeObserver from '@react-hook/resize-observer'

const mockUseResizeObserver = jest.mocked(useResizeObserver)

const defaultResource = {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: { name: 'original', namespace: 'default' },
  data: { key: 'value' },
}

const currentResource = {
  ...defaultResource,
  data: { key: 'updated' },
}

function renderSyncEditorDiff(overrides: Partial<SyncEditorDiffProps> = {}, ref?: Ref<SyncEditorDiffHandle>) {
  const resizeRootRef = { current: document.createElement('div') }
  const onDiffEditorFocusChange = jest.fn()
  const onDiffEditorInstanceChange = jest.fn()
  const onActiveInstancesChange = jest.fn()
  const onChange = jest.fn()

  const props: SyncEditorDiffProps = {
    showChanges: true,
    defaultResources: defaultResource,
    resources: currentResource,
    diffEditorHasFocus: false,
    onDiffEditorFocusChange,
    resizeRootRef,
    onChange,
    onDiffEditorInstanceChange,
    onActiveInstancesChange,
    ...overrides,
  }

  const view = render(<SyncEditorDiff ref={ref} {...props} />)
  return {
    ...view,
    props,
    resizeRootRef,
    onDiffEditorFocusChange,
    onDiffEditorInstanceChange,
    onActiveInstancesChange,
    onChange,
  }
}

describe('SyncEditorDiff', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseResizeObserver.mockImplementation((_target, callback) => {
      mockResizeCallback.mockImplementation(callback)
      return {} as ResizeObserver
    })
  })

  it('renders nothing when showChanges is false', () => {
    renderSyncEditorDiff({ showChanges: false })
    expect(screen.queryByRole('textbox', { name: /monaco-diff/i })).not.toBeInTheDocument()
  })

  it('renders nothing when defaultResources is undefined', () => {
    renderSyncEditorDiff({ defaultResources: undefined })
    expect(screen.queryByRole('textbox', { name: /monaco-diff/i })).not.toBeInTheDocument()
  })

  it('renders nothing when mock mode is enabled', () => {
    renderSyncEditorDiff({ mock: true })
    expect(screen.queryByRole('textbox', { name: /monaco-diff/i })).not.toBeInTheDocument()
  })

  it('mounts the diff editor and exposes imperative handle accessors', async () => {
    const ref = createRef<SyncEditorDiffHandle>()
    const { onDiffEditorInstanceChange, onActiveInstancesChange } = renderSyncEditorDiff({}, ref)

    await waitFor(() => expect(screen.getByRole('textbox', { name: /monaco-diff/i })).toBeInTheDocument())

    expect(onActiveInstancesChange).toHaveBeenCalled()
    expect(onDiffEditorInstanceChange).toHaveBeenCalled()
    expect(ref.current?.getDiffEditor()).not.toBeNull()
    expect(ref.current?.getOriginalEditor()).not.toBeNull()
    expect(ref.current?.getModifiedEditor()).not.toBeNull()
    expect(ref.current?.getDiffEditorMonaco()).not.toBeNull()
  })

  it('invokes diff navigator previous and next from the imperative handle', async () => {
    const ref = createRef<SyncEditorDiffHandle>()
    renderSyncEditorDiff({}, ref)
    await waitFor(() => expect(screen.getByRole('textbox', { name: /monaco-diff/i })).toBeInTheDocument())

    expect(() => ref.current?.previous()).not.toThrow()
    expect(() => ref.current?.next()).not.toThrow()

    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve))
    })
  })

  it('notifies onChange when the modified pane content changes', async () => {
    const { onChange } = renderSyncEditorDiff()
    const input = await waitFor(() => screen.getByRole('textbox', { name: /monaco-diff/i }))

    fireEvent.change(input, { target: { value: 'apiVersion: v1\nkind: Pod\n' } })

    await waitFor(() => expect(onChange).toHaveBeenCalled())
    expect(onChange.mock.calls[0][0]).toContain('kind: Pod')
  })

  it('notifies focus changes when the diff editor gains and loses focus', async () => {
    const { onDiffEditorFocusChange } = renderSyncEditorDiff()
    const input = await waitFor(() => screen.getByRole('textbox', { name: /monaco-diff/i }))

    fireEvent.focus(input)
    expect(onDiffEditorFocusChange).toHaveBeenCalledWith(true)

    fireEvent.blur(input)
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve))
    })
    expect(onDiffEditorFocusChange).toHaveBeenCalledWith(false)
  })

  it('does not report blur when focus moves to a diff toolbar control', async () => {
    const { onDiffEditorFocusChange } = renderSyncEditorDiff()
    const input = await waitFor(() => screen.getByRole('textbox', { name: /monaco-diff/i }))

    fireEvent.focus(input)
    onDiffEditorFocusChange.mockClear()

    const toolbarButton = document.createElement('button')
    toolbarButton.id = 'diff-prev-button'
    document.body.appendChild(toolbarButton)
    toolbarButton.focus()
    fireEvent.blur(input)

    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve))
    })

    expect(onDiffEditorFocusChange).not.toHaveBeenCalledWith(false)
    toolbarButton.remove()
  })

  it('cleans up and notifies instance change when diff view is hidden', async () => {
    const { onDiffEditorInstanceChange, onDiffEditorFocusChange, rerender, props } = renderSyncEditorDiff()

    await waitFor(() => expect(screen.getByRole('textbox', { name: /monaco-diff/i })).toBeInTheDocument())
    onDiffEditorInstanceChange.mockClear()
    onDiffEditorFocusChange.mockClear()

    rerender(<SyncEditorDiff {...props} showChanges={false} />)

    expect(screen.queryByRole('textbox', { name: /monaco-diff/i })).not.toBeInTheDocument()
    expect(onDiffEditorInstanceChange).toHaveBeenCalled()
    expect(onDiffEditorFocusChange).toHaveBeenCalledWith(false)
  })

  it('applies layout when the resize observer fires', async () => {
    renderSyncEditorDiff()
    await waitFor(() => expect(screen.getByRole('textbox', { name: /monaco-diff/i })).toBeInTheDocument())

    const host = document.querySelector('.sync-editor__diff-host') as HTMLDivElement
    jest.spyOn(host, 'getBoundingClientRect').mockReturnValue({
      width: 900,
      height: 400,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 900,
      bottom: 400,
      toJSON: () => ({}),
    })

    await act(async () => {
      mockResizeCallback()
      await new Promise((resolve) => requestAnimationFrame(resolve))
    })

    expect(mockUseResizeObserver).toHaveBeenCalled()
  })
})
