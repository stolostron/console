/* Copyright Contributors to the Open Cluster Management project */
import { get, capitalize } from 'lodash'

export const decorate = (
    isCustomEdit: boolean,
    editorRef: any,
    monacoRef: any,
    errors: any[],
    changes: any[],
    change: {
        parsed: { [name: string]: any[] }
        mappings: { [name: string]: any[] }
    },
    userEdits: any[],
    protectedRanges: any[]
) => {
    const decorations: any[] = []
    const squigglyTooltips: any[] = []

    // errors/warnings
    addErrorDecorations(monacoRef, errors, decorations, squigglyTooltips)

    // add the decorations
    addChangeDecorations(isCustomEdit, monacoRef, changes, change, decorations)

    // if form is making changes, layer any editor changes decorations on top of form changes
    if (!isCustomEdit && userEdits.length) {
        addChangeDecorations(true, monacoRef, userEdits, change, decorations)
    }

    // add protected decorations
    addProtectedDecorations(monacoRef, protectedRanges, decorations)

    // add decorations to editor
    const handles = getResourceEditorDecorations(editorRef).map((decoration: { id: any }) => decoration.id)
    editorRef.current.deltaDecorations(handles, decorations)

    // scroll to best line to show
    if (!isCustomEdit) {
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

const addErrorDecorations = (monacoRef: any, errors: any[], decorations: any[], squigglyTooltips: any[]) => {
    errors.forEach((error: { linePos: any; message: any; isWarning: boolean }) => {
        const { linePos, message, isWarning } = error
        const start = linePos?.start?.line ?? 0
        if (linePos && start !== 0) {
            // error in margin
            decorations.push({
                range: new monacoRef.current.Range(start, 0, start, 132),
                options: {
                    isWholeLine: true,
                    glyphMarginClassName: isWarning ? 'warningDecoration' : 'errorDecoration',
                    glyphMarginHoverMessage: { value: '```html\n' + capitalize(message) + ' \n```' },
                    overviewRuler: { color: isWarning ? '#ffff00' : '#ff0000', position: 4 },
                    minimap: { color: isWarning ? '#ffff0060' : '#ff000060', position: 1 },
                    description: 'resource-editor',
                },
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
                options: {
                    className: isWarning ? 'squiggly-warning' : 'squiggly-error',
                },
            })
            squigglyTooltips.push({
                range,
                message: capitalize(message.replace(/\^*/g, '').replace(/\n/g, '  ')),
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
            if ($f !== undefined && !obj.$s) {
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

export const getResourceEditorDecorations = (editorRef: any) => {
    // clear resource-editor decorations
    const model = editorRef.current?.getModel()
    return model
        .getAllDecorations()
        .filter(
            (decoration: { options: { className: string; description: string } }) =>
                decoration?.options?.className?.startsWith('squiggly-') ||
                decoration?.options?.description === 'resource-editor'
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
