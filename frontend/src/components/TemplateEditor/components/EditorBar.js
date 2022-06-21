'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { SearchInput } from '@patternfly/react-core'
import '../css/editor-bar.css'
import { CloseIcon, UndoIcon, RedoIcon, NextIcon, PreviousIcon } from '../icons/Icons'

class EditorButton extends React.Component {
  static propTypes = {
    button: PropTypes.object,
    command: PropTypes.string,
    handleClick: PropTypes.func,
  }

  handleClick = () => {
    const {
      command,
      button: { disabled },
    } = this.props
    if (!disabled) {
      document.activeElement.blur()
      this.props.handleClick(command)
    }
  }

  handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      this.props.handleClick(this.props.command)
    }
  }

  renderIcon = (icon) => {
    switch (icon) {
      case 'close':
        return <CloseIcon />
      case 'undo':
        return <UndoIcon />
      case 'redo':
        return <RedoIcon />
      case 'next':
        return <NextIcon />
      case 'previous':
        return <PreviousIcon />
    }
  }

  render() {
    const {
      button: { disabled, tooltip, icon, spacer, command },
    } = this.props
    if (spacer) {
      return <div className="editor-bar-spacer" />
    } else {
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
          onClick={this.handleClick}
          onKeyPress={this.handleKeyPress}
        >
          {icon ? this.renderIcon(icon) : <div>{tooltip}</div>}
        </div>
      )
    }
  }
}

class EditorBar extends React.Component {
  static propTypes = {
    handleEditorCommand: PropTypes.func,
    handleSearchChange: PropTypes.func,
    hasRedo: PropTypes.bool,
    hasUndo: PropTypes.bool,
    i18n: PropTypes.func,
    title: PropTypes.string,
    type: PropTypes.string,
  }

  constructor(props) {
    super(props)
    this.state = {
      searchName: '',
    }
  }

  handleClick = (command) => {
    this.props.handleEditorCommand(command)
  }

  handleSearch = (searchName) => {
    this.props.handleSearchChange(searchName)
    this.setState({ searchName })
  }

  handleClear = () => {
    this.props.handleSearchChange('')
    this.setState({ searchName: '' })
  }

  render() {
    const { hasUndo, hasRedo, type, title, i18n } = this.props
    const { searchName } = this.state

    const undoButtons = [
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

    const nextButtons = [
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

    const resetButtons = [
      {
        command: 'restore',
        tooltip: i18n ? i18n('editor.bar.reset') : 'Reset',
        disabled: !hasUndo && !hasRedo,
      },
    ]

    const closeButtons = [
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
                return <EditorButton key={command} command={command} button={button} handleClick={this.handleClick} />
              })}
            </div>
            <div className="editor-bar-section">
              {undoButtons.map((button) => {
                const { command } = button
                return <EditorButton key={command} command={command} button={button} handleClick={this.handleClick} />
              })}
            </div>
            <div className="editor-bar-section">
              <div className="editor-bar-search" role="region" aria-label={searchTitle} id={searchTitle}>
                <SearchInput
                  id={`template-editor-search-${type}`}
                  value={searchName}
                  aria-label={searchTitle}
                  placeholder={searchTitle}
                  onChange={this.handleSearch}
                  onClear={this.handleClear}
                />
                {nextButtons.map((button) => {
                  const { command } = button
                  return <EditorButton key={command} command={command} button={button} handleClick={this.handleClick} />
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="editor-bar-close">
          <div className="editor-bar-section">
            {closeButtons.map((button) => {
              const { command } = button
              return <EditorButton key={command} command={command} button={button} handleClick={this.handleClick} />
            })}
          </div>
        </div>
      </div>
    )
  }
}

export default EditorBar
