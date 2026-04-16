/* Copyright Contributors to the Open Cluster Management project */

import React, { ReactNode, useRef } from 'react'
import classNames from 'classnames'
import { Alert, AlertActionCloseButton, ClipboardCopy, Checkbox } from '@patternfly/react-core'
import '../css/editor-header.css'

export interface EditorHeaderOtherTab {
  id: string
}

export interface EditorHeaderProps {
  children?: ReactNode
  handleEditorCommand: (command: string) => void
  handleShowSecretChange?: () => void
  handleTabChange: (tabIndex: number) => void
  i18n: (key: string, ...args: unknown[]) => string
  otherYAMLTabs?: EditorHeaderOtherTab[]
  readOnly?: boolean
  showSecrets?: boolean
  title: string
  type: string
}

function renderEditorTabs(
  otherYAMLTabs: EditorHeaderOtherTab[],
  type: string,
  handleTabChange: (tabIndex: number) => void,
  tabsRef: React.RefObject<HTMLUListElement>
) {
  const onClick = (e: React.MouseEvent, tab: number) => {
    e.preventDefault()
    if (tabsRef.current) {
      Array.from(tabsRef.current.children).forEach((child, inx) =>
        (child as HTMLElement).classList.toggle('tf--tabs__nav-item--selected', inx === tab)
      )
    }
    handleTabChange(tab)
  }
  return (
    <nav aria-label="Select template" className="tf--tabs" role="navigation">
      <ul role="tablist" className="tf--tabs__nav" ref={tabsRef}>
        <li
          id="main"
          role="presentation"
          tabIndex={-1}
          className="tf--tabs__nav-item tf--tabs__nav-item--selected"
          onClick={(e) => onClick(e, 0)}
        >
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a className="tf--tabs__nav-link" href="#" role="tab" tabIndex={0} aria-selected="true">
            {type}
          </a>
        </li>
        {otherYAMLTabs.map(({ id }, inx) => {
          return (
            <li
              id={id}
              key={id}
              role="presentation"
              tabIndex={-1}
              className="tf--tabs__nav-item"
              onClick={(e) => onClick(e, inx + 1)}
            >
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a className="tf--tabs__nav-link" href="#" role="tab" tabIndex={0} aria-selected="false">
                {id}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function renderShowSecrets(
  showSecrets: boolean | undefined,
  handleShowSecretChange: (() => void) | undefined,
  i18n: (key: string, ...args: unknown[]) => string
) {
  return (
    <div className="creation-view-yaml-header-secrets">
      <Checkbox
        aria-label="show-secrets"
        id="show-secrets"
        isChecked={!!showSecrets}
        onChange={() => handleShowSecretChange?.()}
      />
      <div>{i18n('editor.show.secrets')}</div>
    </div>
  )
}

function EditorHeader({
  children,
  readOnly,
  otherYAMLTabs = [],
  title,
  handleEditorCommand,
  i18n,
  type = 'unknown',
  handleTabChange,
  showSecrets,
  handleShowSecretChange,
}: EditorHeaderProps) {
  const tabsRef = useRef<HTMLUListElement>(null)
  const editorToolbarTitle = i18n('editor.toolbar')

  if (readOnly) {
    return (
      <div>
        <Alert
          isInline
          title={i18n('editor.bar.readonly')}
          variant={'info'}
          style={{ background: '#E7F1FA', padding: '15px 20px' }}
          actionClose={<AlertActionCloseButton onClose={() => handleEditorCommand('close')} />}
        />
        <div className="readonly-editor-bar">
          <div>{title}</div>
          <ClipboardCopy variant="inline-compact" isBlock onCopy={() => handleEditorCommand('copyAll')}>
            {' '}
          </ClipboardCopy>
        </div>
      </div>
    )
  }
  const hasTabs = otherYAMLTabs.length > 0
  const classnames = classNames({
    'creation-view-yaml-header': true,
    hasTabs: hasTabs,
  })
  return (
    <div className={classnames}>
      <div
        className="creation-view-yaml-header-toolbar"
        role="region"
        aria-label={editorToolbarTitle}
        id={editorToolbarTitle}
      >
        {children}
      </div>
      <div className="creation-view-yaml-header-tabs">
        {renderEditorTabs(otherYAMLTabs, type, handleTabChange, tabsRef)}
        {renderShowSecrets(showSecrets, handleShowSecretChange, i18n)}
        <ClipboardCopy
          hoverTip={i18n('Copy to clipboard')}
          variant="inline-compact"
          isBlock
          onCopy={() => handleEditorCommand('copyAll')}
        >
          {' '}
        </ClipboardCopy>
      </div>
    </div>
  )
}

export default EditorHeader
