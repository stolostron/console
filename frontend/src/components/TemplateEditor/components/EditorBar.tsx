/* Copyright Contributors to the Open Cluster Management project */

import React, { useCallback, useState } from 'react'
import classNames from 'classnames'
import { SearchInput } from '@patternfly/react-core'
import '../css/editor-bar.css'
import { AngleLeftIcon, AngleRightIcon, CloseIcon, RedoIcon, UndoIcon } from '@patternfly/react-icons'

type EditorBarCommand = 'next' | 'previous' | 'copyAll' | 'undo' | 'redo' | 'restore' | 'close'

interface EditorBarButtonSpec {
  command: EditorBarCommand | string
  tooltip: string
  icon?: string
  disabled?: boolean
  spacer?: boolean
}

interface EditorButtonProps {
  command: EditorBarCommand | string
  button: EditorBarButtonSpec
  handleClick: (command: EditorBarCommand | string) => void
}

function renderIcon(icon: string | undefined) {
  switch (icon) {
    case 'close':
      return <CloseIcon />
    case 'undo':
      return <UndoIcon />
    case 'redo':
      return <RedoIcon />
    case 'next':
      return <AngleRightIcon />
    case 'previous':
      return <AngleLeftIcon />
    default:
      return undefined
  }
}

function EditorButton({ command, button, handleClick }: EditorButtonProps) {
  const { disabled, tooltip, icon, spacer } = button

  const onClick = useCallback(() => {
    if (!disabled) {
      const active = document.activeElement
      if (active && 'blur' in active && typeof (active as HTMLElement).blur === 'function') {
        ;(active as HTMLElement).blur()
      }
      handleClick(command)
    }
  }, [command, disabled, handleClick])

  const onKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleClick(command)
      }
    },
    [command, handleClick]
  )

  if (spacer) {
    return <div className="editor-bar-spacer" />
  }
  const classes = classNames({
    'editor-bar-button': true,
    [`${command}`]: true,
    disabled,
  })
  return (
    <div
      className={classes}
      tabIndex={0}
      role={'button'}
      aria-label={tooltip}
      title={tooltip}
      id={`${icon}-button`}
      onClick={onClick}
      onKeyPress={onKeyPress}
    >
      {icon ? renderIcon(icon) : <div>{tooltip}</div>}
    </div>
  )
}

export interface EditorBarProps {
  handleEditorCommand: (command: EditorBarCommand | string) => void
  handleSearchChange: (searchName: string) => void
  hasRedo: boolean
  hasUndo: boolean
  i18n?: (key: string) => string
  title: string
  type: string
}

function EditorBar({ hasUndo, hasRedo, type, title, i18n, handleEditorCommand, handleSearchChange }: EditorBarProps) {
  const [searchName, setSearchName] = useState('')

  const handleClick = useCallback(
    (command: EditorBarCommand | string) => {
      handleEditorCommand(command)
    },
    [handleEditorCommand]
  )

  const handleSearch = useCallback(
    (_event: React.FormEvent<HTMLInputElement>, value: string) => {
      handleSearchChange(value)
      setSearchName(value)
    },
    [handleSearchChange]
  )

  const handleClear = useCallback(() => {
    handleSearchChange('')
    setSearchName('')
  }, [handleSearchChange])

  const undoButtons: EditorBarButtonSpec[] = [
    {
      command: 'undo',
      tooltip: i18n ? i18n('editor.bar.undo') : 'Undo',
      icon: 'undo',
      disabled: !hasUndo,
    },
    {
      command: 'redo',
      tooltip: i18n ? i18n('editor.bar.redo') : 'Redo',
      icon: 'redo',
      disabled: !hasRedo,
    },
  ]

  const nextButtons: EditorBarButtonSpec[] = [
    {
      command: 'previous',
      tooltip: i18n ? i18n('editor.bar.previous') : 'Previous',
      icon: 'previous',
      disabled: !searchName,
    },
    {
      command: 'next',
      tooltip: i18n ? i18n('editor.bar.next') : 'Next',
      icon: 'next',
      disabled: !searchName,
    },
  ]

  const resetButtons: EditorBarButtonSpec[] = [
    {
      command: 'restore',
      tooltip: i18n ? i18n('editor.bar.reset') : 'Reset',
      disabled: !hasUndo && !hasRedo,
    },
  ]

  const closeButtons: EditorBarButtonSpec[] = [
    {
      command: 'close',
      tooltip: i18n ? i18n('editor.bar.close') : 'Close',
      icon: 'close',
    },
  ]

  const searchTitle = i18n ? i18n('find.label') : 'Find'
  return (
    <div className="editor-bar">
      <div className="editor-bar-group">
        <div className="editor-bar-title">{title}</div>
      </div>
      <div className="editor-bar-group">
        <div className="editor-bar-toolbar">
          <div className="editor-bar-section">
            {resetButtons.map((button) => {
              const { command } = button
              return <EditorButton key={command} command={command} button={button} handleClick={handleClick} />
            })}
          </div>
          <div className="editor-bar-section">
            {undoButtons.map((button) => {
              const { command } = button
              return <EditorButton key={command} command={command} button={button} handleClick={handleClick} />
            })}
          </div>
          <div className="editor-bar-section">
            <div className="editor-bar-search" role="region" aria-label={searchTitle} id={searchTitle}>
              <SearchInput
                id={`template-editor-search-${type}`}
                value={searchName}
                aria-label={searchTitle}
                placeholder={searchTitle}
                onChange={handleSearch}
                onClear={handleClear}
              />
              {nextButtons.map((button) => {
                const { command } = button
                return <EditorButton key={command} command={command} button={button} handleClick={handleClick} />
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="editor-bar-close">
        <div className="editor-bar-section">
          {closeButtons.map((button) => {
            const { command } = button
            return <EditorButton key={command} command={command} button={button} handleClick={handleClick} />
          })}
        </div>
      </div>
    </div>
  )
}

export default EditorBar
