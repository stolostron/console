/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { DecorationType } from '../utils/source-utils'
import { global_BackgroundColor_200 as globalBackground200 } from '@patternfly/react-tokens/dist/js/global_BackgroundColor_200'
import { global_BackgroundColor_dark_100 as darkEditorBackground } from '@patternfly/react-tokens/dist/js/global_BackgroundColor_dark_100'
import { global_Color_light_100 as globalColorLight100 } from '@patternfly/react-tokens/dist/js/global_Color_light_100'

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
    this.state = {
      editor:
        editor &&
        React.cloneElement(editor, {
          language: 'yaml',
          height: '100%',
          width: '100%',
          options: {
            theme: 'console',
            wordWrap: 'wordWrapColumn',
            wordWrapColumn: 132,
            wordWrapMinified: false,
            scrollBeyondLastLine: true,
            smoothScrolling: true,
            glyphMargin: true,
            tabSize: 2,
            scrollbar: {
              verticalScrollbarSize: 17,
              horizontalScrollbarSize: 17,
            },
          },
          editorDidMount: this.editorDidMount.bind(this, id),
          editorWillMount: this.editorWillMount.bind(this),
          onChange: onYamlChange,
        }),
    }
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
    // make sure this instance of monaco editor has a console theme
    monaco?.editor?.defineTheme('console', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        // avoid pf tokens for `rules` since tokens are opaque strings that might not be hex values
        { token: 'number', foreground: 'ace12e' },
        { token: 'type', foreground: '73bcf7' },
        { token: 'string', foreground: 'f0ab00' },
        { token: 'keyword', foreground: 'cbc0ff' },
      ],
      colors: {
        'editor.background': darkEditorBackground.value,
        'editorGutter.background': '#292e34', // no pf token defined
        'editorLineNumber.activeForeground': globalColorLight100.value,
        'editorLineNumber.foreground': globalBackground200.value,
      },
    })
    // reset the themes to vs
    monaco?.editor?.setTheme('vs')
    window.monaco?.editor?.setTheme('vs')
    // set theme to console
    // --if we didn't reset the themes above to vs
    // --and console was set, monaco wouldn't
    // --update the 'monoco-colors' style
    // -- with the right colors
    monaco?.editor?.setTheme('console')
    window.monaco?.editor?.setTheme('console')
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
  }

  shouldComponentUpdate(nextProps) {
    return (
      this.props.yaml !== nextProps.yaml ||
      this.props.hide !== nextProps.hide ||
      this.props.readOnly !== nextProps.readOnly ||
      this.props.showCondensed !== nextProps.showCondensed
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
            options: {
              ...this.state.editor.props.options,
              theme: 'console',
              wordWrapColumn: showCondensed ? 512 : 256,
              minimap: {
                enabled: !showCondensed,
              },
              readOnly,
            },
          })}
      </div>
    )
  }
}

export default YamlEditor
