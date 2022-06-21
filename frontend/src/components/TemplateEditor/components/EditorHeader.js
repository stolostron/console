'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { Alert, AlertActionCloseButton, ClipboardCopy, Checkbox } from '@patternfly/react-core'
import '../css/editor-header.css'

class EditorHeader extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    handleEditorCommand: PropTypes.func,
    handleShowSecretChange: PropTypes.func,
    handleTabChange: PropTypes.func,
    i18n: PropTypes.func,
    otherYAMLTabs: PropTypes.array,
    readOnly: PropTypes.bool,
    showSecrets: PropTypes.bool,
    title: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props)
  }

  render() {
    const { children, readOnly, otherYAMLTabs = [], title, handleEditorCommand, i18n } = this.props
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
            <ClipboardCopy variant="inline-compact" isBlock onCopy={() => handleEditorCommand('copyAll')} />
          </div>
        </div>
      )
    } else {
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
            {this.renderEditorTabs(otherYAMLTabs)}
            {this.renderShowSecrets()}
            <ClipboardCopy variant="inline-compact" isBlock onCopy={() => handleEditorCommand('copyAll')} />
          </div>
        </div>
      )
    }
  }

  setTabsRef = (ref) => {
    this.tabsRef = ref
  }

  renderEditorTabs = (otherYAMLTabs) => {
    const { type = 'unknown', handleTabChange } = this.props

    const onClick = (e, tab) => {
      e.preventDefault()
      Array.from(this.tabsRef.children).forEach((child, inx) =>
        child.classList.toggle('tf--tabs__nav-item--selected', inx === tab)
      )
      handleTabChange(tab)
    }
    return (
      <nav aria-label="Select template" className="tf--tabs" role="navigation">
        <ul role="tablist" className="tf--tabs__nav" ref={this.setTabsRef}>
          <li
            id="main"
            role="presentation"
            tabIndex="-1"
            className="tf--tabs__nav-item tf--tabs__nav-item--selected"
            onClick={(e) => onClick(e, 0)}
          >
            <a className="tf--tabs__nav-link" href="#" role="tab" tabIndex="0" aria-selected="true">
              {type}
            </a>
          </li>
          {otherYAMLTabs.map(({ id }, inx) => {
            return (
              <li
                id={id}
                key={id}
                role="presentation"
                tabIndex="-1"
                className="tf--tabs__nav-item"
                onClick={(e) => onClick(e, inx + 1)}
              >
                <a className="tf--tabs__nav-link" href="#" role="tab" tabIndex="0" aria-selected="false">
                  {id}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    )
  }

  renderShowSecrets = () => {
    const { showSecrets, handleShowSecretChange, i18n } = this.props
    return (
      <div className="creation-view-yaml-header-secrets">
        <Checkbox
          aria-label="show-secrets"
          id="show-secrets"
          isChecked={showSecrets}
          onChange={handleShowSecretChange}
        />
        <div>{i18n('editor.show.secrets')}</div>
      </div>
    )
  }
}

export default EditorHeader
