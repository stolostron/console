/* Copyright Contributors to the Open Cluster Management project */
import YAML from 'yaml'
import { diff } from 'deep-diff'
import { get, isEmpty, keyBy, isEqual } from 'lodash'
import { getPathArray } from './synchronize'
import { normalize } from './reconcile'
import { MappingType } from './process'
import { ErrorType } from './validation'

export interface ChangeType {
  $t: string // type of change (N, E)
  $u?: any // the value the user has changed it to
  $y?: boolean // an element was added to the array at $p
  $f?: any // the previous value in the form when the user has edited
  $a: string | string[] // the path to the value in a mapped object
  $p: string | string[] // the path to the value in a parsed object
}

export interface FormattedChangeType {
  type: string
  line: number
  path: string | string[]
  previous?: string
  latest?: string | string[]
  length: number
  reveal?: () => void
}

export const getFormChanges = (
  errors: any[],
  change: {
    parsed: { [name: string]: any[] }
    mappings: { [name: string]: any[] }
  },
  userEdits: any[],
  comparison: { [name: string]: any[] },
  lastChange?: {
    parsed: { [name: string]: any[] }
    mappings: { [name: string]: any[] }
  },
  lastComparison?: { [name: string]: any[] }
) => {
  let yamlChanges = []
  let remainingEdits = []

  // changes to yaml
  if (errors.length === 0 || !errors.every(({ errorType }) => errorType !== ErrorType.error)) {
    if (lastChange && lastComparison) {
      yamlChanges = getChanges(false, change, lastChange, comparison, lastComparison)

      // remove any form changes on top of user changes (for decoration purposes--reconcile prevents the yaml change)
      // remove any user changes which are now the same as the form
      if (!isEmpty(userEdits)) {
        // changes made by form
        const changeMap = keyBy(yamlChanges, (edit) => {
          return JSON.stringify(edit.$y ? edit.$p.slice(0, -1) : edit.$p)
        })

        // changes made by user
        remainingEdits = userEdits.filter((edit: ChangeType) => {
          const { $u, $y, $p } = edit
          const val = get(change.parsed, $p) as MappingType
          // if there's no value at this path anymore, just filter out this user edit (may have deleted)
          if (val !== undefined) {
            // use any form change on top of a user edit
            const key = JSON.stringify($p)
            const chng = changeMap[key]
            if (chng) {
              // user edit and form change conflict at this path, so delete form change
              delete changeMap[key]
              // if change equals the user edit, also delete the user edit
              if ((Array.isArray(val) && $y ? val.includes($u) : isEqual($u, val)) || (!$u && !val)) {
                return false
              }
            }
            return true
          }
          return false
        })
        yamlChanges = Object.values(changeMap)
      }
    }
  }
  return { yamlChanges, remainingEdits }
}

