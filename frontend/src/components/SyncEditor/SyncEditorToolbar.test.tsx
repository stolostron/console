/* Copyright Contributors to the Open Cluster Management project */

import { readFileSync } from 'fs'
import { join } from 'path'
import { createRef, type ReactNode } from 'react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import type { editor as editorTypes } from 'monaco-editor'

import type { SyncEditorDiffHandle } from './SyncEditorDiff'
import {
  SyncEditorToolbar,
  SYNC_EDITOR_SHOW_CHANGES_STORAGE_KEY,
  readShowChangesPreference,
  type SyncEditorToolbarProps,
} from './SyncEditorToolbar'

/** CodeEditorControl requires CodeEditorContext; stub it as a plain button for unit tests. */
jest.mock('@patternfly/react-code-editor', () => ({
  CodeEditorControl: ({
    onClick,
    'aria-label': ariaLabel,
    isDisabled,
    icon,
    id,
  }: {
    onClick: (code: string, event?: unknown) => void
    'aria-label'?: string
    isDisabled?: boolean
    icon?: ReactNode
    id?: string
  }) => (
    <button type="button" id={id} aria-label={ariaLabel} disabled={isDisabled} onClick={(event) => onClick('', event)}>
      {icon}
    </button>
  ),
}))

function createMockEditor(
  overrides: Partial<editorTypes.IStandaloneCodeEditor> = {}
): editorTypes.IStandaloneCodeEditor {
  const model = {
    getValue: jest.fn(() => 'apiVersion: v1\nkind: Pod\n'),
    getValueInRange: jest.fn(() => ''),
  }
  return {
    getModel: jest.fn(() => model),
    getSelection: jest.fn(() => ({ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 })),
    trigger: jest.fn(),
    ...overrides,
  } as unknown as editorTypes.IStandaloneCodeEditor
}

function renderToolbar(overrides: Partial<SyncEditorToolbarProps> = {}) {
  const props: SyncEditorToolbarProps = {
    hasUndo: true,
    hasRedo: true,
    showSecrets: false,
    setShowSecrets: jest.fn(),
    showCompareButton: false,
    showChanges: false,
    setShowChanges: jest.fn(),
    copyHint: 'Copy',
    setCopyHint: jest.fn(),
    editor: createMockEditor(),
    lastUnredactedYaml: 'apiVersion: v1\nkind: Pod\n',
    allCopiedCopy: 'All copied',
    copiedCopy: 'Copied',
    defaultCopy: 'Copy',
    t: (key: string) => key,
    ...overrides,
  }
  const view = render(<SyncEditorToolbar {...props} />)
  return { ...view, props }
}

