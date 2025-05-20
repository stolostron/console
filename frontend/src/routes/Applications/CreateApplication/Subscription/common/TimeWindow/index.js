// Copyright (c) 2020 Red Hat, Inc. All Rights Reserved.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import PropTypes from 'prop-types'
import {
  Accordion,
  AccordionItem,
  AccordionToggle,
  AccordionContent,
  Button,
  Checkbox,
  Radio,
  TimePicker,
  ButtonVariant,
  SelectOption,
} from '@patternfly/react-core'
import { AcmSelectBase, SelectVariant } from '../../../../../../components/AcmSelectBase'
import { Fragment, Component } from 'react'
import { PlusCircleIcon, TimesCircleIcon } from '@patternfly/react-icons'
import { Tooltip, getSourcePath, removeVs } from '../../../../../../components/TemplateEditor'
import _ from 'lodash'
import './style.css'

export class TimeWindow extends Component {
  static propTypes = {
    control: PropTypes.object,
    controlId: PropTypes.string,
    handleChange: PropTypes.func,
    locale: PropTypes.string,
    i18n: PropTypes.func,
  }

  constructor(props) {
    super(props)
    if (_.isEmpty(this.props.control.active)) {
      this.props.control.active = {
        mode: '',
        days: [],
        timezone: '',
        showTimeSection: false,
        timeList: [{ id: 0, start: '', end: '', validTime: true }],
        timeListID: 1,
      }
    }
    this.state = {
      timezoneCache: { isSelected: false, tz: '' },
      isExpanded: this.props.control.active.mode,
    }
    this.props.control.validation = this.validation.bind(this)

    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const allTimezones = Intl.supportedValuesOf('timeZone')

    this.timezoneList = this.renderTimezones(allTimezones, localTimezone, 'timezone-dropdown').map((tz) => (
      <SelectOption key={tz.key} value={tz.value}>
        {tz.label}
      </SelectOption>
    ))

    this.daysMap = new Map([
      ['mon', 'Monday'],
      ['tue', 'Tuesday'],
      ['wed', 'Wednesday'],
      ['thu', 'Thursday'],
      ['fri', 'Friday'],
      ['sat', 'Saturday'],
      ['sun', 'Sunday'],
    ])
  }

  validation(exceptions) {
    const { control, i18n } = this.props
    const timeWindowId = 'timeWindow-config'
    // Mode is active/blocked
    if (control.active.mode) {
      // Add exception if no days selected
      if (control.active.days.length === 0) {
        exceptions.push({
          row: 1,
          text: i18n('creation.missing.timeWindow.days'),
          type: 'error',
          controlId: timeWindowId,
        })
      }
      // Add exception if no timezone selected
      if (!control.active.timezone) {
        exceptions.push({
          row: 1,
          text: i18n('creation.missing.timeWindow.timezone'),
          type: 'error',
          controlId: timeWindowId,
        })
      }
      // Add exception if no timelist selected
      if (control.active.timeList && control.active.timeList.length > 0) {
        const invalidTimeRange = (timeRange) => timeRange.validTime && (timeRange.start === '' || timeRange.end === '')
        if (control.active.timeList.some(invalidTimeRange)) {
          exceptions.push({
            row: 1,
            text: i18n('creation.missing.timeWindow.timelist'),
            type: 'error',
            controlId: timeWindowId,
          })
        }
      } else {
        exceptions.push({
          row: 1,
          text: i18n('creation.missing.timeWindow.timelist'),
          type: 'error',
          controlId: timeWindowId,
        })
      }
    }
  }