export const getUserChanges = (
  errors: any[],
  change: {
    parsed: { [name: string]: any[] }
    mappings: { [name: string]: any[] }
  },
  lastUserEdits: any[],
  comparison: { [name: string]: any[] },
  lastChange?: {
    parsed: { [name: string]: any[] }
    mappings: { [name: string]: any[] }
  },
  lastComparison?: { [name: string]: any[] }
) => {
  let changes = [] //lastUserEdits

  // changes to yaml
  if (errors.length === 0 || !errors.every(({ errorType }) => errorType !== ErrorType.error)) {
    if (lastChange && lastComparison) {
      // comparison is always made between current user changes and last yaml created by form
      changes = getChanges(true, change, lastChange, comparison, lastComparison)

      // merge these newest user edits with older user edits
      // lastUserEdits wil only exist if user typed in editor, then form created a change, and now user is again typing in editor
      // newest changes just reflect changes between what user types and what's currently in yaml
      // but after a form change, any previous user edits are now reconciled into the yaml
      // so so they won't show up in the newest changes---the only place we remember old edits are in lastUserEdits
      if (!isEmpty(lastUserEdits)) {
        // create a map of newest user changes
        const changeMap = keyBy(changes, (edit) => {
          return JSON.stringify(edit.$p)
        })
        // for each older user edit...
        lastUserEdits.forEach((oldEdit) => {
          const { $a, $f, $p } = oldEdit
          // a form change has canceled out this user edit
          // (the form has changed the value to equal what the user edit )
          const val = get(change.mappings, $a) as unknown as MappingType
          // if there's no value at this path anymore, ignore this old edit
          // ---the form has probably deleted where the edit was from the yaml
          if (val) {
            const key = JSON.stringify($p)
            const chng = changeMap[key]
            if (chng) {
              // user is editing the same path as an old edit
              // if the change they make is the same value as that old edit
              // this change and the old edit are unnecessary
              if (val.$v === $f) {
                delete changeMap[key]
              } else {
                // else if user is editing the same spot, the newest change's $f won't be the right value
                // because it's comparing against the latest yaml which has incorporated the previous user edits
                // the only place that remembers the original $f value is the old edit
                chng.$f = $f
              }
            } else {
              // else user isn't typing the same spot as this old edit
              // and the newest changes don't know about the old edit
              // so add it to newest changes
              // however if the form made a change that now equals this old edit value
              // ignore it
              if (val.$v !== $f) {
                changeMap[key] = oldEdit
              }
            }
          }
        })
        // changeMap now has newest changes, tweaked new changes, and old edits
        changes = Object.values(changeMap)
      }
    }
  }
  return changes
}

