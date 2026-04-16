/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable @typescript-eslint/ban-ts-comment -- Monaco wiring; types deferred */
// @ts-nocheck — Monaco editor instance wiring; types deferred

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import debounce from 'lodash/debounce'
import { DecorationType } from '../utils/source-utils'
import { getTheme, defineThemes, mountTheme, dismountTheme } from '../../theme'

function YamlEditor(props) {
  const propsRef = useRef(props)
  propsRef.current = props

  const { id, editor, onYamlChange, yaml, readOnly, hide = false, showCondensed } = props

  const [editorHasFocus, setEditorHasFocus] = useState(false)

  const frozenRef = useRef({ yaml, hide, readOnly, showCondensed })
  if (!editorHasFocus) {
    frozenRef.current = { yaml, hide, readOnly, showCondensed }
  }
  const { yaml: effYaml, hide: effHide, readOnly: effReadOnly, showCondensed: effShowCondensed } = frozenRef.current

  const classObserverRef = useRef(null)

  const editorWillUnmount = useCallback(() => {
    dismountTheme('te')
  }, [])

  const editorWillMount = useCallback(() => {
    let stylesheet = document.querySelector('link[href*=main]')
    if (stylesheet) {
      stylesheet = stylesheet.sheet
      stylesheet.insertRule('span { font-family: monospace }', stylesheet.cssRules.length)
    }
  }, [])

  const editorDidMount = useCallback(
    (mountedEditor, monaco) => {
      const { addEditor } = propsRef.current
      defineThemes(monaco?.editor)

      monaco?.editor?.setTheme('vs')
      monaco?.editor?.setTheme(getTheme())
      mountTheme('te')

      if (typeof MutationObserver !== 'undefined') {
        classObserverRef.current = new MutationObserver(() => {
          monaco?.editor?.setTheme(getTheme())
          window.monaco?.editor?.setTheme(getTheme())
        })
        classObserverRef.current.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class'],
        })
      }

      mountedEditor.layout()
      mountedEditor.focus()
      mountedEditor.monaco = monaco
      mountedEditor.decorations = []
      if (addEditor) {
        addEditor(id, mountedEditor)
      }

      let stylesheet = document.querySelector('link[href*=main]')
      if (stylesheet) {
        stylesheet = stylesheet.sheet
        stylesheet.deleteRule(stylesheet.cssRules.length - 1)
      }

      monaco.editor.setModelLanguage(mountedEditor.getModel(), 'yaml')

      mountedEditor.changeViewZones((changeAccessor) => {
        const domNode = document.createElement('div')
        changeAccessor.addZone({
          afterLineNumber: 0,
          heightInPx: 10,
          domNode: domNode,
        })
      })

      mountedEditor.onKeyDown((e) => {
        const prohibited = []
        const { decorationRows = [] } = propsRef.current
        decorationRows.forEach((obj) => {
          if (obj.decorationType === DecorationType.IMMUTABLE) {
            prohibited.push(new mountedEditor.monaco.Range(obj.$r + 1, 0, obj.$r + 1, 132))
          }
        })

        let endOfLineEnter = false
        if (e.code === 'Enter') {
          const model = mountedEditor.getModel()
          const pos = mountedEditor.getPosition()
          const thisLine = model.getLineContent(pos.lineNumber)
          endOfLineEnter = thisLine.length < pos.column
        }

        const selections = mountedEditor.getSelections()
        if (
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
      })

      mountedEditor.onMouseDown(
        debounce(() => {
          const nextFocus = !!document.querySelector('.monaco-editor.focused')
          setEditorHasFocus(nextFocus)
        }, 0)
      )

      mountedEditor.onDidBlurEditorWidget(() => {
        const nextFocus = !!document.querySelector('.monaco-editor.focused')
        const activeId = document.activeElement?.id
        if (!nextFocus && ['undo-button', 'redo-button'].indexOf(activeId) === -1) {
          setEditorHasFocus(nextFocus)
        }
      })
    },
    [id]
  )

  useEffect(() => {
    return () => {
      if (classObserverRef.current) {
        classObserverRef.current.disconnect()
        classObserverRef.current = null
      }
    }
  }, [])

  const clonedEditor = useMemo(() => {
    if (!editor) {
      return null
    }
    return React.cloneElement(editor, {
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
      editorDidMount: (e, m) => editorDidMount(e, m),
      editorWillMount: editorWillMount,
      editorWillUnmount: editorWillUnmount,
      onChange: onYamlChange,
    })
  }, [editor, onYamlChange, editorDidMount, editorWillMount, editorWillUnmount])

  const style = {
    display: effHide ? 'none' : 'block',
    minHeight: '100px',
  }
  if (effReadOnly) {
    style.borderLeft = '1px solid #c8c8c8'
  }

  return (
    <div className="yamlEditorContainer" style={style}>
      {clonedEditor &&
        React.cloneElement(clonedEditor, {
          value: effYaml,
          theme: getTheme(),
          options: {
            ...clonedEditor.props.options,
            wordWrapColumn: effShowCondensed ? 512 : 256,
            readOnly: effReadOnly,
            minimap: {
              enabled: false,
            },
          },
        })}
    </div>
  )
}

export default YamlEditor