  render() {
    const { isExpanded } = this.state
    const onToggle = (toggleStatus) => {
      this.setState({ isExpanded: !toggleStatus })
    }
    const { controlId, locale, control, i18n } = this.props
    const { name, active, validation = {} } = control
    const modeSelected = active && active.mode ? true : false
    const { mode, days = [], timezone } = this.props.control.active

    return (
      <Fragment>
        <div className="creation-view-controls-labels">
          <div className="creation-view-controls-textarea-title">
            {name}
            {validation.required ? <div className="creation-view-controls-required">*</div> : null}
            <Tooltip control={control} locale={locale} />
          </div>

          <div className="timeWindow-container" style={{ fontSize: '14px', position: 'relative' }}>
            <Radio
              className="mode-btn"
              name={`timeWindow-mode-container-${controlId}`}
              id={`default-mode-${controlId}`}
              label={i18n('creation.app.settings.timeWindow.defaultMode')}
              value=""
              onChange={this.handleChange.bind(this)}
              defaultChecked={!mode}
            />
            <Radio
              className="mode-btn"
              name={`timeWindow-mode-container-${controlId}`}
              id={`active-mode-${controlId}`}
              label={i18n('creation.app.settings.timeWindow.activeMode')}
              value='"active"'
              onChange={this.handleChange.bind(this)}
              defaultChecked={mode === 'active'}
            />
            <Radio
              className="mode-btn"
              name={`timeWindow-mode-container-${controlId}`}
              id={`blocked-mode-${controlId}`}
              label={i18n('creation.app.settings.timeWindow.blockedMode')}
              value='"blocked"'
              onChange={this.handleChange.bind(this)}
              defaultChecked={mode === 'blocked'}
            />

            <Accordion style={{ display: 'block' }}>
              <AccordionItem>
                <AccordionToggle
                  onClick={() => {
                    onToggle(isExpanded)
                  }}
                  isExpanded={isExpanded}
                  id="time-window-header"
                >
                  {i18n('creation.app.settings.timeWindow.config')}
                </AccordionToggle>
                <AccordionContent isHidden={!isExpanded}>
                  <div className="timeWindow-config-container" id="timeWindow-config">
                    <div className="config-days-section" style={{ marginBottom: '20px' }}>
                      <div
                        className="config-title"
                        style={{ fontWeight: '600', fontSize: '14px', marginBottom: '10px' }}
                      >
                        {i18n('creation.app.settings.timeWindow.config.days.title')}{' '}
                        <div className="config-title-required">*</div>
                      </div>
                      <div className="config-descr" style={{ fontSize: '14px', marginBottom: '10px' }}>
                        {i18n('creation.app.settings.timeWindow.config.days.descr')}
                      </div>
                      <div
                        className="config-days-selector"
                        style={{
                          width: '50%',
                          display: 'grid',
                          gridTemplateColumns: 'auto auto',
                        }}
                      >
                        <div className="first-col" style={{ gridColumnStart: '1' }}>
                          {Array.from(this.daysMap, ([key, value]) => {
                            return (
                              <Checkbox
                                isChecked={days.includes(`"${value}"`)}
                                label={value}
                                name={`days-selector-${key}`}
                                id={`${key}-${controlId}`}
                                key={`${key}-${controlId}`}
                                value={`"${value}"`}
                                isDisabled={!modeSelected}
                                onChange={this.handleChange.bind(this)}
                              />
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="config-timezone-section" style={{ marginBottom: '20px' }}>
                      <div className="config-title">
                        {i18n('Time zone')}
                        <div className="config-title-required">*</div>
                      </div>
                      <AcmSelectBase
                        id="timeZoneSelect"
                        variant={SelectVariant.typeahead}
                        aria-label={i18n('Select timezone')}
                        className="config-timezone-combo-box"
                        placeholder={i18n('Choose a location')}
                        selections={timezone || ''}
                        isDisabled={!modeSelected}
                        maxHeight={180}
                        onSelect={(value) => {
                          this.handleTimeZone.bind(this)(value)
                        }}
                        onClear={() => {
                          this.handleTimeZone.bind(this)(undefined)
                        }}
                      >
                        {this.timezoneList}
                      </AcmSelectBase>
                    </div>

                    <div style={{ display: 'block' }}>
                      {this.renderTimes(control, modeSelected)}
                      <Button
                        variant={ButtonVariant.link}
                        onClick={() => this.addTimeToList(control, modeSelected)}
                        icon={<PlusCircleIcon />}
                        isDisabled={!modeSelected}
                        size="sm"
                      >
                        {i18n('Add another time range')}
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </Fragment>
    )
  }

  renderTimezones = (timezoneList, localTimezone, id) => {
    const timezoneObjList = [
      {
        label: localTimezone,
        key: `${localTimezone}-${id}`,
        value: `"${localTimezone}"`,
      },
    ]

    timezoneList = timezoneList.filter((e) => e !== localTimezone)

    timezoneList.forEach((tz) => {
      timezoneObjList.push({
        label: tz,
        key: `${tz}-${id}`,
        value: `"${tz}"`,
      })
    })

    return timezoneObjList
  }

  renderTimes = (control, modeSelected) => {
    const { controlId, i18n } = this.props
    return (
      control.active &&
      control.active.timeList.map((item) => {
        const { id, existingStart, existingEnd, validTime } = item
        const startTimeID = `start-time-${id}-${controlId}`
        const endTimeID = `end-time-${id}-${controlId}`
        // Don't show deleted time invertals
        if (validTime) {
          return (
            <Fragment key={id}>
              {id === 0 ? (
                <div className="time-picker-title" style={{ display: 'flex' }}>
                  <div className="config-title">
                    {i18n('Start time')}
                    <div className="config-title-required">*</div>
                  </div>
                  <div className="config-title">
                    {i18n('End time')}
                    <div className="config-title-required">*</div>
                  </div>
                </div>
              ) : (
                ''
              )}
              <div className="config-time-container">
                <div className="config-input-time">
                  <TimePicker
                    id={startTimeID}
                    time={existingStart ? existingStart : ''}
                    isDisabled={!modeSelected}
                    onChange={(eventOrTime, timeOrHour) => {
                      const time = typeof eventOrTime === 'string' ? eventOrTime : timeOrHour
                      this.handleTimeRange.bind(this)(time, startTimeID)
                    }}
                    width={'140px'}
                  />
                </div>
                <div className="config-input-time" style={{ float: 'left', marginRight: '10px' }}>
                  <TimePicker
                    id={endTimeID}
                    time={existingEnd ? existingEnd : ''}
                    isDisabled={!modeSelected}
                    onChange={(eventOrTime, timeOrHour) => {
                      const time = typeof eventOrTime === 'string' ? eventOrTime : timeOrHour
                      this.handleTimeRange.bind(this)(time, endTimeID)
                    }}
                    width={'140px'}
                  />
                </div>
                {id !== 0 ? ( // Option to remove added times
                  <Button
                    id={id}
                    variant={ButtonVariant.link}
                    isDisabled={!modeSelected}
                    onClick={() => this.removeTimeFromList(control, item, modeSelected)}
                    icon={<TimesCircleIcon />}
                    aria-label={i18n('Remove time range')}
                    size="sm"
                  />
                ) : (
                  ''
                )}
              </div>
            </Fragment>
          )
        }
        return ''
      })
    )
  }

  getRegExp = () => new RegExp('^\\s*\\d\\d?:[0-5]\\d\\s*([AaPp][Mm])?\\s*$')

  validateTime = (time) => {
    // hours only valid if they are [0-12]
    const hours = parseInt(time.split(':')[0], 10)
    const validHours = hours >= 0 && hours <= 12
    return this.getRegExp().test(time) && validHours
  }

  parseTime = (time) => {
    const timeStr = time.trim()
    if (!timeStr) {
      return ''
    }

    try {
      // Create a date object with the time
      const [hours, minutes] = timeStr.split(':')
      const date = new Date()
      date.setHours(parseInt(hours, 10))
      date.setMinutes(parseInt(minutes, 10))

      // Format in 12-hour format with AM/PM
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    } catch {
      return ''
    }
  }

  addTimeToList = (control, modeSelected) => {
    if (modeSelected) {
      // Create new "time" item
      control.active.timeList.push({
        id: control.active.timeListID,
        start: '',
        end: '',
        validTime: true,
      })
      control.active.timeListID++

      // Update UI
      this.forceUpdate()
    }
  }

  removeTimeFromList = (control, item, modeSelected) => {
    if (modeSelected) {
      // Removed times are no longer valid
      control.active.timeList[item.id].validTime = false

      // Update UI and yaml editor
      this.forceUpdate()
      this.handleChange({})
    }
  }

  removeTimeKeyPress = (e) => {
    if (e.type === 'click' || e.key === 'Enter') {
      this.removeTimeFromList(this.props.control, { id: e.target.id })
    }
  }

  handleTimeZone = (value) => {
    const { control, handleChange } = this.props

    if (value) {
      // Set timezone on select and set cached tz for repopulating yaml
      control.active.timezone = value
      this.setState({
        timezoneCache: { isSelected: true, tz: value },
      })
    } else {
      // Reset timezone and reset cached tz
      control.active.timezone = ''
      this.setState({
        timezoneCache: { isSelected: false, tz: '' },
      })
    }

    handleChange(control)
  }

  handleTimeRange(value, targetID) {
    const { control, handleChange } = this.props

    const timeID = parseInt(targetID.split('-')[2], 10)
    const parsedTime = this.parseTime(value)
    if (targetID.includes('start-time')) {
      // As long as first start-time is entered, all times will show
      if (timeID === 0) {
        control.active.showTimeSection = parsedTime ? true : false
      }
      control.active.timeList[timeID].start = parsedTime
    } else if (targetID.includes('end-time')) {
      control.active.timeList[timeID].end = parsedTime
    }

    handleChange(control)
  }

  handleChange(event, checked) {
    const { control, handleChange } = this.props
    const { timezoneCache } = this.state

    let targetName = ''
    try {
      targetName = event.target.name
    } catch {
      targetName = ''
    }

    if (targetName) {
      if (targetName.startsWith('timeWindow-mode-container')) {
        // When switching from "default" to "active/blocked" repopulate yaml if timezone was previously selected
        if (!control.active.mode && event.target.value && timezoneCache.isSelected) {
          control.active.timezone = timezoneCache.tz
        }
        control.active.mode = (event.target.value || '').replace(/"/g, '')
        this.setState({ isExpanded: control.active.mode })
      } else if (targetName.startsWith('days-selector')) {
        if (checked) {
          control.active.days.push(event.target.value)
        } else {
          const index = control.active.days.indexOf(event.target.value)
          control.active.days.splice(index, 1)
        }
      }
    }

    handleChange(control)
  }
}

export default TimeWindow

export const reverse = (control, templateObject) => {
  if (!control.active) {
    let showTimeSection = false
    let timezoneValue = ''

    // getting timezone and preparing value without setting properties
    const timezone = _.get(templateObject, getSourcePath('Subscription[0].spec.timewindow.location'))
    if (timezone) {
      const allTimezones = Intl.supportedValuesOf('timeZone')
      timezoneValue = allTimezones.includes(timezone.$v) ? timezone.$v : ''
    }

    const mode = _.get(templateObject, getSourcePath('Subscription[0].spec.timewindow.windowtype'))
    let weekdays = _.get(templateObject, getSourcePath('Subscription[0].spec.timewindow.daysofweek'))
    weekdays = (removeVs(weekdays && weekdays.$v) || []).map((day) => {
      return `"${day}"`
    })

    let timeList = _.get(templateObject, getSourcePath('Subscription[0].spec.timewindow.hours'))
    if (timeList) {
      timeList = removeVs(timeList)
    }
    if (timeList) {
      timeList = timeList.map(({ start, end }, id) => {
        return {
          id,
          existingStart: start,
          existingEnd: end,
          start,
          end,
          validTime: true,
        }
      })
      showTimeSection = true
    } else {
      timeList = [{ id: 0, start: '', end: '', validTime: true }]
    }

    control.active = {
      mode: mode && mode.$v,
      days: weekdays,
      timezone: timezone ? timezone.$v : timezoneValue,
      showTimeSection,
      timeList,
      timeListID: timeList.length,
    }
  }
}

export const summarize = (control, controlData, summary) => {
  const { mode, timezone, timeList, days } = control.active || {}
  if (mode) {
    summary.push(mode)
    timeList.forEach(({ start, end }) => {
      if (start) {
        summary.push(`${start}-${end}`)
      }
    })
    summary.push(timezone)
    summary.push(days.join(','))
  } else {
    summary.push('No time window')
  }
}
