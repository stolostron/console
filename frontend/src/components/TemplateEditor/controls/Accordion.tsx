/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import classNames from 'classnames'
import { Badge, Popover } from '@patternfly/react-core'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import get from 'lodash/get'
import { AngleRightIcon } from '@patternfly/react-icons'
import { ControlPanelBaseProps, TemplateControl } from '../types'
import { TFunction } from 'react-i18next'

type Props = ControlPanelBaseProps

function getSummary(content: TemplateControl[], summary: string[], i18n: TFunction, ignoreEmpty?: boolean) {
  if (!Array.isArray(content)) {
    content = []
  }
  content.forEach(
    ({
      id,
      type,
      hasValueDescription,
      summaryKey: key,
      summarize,
      active,
      initial,
      available,
      availableMap,
    }: TemplateControl) => {
      if (!summarize) {
        switch (type) {
          case 'title':
          case 'section':
          case 'hidden':
            break
          case 'checkbox':
          case 'radio':
            summary.push(available ? (available as string[])[!active ? 0 : 1] : String(active))
            break
          case 'number':
            summary.push(String(active ?? initial ?? ''))
            break
          case 'table':
            if (Array.isArray(active)) {
              ;(active as { [k: string]: string }[]).forEach((a) => {
                summary.push(a[key as string])
              })
            }
            break
          case 'labels':
            if (active) {
              ;(active as { key: string; value: string }[]).forEach(({ key: k, value }) => {
                summary.push(`${k}=${value}`)
              })
            }
            break
          case 'values':
            if (active) {
              if (!Array.isArray(active)) {
                summary.push(String(active))
              } else {
                ;(active as string[]).forEach((value) => {
                  summary.push(value)
                })
              }
            }
            break
          default:
            if (hasValueDescription && availableMap) {
              summary.push(String((availableMap as Record<string, string>)[active as string] || active))
            } else if (Array.isArray(active)) {
              if (availableMap && active.length === 1) {
                const { title: t = '' } =
                  (availableMap as Record<string, { title?: string }>)[active[0] as string] || {}
                summary.push(t)
              } else if (typeof active[0] === 'string') {
                summary.push(...(active as string[]))
              } else {
                getSummary((active as TemplateControl[][])[0], summary, i18n, true)
              }
            } else {
              switch (typeof active) {
                case 'string': {
                  let s = active
                  if (s.length > 24) {
                    if (id?.indexOf('ssh') !== -1) {
                      s = 'ssh'
                    } else if (id?.indexOf('secret') !== -1) {
                      s = 'secret'
                    } else {
                      s = `${s.substring(0, 12)}...${s.substring(s.length - 12)}`
                    }
                  }
                  summary.push(s)
                  break
                }
                default:
                  if (!ignoreEmpty) {
                    summary.push('')
                  }
                  break
              }
            }
            break
        }
      } else {
        ;(summarize as (s: string[], tf: TFunction) => void)(summary, i18n)
      }
    }
  )
}

export default function ControlPanelAccordion({ controlId, i18n, control, controlData }: Props) {
  const setControlSectionTitleRef = (title: TemplateControl, ref: HTMLDivElement | null) => {
    title.sectionTitleRef = ref
  }

  const {
    tooltip,
    note,
    overline,
    collapsable,
    collapsed = false,
    content = [],
    techPreview,
  } = control as {
    tooltip?: React.ReactNode
    note?: React.ReactNode
    overline?: boolean
    collapsable?: boolean
    collapsed?: boolean
    content?: TemplateControl[]
    techPreview?: boolean
  }
  let { title, subtitle, info } = control as {
    title?: React.ReactNode | ((c: TemplateControl, cd: TemplateControl[], tf: TFunction) => React.ReactNode)
    subtitle?: React.ReactNode | ((c: TemplateControl, cd: TemplateControl[], tf: TFunction) => React.ReactNode)
    info?: React.ReactNode | ((c: TemplateControl, cd: TemplateControl[], tf: TFunction) => React.ReactNode)
  }
  if (typeof title === 'function') {
    title = title(control, controlData, i18n)
  }
  if (typeof subtitle === 'function') {
    subtitle = subtitle(control, controlData, i18n)
  }
  if (typeof info === 'function') {
    info = info(control, controlData, i18n)
  }
  const handleCollapse = () => {
    if (control.sectionRef && collapsable) {
      const isCollapsed = control.sectionRef.classList.contains('collapsed')
      control.sectionRef.classList.toggle('collapsed', !isCollapsed)
      control.sectionTitleRef?.classList.toggle('collapsed', !isCollapsed)
      if (isCollapsed) {
        const { content: _content } = control as { content?: TemplateControl[] }
        const ref = get(_content, '[2].ref') || get(_content, '[1].ref') || get(_content, '[0].ref')
        if (ref && typeof (ref as HTMLElement).getBoundingClientRect === 'function') {
          const rect = (ref as HTMLElement).getBoundingClientRect()
          if (rect.top < 0 || rect.bottom > window.innerHeight) {
            ;(ref as HTMLElement).scrollIntoView({
              behavior: 'smooth',
              block: 'end',
              inline: 'nearest',
            })
          }
        }
      }
    }
  }
  const handleCollapseKey = (e: React.KeyboardEvent) => {
    if (e.type === 'click' || e.key === 'Enter') {
      handleCollapse()
    }
  }
  const text = i18n('creation.ocp.toggle')
  const titleClasses = classNames({
    'creation-view-controls-title': true,
    collapsed,
  })
  const mainTitleClasses = classNames({
    'creation-view-controls-title-main': true,
    subtitle: !!subtitle,
    overline,
  })
  const summary: string[] = []
  getSummary(content, summary, i18n)
  const summaryFiltered = summary.filter((s) => !!s)
  const label = title || subtitle
  let id = `${controlId}-${label || ''}`
  id = id.replaceAll(/\s+/g, '-').toLowerCase()
  return (
    <React.Fragment>
      {label || info ? (
        <div
          id={id}
          className={titleClasses}
          tabIndex={0}
          role={'button'}
          title={text}
          aria-label={text}
          onClick={handleCollapse}
          onKeyPress={handleCollapseKey}
          ref={(ref) => setControlSectionTitleRef(control, ref)}
        >
          {note && <div className="creation-view-controls-note">{note}</div>}
          {label && (
            <div className={mainTitleClasses}>
              {collapsable && (
                <div className={'creation-view-controls-title-main-collapse-button'}>
                  <AngleRightIcon />
                </div>
              )}
              <div className="creation-view-controls-title-main-name">
                {label}
                {!info && tooltip && (
                  <Popover id={`${controlId}-label-help-popover`} bodyContent={tooltip}>
                    <button
                      id={`${controlId}-label-help-button`}
                      aria-label="More info"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      className="pf-v6-c-form__group-label-help"
                    >
                      <HelpIcon />
                    </button>
                  </Popover>
                )}
                {techPreview && <div className="techPreviewTag">{i18n('creation.app.section.techPreview')}</div>}
                <span className="creation-view-controls-title-main-summary">
                  {summaryFiltered.map((tag, inx) => {
                    return (
                      <Badge key={`${id}-${tag}-${inx}`} className="tag">
                        {tag}
                      </Badge>
                    )
                  })}
                </span>
              </div>
            </div>
          )}
          {info && (
            <div className="creation-view-controls-title-normal-container">
              <div className="creation-view-controls-title-normal">{info}</div>
            </div>
          )}
        </div>
      ) : null}
    </React.Fragment>
  )
}
