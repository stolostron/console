/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { partitionGroupSections } from '../utils/groupControlUtils'
import capitalize from 'lodash/capitalize'
import {
  Alert,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Icon,
} from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { hasReviewExceptions as sharedHasReviewExceptions } from '../utils/controlPredicates'

export const REVIEW_EMPTY_VALUE = '-'

class ControlPanelFinish extends React.Component {
  static propTypes = {
    comment: PropTypes.string,
    commentVariant: PropTypes.string,
    controlData: PropTypes.array,
    details: PropTypes.array,
    onEditStep: PropTypes.func,
    renderNotifications: PropTypes.func,
    reviewLayout: PropTypes.string,
    startStep: PropTypes.number,
    i18n: PropTypes.func,
  }

  constructor(props) {
    super(props)
  }

  isStandaloneLayout() {
    return this.props.reviewLayout === 'standalone'
  }

  hasReviewExceptions(details = []) {
    return sharedHasReviewExceptions(details, this.props.i18n)
  }

  render() {
    const { details, comment, commentVariant = 'warning', renderNotifications, i18n } = this.props
    const standalone = this.isStandaloneLayout()
    const hasExceptions = this.hasReviewExceptions(details)

    return (
      <React.Fragment>
        <div className={standalone ? 'tf--finish-standalone' : undefined}>
          {this.renderDetails(details, i18n)}
          {standalone && this.renderReadiness(hasExceptions, i18n)}
          {comment && (
            <Alert
              className={standalone ? 'tf--finish-comment-alert' : undefined}
              variant={commentVariant}
              isInline
              title={comment}
            />
          )}
          {renderNotifications()}
        </div>
      </React.Fragment>
    )
  }

  renderReadiness(hasExceptions, i18n) {
    return (
      <div
        className={`review-readiness ${hasExceptions ? 'pf-m-warning' : 'pf-m-success'}`}
        role="status"
        aria-live="polite"
      >
        <span className="review-readiness__icon">
          <Icon status={hasExceptions ? 'warning' : 'success'}>
            {hasExceptions ? <ExclamationTriangleIcon /> : <CheckCircleIcon />}
          </Icon>
        </span>
        <span className="review-readiness__title">
          {hasExceptions ? i18n('Complete the configuration') : i18n('Ready to create')}
        </span>
        <span className="review-readiness__separator" aria-hidden="true" hidden>
          ·
        </span>
        <span className="review-readiness__description" hidden />
      </div>
    )
  }

  renderDetails(details, i18n) {
    const standalone = this.isStandaloneLayout()
    let step = this.props.startStep + 1
    return (
      <div className={standalone ? 'review-nebius' : 'tf--finish-details'}>
        {details.map(({ title, sections }) => {
          if (title.type === 'review') {
            step++
            return null
          }
          if (standalone) {
            return (
              <section
                key={title.id || step}
                className="review-nebius__section"
                aria-labelledby={`review-section-${title.id || step}`}
              >
                <div className="review-nebius__head">
                  <h3 className="review-nebius__title" id={`review-section-${title.id || step}`}>
                    <button
                      type="button"
                      className="review-nebius__title-link"
                      aria-label={i18n('Edit {{title}}', { title: title.title })}
                      onClick={() => this.props.onEditStep?.(title.id)}
                    >
                      {title.title}
                    </button>
                  </h3>
                </div>
                <div className="review-nebius__card">{this.renderSections(sections, i18n)}</div>
              </section>
            )
          }
          return (
            <div key={step} className="tf--finish-step">
              <div className="tf--finish-step-title">
                <div className="tf--finish-step-circle">{step++}</div>
                <div>{title.title}</div>
              </div>
              {this.renderSections(sections, i18n)}
            </div>
          )
        })}
      </div>
    )
  }

