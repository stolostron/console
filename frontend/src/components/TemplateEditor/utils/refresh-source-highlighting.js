'use strict'

import { diff } from 'deep-diff'
import { parseYAML, getInsideObject, getResourceID } from './source-utils'
import get from 'lodash/get'
import keyBy from 'lodash/keyBy'

export const highlightChanges = (editor, oldYAML, newYAML, highlightEncoded) => {
  // mark any modified/added lines in editor
  const decorationList = []

  // determine what rows were modified or added
  oldYAML = oldYAML.replace(/\./g, '_') // any periods will mess up the get later
  newYAML = newYAML.replace(/\./g, '_')
  const oldParse = parseYAML(oldYAML)
  const newParse = parseYAML(newYAML)
  const oldRaw = getInsideObject('$raw', oldParse.parsed)
  const newRaw = getInsideObject('$raw', newParse.parsed)
  const oldSynced = getInsideObject('$synced', oldParse.parsed)
  const newSynced = getInsideObject('$synced', newParse.parsed)
  let firstModRow = undefined
  let firstNewRow = undefined
  let encodedRow = undefined
  const ignorePaths = []
  normalize(oldRaw, newRaw)
  const diffs = diff(oldRaw, newRaw)
  if (diffs) {
    diffs.forEach(({ kind, path, index, item, lhs, rhs }) => {
      let pathBase = path.shift()
      pathBase = `${pathBase}[${path.length > 0 ? path.shift() : 0}]`
      let newPath = path.length > 0 ? pathBase + `.${path.join('.$v.')}` : pathBase
      const synced = (kind === 'D' || kind === 'E') && lhs && !rhs ? oldSynced : newSynced
      let obj = get(synced, newPath)
      if (obj) {
        if (obj.$v || obj.$v === false) {
          // convert A's and E's into 'N's
          switch (kind) {
            case 'E': {
              if (obj.$l > 1 && rhs) {
                // convert edit to new is multilines added
                kind = 'N'
                obj = { $r: obj.$r + 1, $l: obj.$l - 1 }
              }
              break
            }
            case 'A': {
              switch (item.kind) {
                case 'N':
                  // convert new array item to new range
                  kind = 'N'
                  obj = obj.$v[index].$r ? obj.$v[index] : obj
                  break
                case 'D':
                  // if array delete, ignore any other edits within array
                  // edits are just the comparison of other array items
                  ignorePaths.push(path.join('/'))
                  break
              }
              break
            }
          }
        } else if (obj.$l > 1 && path.length > 0 && kind !== 'D') {
          kind = 'N'
          path.pop()
          newPath = pathBase + `.${path.join('.$v.')}`
          obj = get(newSynced, newPath)
        } else if (path.length > 0) {
          kind = 'D'
        }

        // if array delete, ignore any other edits within array
        // edits are just the comparison of other array items
        if (ignorePaths.length > 0) {
          const tp = path.join('/')
          if (
            ignorePaths.some((p) => {
              return tp.startsWith(p)
            })
          ) {
            // ignore any edits within an array that had an imtem deleted
            kind = 'D'
          }
        }

        switch (kind) {
          case 'E': {
            // edited
            if ((obj.$v || obj.$v === false) && rhs) {
              // if no value ignore--all values removed from a key
              decorationList.push({
                range: new editor.monaco.Range(obj.$r + 1, 0, obj.$r + 1, 0),
                options: {
                  isWholeLine: true,
                  linesDecorationsClassName: 'insertedLineDecoration',
                  minimap: { color: '#c0c0ff', position: 2 },
                },
              })

              // if long encoded string, don't scroll to it
              let isEncoded = typeof obj.$v === 'string' && obj.$v.length > 200
              if (isEncoded) {
                try {
                  Buffer.from(obj.$v, 'base64').toString('ascii')
                } catch (e) {
                  isEncoded = false
                }
              }
              if (!isEncoded) {
                if (!firstModRow || firstModRow > obj.$r) {
                  firstModRow = obj.$r
                }
              } else {
                encodedRow = obj.$r
              }
            }
            break
          }
          case 'N': // new
            decorationList.push({
              range: new editor.monaco.Range(obj.$r + 1, 0, obj.$r + obj.$l, 0),
              options: {
                isWholeLine: true,
                linesDecorationsClassName: 'insertedLineDecoration',
                minimap: { color: '#c0c0ff', position: 2 },
              },
            })
            if (!firstNewRow || firstNewRow > obj.$r) {
              firstNewRow = obj.$r
            }
            break
        }
      }
    })

    setTimeout(() => {
      editor.changeList = decorationList
      editor.decorations = editor.deltaDecorations(editor.decorations, [
        ...(editor.errorList || []),
        ...(editor.immutableList || []),
        ...editor.changeList,
      ])
    }, 0)
  } else {
    editor.decorations = editor.deltaDecorations(editor.decorations, [])
  }
  editor.changed = firstNewRow || firstModRow || (highlightEncoded && encodedRow)
}

