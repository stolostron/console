/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import capitalize from 'lodash/capitalize'
import {
  Alert,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core'
import { ControlPanelFinishProps, FinishSummaryRow, TemplateControl, WizardStepSection } from '../types'
import { TFunction } from 'react-i18next'

function renderTables(tables: TemplateControl[]) {
  return (
    <div key="finish-tables">
      {tables.map((table) => {
        const { active = [], controlData = [] } = table as TemplateControl & {
          controlData?: TemplateControl[]
        }
        const columns = controlData.filter(({ mode }) => !mode)
        return (
          <div key={table.id} className="tf--finish-step-table">
            {columns.map(({ name }, inx) => {
              return (
                <div key={name} style={{ gridColumn: inx + 1, fontWeight: 'bold' }}>
                  {name}
                </div>
              )
            })}
            {(active as Record<string, string>[]).map((row) =>
              columns.map(({ id: colId }, inx) => (
                <div key={colId} style={{ gridColumn: inx + 1 }}>
                  {row[colId as string]}
                </div>
              ))
            )}
          </div>
        )
      })}
    </div>
  )
}

function renderTable(control: TemplateControl) {
  return renderTables([control])
}

function renderControl(control: TemplateControl, i18n: TFunction) {
  const {
    id,
    type,
    active,
    availableMap,
    name,
    exception,
    validation,
    summary,
    hidden,
    controlData = [],
  } = control as TemplateControl & { controlData?: TemplateControl[] }
  let term: React.ReactNode
  let desc: React.ReactNode
  let summaries: FinishSummaryRow[] | undefined
  switch (type) {
    case 'reviewinfo':
    case 'text':
    case 'singleselect':
    case 'combobox':
    case 'treeselect':
      term = name
      desc = active as React.ReactNode
      break
    case 'multitext':
      term = name
      desc = controlData
        .filter((innerControl) => innerControl.active !== '')
        .map((innerControl) => innerControl.active)
        .join(', ')
      break
    case 'multiselect':
      term = name
      desc = ((active as string[]) || []).join(', ')
      break
    case 'number':
      term = name
      desc = active as React.ReactNode
      break
    case 'checkbox':
    case 'radio':
      term = name
      desc = active ? active.toString() : 'false'
      break
    case 'cards':
      term = capitalize(String(id))
      desc =
        typeof active === 'function' ? (active as (this: unknown) => string).call(control) : (active as React.ReactNode)
      if (desc && availableMap) {
        desc = (availableMap as Record<string, { title?: string }>)[desc as string]?.title
      }
      break
    case 'labels':
      term = name
      desc = ((active as { key: string; value: string }[]) || [])
        .map(({ key: k, value }) => {
          return `${k}=${value}`
        })
        .join(', ')
      break
    case 'values':
      term = name
      desc = ((active as string[]) || []).join(', ')
      break
    case 'custom':
      if (typeof summary === 'function') {
        summaries = summary(control, i18n)
      }
      break
  }

  const isHidden = (!term && !summaries) || (typeof hidden === 'function' ? (hidden as () => boolean)() : hidden)
  if (!isHidden) {
    if (!summaries) {
      summaries = [
        {
          term,
          desc,
          exception,
          validation,
        },
      ]
    }
    return (
      <React.Fragment key={id}>
        {summaries.map(({ term, desc, exception, validation, valueComponent }) => {
          let styles = {}
          if (exception) {
            desc = i18n('Fix exceptions')
            styles = { color: 'red' }
          } else if (typeof desc === 'string' && desc.length > 64) {
            desc = `${desc.substr(0, 32)}...${desc.substr(-32)}`
          } else if (!desc && validation && validation.required) {
            desc = i18n('Required')
            styles = { color: 'red' }
          }
          return (
            <DescriptionListGroup key={`${term}${desc}`} className="tf--finish-step-group">
              <DescriptionListTerm>{term}</DescriptionListTerm>
              <DescriptionListDescription>
                <div style={styles}>{valueComponent || desc || '-none-'}</div>
              </DescriptionListDescription>
            </DescriptionListGroup>
          )
        })}
      </React.Fragment>
    )
  } else {
    return null
  }
}

function renderContent(controlData: TemplateControl[], divider: boolean, i18n: TFunction) {
  const key = controlData.map((elem) => elem.id).join(',')
  return (
    <React.Fragment key={key}>
      {divider && '---'}
      {controlData.map((control) => {
        const { type, disabled } = control
        switch (type) {
          case 'group':
            return renderGroup(control, i18n)
          case 'table':
            return renderTable(control)
          default:
            return disabled ? null : renderControl(control, i18n)
        }
      })}
    </React.Fragment>
  )
}

function renderGroup(control: TemplateControl, i18n: TFunction) {
  const active = (control.active as TemplateControl[][] | undefined) ?? []
  return (
    <React.Fragment key={control.id}>
      {active.map((groupRow) => {
        return renderContent(groupRow, active.length > 1, i18n)
      })}
    </React.Fragment>
  )
}

function renderSections(sections: WizardStepSection[], i18n: TFunction) {
  const tables: TemplateControl[] = []
  let id: string | undefined
  sections.forEach((section) => {
    section.content = section.content.filter((control) => {
      if (control.type === 'table') {
        tables.push(control)
        return false
      }
      id = control.id
      return true
    })
  })
  return (
    <React.Fragment>
      {renderTables(tables)}
      <DescriptionList isHorizontal>
        {sections.map(({ content }) => {
          return (
            <div key={id} className="tf--finish-step-section">
              {renderContent(content, false, i18n)}
            </div>
          )
        })}
      </DescriptionList>
    </React.Fragment>
  )
}

function renderDetails(details: ControlPanelFinishProps['details'], i18n: TFunction, startStep: number) {
  let step = startStep + 1
  return (
    <div className="tf--finish-details">
      {details.map(({ title, sections }) => {
        if (title.type !== 'review') {
          const tc = title as TemplateControl
          const rawTitle = tc.title
          const heading =
            typeof rawTitle === 'function'
              ? rawTitle(
                  tc,
                  details.flatMap((d) => d.sections.flatMap((s) => s.content)),
                  i18n
                )
              : rawTitle
          return (
            <div key={step} className="tf--finish-step">
              <div className="tf--finish-step-title">
                <div className="tf--finish-step-circle">{step++}</div>
                <div>{heading as React.ReactNode}</div>
              </div>
              {renderSections(sections, i18n)}
            </div>
          )
        } else {
          step++
          return null
        }
      })}
    </div>
  )
}

export default function Review({ details, comment, renderNotifications, i18n, startStep }: ControlPanelFinishProps) {
  return (
    <React.Fragment>
      <div>
        {renderDetails(details, i18n, startStep)}
        {comment && <Alert variant="warning" isInline title={comment} />}
        {renderNotifications()}
      </div>
    </React.Fragment>
  )
}