  renderSections(sections, i18n) {
    const tables = []
    let id
    // Copy sections so omit/table filtering does not mutate wizard step control data.
    const filteredSections = sections.map((section) => {
      const content = (section.content || []).filter((control) => {
        if (control.omitFromReview) {
          return false
        }
        if (control.type === 'table') {
          tables.push(control)
          return false
        }
        id = control.id
        return true
      })
      return { ...section, content }
    })
    const standalone = this.isStandaloneLayout()
    return (
      <React.Fragment>
        {this.renderTables(tables)}
        {standalone ? (
          filteredSections.map(({ content }) => (
            <div key={id} className="review-nebius__fields">
              {this.renderContent(content, false, i18n)}
            </div>
          ))
        ) : (
          <DescriptionList isHorizontal>
            {filteredSections.map(({ content }) => {
              return (
                <div key={id} className="tf--finish-step-section">
                  {this.renderContent(content, false, i18n)}
                </div>
              )
            })}
          </DescriptionList>
        )}
      </React.Fragment>
    )
  }

  renderContent(controlData, divider, i18n) {
    const key = controlData.map((elem) => elem.id).join(',')
    return (
      <React.Fragment key={key}>
        {divider && '---'}
        {controlData.map((control) => {
          if (control.omitFromReview) {
            return null
          }
          const { type, disabled } = control
          switch (type) {
            case 'group':
              return this.renderGroup(control, i18n)
            case 'table':
              return this.renderTable(control)
            default:
              return disabled ? null : this.renderControl(control, i18n)
          }
        })}
      </React.Fragment>
    )
  }

  renderGroup(control, i18n) {
    const { active = [] } = control
    return (
      <React.Fragment key={control.id}>
        {active.map((controlData) => {
          return this.renderContent(controlData, active.length > 1, i18n)
        })}
      </React.Fragment>
    )
  }

  renderGroupControlSections(controlData, grpNum, grpId = '') {
    const controlSections = partitionGroupSections(controlData, grpNum)
    return this.renderControlSections(controlSections, grpId)
  }


  renderTables(tables) {
    return (
      <div key={tables.id}>
        {tables.map((table) => {
          const { active = [], controlData } = table
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
              {active.map((row) =>
                columns.map(({ id }, inx) => (
                  <div key={id} style={{ gridColumn: inx + 1 }}>
                    {row[id]}
                  </div>
                ))
              )}
            </div>
          )
        })}
      </div>
    )
  }

  renderControl(control, i18n) {
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
      omitFromReview,
      controlData,
    } = control
    if (omitFromReview) {
      return null
    }
    let term
    let desc
    let summaries
    switch (type) {
      case 'reviewinfo':
      case 'text':
      case 'textarea':
      case 'singleselect':
      case 'combobox':
      case 'treeselect':
        term = name
        desc = active
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
        desc = (active || []).join(', ')
        break
      case 'number':
        term = name
        desc = active
        break
      case 'checkbox':
      case 'radio':
        term = name
        desc = active ? active.toString() : 'false'
        break
      case 'cards':
        term = name || capitalize(id)
        desc = typeof active === 'function' ? active() : active
        if (desc && availableMap) {
          desc = availableMap[desc].title
        }
        break
      case 'labels':
        term = name
        desc = active
          .map(({ key: k, value }) => {
            return `${k}=${value}`
          })
          .join(', ')
        break
      case 'values':
        term = name
        desc = (active || []).join(', ')
        break
      case 'custom':
        if (typeof summary === 'function') {
          summaries = summary(control, i18n)
        }
        break
    }

    const isHidden =
      (!term && !summaries) ||
      (typeof hidden === 'function' ? hidden(control, this.props.controlData) : hidden)
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
      const standalone = this.isStandaloneLayout()
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
            const displayValue = valueComponent || desc || REVIEW_EMPTY_VALUE
            if (standalone) {
              return (
                <div key={`${term}${desc}`} className="review-nebius__row">
                  <span className="review-nebius__label">{term}</span>
                  <span className="review-nebius__value" style={styles}>
                    {displayValue}
                  </span>
                </div>
              )
            }
            return (
              <DescriptionListGroup key={`${term}${desc}`} className="tf--finish-step-group">
                <DescriptionListTerm>{term}</DescriptionListTerm>
                <DescriptionListDescription>
                  <div style={styles}>{displayValue}</div>
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
}

export default ControlPanelFinish
