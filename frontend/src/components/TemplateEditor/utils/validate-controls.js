'use strict'

import { ControlMode, parseYAML, reverseTemplate } from './source-utils'
import get from 'lodash/get'
import keyBy from 'lodash/keyBy'

///////////////////////////////////////////////////////////////////////////////
// validate control/source values
///////////////////////////////////////////////////////////////////////////////

export function validateControls(
  editors,
  templateYAML,
  otherYAMLTabs = [],
  activeTabId = '<<main>>',
  controlValidation,
  controlData,
  isFinalValidate,
  i18n
) {
  // parse all yamls
  const results = parseYAML(templateYAML)
  let { parsed, exceptions } = results
  const { resources } = results

  const templateObjectMap = { '<<main>>': parsed }
  const templateExceptionMap = {
    '<<main>>': {
      editor: editors[0],
      exceptions: attachEditorToExceptions(exceptions, editors, 0),
      controlValidation,
    },
  }
  otherYAMLTabs.forEach(({ id, templateYAML: yaml }, inx) => {
    ;({ parsed, exceptions } = parseYAML(yaml))
    templateObjectMap[id] = parsed
    templateExceptionMap[id] = {
      editor: editors[inx + 1],
      exceptions: attachEditorToExceptions(exceptions, editors, inx + 1),
    }
  })

  // update active values in controls
  if (exceptions.length === 0) {
    reverseTemplate(controlData, templateObjectMap[activeTabId] || parsed, activeTabId)
  }

  // if any syntax errors, report them and leave
  let hasSyntaxExceptions = false
  Object.values(templateExceptionMap).forEach(({ exceptions: _exceptions }) => {
    if (_exceptions.length > 0) {
      hasSyntaxExceptions = true
    }
  })

  // get values from parsed yamls using source paths and verify values are valid
  if (!hasSyntaxExceptions) {
    let stopValidating = false
    controlData.forEach((control) => {
      const { type, active = [], pauseControlCreationHereUntilSelected } = control
      delete control.exception
      if (!stopValidating) {
        switch (type) {
          case 'group':
            validateGroupControl(active, controlData, templateObjectMap, templateExceptionMap, isFinalValidate, i18n)
            break

          case 'table':
            control.exceptions = []
            validateTableControl(control, controlData, templateObjectMap, templateExceptionMap, isFinalValidate, i18n)
            break

          default:
            validateControl(control, controlData, templateObjectMap, templateExceptionMap, isFinalValidate, i18n)
            break
        }
      }
      if (pauseControlCreationHereUntilSelected) {
        stopValidating = !active
      }
    })
  }

  // update editors with any format exceptions
  let hasValidationExceptions = false
  Object.values(templateExceptionMap).forEach(({ editor, exceptions: _exceptions }, inx) => {
    setTimeout(() => {
      if (editor) {
        const decorationList = []
        _exceptions.forEach(({ row = 1, text }) => {
          decorationList.push({
            range: new editor.monaco.Range(row, 0, row, 132),
            options: {
              isWholeLine: true,
              glyphMarginClassName: 'errorDecoration',
              glyphMarginHoverMessage: { value: text },
              minimap: { color: 'red', position: 1 },
            },
          })
        })
        _exceptions.forEach(({ row = 1, column = 0 }) => {
          decorationList.push({
            range: new editor.monaco.Range(row, column - 6, row, column + 6),
            options: {
              className: 'squiggly-error',
            },
          })
        })
        editor.errorList = decorationList
        editor.decorations = editor.deltaDecorations(editor.decorations, [
          ...editor.errorList,
          ...(editor.changeList || []),
          ...(editor.immutableList || []),
        ])
      }
    }, 0)
    if (_exceptions.length > 0) {
      hasValidationExceptions = true
      attachEditorToExceptions(_exceptions, editors, inx)
    }
  })
  return {
    templateObjectMap,
    templateExceptionMap,
    parsedResources: resources,
    hasSyntaxExceptions,
    hasValidationExceptions,
  }
}

const validateGroupControl = (
  group,
  parentControlData,
  templateObjectMap,
  templateExceptionMap,
  isFinalValidate,
  i18n
) => {
  group.forEach((controlData) => {
    controlData.forEach((control) => {
      delete control.exception
      validateControl(control, parentControlData, templateObjectMap, templateExceptionMap, isFinalValidate, i18n)
    })
  })
}

