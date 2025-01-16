/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import { cloneDeep } from 'lodash'
import get from 'lodash/get'

///////////////////////////////////////////////////////////////////////////////
// intialize controls and groups
///////////////////////////////////////////////////////////////////////////////
export const initializeControlData = (initialControlData, onControlInitialize, i18n, uniqueGroupID, inGroup) => {
  const parentControlData = initialControlData.map((control) => {
    const { type, controlData, groupCnt = 1 } = control
    switch (type) {
      case 'group': {
        let active = control.active
        if (!active) {
          active = control.active = []
        }
        if (!control.nextUniqueGroupID) {
          control.nextUniqueGroupID = 1
        }
        while (active.length < groupCnt) {
          active.push(initializeControlData(controlData, onControlInitialize, i18n, control.nextUniqueGroupID, true))
          control.nextUniqueGroupID++
        }
        return control
      }
      default:
        return initialControl(control, onControlInitialize)
    }
  })

  // if any card controls, set this as parent control data
  if (inGroup) {
    parentControlData.forEach((c) => {
      if (c.type === 'cards') {
        c.uniqueGroupID = uniqueGroupID
        c.groupControlData = parentControlData
      }
    })
    parentControlData.unshift({
      id: 'uniqueGroupID',
      type: 'hidden',
      active: uniqueGroupID,
    })
  }
  return parentControlData
}

///////////////////////////////////////////////////////////////////////////////
// initialze each control
///////////////////////////////////////////////////////////////////////////////
const initialControl = (control, onControlInitialize) => {
  const { type, isInitialized } = control
  if (!isInitialized) {
    control = cloneDeep(control)

    // initialize control's active value
    initializeControlActive(type, control)

    // initialize user data if control's available choices were cached
    initializeControlUserData(control)

    // initialize inner tables and cards
    initializeInnerControls(control)

    // intialize choices available for a control
    initializeAvailableChoices(type, control)

    // initialize validation methods
    initializeValidation(control)

    control.isInitialized = true
  }
  // user init
  if (onControlInitialize) {
    onControlInitialize(control)
  }
  return control
}

const initializeControlActive = (type, control) => {
  switch (type) {
    case 'number':
      control.active = control.initial
      break

    default:
      break
  }
}

const initializeControlUserData = (control) => {
  //if user data was cached, apply now
  //save custom user input for session??
  if (control.cacheUserValueKey) {
    const storageKey = `${control.cacheUserValueKey}--${window.location.href}`
    const sessionObject = JSON.parse(sessionStorage.getItem(storageKey))
    if (sessionObject) {
      control.userData = sessionObject
    }
  }
}

const initializeInnerControls = (control) => {
  const { type, available } = control

  // if cards convert the data in that
  if (type === 'cards' && available) {
    available.forEach(({ change = {} }) => {
      if (change.insertControlData) {
        change.insertControlData.forEach((ctrl) => {
          if (!ctrl.isInitialized) {
            initializeControlActive(ctrl.type, ctrl)
            initializeInnerControls(ctrl)
            initializeValidation(ctrl)
            ctrl.isInitialized = true
          }
        })
      }
    })
  }
}

const initializeAvailableChoices = (type, control) => {
  const { multiselect } = control
  //if available choices are objects, convert to keys
  //required for label lists, multiselect, cards
  let sortAvailableChoices = true
  let sortLabelsByName = false
  let availableMap = {}

  if (type !== 'table' && type !== 'treeselect' && typeof get(control, 'available[0]') === 'object') {
    const { sort = true } = control
    availableMap = control.availableMap = {}
    sortAvailableChoices = sort
    control.available = control.available.map((choice) => {
      let availableKey
      const { id, key, value, name, description, replacements, change = {} } = choice
      // label choices
      if (key && value) {
        availableKey = `${key}: "${value}"`
        sortLabelsByName = control.hasKeyLabels = true
      } else if (value && description) {
        availableKey = `${value} - ${description}`
        sortLabelsByName = control.hasValueDescription = true
        choice = choice.value
      } else if (name && description) {
        // multiselect choices
        availableKey = `${name} - ${description}`
        control.hasReplacements = true
      } else if (id) {
        // card choices
        availableKey = id
        const replaces = replacements || change.replacements
        control.hasReplacements = control.hasReplacements || !!replaces
        if (control.hasReplacements) {
          choice.replacements = replaces
        }
        control.newEditorMode = type === 'cards' && !multiselect
      }
      control.availableMap[availableKey] = choice
      return availableKey
    })
    if (sortAvailableChoices) {
      control.available = control.available.sort((a, b) => {
        switch (type) {
          case 'cards':
            a = availableMap[a].title || a
            b = availableMap[b].title || b
            break
        }
        if (sortLabelsByName) {
          const aw = a.startsWith('name')
          const bw = b.startsWith('name')
          if (aw && !bw) {
            return 1
          } else if (!aw && bw) {
            return -1
          }
        }
        return a.localeCompare(b)
      })
    }
  }
}

const initializeValidation = (control) => {
  //connect controls to source for updates/validation
  const { validation, multiline } = control
  if (validation) {
    let { constraint } = validation
    if (constraint) {
      if (multiline) {
        validation.tester = new RegExp(constraint)
      } else {
        if (!constraint.startsWith('^')) {
          constraint = '^' + constraint
        }
        if (!constraint.endsWith('$')) {
          constraint = constraint + '$'
        }
        validation.tester = new RegExp(constraint)
      }
    } else if (validation.json) {
      validation.tester = {
        test: function (value) {
          try {
            JSON.parse(value)
            return true
          } catch {
            return false
          }
        },
      }
    }
  }
}
