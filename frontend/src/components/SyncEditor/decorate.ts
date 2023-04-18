/* Copyright Contributors to the Open Cluster Management project */
import { get } from 'lodash'
import { ErrorType } from './validation'

const startCase = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
export const decorate = (
  isCustomEdit: boolean,
  editorHasFocus: boolean,
  editorRef: any,
  monacoRef: any,
  errors: any[],
  changes: any[],
  change: {
    parsed: { [name: string]: any[] }
    mappings: { [name: string]: any[] }
  },
  userEdits: any[],
  protectedRanges: any[],
  filteredRows: number[]
) => {
  const decorations: any[] = []
  const squigglyTooltips: any[] = []

  // errors/warnings
  addErrorDecorations(monacoRef, errors, decorations, squigglyTooltips)

  // add change decorations
  addChangeDecorations(isCustomEdit, monacoRef, changes, change, decorations)

  // if form is making changes, layer any editor changes decorations on top of form changes
  if (userEdits.length) {
    addChangeDecorations(true, monacoRef, userEdits, change, decorations)
  }

  // add protected decorations
  addProtectedDecorations(monacoRef, protectedRanges, decorations)

  // add filter row toggle decorations
  addFilteredDecorations(monacoRef, filteredRows, decorations)

  // add decorations to editor
  const hasErrors = errors.length > 0
  const handles = getResourceEditorDecorations(editorRef, hasErrors).map((decoration: { id: any }) => decoration.id)
  editorRef.current.deltaDecorations(handles, decorations)

  // scroll to best line to show
  if (!editorHasFocus) {
    scrollToChangeDecoration(editorRef, errors, decorations)
  }

  return squigglyTooltips
}

const addProtectedDecorations = (monacoRef: any, protectedRanges: any[], decorations: any[]) => {
  protectedRanges?.forEach((range) => {
    const start = range.startLineNumber
    const end = range.endLineNumber - 1
    decorations.push({
      range: new monacoRef.current.Range(start, 1, end, 132),
      options: {
        inlineClassName: 'protectedDecoration',
        description: 'resource-editor',
      },
    })
  })
}

const addFilteredDecorations = (monacoRef: any, filteredRows: any[], decorations: any[]) => {
  filteredRows?.forEach((row) => {
    decorations.push({
      range: new monacoRef.current.Range(row, 0, row, 132),
      options: {
        after: { content: '\u200b', inlineClassName: 'inline-folded' },
        description: 'resource-editor',
      },
    })
  })
}

const addErrorDecorations = (monacoRef: any, errors: any[], decorations: any[], squigglyTooltips: any[]) => {
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
        range: new monacoRef.current.Range(start, 0, start, 132),
        options,
      })

      // squiggly line under error
      const range = new monacoRef.current.Range(
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
  monacoRef: any,
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
        range: new monacoRef.current.Range(obj.$r, 0, obj.$r + ($t === 'N' ? obj.$l - 1 : 0), 0),
        options: {
          isWholeLine: true,
          linesDecorationsClassName: isCustomEdit ? 'customLineDecoration' : 'insertedLineDecoration',
          overviewRuler: isCustomEdit ? { color: '#0000ff', position: 1 } : {},
          minimap: { color: isCustomEdit ? '#0000ff' : '#c0c0ff', position: 2 },
          description: 'resource-editor',
        },
      })
      if ($f != null && $f.toString().length < 32 && !obj.$s) {
        decorations.push({
          range: new monacoRef.current.Range(obj.$r, 0, obj.$r, 132),
          options: {
            after: { content: `  # ${$f}`, inlineClassName: 'protectedDecoration' },
            description: 'resource-editor',
          },
        })
      }
    }
  })
}

export const getResourceEditorDecorations = (editorRef: any, hasErrors: boolean) => {
  // clear resource-editor decorations
  // don't filter protectedDecoration if there are errors because parser doesn't know where protected
  // areas are so only previous decorations do
  const model = editorRef.current?.getModel()
  return model.getAllDecorations().filter(
    (decoration: {
      options: {
        inlineClassName: string
        glyphMarginClassName: string
        className: string
        description: string
      }
    }) =>
      decoration?.options?.className?.startsWith('squiggly-') ||
      (!!decoration?.options?.glyphMarginClassName &&
        (decoration?.options?.inlineClassName !== 'protectedDecoration' || !hasErrors))
  )
}

const scrollToChangeDecoration = (editorRef: any, errors: any[], decorations: any[]) => {
  const editor = editorRef.current
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
