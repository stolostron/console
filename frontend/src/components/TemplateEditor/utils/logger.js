'use strict'

import jsYaml from 'js-yaml'
import { generateTemplateData } from './refresh-source-from-templates'

import get from 'lodash/get'
import set from 'lodash/set'

export const logSourceErrors = (logging, templateYAML, controlData, otherYAMLTabs, templateExceptionMap) => {
  if (logging) {
    /* eslint-disable no-console */

    //////////////////////////////// SOURCE ERRORS //////////////////////////////////////
    const errors = []
    const tabIds = ['Main YAML']
    Object.values(templateExceptionMap).forEach(({ exceptions }) => {
      exceptions.forEach(({ row, text, tabInx, controlId }) => {
        const tabErrors = get(errors, `${tabInx}`, [])
        const rowErrors = get(tabErrors, `${row}`, [])
        rowErrors.push({ text, controlId })
        set(tabErrors, `${row}`, rowErrors)
        set(errors, `${tabInx}`, tabErrors)
      })
    })
    const yamls = [templateYAML]
    otherYAMLTabs.forEach(({ id, templateYAML: yaml }) => {
      tabIds.push(id)
      yamls.push(yaml)
    })

    if (errors.length) {
      console.group('!!!!!!!!!!!!!!!!!! YAML ERRORS !!!!!!!!!!!!!!!!!!!!!!')

      // errors at top
      errors.forEach((tabErrors, tabInx) => {
        tabErrors.forEach((rowErrors, rowInx) => {
          rowErrors.forEach(({ text }) => {
            console.info(`${tabIds[tabInx]} ${rowInx + 1}: ${text}`)
          })
        })
      })
      console.groupEnd()
    }

    //////////////////////////////// YAML //////////////////////////////////////
    console.groupCollapsed('\n==================YAML OUTPUT=====================')
    // log YAML with errors
    yamls.forEach((yaml, tabInx) => {
      console.info(`\n//////////////////////// ${tabIds[tabInx]} ///////////////`)
      const output = []
      const tabErrors = errors[tabInx] || []
      const lines = yaml.split('\n')
      lines.forEach((line, row) => {
        output.push(`${row + 1} ${line}`)
        const rowErrors = tabErrors[row + 1] || []
        rowErrors.forEach(({ text }) => {
          output.push(`********* ${text}`)
        })
      })
      console.info(output.join('\n'))
    })
    console.groupEnd()

    //////////////////////////////// INPUT //////////////////////////////////////
    console.groupCollapsed('==================TEMPLATE INPUT======================')
    const replacements = []
    const controlMap = {}
    const templateData = generateTemplateData(controlData, replacements, controlMap)
    try {
      const input = jsYaml.dump(templateData, {
        noRefs: true,
        lineWidth: 200,
      })
      console.info(input)
    } catch (e) {
      // nothing
    }
    console.groupEnd()
  }
}

export const logCreateErrors = (logging, creationMsg, resourceJSON) => {
  if (logging) {
    /* eslint-disable no-console */

    console.group('!!!!!!!!!!!!!!!!!! CREATE ERRORS !!!!!!!!!!!!!!!!!!!!!!')

    creationMsg.forEach(({ message }) => {
      console.info(message)
    })
    console.groupEnd()

    //////////////////////////////// INPUT //////////////////////////////////////
    console.groupCollapsed('==================RESOURCE JSON======================')
    try {
      const input = jsYaml.dump(resourceJSON.createResources, {
        noRefs: true,
        lineWidth: 200,
      })
      console.info(input)
    } catch (e) {
      // nothing
    }
    console.groupEnd()
  }
}
