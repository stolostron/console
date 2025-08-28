/* Copyright Contributors to the Open Cluster Management project */
import { global_BackgroundColor_200 as globalBackground200 } from '@patternfly/react-tokens/dist/js/global_BackgroundColor_200'
import { global_BackgroundColor_dark_100 as darkEditorBackground } from '@patternfly/react-tokens/dist/js/global_BackgroundColor_dark_100'
import { global_Color_light_100 as globalColorLight100 } from '@patternfly/react-tokens/dist/js/global_Color_light_100'

import type { editor as monacoEditor } from 'monaco-editor/esm/vs/editor/editor.api'

export const getTheme = () => {
  return !document.documentElement.classList.contains('pf-v5-theme-dark') ? 'console-light' : 'console-dark'
}
/**
 * Define the themes `console-light` and `console-dark` for an instance of Monaco editor.
 */
export const defineThemes = (editor: typeof monacoEditor) => {
  editor.defineTheme('console-light', {
    base: 'vs',
    inherit: true,
    colors: {
      'editor.background': '#ffffff',
      'editorLineNumber.activeForeground': '#000000',
      'editorLineNumber.foreground': '#4d4d4d',
    },
    rules: [
      { token: 'number', foreground: '#204d00' },
      { token: 'type', foreground: '#73480b' },
      { token: 'string', foreground: '#73480b' },
      { token: 'keyword', foreground: '#21134d' },
    ],
  })

  editor.defineTheme('console-dark', {
    base: 'vs-dark',
    inherit: true,
    colors: {
      'editor.background': darkEditorBackground.value,
      'editorLineNumber.activeForeground': globalColorLight100.value,
      'editorLineNumber.foreground': globalBackground200.value,
    },
    rules: [
      { token: 'number', foreground: 'ace12e' },
      { token: 'type', foreground: '73bcf7' },
      { token: 'string', foreground: 'f0ab00' },
      { token: 'keyword', foreground: 'cbc0ff' },
    ],
  })
}