describe('SyncEditorToolbar', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  describe('editorTitle layout', () => {
    it('renders the default title when editorTitle is omitted', () => {
      const { container } = renderToolbar()
      const title = container.querySelector('.sy-c-code-editor__title')
      expect(title).toHaveTextContent('YAML')
      expect(title).toHaveAttribute('title', 'YAML')
    })

    it('renders a custom editorTitle with a native tooltip of the full value', () => {
      const editorTitle = 'Pod > weekly > ansible-automation-platform > aap-gateway-operator'
      const { container } = renderToolbar({ editorTitle })
      const title = container.querySelector('.sy-c-code-editor__title')
      expect(title).toHaveTextContent(editorTitle)
      expect(title).toHaveAttribute('title', editorTitle)
    })

    it('keeps a long editorTitle in the same toolbar row as the controls', () => {
      const editorTitle =
        'Pod > weekly > ansible-automation-platform > aap-gateway-operator-controller-manager-5dd54b9c98-ln8fw'
      const { container } = renderToolbar({ editorTitle, showCompareButton: true })

      const row = container.querySelector('.sy-toolbar-row')
      const title = container.querySelector('.sy-c-code-editor__title')
      const buttons = container.querySelector('.sy-toolbar-buttons')

      expect(row).toBeInTheDocument()
      expect(title).toBeInTheDocument()
      expect(buttons).toBeInTheDocument()
      expect(row).toContainElement(title as HTMLElement)
      expect(row).toContainElement(buttons as HTMLElement)
      expect(Array.from(row!.children)).toEqual([title, buttons])
      expect(title).toHaveTextContent(editorTitle)
      expect(title).toHaveAttribute('title', editorTitle)
      expect(screen.getByRole('checkbox', { name: /show changes/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /find/i })).toBeInTheDocument()
    })

    it('defines CSS so long titles truncate instead of wrapping the toolbar', () => {
      const css = readFileSync(join(__dirname, 'SyncEditor.css'), 'utf8')

      expect(css).toMatch(/\.sy-c-code-editor__title\s*\{[^}]*overflow:\s*hidden/s)
      expect(css).toMatch(/\.sy-c-code-editor__title\s*\{[^}]*text-overflow:\s*ellipsis/s)
      expect(css).toMatch(/\.sy-c-code-editor__title\s*\{[^}]*white-space:\s*nowrap/s)
      expect(css).toMatch(/\.sy-c-code-editor__title\s*\{[^}]*min-width:\s*0/s)
      expect(css).toMatch(/\.sy-toolbar-row\s*\{[^}]*flex-wrap:\s*nowrap/s)
      expect(css).toMatch(/\.sy-toolbar-row\s*\{[^}]*overflow-x:\s*auto/s)
      expect(css).toMatch(/\.sy-toolbar-buttons\s*\{[^}]*flex-wrap:\s*nowrap/s)
      expect(css).toMatch(/\.sy-toolbar-buttons\s*\{[^}]*flex:\s*0\s+0\s+auto/s)
    })
  })

  describe('readShowChangesPreference', () => {
    it('returns false when preference is unset', () => {
      expect(readShowChangesPreference()).toBe(false)
    })

    it('returns true when preference is stored as true', () => {
      localStorage.setItem(SYNC_EDITOR_SHOW_CHANGES_STORAGE_KEY, 'true')
      expect(readShowChangesPreference()).toBe(true)
    })
  })

  describe('controls', () => {
    it('hides undo and redo when readonly', () => {
      renderToolbar({ readonly: true })
      expect(screen.queryByRole('button', { name: /undo/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /redo/i })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /find/i })).toBeInTheDocument()
    })

    it('persists show changes preference and invokes setShowChanges', () => {
      const setShowChanges = jest.fn()
      renderToolbar({ showCompareButton: true, setShowChanges })

      userEvent.click(screen.getByRole('checkbox', { name: /show changes/i }))

      expect(setShowChanges).toHaveBeenCalledWith(true)
      expect(localStorage.getItem(SYNC_EDITOR_SHOW_CHANGES_STORAGE_KEY)).toBe('true')
    })

    it('shows diff navigation when show changes is enabled', () => {
      const onDiffPrevious = jest.fn()
      const onDiffNext = jest.fn()
      renderToolbar({
        showCompareButton: true,
        showChanges: true,
        onDiffPrevious,
        onDiffNext,
      })

      expect(screen.getByRole('button', { name: /previous change/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /next change/i })).toBeInTheDocument()
    })

    it('invokes undo, redo, and find on the active editor', () => {
      const editor = createMockEditor()
      renderToolbar({ editor })

      userEvent.click(screen.getByRole('button', { name: /undo/i }))
      userEvent.click(screen.getByRole('button', { name: /redo/i }))
      userEvent.click(screen.getByRole('button', { name: /find/i }))

      expect(editor.trigger).toHaveBeenCalledWith('source', 'undo', undefined)
      expect(editor.trigger).toHaveBeenCalledWith('source', 'redo', undefined)
      expect(editor.trigger).toHaveBeenCalledWith('source', 'actions.find', undefined)
    })

    it('toggles secrets visibility', () => {
      const setShowSecrets = jest.fn()
      renderToolbar({ secrets: ['password'], setShowSecrets })

      userEvent.click(screen.getByRole('button', { name: /show secrets/i }))
      expect(setShowSecrets).toHaveBeenCalledWith(true)
    })

    it('copies editor content and resets the copy hint after a delay', () => {
      jest.useFakeTimers()
      try {
        const setCopyHint = jest.fn()
        const writeText = jest.fn().mockResolvedValue(undefined)
        Object.assign(navigator, { clipboard: { writeText } })

        renderToolbar({
          setCopyHint,
          lastUnredactedYaml: 'kind: Pod',
          allCopiedCopy: 'All copied',
          copiedCopy: 'Copied',
          defaultCopy: 'Copy',
        })

        userEvent.click(screen.getByRole('button', { name: /copy to clipboard/i }))

        expect(writeText).toHaveBeenCalledWith('kind: Pod')
        expect(setCopyHint).toHaveBeenCalledWith('All copied')

        act(() => {
          jest.advanceTimersByTime(800)
        })
        expect(setCopyHint).toHaveBeenCalledWith('Copy')
      } finally {
        jest.useRealTimers()
      }
    })

    it('copies from the diff modified editor when show changes is on', () => {
      const writeText = jest.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText } })

      const modifiedEditor = createMockEditor()
      const model = {
        getValue: jest.fn(() => 'modified: true'),
        getValueInRange: jest.fn(() => ''),
      }
      ;(modifiedEditor.getModel as jest.Mock).mockReturnValue(model)

      const syncEditorDiffRef = createRef<SyncEditorDiffHandle | null>()
      // RefObject.current is readonly in typings; assign for the unit test double.
      Object.assign(syncEditorDiffRef, {
        current: {
          getModifiedEditor: () => modifiedEditor,
          getDiffEditor: () => null,
          getOriginalEditor: () => null,
          getDiffEditorMonaco: () => null,
          previous: jest.fn(),
          next: jest.fn(),
        } satisfies SyncEditorDiffHandle,
      })

      renderToolbar({
        showChanges: true,
        syncEditorDiffRef,
        lastUnredactedYaml: 'original',
      })

      userEvent.click(screen.getByRole('button', { name: /copy to clipboard/i }))
      expect(writeText).toHaveBeenCalledWith('modified: true')
    })

    it('invokes onClose when the close control is present', () => {
      const onClose = jest.fn()
      renderToolbar({ onClose })

      userEvent.click(screen.getByRole('button', { name: /close/i }))
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('has no accessibility violations', async () => {
    const { container } = renderToolbar({
      editorTitle: 'Pod > ns > name',
      showCompareButton: true,
      secrets: ['token'],
      onClose: jest.fn(),
    })
    expect(await axe(container)).toHaveNoViolations()
  })
})