// if there are arrays make sure equal array entries line up
const normalize = (oldRaw, newRaw) => {
  Object.keys(oldRaw).forEach((key) => {
    if (newRaw[key] && oldRaw[key].length !== newRaw[key].length) {
      const oldKeys = keyBy(oldRaw[key], getResourceID)
      const newKeys = keyBy(newRaw[key], getResourceID)

      // if an element added to array, compare it with an empty object
      Object.keys(newKeys).forEach((k, inx) => {
        if (!oldKeys[k]) {
          oldRaw[key].splice(inx, 0, {})
        }
      })

      // if an element was deleted, compare it with nothing
      Object.keys(oldKeys).forEach((k, inx) => {
        if (!newKeys[k]) {
          newRaw[key].splice(inx, 0, null)
        }
      })
    }
  })
}

export const highlightAllChanges = (editors, oldYAML, newYAML, otherYAMLTabs, selectedTab) => {
  if (editors.length > 0) {
    highlightChanges(editors[0], oldYAML, newYAML, editors.length === 1)
    if (otherYAMLTabs.length > 0) {
      otherYAMLTabs.forEach(({ editor, oldTemplateYAML, templateYAML }) => {
        if (editor && oldTemplateYAML) {
          highlightChanges(editor, oldTemplateYAML, templateYAML, true)
        }
      })
    }

    // if currently opened tab has no change, open a tab with changes
    setTimeout(() => {
      let changedTab
      let changeTab = true
      let editorOnTab
      editors.forEach((editor, inx) => {
        editor.errorLine = get(editor, 'errorList[0].range.startLineNumber')
        if (editor.changed || editor.errorLine !== undefined) {
          if (changedTab === undefined) {
            changedTab = inx
            editorOnTab = editor
          }
          if (inx === selectedTab) {
            changeTab = false
            editorOnTab = editor
          } else if (!changeTab && editor.errorLine !== undefined) {
            changeTab = true
          }
        }
      })
      if (changeTab && changedTab !== undefined) {
        const tabContainer = document.querySelector('.creation-view-yaml-header-tabs')
        if (tabContainer) {
          const tabs = tabContainer.getElementsByClassName('tf--tabs__nav-link')
          if (tabs.length > 0) {
            tabs[changedTab].click()
          }
        }
      }
      if (editorOnTab) {
        const r = editorOnTab.getVisibleRanges()[0]
        const scrollTo = editorOnTab.errorLine || editorOnTab.changed || 1
        if (r && (scrollTo < r.startLineNumber || scrollTo > r.endLineNumber)) {
          setTimeout(() => {
            editorOnTab.setSelection(new editorOnTab.monaco.Selection(0, 0, 0, 0))
            editorOnTab.revealLineInCenter(scrollTo)
          })
        } else {
          setTimeout(() => {
            editorOnTab.setSelection(new editorOnTab.monaco.Selection(0, 0, 0, 0))
          })
        }
      }
    })
  }
}

export const highlightImmutables = (editors, immutableRows) => {
  if (editors.length > 0) {
    const editor = editors[0]
    const decorationList = []
    immutableRows.forEach((obj) => {
      decorationList.push({
        range: new editor.monaco.Range(obj.$r + 1, 0, obj.$r + 1, 132),
        options: {
          inlineClassName: 'protectedDecoration',
        },
      })
    })
    setTimeout(() => {
      editor.immutableList = decorationList
      editor.decorations = editor.deltaDecorations(editor.decorations, [
        ...(editor.errorList || []),
        ...(editor.changeList || []),
        ...editor.immutableList,
      ])
    }, 0)
  }
}
