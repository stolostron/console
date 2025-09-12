/* Copyright Contributors to the Open Cluster Management project */
import { global_BackgroundColor_200 as globalBackground200 } from '@patternfly/react-tokens/dist/js/global_BackgroundColor_200'
import { global_BackgroundColor_dark_100 as darkEditorBackground } from '@patternfly/react-tokens/dist/js/global_BackgroundColor_dark_100'
import { global_Color_light_100 as globalColorLight100 } from '@patternfly/react-tokens/dist/js/global_Color_light_100'
export const THEME_LOCAL_STORAGE_KEY = 'bridge/theme'
const THEME_SYSTEM_DEFAULT = 'systemDefault'
export const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)')

import type { editor as monacoEditor } from 'monaco-editor/esm/vs/editor/editor.api'

export const getTheme = () => {
  // if user wants default and if OS wants dark, give them dark
  const theme = localStorage.getItem(THEME_LOCAL_STORAGE_KEY)
  if (theme === THEME_SYSTEM_DEFAULT && darkThemeMq.matches) {
    return 'console-dark'
  }
  // else only give them what user wants
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

/**
 * Mount the Monaco theme style for a given id.
 *
 *  every instance of monaco adds its own .monaco-colors stylesheet
 *  ocp, mce and acm create their own instances of monaco, so there can be 3 versions of monaco-colors
 *  whatever creates the monaco instance last (ocp, mce or acm) will be the last version in the style list
 *    and therefore will be the colors used by the currently open monaco editor whether it belongs to it or not
 *       (ex: ocp editor can wind up using acm colors)
 *  we can't push and pop or rearrange these duplication stylesheets so that they match the editor you open
 *   because their object is locked into that instance of monaco--it will only update the stylesheet it created
 *  but what we CAN do is hide the stylesheets that aren't used by setting its media to 'none'
 *  these functions show the monaco-colors for the currently open editor and hides the rest
 */
export const mountTheme = (id: string): void => {
  const elements = Array.from(document.querySelectorAll('.monaco-colors')) as Array<HTMLElement & { media?: string }>
  if (elements.length === 0) return

  // Prefer an element that already has data-<id>
  let target = elements.find((el) => el.dataset && Object.prototype.hasOwnProperty.call(el.dataset, id))

  // If none, choose the last element with an empty dataset and tag it
  if (!target) {
    const withoutDataset = elements.filter((el) => !el.dataset || Object.keys(el.dataset).length === 0)
    target = withoutDataset[withoutDataset.length - 1] || elements[elements.length - 1]
    try {
      target.dataset[id] = 'true'
    } catch {
      /* no-op: best-effort */
    }
  }

  // Activate the target, deactivate the rest
  elements.forEach((el) => {
    const styleEl = el as HTMLStyleElement
    if (el === target) {
      styleEl.media = 'screen'
    } else {
      styleEl.media = 'none'
    }
  })
}

/**
 * Dismount the Monaco theme style for a given id.
 */
export const dismountTheme = (id: string): void => {
  const elements = Array.from(document.querySelectorAll('.monaco-colors')) as Array<HTMLElement & { media?: string }>
  if (elements.length === 0) return

  elements.forEach((el) => {
    const styleEl = el as HTMLStyleElement
    const hasDatasetEntries = !!el.dataset && Object.keys(el.dataset).length > 0
    if (el.dataset && Object.prototype.hasOwnProperty.call(el.dataset, id)) {
      styleEl.media = 'none'
    } else if (!hasDatasetEntries) {
      styleEl.media = 'screen'
    }
  })
}
