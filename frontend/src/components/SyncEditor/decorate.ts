/* Copyright Contributors to the Open Cluster Management project */
import { get } from 'lodash'
import { ErrorType } from './validation'
import { Monaco } from '@monaco-editor/react'
import { editor as editorTypes } from 'monaco-editor'

const startCase = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const decorate = (
  isCustomEdit: boolean,
  editorHasFocus: boolean,
  editor: editorTypes.IStandaloneCodeEditor,
  monaco: Monaco,
  errors: any[],
  changes: any[],
  change: {
    parsed: { [name: string]: any[] }
    mappings: { [name: string]: any[] }
  },
  preservedUserEdits: any[],
  protectedRanges: any[],
  filteredRows: number[]
) => {
  const decorations: any[] = []
  const squigglyTooltips: any[] = []

  // errors/warnings
  addErrorDecorations(monaco, errors, decorations, squigglyTooltips)

  // add change decorations
  addChangeDecorations(isCustomEdit, monaco, changes, change, decorations)

  // if form is making changes, layer any editor changes decorations on top of form changes
  if (preservedUserEdits.length) {
    addChangeDecorations(true, monaco, preservedUserEdits, change, decorations)
  }

  // add protected decorations
  addProtectedDecorations(monaco, protectedRanges, decorations)

  // add filter row toggle decorations
  addFilteredDecorations(monaco, filteredRows, decorations)

  // add decorations to editor
  const hasErrors = errors.length > 0
  const handles = getResourceEditorDecorations(editor, hasErrors).map((decoration: { id: any }) => decoration.id)
  editor.deltaDecorations(handles, decorations)

  // scroll to best line to show
  if (!editorHasFocus) {
    scrollToChangeDecoration(editor, errors, decorations)
  }

  return squigglyTooltips
}

const addProtectedDecorations = (monaco: Monaco, protectedRanges: any[], decorations: any[]) => {
  protectedRanges?.forEach((range) => {
    const start = range.startLineNumber
    const end = range.endLineNumber - 1
    decorations.push({
      range: new monaco.Range(start, 1, end, 132),
      options: {
        inlineClassName: 'protectedDecoration',
        description: 'resource-editor',
      },
    })
  })
}

const addFilteredDecorations = (monaco: Monaco, filteredRows: any[], decorations: any[]) => {
  filteredRows?.forEach((row) => {
    decorations.push({
      range: new monaco.Range(row, 0, row, 132),
      options: {
        after: { content: '\u200b', inlineClassName: 'inline-folded' },
        description: 'resource-editor',
      },
    })
  })
}

const addErrorDecorations = (monaco: Monaco, errors: any[], decorations: any[], squigglyTooltips: any[]) => {
  errors.forEach((error: { linePos: any; message: any; errorType: ErrorType }) => {
    const { linePos, message, errorType } = error
    const start = linePos?.start?.line ?? 0
    if (linePos && start !== 0) {
      // error in margin
      const options = {
        isWholeLine: true,
        glyphMarginClassName: 'errorDecoration',
        overviewRuler: { color: '#ff0000', position: 4 },
        minimap: { color: '#ff000060', position: 1 },
        glyphMarginHoverMessage: { value: '```html\n' + startCase(message) + ' \n```' },
        description: 'resource-editor',
      }
      const squiggly = {
        className: 'squiggly-error',
      }
      switch (errorType) {
        case ErrorType.warning:
          options.glyphMarginClassName = 'warningDecoration'
          options.overviewRuler.color = '#ffff00'
          options.minimap.color = '#ffff0060'
          squiggly.className = 'squiggly-warning'
          break
        case ErrorType.info:
          options.glyphMarginClassName = 'infoDecoration'
          options.overviewRuler.color = '#2B9AF3'
          options.minimap.color = '#2B9AF360'
          squiggly.className = 'squiggly-information'
          break
      }

      decorations.push({
        range: new monaco.Range(start, 0, start, 132),
        options,
      })

      // squiggly line under error
      const range = new monaco.Range(
        start,
        linePos?.start?.col ?? 0,
        linePos?.end?.line ?? start,
        linePos?.end?.col ?? 132
      )
      decorations.push({
        range,
        options: squiggly,
      })
      squigglyTooltips.push({
        range,
        message: startCase(message.replace(/\^*/g, '')).replace(/\n/g, '  '),
      })
    }
    errors.push({ linePos, message })
  })
}

const addChangeDecorations = (
  isCustomEdit: boolean,
  monaco: Monaco,
  changes: any[],
  change: {
    parsed: { [name: string]: any[] }
    mappings: { [name: string]: any[] }
  },
  decorations: any[]
) => {
  changes.forEach((chng) => {
    const { $t, $a, $f } = chng
    const obj: any = get(change.mappings, $a)
    if (obj) {
      decorations.push({
        range: new monaco.Range(obj.$r, 0, obj.$r + ($t === 'N' ? obj.$l - 1 : 0), 0),
        options: {
          isWholeLine: true,
          linesDecorationsClassName: isCustomEdit ? 'customLineDecoration' : 'insertedLineDecoration',
          overviewRuler: isCustomEdit ? { color: '#0000ff', position: 1 } : {},
          minimap: { color: isCustomEdit ? '#0000ff' : '#c0c0ff', position: 2 },
          description: 'resource-editor',
        },
      })
      if ($f != null && $f.toString().length < 132 && !obj.$s) {
        decorations.push({
          range: new monaco.Range(obj.$r, 0, obj.$r, 132),
          options: {
            after: { content: `  # ${$f}`, inlineClassName: 'protectedDecoration' },
            description: 'resource-editor',
          },
        })
      }
    }
  })
}

export const getResourceEditorDecorations = (editor: editorTypes.IStandaloneCodeEditor, hasErrors: boolean) => {
  // clear resource-editor decorations
  // don't filter protectedDecoration if there are errors because parser doesn't know where protected
  // areas are so only previous decorations do
  const model = editor?.getModel()
  let decorations = model ? model.getAllDecorations() : []
  decorations = decorations.filter(({ options }) => {
    return (
      options?.className?.startsWith('squiggly-') ||
      ['customLineDecoration', 'insertedLineDecoration'].includes(options?.linesDecorationsClassName ?? '') ||
      (!!options?.glyphMarginClassName && (options?.inlineClassName !== 'protectedDecoration' || !hasErrors))
    )
  })
  // these are the handles that are removed before adding new decorators
  return decorations
}

const scrollToChangeDecoration = (editor: editorTypes.IStandaloneCodeEditor, errors: any[], decorations: any[]) => {
  const visibleRange = editor.getVisibleRanges()[0]
  if (visibleRange) {
    // if any errors and not in visible range, and first error isn't visible, scroll to it
    const errorLine = errors.length !== 0 ? errors[0]?.linePos?.start?.linePos : undefined
    if (errorLine && !visibleRange.containsPosition({ lineNumber: errorLine, column: 1 })) {
      setTimeout(() => {
        editor.revealLineInCenter(errorLine)
      })
    } else if (decorations.length) {
      // if visible range doesn't show any change decorations, scroll to first change decoration
      const changeDecorations = decorations.filter(
        (decoration) => decoration.options.linesDecorationsClassName === 'insertedLineDecoration'
      )
      if (
        changeDecorations.length &&
        !changeDecorations.some((decoration) => {
          return visibleRange.containsPosition(decoration?.range.getStartPosition())
        })
      ) {
        setTimeout(() => {
          editor.revealLineInCenter(changeDecorations[0]?.range.getStartPosition()?.lineNumber)
        })
      }
    }
  }
}
