/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import debounce from 'lodash/debounce'
import PropTypes from 'prop-types'
import { DecorationType } from '../utils/source-utils'
import { getTheme, defineThemes, mountTheme, dismountTheme } from '../../theme'

class YamlEditor extends React.Component {
  static propTypes = {
    addEditor: PropTypes.func,
    editor: PropTypes.element,
    hide: PropTypes.bool,
    id: PropTypes.string,
    decorationRows: PropTypes.array,
    onYamlChange: PropTypes.func,
    readOnly: PropTypes.bool,
    showCondensed: PropTypes.bool,
    yaml: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  }

  constructor(props) {
    super(props)

    const { id, editor, onYamlChange } = this.props
    this.classObserver = null
    this.state = {
      editor:
        editor &&
        React.cloneElement(editor, {
          language: 'yaml',
          height: '100%',
          width: '100%',
          theme: getTheme(),
          options: {
            wordWrap: 'wordWrapColumn',
            wordWrapColumn: 132,
            wordWrapMinified: false,
            scrollBeyondLastLine: true,
            smoothScrolling: true,
            glyphMargin: true,
            tabSize: 2,
            minimap: {
              enabled: false,
            },
            scrollbar: {
              verticalScrollbarSize: 17,
              horizontalScrollbarSize: 17,
            },
          },
          editorDidMount: this.editorDidMount.bind(this, id),
          editorWillMount: this.editorWillMount.bind(this),
          editorWillUnmount: this.editorWillUnmount.bind(this),
          onChange: onYamlChange,
        }),
      editorHasFocus: false,
    }
  }
  editorWillUnmount() {
    // hide TemplateEditor version of monaco-colors
    dismountTheme('te')
  }

  editorWillMount() {
    // Monaco uses <span> to measure character sizes
    // therefore make sure <span> has the right font
    let stylesheet = document.querySelector('link[href*=main]')
    if (stylesheet) {
      stylesheet = stylesheet.sheet
      stylesheet.insertRule('span { font-family: monospace }', stylesheet.cssRules.length)
    }
  }

  editorDidMount(id, editor, monaco) {
    const { addEditor } = this.props
    // make sure this instance of monaco editor has the ocp console themes
    defineThemes(monaco?.editor)

    // if we don't reset the themes to vs
    // and console-light or console-dark were set, monaco wouldn't
    // update the 'monoco-colors' style with the right colors
    monaco?.editor?.setTheme('vs')
    monaco?.editor?.setTheme(getTheme())
    // use TemplateEditor version of monaco-colors
    mountTheme('te')

    // observe documentElement class changes (theme toggles)
    if (typeof MutationObserver !== 'undefined') {
      this.classObserver = new MutationObserver(() => {
        monaco?.editor?.setTheme(getTheme())
        window.monaco?.editor?.setTheme(getTheme())
      })
      this.classObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      })
    }

    editor.layout()
    editor.focus()
    editor.monaco = monaco
    editor.decorations = []
    if (addEditor) {
      addEditor(id, editor)
    }
    this.editor = editor

    // remove the rule setting <span> font
    let stylesheet = document.querySelector('link[href*=main]')
    if (stylesheet) {
      stylesheet = stylesheet.sheet
      stylesheet.deleteRule(stylesheet.cssRules.length - 1)
    }

    monaco.editor.setModelLanguage(editor.getModel(), 'yaml')

    editor.changeViewZones((changeAccessor) => {
      const domNode = document.createElement('div')
      changeAccessor.addZone({
        afterLineNumber: 0,
        heightInPx: 10,
        domNode: domNode,
      })
    })

    editor.onKeyDown(
      ((e) => {
        // determine readonly ranges
        const prohibited = []
        const { decorationRows = [] } = this.props
        decorationRows.forEach((obj) => {
          if (obj.decorationType === DecorationType.IMMUTABLE) {
            prohibited.push(new this.editor.monaco.Range(obj.$r + 1, 0, obj.$r + 1, 132))
          }
        })

        // if user presses enter, add new key: below this line
        let endOfLineEnter = false
        if (e.code === 'Enter') {
          const model = this.editor.getModel()
          const pos = this.editor.getPosition()
          const thisLine = model.getLineContent(pos.lineNumber)
          endOfLineEnter = thisLine.length < pos.column
        }

        // prevent typing on readonly ranges
        const selections = this.editor.getSelections()
        if (
          // if user clicks on readonly area, ignore
          !(e.code === 'KeyC' && (e.ctrlKey || e.metaKey)) &&
          e.code !== 'ArrowDown' &&
          e.code !== 'ArrowUp' &&
          e.code !== 'ArrowLeft' &&
          e.code !== 'ArrowRight' &&
          !endOfLineEnter &&
          !prohibited.every((prohibit) => {
            return selections.findIndex((range) => prohibit.intersectRanges(range)) === -1
          })
        ) {
          e.stopPropagation()
          e.preventDefault()
        }
      }).bind(this)
    )

    editor.onMouseDown(
      debounce(() => {
        const editorHasFocus = !!document.querySelector('.monaco-editor.focused')
        this.setState({ editorHasFocus })
      }, 0)
    )

    editor.onDidBlurEditorWidget(() => {
      const editorHasFocus = !!document.querySelector('.monaco-editor.focused')
      const activeId = document.activeElement?.id
      if (!editorHasFocus && ['undo-button', 'redo-button'].indexOf(activeId) === -1) {
        this.setState({ editorHasFocus })
      }
    })
  }

  componentWillUnmount() {
    if (this.classObserver) {
      this.classObserver.disconnect()
      this.classObserver = null
    }
  }

  shouldComponentUpdate(nextProps) {
    // if editor has focus, ignore form changes, since editor is doing all the changes
    return (
      !this.state.editorHasFocus &&
      (this.props.yaml !== nextProps.yaml ||
        this.props.hide !== nextProps.hide ||
        this.props.readOnly !== nextProps.readOnly ||
        this.props.showCondensed !== nextProps.showCondensed)
    )
  }

  // componentDidUpdate() {
  //   // stop flickering
  //   if (this.editor && this.editor.getModel()) {
  //     const model = this.editor.getModel()
  //     model.forceTokenization(model.getLineCount())
  //   }
  // }

  render() {
    const { yaml, readOnly, hide = false, showCondensed } = this.props
    const { editor } = this.state
    const style = {
      display: hide ? 'none' : 'block',
      minHeight: '100px',
    }
    if (readOnly) {
      style.borderLeft = '1px solid #c8c8c8'
    }
    return (
      <div className="yamlEditorContainer" style={style}>
        {editor &&
          React.cloneElement(editor, {
            value: yaml,
            theme: getTheme(),
            options: {
              ...this.state.editor.props.options,
              wordWrapColumn: showCondensed ? 512 : 256,
              readOnly,
              minimap: {
                enabled: false,
              },
            },
          })}
      </div>
    )
  }
}

export default YamlEditor
