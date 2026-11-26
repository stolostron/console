/* Copyright Contributors to the Open Cluster Management project */
'use strict'

/**
 * Returns true when a control is considered hidden.
 * Mirrors ControlPanel.isHidden — supports boolean, string 'true', and
 * functional hidden(control, controlData) forms.
 */
export const isControlHidden = (control, controlData) => {
  const { hidden } = control
  return hidden === true || hidden === 'true' || (typeof hidden === 'function' && hidden(control, controlData))
}

/**
 * True when a required, visible control has no usable value.
 * Hidden and disabled controls are never considered missing.
 */
export const isRequiredValueMissing = (control, controlData) => {
  if (!control || isControlHidden(control, controlData) || control.disabled) {
    return false
  }
  const required = control.validation?.required
  if (!required) {
    return false
  }
  const { active, type } = control
  if (type === 'cards') {
    return !active || active.length === 0 || typeof active[0] !== 'string'
  }
  if (type === 'multiselect' || type === 'labels') {
    return !Array.isArray(active) || active.length === 0
  }
  return active === undefined || active === null || active === ''
}

/**
 * True when this step still has required fields to fill (or validation exceptions).
 */
export const hasIncompleteRequiredControls = (controls = [], controlData = controls) => {
  return controls.some((control) => {
    // Disabled/hidden controls (and their children) must not block wizard navigation.
    if (isControlHidden(control, controlData) || control.disabled) {
      return false
    }
    if (control.type === 'group') {
      const groups = control.active || []
      return groups.some((groupControls) =>
        (groupControls || []).some((groupControl) => {
          if (isControlHidden(groupControl, controlData) || groupControl.disabled) {
            return false
          }
          return isRequiredValueMissing(groupControl, controlData) || !!groupControl.exception
        })
      )
    }
    return isRequiredValueMissing(control, controlData) || !!control.exception
  })
}

/**
 * True when any reviewed control (outside review-type steps) has an exception.
 * Mirrors ControlPanelFinish.hasReviewExceptions including omitFromReview,
 * disabled, group.active[].exception and summary(control,i18n).exception.
 */
export const hasReviewExceptions = (details = [], i18n) => {
  return details.some(({ title, sections = [] }) => {
    if (title?.type === 'review') {
      return false
    }
    return sections.some(({ content = [] }) =>
      content.some((control) => {
        if (control.omitFromReview || control.disabled) {
          return false
        }
        if (control.exception) {
          return true
        }
        if (control.type === 'group') {
          return (control.active || []).some((groupControls) =>
            (groupControls || []).some((groupControl) => {
              if (groupControl.omitFromReview || groupControl.disabled) {
                return false
              }
              if (groupControl.exception) {
                return true
              }
              if (typeof groupControl.summary === 'function') {
                const rows = groupControl.summary(groupControl, i18n) || []
                return rows.some((row) => !!row.exception)
              }
              return false
            })
          )
        }
        if (typeof control.summary === 'function') {
          const rows = control.summary(control, i18n) || []
          return rows.some((row) => !!row.exception)
        }
        return false
      })
    )
  })
}

/** Internal helper: flatten all controls from wizard steps. */
const flattenStepControls = (steps = []) => steps.flatMap(({ controls = [] }) => controls)

/**
 * Highest step index the user may navigate to (inclusive).
 *
 * Default (validateRequiredFields falsy): legacy behavior — only mustValidate
 * incomplete steps and unfinished review steps cap navigation.
 * Opt-in (validateRequiredFields true): also stop on empty required fields.
 */
export const getMaxEnabledStepIndex = (steps = [], { validateRequiredFields = false } = {}) => {
  const controlData = flattenStepControls(steps)
  for (let index = 0; index < steps.length; index++) {
    const { title: control = {}, controls = [] } = steps[index]
    const { isComplete, type = 'step' } = control
    if (type === 'step') {
      const mustValidateIncomplete = controls.some(({ mustValidate }) => mustValidate && !isComplete)
      const requiredIncomplete =
        validateRequiredFields && hasIncompleteRequiredControls(controls, controlData)
      if (mustValidateIncomplete || requiredIncomplete) {
        return index
      }
    } else if (type === 'review' && !isComplete) {
      return index
    }
  }
  return steps.length + 1
}
