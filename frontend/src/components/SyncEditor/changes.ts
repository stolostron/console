/* Copyright Contributors to the Open Cluster Management project */
import { diff } from 'deep-diff'
import { get, isEmpty, keyBy } from 'lodash'
import { getPathArray } from './process'
import { normalize } from './reconcile'

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
    let changes = userEdits

    // changes to yaml
    if (errors.length === 0 || !errors.every(({ isWarning }) => !isWarning)) {
        if (lastChange && lastComparison) {
            changes = getChanges(false, change, lastChange, comparison, lastComparison)

            // remove any form changes on top of user changes (for decoration purposes--reconcile prevents the yaml change)
            // remove any user changes which are now the same as the form
            if (!isEmpty(userEdits)) {
                const changeMap = keyBy(changes, (edit) => {
                    return JSON.stringify(edit.$p)
                })
                userEdits = userEdits.filter((edit) => {
                    const { $a, $f, $p } = edit
                    const val = get(change.mappings, $a)
                    // if there's no value at this path anymore, just filter out this user edit (may have deleted)
                    if (val) {
                        // use any form change on top of a user edit
                        const key = JSON.stringify($p)
                        const chng = changeMap[key]
                        if (chng) {
                            // however if the latest form change equals the user edit, just delete the user edit
                            if ($f === val.$v) {
                                return false
                            } else {
                                delete changeMap[key]
                            }
                        }
                        return true
                    }
                    return false
                })
                changes = Object.values(changeMap)
            }
        }
    }
    return { changes, userEdits }
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
    let changes = lastUserEdits

    // changes to yaml
    if (errors.length === 0 || !errors.every(({ isWarning }) => !isWarning)) {
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
                    const { $a, $f, $p, $h } = oldEdit
                    // a form change has canceled out this user edit
                    // (the form has changed the value to equal what the user edit )
                    const val = get(change.mappings, $a)
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
    if (!isEmpty(lastChange.parsed)) {
        const ignorePaths: any = []
        normalize(lastComparison, comparison)
        const diffs = diff(lastComparison, comparison)
        if (diffs) {
            diffs.forEach((diff: any) => {
                const { path, index, item, lhs, rhs } = diff
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
                                    if (obj.$l > 1 && rhs) {
                                        // convert edit to new if multiple lines were added
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

                        switch (kind) {
                            case 'E': {
                                // edited
                                if ((obj.$v || obj.$v === false) && rhs !== undefined) {
                                    const chng = { $t: 'E', $a: pathArr, $p: path }
                                    if (isCustomEdit) {
                                        chng.$f = lhs
                                    }
                                    changes.push(chng)
                                }
                                break
                            }
                            case 'N': // new
                                const chng = { $t: 'N', $a: pathArr, $p: path }
                                if (isCustomEdit) {
                                    chng.$f = 'new'
                                }
                                changes.push(chng)
                                break
                        }
                    }
                }
            })
        }
    }
    return changes
}