const getChanges = (
  isCustomEdit: boolean,
  change: {
    parsed: { [name: string]: any[] }
    mappings: { [name: string]: any[] }
  },
  lastChange: {
    parsed: { [name: string]: any[] }
    mappings: { [name: string]: any[] }
  },
  comparison: { [name: string]: any[] },
  lastComparison: { [name: string]: any[] }
) => {
  const changes: any[] = []
  const ignorePaths: any = []
  normalize(lastComparison, comparison)
  const diffs = diff(lastComparison, comparison)
  if (diffs) {
    diffs.forEach((diff: any) => {
      const { path, item, lhs, rhs } = diff
      let { kind } = diff
      if (path && path.length) {
        let pathArr = getPathArray(path)
        const synced = (kind === 'D' || kind === 'E') && lhs && !rhs ? lastChange.mappings : change.mappings
        let obj: any = get(synced, pathArr)
        if (obj) {
          if (obj.$v || obj.$v === false) {
            // convert A's and E's into 'N's
            switch (kind) {
              case 'E': {
                if (obj.$l > 1 && !lhs && rhs) {
                  // convert edit to new if multiple lines were added
                  kind = 'N'
                  obj = { $r: obj.$r + 1, $l: obj.$l - 1 }
                }
                break
              }
              case 'A': {
                switch (item.kind) {
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
            pathArr = getPathArray(path)
            obj = get(change.mappings, pathArr)
          }

          // if array delete, ignore any other edits within array
          // edits are just the comparison of other array items
          if (ignorePaths.length > 0) {
            const tp = path.join('/')
            if (
              ignorePaths.some((p: any) => {
                return tp.startsWith(p)
              })
            ) {
              // ignore any edits within an array that had an item deleted
              kind = 'D'
            }
          }

          let chng: ChangeType
          switch (kind) {
            case 'A': {
              if (item.kind === 'N') {
                chng = { $t: 'N', $a: pathArr, $p: path, $y: true }
                if (isCustomEdit) {
                  chng.$u = item.rhs
                  chng.$f = 'new'
                } else {
                  if (Array.isArray(obj.$v)) {
                    obj.$v.some((itm: { $v: any; rhs: any; $k: any }) => {
                      if ((!itm.$v && item.rhs === '') || itm.$v === item.rhs) {
                        chng.$a = [...pathArr, '$v', itm.$k]
                        chng.$p = [...path, itm.$k]
                        return true
                      }
                      return false
                    })
                  }
                }
                changes.push(chng)
              }
              break
            }
            case 'E': {
              // edited
              if ((obj.$v || obj.$v === false) && rhs !== undefined) {
                chng = { $t: 'E', $a: pathArr, $p: path }
                if (isCustomEdit) {
                  chng.$u = rhs // what user changed it to
                  chng.$f = lhs // what form had it as
                }
                changes.push(chng)
              }
              break
            }
            case 'N': // new
              chng = { $t: 'N', $a: pathArr, $p: path }
              if (isCustomEdit) {
                chng.$u = rhs || obj.$v // what user changed it to
                chng.$f = 'new'
              }
              changes.push(chng)
              break
          }
        }
      }
    })
  }
  return changes
}

export const formatChanges = (
  editor: { revealLineInCenter: (arg0: any) => void; setSelection: (arg0: any) => void },
  monaco: { Selection: new (arg0: any, arg1: number, arg2: any, arg3: number) => any },
  changes: any[],
  changeWithoutSecrets: { mappings: any; parsed: any; resources?: any[] },
  syncs: unknown
) => {
  const syncPathSet = new Set()
  if (Array.isArray(syncs)) {
    syncs.forEach(({ path }) => {
      syncPathSet.add(getPathArray(path).join('/'))
    })
  }
  changes = changes
    .filter((change: ChangeType) => {
      // don't include change if it's already being sent to form
      // or if the value is undefined
      return (
        !syncPathSet.has((change.$a as string[]).join('/')) && get(changeWithoutSecrets.parsed, change.$p) !== undefined
      )
    })
    .map((change: ChangeType) => {
      const obj = get(changeWithoutSecrets.parsed, change.$p)
      const objVs = get(changeWithoutSecrets.mappings, change.$a)
      const formatted: FormattedChangeType = {
        type: change.$t,
        line: objVs?.$r ?? 1,
        path: change.$p,
        length: objVs.$l,
      }
      switch (change.$t) {
        case 'N':
          formatted.latest = YAML.stringify({ [objVs.$k]: obj }, { indent: 4 })
            .trim()
            .split('\n')
          break
        case 'E':
          formatted.latest = objVs?.$v ?? ''
          formatted.previous = objVs.$s ? formatted.latest : change.$f
          break
      }
      return formatted
    })
    .sort((a: { line: number }, b: { line: number }) => {
      return a.line - b.line
    })
  changes = consolidate(changes)
  changes.forEach((change) => {
    change.reveal = () => {
      editor.revealLineInCenter(change.line)
      editor.setSelection(new monaco.Selection(change.line, 1, change.line + change.length, 1))
    }
  })
  return changes
}

const consolidate = (changes: FormattedChangeType[]) => {
  let lastChange: FormattedChangeType
  return changes.filter((change: FormattedChangeType) => {
    if (lastChange) {
      const { type, line, length } = lastChange
      if (type === 'N') {
        switch (change.type) {
          case 'N':
            // if last change was new and this change is new
            // and last ends where this change begins
            // consolidate this change into the last change
            if (change.latest && lastChange.latest) {
              if (line + length === change.line) {
                if (!Array.isArray(change.latest)) {
                  change.latest = [change.latest]
                }
                if (!Array.isArray(lastChange.latest)) {
                  lastChange.latest = [lastChange.latest]
                }
                lastChange.latest = [...lastChange.latest, ...change.latest]
                lastChange.length += change.length
                return false
              }
            }
            lastChange = change
            break
          case 'E':
            // if last change was new and this change is edit
            // and edit change falls with new
            // just ignore this change
            if (change.line < line + length) {
              return false
            }
            break
        }
      } else {
        lastChange = change
      }
    } else {
      lastChange = change
    }
    return true
  })
}
