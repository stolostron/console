/* Copyright Contributors to the Open Cluster Management project */
import { ReactNode, type RefObject } from 'react'
import { CodeEditorControl } from '@patternfly/react-code-editor'
import {
  RedoIcon,
  UndoIcon,
  SearchIcon,
  EyeIcon,
  EyeSlashIcon,
  CloseIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@patternfly/react-icons'
import { Checkbox, ClipboardCopyButton } from '@patternfly/react-core'
import { noop } from 'lodash'
import type { editor as editorTypes } from 'monaco-editor'

import type { SyncEditorDiffHandle } from './SyncEditorDiff'

export const SYNC_EDITOR_SHOW_CHANGES_STORAGE_KEY = 'sync-editor-show-changes'

export function readShowChangesPreference(): boolean {
  try {
    return localStorage.getItem(SYNC_EDITOR_SHOW_CHANGES_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export interface SyncEditorToolbarProps {
  editorTitle?: string
  readonly?: boolean
  hasUndo: boolean
  hasRedo: boolean
  secrets?: (string | string[])[]
  showSecrets: boolean
  setShowSecrets: (value: boolean | ((prev: boolean) => boolean)) => void
  showCompareButton: boolean
  showChanges: boolean
  setShowChanges: (value: boolean | ((prev: boolean) => boolean)) => void
  onDiffPrevious?: () => void
  onDiffNext?: () => void
  copyHint: ReactNode
  setCopyHint: (hint: ReactNode) => void
  onClose?: () => void
  editor: editorTypes.IStandaloneCodeEditor | null
  /** When set, copy uses the diff modified pane while Show changes is on. */
  syncEditorDiffRef?: RefObject<SyncEditorDiffHandle | null>
  lastUnredactedYaml?: string
  allCopiedCopy: ReactNode
  copiedCopy: ReactNode
  defaultCopy: ReactNode
  t: (key: string) => string
}

export function SyncEditorToolbar(props: Readonly<SyncEditorToolbarProps>): JSX.Element {
  const {
    editorTitle,
    readonly,
    hasUndo,
    hasRedo,
    secrets,
    showSecrets,
    setShowSecrets,
    showCompareButton,
    showChanges,
    setShowChanges,
    onDiffPrevious,
    onDiffNext,
    copyHint,
    setCopyHint,
    onClose,
    editor,
    syncEditorDiffRef,
    lastUnredactedYaml,
    allCopiedCopy,
    copiedCopy,
    defaultCopy,
    t,
  } = props

  /** Diff mounts in a child useEffect, so getModifiedEditor() can be null on the render that toggles showChanges. */
  const getActiveEditor = () => {
    const diffModified = showChanges ? (syncEditorDiffRef?.current?.getModifiedEditor() ?? null) : null
    return diffModified ?? editor
  }

  return (
    <div className="sy-toolbar-row">
      <div className="sy-c-code-editor__title">{editorTitle || 'YAML'}</div>
      <div className="sy-toolbar-buttons">
        {showCompareButton && (
          <div className="sy-toolbar-compare-group">
            <hr className="sy-toolbar-separator" aria-orientation="vertical" />
            {showChanges && (
              <div className="sy-toolbar-diff-nav">
                <CodeEditorControl
                  id="diff-prev-button"
                  icon={<ArrowUpIcon />}
                  aria-label={t('Previous change')}
                  tooltipProps={{ content: t('Previous change') }}
                  onClick={() => {
                    onDiffPrevious?.()
                  }}
                />
                <CodeEditorControl
                  id="diff-next-button"
                  icon={<ArrowDownIcon />}
                  aria-label={t('Next change')}
                  tooltipProps={{ content: t('Next change') }}
                  onClick={() => {
                    onDiffNext?.()
                  }}
                />
              </div>
            )}
            <div className="sy-toolbar-checkbox-wrap">
              <Checkbox
                id="compare-changes-checkbox"
                label={t('Show changes')}
                isChecked={showChanges}
                onChange={(_event, checked) => {
                  try {
                    localStorage.setItem(SYNC_EDITOR_SHOW_CHANGES_STORAGE_KEY, String(checked))
                  } catch {
                    /* ignore quota / private mode */
                  }
                  setShowChanges(checked)
                }}
              />
            </div>
            <hr className="sy-toolbar-separator" aria-orientation="vertical" />
          </div>
        )}
        {/* undo */}
        {!readonly && (
          <CodeEditorControl
            id="undo-button"
            icon={<UndoIcon />}
            aria-label={t('Undo')}
            tooltipProps={{ content: t('Undo') }}
            isDisabled={!hasUndo}
            onClick={() => {
              getActiveEditor()?.trigger('source', 'undo', undefined)
            }}
          />
        )}
        {/* redo */}
        {!readonly && (
          <CodeEditorControl
            id="redo-button"
            icon={<RedoIcon />}
            aria-label={t('Redo')}
            tooltipProps={{ content: t('Redo') }}
            isDisabled={!hasRedo}
            onClick={() => {
              getActiveEditor()?.trigger('source', 'redo', undefined)
            }}
          />
        )}
        {!readonly && <hr className="sy-toolbar-separator" aria-orientation="vertical" />}
        {/* search */}
        <CodeEditorControl
          id="search-button"
          icon={<SearchIcon />}
          aria-label={t('Find')}
          tooltipProps={{ content: t('Find') }}
          onClick={() => {
            getActiveEditor()?.trigger('source', 'actions.find', undefined)
          }}
        />
        {/* secrets */}
        {secrets && (
          <CodeEditorControl
            id="secret-button"
            icon={showSecrets ? <EyeIcon /> : <EyeSlashIcon />}
            aria-label={t('Show Secrets')}
            tooltipProps={{ content: t('Show Secrets') }}
            onClick={() => {
              setShowSecrets(!showSecrets)
            }}
          />
        )}
        {/* copy */}
        <ClipboardCopyButton
          id="copy-button"
          aria-label={t('Copy to clipboard')}
          disabled={false}
          onClick={() => {
            const diffModifiedEditor = showChanges ? (syncEditorDiffRef?.current?.getModifiedEditor() ?? null) : null
            const targetEditor = diffModifiedEditor ?? editor
            if (targetEditor?.getModel()) {
              const model = targetEditor.getModel()
              const selection = targetEditor.getSelection()
              if (model && selection) {
                const selectedText = model.getValueInRange(selection)
                const fallbackFull = diffModifiedEditor ? model.getValue() : lastUnredactedYaml || ''
                navigator.clipboard.writeText(selectedText || fallbackFull)
                setCopyHint(selectedText.length === 0 ? allCopiedCopy : copiedCopy)
                setTimeout(() => {
                  setCopyHint(defaultCopy)
                }, 800)
              }
            }
          }}
          exitDelay={600}
          variant="plain"
        >
          {copyHint}
        </ClipboardCopyButton>
        {!!onClose && (
          <CodeEditorControl
            icon={<CloseIcon />}
            aria-label={t('Close')}
            tooltipProps={{ content: t('Close') }}
            onClick={onClose || noop}
          />
        )}
      </div>
    </div>
  )
}
