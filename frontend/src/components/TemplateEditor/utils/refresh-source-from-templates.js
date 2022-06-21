'use strict'

import { parseYAML, escapeYAML, getImmutables, getImmutableRows } from './source-utils'
import { setSourcePaths } from './initialize-control-functions'
import { caseFn, defaultFn, if_eqFn, if_existsFn, if_gtFn, if_neFn, if_orFn, switchFn } from '../helpers'
import get from 'lodash/get'
import capitalize from 'lodash/capitalize'

const helpers = {
  helpers: {
    case: caseFn,
    default: defaultFn,
    if_eq: if_eqFn,
    if_exists: if_existsFn,
    if_gt: if_gtFn,
    if_ne: if_neFn,
    if_or: if_orFn,
    switch: switchFn,
  },
}

export const generateSourceFromTemplate = (template, controlData, otherYAMLTabs) => {
  /////////////////////////////////////////////////////////
  // generate a map of id:values that can be passed to the handlerbars template
  /////////////////////////////////////////////////////////
  const replacements = []
  const controlMap = {}
  const templateData = generateTemplateData(controlData, replacements, controlMap)
  escapeYAML(templateData)

  /////////////////////////////////////////////////////////
  // add replacements to templateData
  /////////////////////////////////////////////////////////
  // replacements are snippets of code instead of single values
  // ex: when you select a card, it inserts a snippet of code into
  //     the template instead of a text value
  const { snippetMap, encodeInfo } = addCodeSnippetsTemplateData(templateData, replacements, controlMap)

  /////////////////////////////////////////////////////////
  // if there are multiple tabs, update the yaml that belongs on each
  /////////////////////////////////////////////////////////
  // if tab(s) were created to show encoded YAML, update that tab's info
  if (otherYAMLTabs) {
    if (encodeInfo.length > 0) {
      encodeInfo.forEach(({ id, control, templateYAML, encode, newTab, snippetKey }) => {
        templateYAML = replaceSnippetMap(templateYAML, snippetMap)
        if (encode) {
          snippetMap[snippetKey] = Buffer.from(templateYAML.replace(/\s*##.+$/gm, ''), 'ascii').toString('base64')
        }
        if (newTab) {
          const existingInx = otherYAMLTabs.findIndex(({ id: existingId }) => existingId === id)
          if (existingInx !== -1) {
            const existingTab = otherYAMLTabs[existingInx]
            existingTab.oldTemplateYAML = existingTab.templateYAML
            existingTab.templateYAML = templateYAML
          } else {
            otherYAMLTabs.push({
              id,
              control,
              templateYAML,
            })
          }
        }
      })
    } else {
      otherYAMLTabs.length = 0
    }
  }

  /////////////////////////////////////////////////////////
  // generate the yaml!!
  // make sure the code snippets align with the yaml around it
  /////////////////////////////////////////////////////////
  let yaml = template(templateData, helpers) || ''
  yaml = replaceSnippetMap(yaml, snippetMap)

  // need to connect changes in source with the active value in the control
  // 1. by adding a reverse path to the control definition --or--
  // 2. by adding a ## controlId to the end of the template line with the value
  yaml = setSourcePaths(yaml, otherYAMLTabs, controlData)

  // if show secrets is off, create the templateObject with secrets
  const parsed = parseYAML(yaml)
  let templateObject = parsed.parsed
  if (yaml) {
    templateData.showSecrets = true
    let yamlWithSecrets = template(templateData, helpers) || ''
    yamlWithSecrets = replaceSnippetMap(yamlWithSecrets, snippetMap)
    templateObject = parseYAML(yamlWithSecrets).parsed
  }

  // what lines should be readonly in editor
  const immutables = getImmutables(controlData)
  const immutableRows = getImmutableRows(immutables, templateObject)

  return {
    templateYAML: yaml,
    templateObject,
    templateResources: parsed.resources,
    immutableRows,
  }
}

export const generateTemplateData = (controlData, replacements, controlMap) => {
  //convert controlData active into templateData
  //do replacements second in case it depends on previous templateData
  let templateData = {}
  const getTemplateData = (control) => {
    const {
      getActive,
      userMap,
      id,
      type,
      multiselect,
      singleline,
      multiline,
      hasKeyLabels,
      hasValueDescription,
      hasReplacements,
      encode,
      template: _template,
    } = control
    let { availableMap } = control
    availableMap = { ...userMap, ...availableMap }
    controlMap[id] = control
    let ret = undefined

    // if there's a get active function that gets active from other control data, get active value
    let { active } = control
    if (typeof getActive === 'function') {
      active = getActive(control, controlData)
    }

    if (active !== undefined) {
      if (hasKeyLabels) {
        const map = {}
        active.forEach((pair) => {
          const { key, value } = availableMap[pair]
          let arr = map[key]
          if (!arr) {
            arr = map[key] = []
          }
          arr.push(value)
        })
        ret = map
      } else if (hasValueDescription) {
        ret = availableMap[active] || active
      } else if (type === 'group') {
        ret = active.map((group) => {
          const map = {}
          group.forEach((gcontrol) => {
            const gvalue = getTemplateData(gcontrol)
            if (gvalue) {
              map[gcontrol.id] = gvalue
            }
            if (gcontrol.hasReplacements) {
              gcontrol.groupTemplateData = map
            }
          })
          return map
        })
      } else if (encode) {
        if (active !== undefined) {
          ret = Buffer.from(active, 'ascii').toString('base64')
        }
      } else if (singleline) {
        ret = active.replace(/\n/g, '')
      } else if (multiline) {
        let lines = active.trim().split(/[\r\n]+/g)
        const max = 64
        if (lines.length === 1 && lines[0].length > max) {
          const lline = lines[0]
          const numChunks = Math.ceil(lline.length / max)
          lines = Array.from({ length: numChunks })
          for (let i = 0, o = 0; i < numChunks; ++i, o += max) {
            lines[i] = lline.substr(o, max)
          }
        }
        ret = lines
      } else if (
        !multiselect &&
        type !== 'table' &&
        type !== 'labels' &&
        type !== 'values' &&
        type !== 'textarea' &&
        Array.isArray(active)
      ) {
        ret = active[0]
      } else if (_template) {
        // ex: when a text input is part of a url
        ret = _template.replace(`{{{${id}}}}`, active)
      } else {
        ret = active
      }
      if (hasReplacements) {
        replacements.push(control)
      }
    }
    return ret
  }
  controlData.forEach((control) => {
    let value = getTemplateData(control)
    if (value !== undefined) {
      const { type, onlyOne, encodeValues } = control
      if (type === 'group' && onlyOne) {
        templateData = { ...templateData, ...value[0] }
      }
      if (encodeValues) {
        value = { ...value }
        encodeValues.forEach((key) => {
          if (value[key] !== undefined) {
            value[key] = Buffer.from(value[key], 'ascii').toString('base64')
          }
        })
      }
    }
    templateData[control.id] = value
  })
  return templateData
}

const addCodeSnippetsTemplateData = (mainTemplateData, replacements, controlMap) => {
  // if replacement updates a hidden control that user can't change
  // reset that control's active state and let replacement fill from scratch
  replacements.forEach((control) => {
    const { availableMap } = control
    const controlReplacements = get(Object.values(availableMap), '[0].replacements')
    if (controlReplacements) {
      Object.keys(controlReplacements).forEach((id) => {
        const ctrl = controlMap[id]
        if (ctrl && ctrl.type === 'hidden') {
          delete controlMap[id].wasSet
          delete mainTemplateData[id]
        }
      })
    }
  })

  // sort the controls with handlerbars to bottom in case they need values
  // from other replacements to do the replacements
  // iow: a snippet might itself be a handlerbars template that needs
  //      templateData to resolve it
  replacements.sort((a, b) => {
    if (a.noHandlebarReplacements && !b.noHandlebarReplacements) {
      return -1
    } else if (!a.noHandlebarReplacements && b.noHandlebarReplacements) {
      return 1
    }
    return 0
  })

  //add replacements
  const snippetMap = {}
  const encodeInfo = []
  replacements.forEach((control) => {
    const {
      id,
      active,
      availableMap,
      hasCapturedUserSource,
      customYAML,
      encode: encodeData = [],
      groupTemplateData,
      userData,
    } = control
    const templateData = groupTemplateData || mainTemplateData
    templateData[`has${capitalize(id)}`] = active.length > 0
    if (typeof active !== 'function' && active.length > 0) {
      if (hasCapturedUserSource) {
        // restore snippet that user edited
        templateData[`${id}Capture`] = userData
      } else {
        // add predefined snippets
        const choices = Array.isArray(active) ? active : [active]
        choices.forEach((key, idx) => {
          const { replacements: _replacements } = availableMap[key] || {}

          Object.entries(_replacements).forEach(([_id, partial = {}]) => {
            const { template: _template, encode, newTab } = partial
            partial = _template || (templateData[_id] ? templateData[_id] : partial)
            const typeOf = typeof partial
            if (typeOf === 'string' || typeOf === 'function') {
              let snippet = typeOf === 'string' ? partial : partial(templateData, helpers)
              snippet = snippet.trim().replace(/^\s*$(?:\r\n?|\n)/gm, '')
              let arr = templateData[_id]
              if (!arr) {
                arr = templateData[_id] = []
              }

              // need to make sure yaml indents line up
              // see below for more
              if (new RegExp(/[\r\n]/).test(snippet)) {
                const snippetKey = `____${_id}-${idx}____`
                if (encode || encodeData.includes(_id)) {
                  snippet = customYAML || snippet
                  encodeInfo.push({
                    control,
                    templateYAML: snippet,
                    snippetKey,
                    encode: true,
                    newTab,
                    id: _id,
                  })
                }
                snippetMap[snippetKey] = snippet
                if (!Array.isArray(arr)) {
                  arr = templateData[_id] = []
                }
                arr.push(snippetKey)
              } else if (Array.isArray(arr) && !arr.includes(snippet) && controlMap[_id]) {
                let wasSet = controlMap[_id].wasSet
                if (!wasSet) {
                  wasSet = controlMap[_id].wasSet = new Set()
                }
                // if this control has already been set by this selection
                // don't do it again in case user unselected it
                if (arr && !wasSet.has(key)) {
                  arr.push(snippet)
                  controlMap[_id].active = arr
                  wasSet.add(key)
                }
              } else {
                if (!Array.isArray(arr)) {
                  arr = []
                }
                if (arr.indexOf(snippet) === -1) {
                  arr.push(snippet)
                }
              }
            } else if (Array.isArray(partial)) {
              templateData[_id] = partial
            }
          })
        })
      }
    } else {
      // user reset selection, remove its keys from wasSet
      Object.values(controlMap).forEach(({ wasSet }) => {
        if (wasSet) {
          Object.keys(availableMap).forEach((key) => {
            wasSet.delete(key)
          })
        }
      })
      delete control.hasCapturedUserSource
      delete control.userData
    }
  })

  return { snippetMap, encodeInfo }
}

const replaceSnippetMap = (yaml, snippetMap) => {
  // find indent of key and indent the whole snippet
  Object.entries(snippetMap).forEach(([key, replace]) => {
    let replaced = false
    const regex = new RegExp(`^\\s*${key}`, 'gm')
    yaml = yaml.replace(regex, (str) => {
      replaced = true
      const inx = str.indexOf(key)
      const indent = inx !== -1 ? str.substring(0, inx) : '    '
      return indent + replace.replace(/\n/g, '\n' + indent)
    })
    // if not replaced, may be an in-line replacement--no need to worry about indent
    if (!replaced) {
      yaml = yaml.replace(key, replace)
    }
  })
  yaml = yaml.replace(/^\s*$(?:\r\n?|\n)/gm, '')
  if (!yaml.endsWith('\n')) {
    yaml += '\n'
  }
  return yaml
}
