import { global_BackgroundColor_200 as globalBackground200 } from '@patternfly/react-tokens/dist/js/global_BackgroundColor_200'
import { global_BackgroundColor_dark_100 as darkEditorBackground } from '@patternfly/react-tokens/dist/js/global_BackgroundColor_dark_100'
import { global_BackgroundColor_dark_200 as globalBackgroundDark200 } from '@patternfly/react-tokens/dist/js/global_BackgroundColor_dark_200'
import { global_BackgroundColor_light_100 as lightEditorBackground } from '@patternfly/react-tokens/dist/js/global_BackgroundColor_light_100'
import { global_Color_dark_100 as globalColorDark100 } from '@patternfly/react-tokens/dist/js/global_Color_dark_100'
import { global_Color_light_100 as globalColorLight100 } from '@patternfly/react-tokens/dist/js/global_Color_light_100'
;(window as any).monaco?.editor?.defineTheme('console', {
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
;(window as any).monaco?.editor?.defineTheme('vs-light', {
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
;(window as any).monaco.editor.defineTheme('console-light', {
  base: 'vs',
  inherit: true,
  colors: {
    'editor.background': lightEditorBackground.value,
    'editorGutter.background': '#f5f5f5', // black-150
    'editorLineNumber.activeForeground': globalColorDark100.value,
    'editorLineNumber.foreground': globalBackgroundDark200.value,
  },
  rules: [
    { token: 'number', foreground: '486b00' }, // light-green-600
    { token: 'type', foreground: '795600' }, // gold-500
    { token: 'string', foreground: '004080' }, // blue-600
    { token: 'keyword', foreground: '40199a' }, // purple-600
  ],
})
;(window as any).monaco.editor.defineTheme('console-dark', {
  base: 'vs-dark',
  inherit: true,
  colors: {
    'editor.background': darkEditorBackground.value,
    'editorGutter.background': '#292e34', // no pf token defined
    'editorLineNumber.activeForeground': globalColorLight100.value,
    'editorLineNumber.foreground': globalBackground200.value,
  },
  rules: [
    { token: 'number', foreground: 'ace12e' }, // light-green-600
    { token: 'type', foreground: '73bcf7' }, // blue-200
    { token: 'string', foreground: 'f0ab00' }, // gold-400
    { token: 'keyword', foreground: 'cbc1ff' }, // purple-100
  ],
})