const validateTableControl = (
  table,
  globalControlData,
  templateObjectMap,
  templateExceptionMap,
  isFinalValidate,
  i18n
) => {
  const {
    active: rows,
    controlData,
    //sourcePath: { tabId = '<<main>>', paths },
    validation: { tester },
    exceptions,
  } = table
  const controlDataMap = keyBy(controlData, 'id')
  let hidden = false
  if (Array.isArray(rows)) {
    rows.forEach((row) => {
      //const pathMap = paths[inx]
      Object.entries(row).forEach(([key, active]) => {
        if (controlDataMap[key] && (typeof active !== 'string' || !active.trim().startsWith('#'))) {
          const control = {
            ...controlDataMap[key],
            //sourcePath: { tabId, path: pathMap ? pathMap[key] : '' },
            active,
          }
          validateControl(control, controlData, templateObjectMap, templateExceptionMap, isFinalValidate, i18n)
          row[key] = control.active
          const promptOnly = control.mode === ControlMode.PROMPT_ONLY
          if (control.exception) {
            // add exception to cell in table
            let exception = exceptions.find(({ exception: _exception }) => _exception === control.exception)
            if (!exception) {
              exception = {
                exception: control.exception,
                cells: [],
              }
              exceptions.push(exception)
            }
            if (!promptOnly) {
              exception.cells.push(`${key}-${row.id}`)
            } else {
              hidden = true
            }
          }
        }
      })
    })
  }
  if (exceptions.length > 0) {
    table.exception = i18n(`creation.ocp.validation.errors${hidden ? '.hidden' : ''}`)
  } else if (typeof tester === 'function') {
    const exception = tester(rows, table, globalControlData)
    if (exception) {
      table.exception = i18n(exception)
    }
  }
}

const validateControl = (control, controlData, templateObjectMap, templateExceptionMap, isFinalValidate, i18n) => {
  // if final validation before creating template, if this value is required, throw error
  const { active, type, hidden, disabled, editing } = control
  if (hidden === true || hidden === 'true' || (typeof hidden === 'function' && hidden()) || (disabled && !editing)) {
    return
  }
  const { exceptions, controlValidation } = templateExceptionMap['<<main>>']
  if (controlValidation) {
    controlValidation(control)
  }
  if ((isFinalValidate || type === 'number') && control.validation) {
    if (type === 'custom') {
      control.validation(exceptions)
      return
    } else {
      const {
        name,
        validation: { required, notification },
      } = control
      if (
        required &&
        ((!active && active !== 0) || (type === 'cards' && (active.length === 0 || typeof active[0] !== 'string')))
      ) {
        const msg = notification ? notification : 'creation.missing.input'
        control.exception = i18n(msg, [name])
        reportException(control, exceptions)
        return
      }
    }
  }

  if (shouldValidateControl(control)) {
    switch (control.type) {
      case 'text':
      case 'textarea':
      case 'number':
      case 'combobox':
      case 'toggle':
      case 'hidden':
        validateTextControl(control, templateObjectMap, templateExceptionMap, isFinalValidate, i18n)
        break
      case 'checkbox':
      case 'radio':
        validateCheckboxControl(control, templateObjectMap, templateExceptionMap, i18n)
        break
      case 'cards':
        validateCardsControl(control, templateObjectMap, templateExceptionMap, i18n)
        break
      case 'singleselect':
        validateSingleSelectControl(control, templateObjectMap, templateExceptionMap, i18n)
        break
      case 'multiselect':
        validateMultiSelectControl(control, templateObjectMap, templateExceptionMap, i18n)
        break
      case 'table':
        validateTableControl(control, controlData, templateObjectMap, templateExceptionMap, i18n)
        break
    }
  }
}

const attachEditorToExceptions = (exceptions, editors, inx) => {
  return exceptions.map((exception) => {
    exception.editor = editors[inx]
    exception.tabInx = inx
    return exception
  })
}

const shouldValidateControl = (control) => {
  let required = false
  const { validation, active } = control
  if (validation) {
    ;({ required } = validation)
    if (!required) {
      // if not required, only validate if that yaml path exists
      return !!active
    }
  }
  return required
}

const validateTextControl = (control, templateObjectMap, templateExceptionMap, isFinalValidate, i18n) => {
  const {
    id,
    name,
    availableMap,
    sourcePathMap,
    validation: { contextTester, tester, notification },
    template,
    controlId,
    ref,
  } = control
  let active = control.active
  if (typeof active === 'number') {
    active = active.toString()
  }
  // ex: text input is in the form of a uri
  if (active && template) {
    const parts = template.split(`{{{${id}}}}`)
    active = active.replace(parts[0], '')
    if (parts.length > 1) {
      active = active.replace(new RegExp(parts[1] + '$'), '')
    }
  }
  control.active = active
  if (availableMap && typeof availableMap[active] === 'string') {
    active = availableMap[active]
  }
  if (active === undefined) {
    addExceptions(undefined, sourcePathMap, templateExceptionMap, templateObjectMap, controlId, ref, i18n)
  } else if (active || isFinalValidate) {
    let exception
    if (active) {
      if (contextTester) {
        exception = contextTester(active, templateObjectMap, i18n)
      } else if (tester && !tester.test(active)) {
        if (active.length > 50) {
          active = `${active.substr(0, 25)}...${active.substr(-25)}`
        }
        exception = i18n(notification, [active])
      }
    } else {
      exception = i18n('validation.missing.value', [name])
    }
    if (exception) {
      control.exception = exception
      addExceptions(exception, sourcePathMap, templateExceptionMap, templateObjectMap, controlId, ref, i18n)
    }
  }
  if (tester) {
    tester.lastIndex = 0
  }
}

