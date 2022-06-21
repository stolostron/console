'use strict'

import jsYaml from 'js-yaml'
import YamlParser from './YamlParser'
import { initializeControlData } from './initialize-control-data'
import { initializeControlFunctions } from './initialize-control-functions'
import { generateSourceFromStack } from './refresh-source-from-stack'
import { generateSourceFromTemplate } from './refresh-source-from-templates'

import cloneDeep from 'lodash/cloneDeep'
import capitalize from 'lodash/capitalize'
import isEmpty from 'lodash/isEmpty'
import get from 'lodash/get'
import set from 'lodash/set'

export const ControlMode = Object.freeze({
  TABLE_ONLY: 'TABLE_ONLY',
  PROMPT_ONLY: 'PROMPT_ONLY',
})

export const initializeControls = (initialControlData, editor, onControlInitialize, i18n, uniqueGroupID, inGroup) => {
  const controlData = initializeControlData(initialControlData, onControlInitialize, i18n, uniqueGroupID, inGroup)
  initializeControlFunctions(controlData, editor)
  return controlData
}

// from an edit resource, discover # of groups, card selections
export function discoverControls(controlData, templateObject, editor, i18n) {
  templateObject = cloneDeep(templateObject)
  const discoverControl = (control) => {
    const { discover } = control
    if (discover) {
      discover(control, controlData, templateObject, editor, i18n)
    }
  }
  controlData.forEach((control) => {
    discoverControl(control)
  })
}

//reverse control active valuess from template
export function reverseTemplate(controlData, templateObject, activeTabId) {
  templateObject = cloneDeep(templateObject)
  const reverseControl = (control) => {
    const { type, active = [], reverse, shift } = control
    if (type === 'group') {
      active.forEach((group) => {
        group.forEach((gcontrol) => {
          reverseControl(gcontrol)
        })
        if (typeof shift === 'function') {
          shift(templateObject)
        }
      })
    } else if (typeof reverse === 'function') {
      reverse(control, templateObject, activeTabId)
    }
  }
  controlData.forEach((control) => {
    reverseControl(control)
  })
}

// find immutable paths
export function getImmutables(controlData, immutables) {
  immutables = immutables || []
  const findImmutables = (control, immutables) => {
    const { type, active = [], immutable } = control
    if (type === 'group') {
      active.forEach((group) => {
        group.forEach((gcontrol) => {
          findImmutables(gcontrol, immutables)
        })
      })
    } else if (immutable) {
      immutables.push(immutable)
    }
  }
  controlData.forEach((control) => {
    findImmutables(control, immutables)
  })
  return immutables
}

// set immutable values
export function setImmutableValues(immutables, resources) {
  if (immutables.length) {
    // create an array map
    const parsed = {}
    resources.forEach((resource) => {
      if (!isEmpty(resource)) {
        const key = get(resource, 'kind', 'unknown')
        let values = parsed[key]
        if (!values) {
          values = parsed[key] = []
        }
        values.push(resource)
      }
    })

    // set the values
    immutables.forEach(({ value, path }) => {
      set(parsed, path, value)
    })
  }
}

// get readonly lines in yaml
export function getImmutableRows(immutables, templateObjects) {
  const immutableRows = []
  immutables.forEach(({ path: _path }) => {
    const path = getSourcePath(_path)
    const row = get(templateObjects, path)
    if (row) {
      immutableRows.push(row)
    }
  })
  return immutableRows
}

// reverse control active valuess from template
export function setEditingMode(controlData) {
  const setEditMode = (control) => {
    const { type, active, hidden: isHidden, editing } = control
    if (type === 'group') {
      active.forEach((group) => {
        group.forEach((gcontrol) => {
          setEditMode(gcontrol)
        })
      })
    } else if (editing) {
      const { hidden, disabled, collapsed, editMode } = editing
      // if editing existing app, hide this field initially
      if (hidden) {
        if (isHidden) {
          control.hidden = true
        } else {
          control.type = 'hidden'
        }
      }
      // if editing existing app, disable this field
      if (disabled) {
        control.disabled = true
        control.immutable = { value: control.active, path: control.path }
      }
      // if editing existing app, disable this field
      if (collapsed) {
        control.collapsed = true
      }
      // if editing existing app, set editMode
      if (editMode) {
        control.editMode = true
      }
    }
  }
  controlData.forEach((control) => {
    setEditMode(control)
  })
}

