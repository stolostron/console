'use strict'

import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import { Badge, Popover } from '@patternfly/react-core'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import get from 'lodash/get'
import { CaretIcon } from '../icons/Icons'

class ControlPanelAccordion extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    controlData: PropTypes.array,
    controlId: PropTypes.string,
    i18n: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.state = {}
  }

  setControlSectionTitleRef = (title, ref) => {
    title.sectionTitleRef = ref
  }

  render() {
    const { controlId, i18n, control, controlData } = this.props
    const { tooltip, note, overline, collapsable, collapsed = false, content = [], techPreview } = control
    let { title, subtitle, info } = control
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
        control.sectionTitleRef.classList.toggle('collapsed', !isCollapsed)
        if (isCollapsed) {
          // if expanding make sure at least 1st control is visible
          const { content: _content } = control
          const ref = get(_content, '[2].ref') || get(_content, '[1].ref') || get(_content, '[0].ref')
          if (ref) {
            const rect = ref.getBoundingClientRect()
            if (rect.top < 0 || rect.bottom > window.innerHeight) {
              ref.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
                inline: 'nearest',
              })
            }
          }
        }
      }
    }
    const handleCollapseKey = (e) => {
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
    let summary = []
    this.getSummary(content, summary)
    summary = summary.filter((s) => !!s)
    const label = title || subtitle
    let id = `${controlId}-${label || ''}`
    id = id.replace(/\s+/g, '-').toLowerCase()
    return (
      <React.Fragment>
        {label || info ? (
          <div
            id={id}
            className={titleClasses}
            tabIndex="0"
            role={'button'}
            title={text}
            aria-label={text}
            onClick={handleCollapse}
            onKeyPress={handleCollapseKey}
            ref={this.setControlSectionTitleRef.bind(this, control)}
          >
            {note && <div className="creation-view-controls-note">{i18n(note)}</div>}
            {label && (
              <div className={mainTitleClasses}>
                {collapsable && (
                  <div className={'creation-view-controls-title-main-collapse-button'}>
                    <CaretIcon />
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
                        className="pf-c-form__group-label-help"
                      >
                        <HelpIcon noVerticalAlign />
                      </button>
                    </Popover>
                  )}
                  {techPreview && (
                    <div variant="primary" className="techPreviewTag">
                      {i18n('creation.app.section.techPreview')}
                    </div>
                  )}
                  <span className="creation-view-controls-title-main-summary">
                    {summary.map((tag, inx) => {
                      return (
                        <Badge
                          /* eslint-disable-next-line react/no-array-index-key */
                          key={`${id}-${tag}-${inx}`}
                          className="tag"
                          type="custom"
                        >
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

  getSummary(content, summary, ignoreEmpty) {
    if (!Array.isArray(content)) {
      content = []
    }
    content.forEach(
      ({ id, type, hasValueDescription, summaryKey: key, summarize, active, initial, available, availableMap }) => {
        if (!summarize) {
          switch (type) {
            case 'title':
            case 'section':
            case 'hidden':
              break
            case 'checkbox':
            case 'radio':
              summary.push(available ? available[!active ? 0 : 1] : active.toString())
              break
            case 'number':
              summary.push(active || initial)
              break
            case 'table':
              if (Array.isArray(active)) {
                active.forEach((a) => {
                  summary.push(a[key])
                })
              }
              break
            case 'labels':
              if (active) {
                active.forEach(({ key: k, value }) => {
                  summary.push(`${k}=${value}`)
                })
              }
              break
            case 'values':
              if (active) {
                if (!Array.isArray(active)) {
                  summary.push(active)
                } else {
                  active.forEach((value) => {
                    summary.push(value)
                  })
                }
              }
              break
            default:
              if (hasValueDescription && availableMap) {
                summary.push(availableMap[active] || active)
              } else if (Array.isArray(active)) {
                if (availableMap && active.length === 1) {
                  const { title = '' } = availableMap[active[0]] || {}
                  summary.push(title)
                } else if (typeof active[0] === 'string') {
                  summary.push(...active)
                } else {
                  this.getSummary(active[0], summary, true)
                }
              } else {
                switch (typeof active) {
                  case 'string':
                    if (active.length > 24) {
                      if (id.indexOf('ssh') !== -1) {
                        active = 'ssh'
                      } else if (id.indexOf('secret') !== -1) {
                        active = 'secret'
                      } else {
                        active = `${active.substr(0, 12)}...${active.substr(-12)}`
                      }
                    }
                    summary.push(active)
                    break
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
          summarize(summary, this.props.i18n)
        }
      }
    )
  }
}

export default ControlPanelAccordion