const validateSingleSelectControl = (control, templateObjectMap, templateExceptionMap, i18n) => {
  const { active, available = [], controlId, sourcePathMap, ref } = control
  if (!active) {
    addExceptions(undefined, sourcePathMap, templateExceptionMap, templateObjectMap, controlId, ref, i18n)
  } else if (available.indexOf(active) === -1) {
    control.exception = i18n('validation.bad.value', [active, get(control, 'available').join(', ')])
    addExceptions(control.exception, sourcePathMap, templateExceptionMap, templateObjectMap, controlId, ref, i18n)
  }
}

const validateCardsControl = (control, templateObjectMap, templateExceptionMap, i18n) => {
  const {
    active,
    validation: { required, notification },
  } = control
  if (required && !active) {
    control.exception = i18n(notification)
  }
}

const validateCheckboxControl = (control, templateObjectMap, templateExceptionMap, i18n) => {
  const { active, available, controlId, sourcePathMap, ref } = control
  if (!active) {
    addExceptions(undefined, sourcePathMap, templateExceptionMap, templateObjectMap, controlId, ref, i18n)
  }
  if (Array.isArray(available) && available.length && available.indexOf(active) === -1) {
    control.exception = i18n('validation.bad.value', [getKey([]), available.join(', ')])
    addExceptions(control.exception, sourcePathMap, templateExceptionMap, templateObjectMap, controlId, ref, i18n)
  }
}

const validateMultiSelectControl = (control, templateObjectMap, templateExceptionMap, i18n) => {
  const { hasKeyLabels, hasReplacements } = control
  if (hasKeyLabels) {
    validateMultiSelectLabelControl(control, templateObjectMap, templateExceptionMap, i18n)
  } else if (hasReplacements) {
    validateMultiSelectReplacementControl(control, templateObjectMap, templateExceptionMap, i18n)
  } else {
    validateMultiSelectStringControl(control, templateObjectMap, templateExceptionMap, i18n)
  }
}

const validateMultiSelectStringControl = (control, templateObjectMap, templateExceptionMap, i18n) => {
  const { active, sourcePath } = control
  const { exceptions } = templateExceptionMap['<<main>>']
  if (active === null) {
    addException(sourcePath, exceptions, i18n)
  }
}

const validateMultiSelectLabelControl = (control, templateObjectMap, templateExceptionMap, i18n) => {
  const { active, sourcePath } = control
  const { exceptions } = templateExceptionMap['<<main>>']
  if (!active) {
    addException(sourcePath, exceptions, i18n)
  }
}

const validateMultiSelectReplacementControl = (control, templateObjectMap, templateExceptionMap, i18n) => {
  const { active, sourcePath } = control
  const { exceptions } = templateExceptionMap['<<main>>']
  if (!active) {
    addException(sourcePath, exceptions, i18n)
  }
}

const reportException = (control, exceptions) => {
  let row = 0
  const { sourcePath, controlId, exception, ref } = control
  if (sourcePath) {
    row = getRow(sourcePath)
  }
  exceptions.push({
    row,
    column: 0,
    text: exception,
    type: 'error',
    controlId,
    ref,
  })
}

const addExceptions = (message, sourcePathMap, templateExceptionMap, templateObjectMap, controlId, ref, i18n) => {
  if (sourcePathMap) {
    Object.entries(sourcePathMap).forEach(([k, v]) => {
      const { exceptions } = templateExceptionMap[k]
      const templateObject = templateObjectMap[k]
      if (typeof v === 'string' && v.endsWith('.$v')) {
        v = v.substring(0, v.length - 3)
      }
      const row = get(templateObject, v)
      if (row) {
        exceptions.push({
          row: row.$r + 1,
          column: 0,
          text: message || i18n('validation.missing.resource'),
          type: 'error',
          controlId,
          ref,
        })
      }
    })
  }
}

const addException = (sourcePath, exceptions, i18n) => {
  exceptions.push({
    row: getRow(sourcePath),
    column: 0,
    text: i18n('validation.missing.resource'),
    type: 'error',
  })
}

const getKey = (path) => {
  return path.join('.').replace('.$synced', '').replace('[0]', '').replace(/\.\$v/g, '')
}

const getRow = (sourcePath) => {
  return get(sourcePath, '$r', 0) + 1
}