export const generateSource = (template, editStack, controlData, otherYAMLTabs) => {
  if (!isEmpty(editStack)) {
    return generateSourceFromStack(template, editStack, controlData, otherYAMLTabs)
  } else {
    return generateSourceFromTemplate(template, controlData, otherYAMLTabs)
  }
}

export const parseYAML = (yaml) => {
  let absLine = 0
  const parsed = {}
  const resources = []
  const exceptions = []
  const yamls = yaml.split(/^---$/gm)
  // check for syntax errors
  try {
    yamls.forEach((snip) => {
      if (snip) {
        const obj = jsYaml.load(snip)
        const key = get(obj, 'kind', 'unknown')
        let values = parsed[key]
        if (!values) {
          values = parsed[key] = []
        }
        const post = new RegExp(/[\r\n]+$/).test(snip)
        snip = snip.trim()
        const $synced = new YamlParser().parse(snip, absLine)
        if ($synced) {
          $synced.$r = absLine
          $synced.$l = snip.split(/[\r\n]+/g).length
          values.push({ $raw: obj, $yml: snip, $synced })
          resources.push(obj)
          absLine += $synced.$l
          if (post) {
            absLine++
          }
        }
      } else {
        absLine++
      }
    })
  } catch (e) {
    const { mark = {}, reason, message } = e
    const { line = 0, column = 0 } = mark
    exceptions.push({
      row: line + absLine,
      column,
      text: capitalize(reason || message),
      type: 'error',
    })
  }
  return { parsed, resources, exceptions }
}

export const getInsideObject = (ikey, parsed) => {
  const ret = {}
  Object.keys(parsed).forEach((key) => {
    ret[key] = []
    get(parsed, `${key}`, []).forEach((obj) => {
      ret[key].push(get(obj, `${ikey}`))
    })
  })
  return ret
}

//don't save user data until they create
export const cacheUserData = (controlData) => {
  controlData.forEach((control) => {
    if (control.cacheUserValueKey && control.userData && control.userData.length > 0) {
      const storageKey = `${control.cacheUserValueKey}--${window.location.href}`
      sessionStorage.setItem(storageKey, JSON.stringify(control.userData))
    }
  })
}

export const getResourceID = (resource) => {
  return (
    get(resource, 'metadata.selfLink') ||
    (
      `/namespaces/${get(resource, 'metadata.namespace', 'none') || ''}/` +
      `${resource.kind}s/${get(resource, 'metadata.name') || ''}`
    ).toLowerCase()
  )
}

export const getUniqueName = (name, nameSet) => {
  if (nameSet.has(name)) {
    let count = 1
    const baseName = name.replace(/-*\d+$/, '')
    do {
      name = `${baseName}-${count}`
      count++
    } while (nameSet.has(name))
  }
  return name
}

// convert this: PlacementRule[0].spec.clusterConditions[0].type
// to this:      PlacementRule[0].$synced.spec.$v.clusterConditions.$v[0].$v.type.$v
export const getSourcePath = (path) => {
  let sourcePath = path.split(/\.(?=(?:[^"]*"[^"]*")*[^"]*$)/)
  const pathBase = sourcePath.shift() + '.$synced'
  sourcePath = sourcePath.map((seg) => {
    return seg.replace('[', '.$v[')
  })
  sourcePath = sourcePath.length > 0 ? pathBase + `.${sourcePath.join('.$v.')}` : pathBase
  return sourcePath
}

export const escapeYAML = (object) => {
  if (object) {
    if (typeof object === 'string') {
      object = object.replace(/'/g, '')
    } else if (Array.isArray(object)) {
      for (let i = 0; i < object.length; i++) {
        const o = object[i]
        object[i] = o !== undefined ? escapeYAML(o) : o
      }
    } else if (!!object && typeof object === 'object') {
      Object.entries(object).forEach(([k, oo]) => {
        object[k] = oo !== undefined ? escapeYAML(oo) : oo
      })
    }
  }
  return object
}

export const removeVs = (object) => {
  if (object) {
    let o
    object = object.$v !== undefined ? object.$v : object
    if (Array.isArray(object)) {
      for (let i = 0; i < object.length; i++) {
        o = object[i]
        object[i] = o.$v !== undefined ? removeVs(o) : o
      }
    } else if (!!object && typeof object === 'object') {
      Object.entries(object).forEach(([k, oo]) => {
        object[k] = oo.$v !== undefined ? removeVs(oo) : oo
      })
    }
  }
  return object
}

export const getValue = (templateObject, path, def) => {
  return removeVs(get(templateObject, getSourcePath(path), def))
}
