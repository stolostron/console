/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import groupBy from 'lodash/groupBy'
import { Title, TitleSizes, Gallery, Label, Stack } from '@patternfly/react-core'
import { Tile } from '@patternfly/react-core/deprecated'
import Tooltip from '../components/Tooltip'
import isEmpty from 'lodash/isEmpty'
import ControlPanelFormGroup from './ControlPanelFormGroup'

class ControlPanelCards extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    controlData: PropTypes.array,
    controlId: PropTypes.string,
    fetchData: PropTypes.object,
    handleChange: PropTypes.func,
    i18n: PropTypes.func,
    showEditor: PropTypes.bool,
  }

  static getDerivedStateFromProps(props, state) {
    const { initialized } = state
    if (!initialized) {
      const { control } = props
      const { active, collapseCardsControlOnSelect } = control
      return {
        collapsed: collapseCardsControlOnSelect && !isEmpty(active),
        initialized: true,
      }
    }
    return null
  }

  constructor(props) {
    super(props)
    const { control } = props
    const { active, collapsed, collapseCardsControlOnSelect } = control

    // if active was preset by loading an existing resource
    // collapse cards on that selection
    this.state = {
      collapsed: collapsed || (collapseCardsControlOnSelect && !!active),
    }
  }

  setControlRef = (control, ref) => {
    this.multiSelect = control.ref = ref
  }

  componentDidMount() {
    const { control, fetchData, handleChange } = this.props
    const { active } = control
    if (typeof active === 'function') {
      const activeID = active(control, fetchData)
      if (activeID) {
        handleChange(activeID)
      }
    }
  }

  renderCards() {
    const { i18n, control } = this.props
    const { available = [], availableMap } = control
    const { collapsed } = this.state
    let { active } = control
    active = active || []

    const availableCards = Object.keys(availableMap).reduce((acc, curr) => {
      if (available.includes(curr)) {
        acc.push(availableMap[curr])
      }
      return acc
    }, [])
    const cardGroups = groupBy(availableCards, (c) => c.section)
    return (
      <div className="creation-view-controls-card-container" ref={this.setControlRef.bind(this, control)}>
        <div>
          <div className={'tf--grid'}>
            <Stack hasGutter>
              {Object.keys(cardGroups).map((group) => {
                const groupTooltip = group && control.sectionTooltips?.[group]
                return (
                  <React.Fragment key={group}>
                    <Stack hasGutter>
                      {group !== 'undefined' && (
                        <Title headingLevel="h1" size={TitleSizes.xl}>
                          {group}
                          {groupTooltip && (
                            <Tooltip
                              control={{
                                controlId: `group-${group}`,
                                tooltip: groupTooltip,
                              }}
                              i18n={i18n}
                              className="control-panel-cards__group-tooltip"
                            />
                          )}
                        </Title>
                      )}
                      <Gallery hasGutter>
                        {(() => {
                          const visibleChoices = cardGroups[group].filter((choice) => {
                            return (
                              !choice.hidden &&
                              (active.length === 0 || !collapsed || active.includes(choice.id))
                            )
                          })
                          const reserveBadgeSlot = visibleChoices.some((choice) => choice.badge)
                          return visibleChoices.map((choice) => {
                            const { id, title, tooltip, text, logo, disabled, badge } = choice
                            return (
                              <Tile
                                id={String(title).replaceAll(/\s+/g, '-').toLowerCase()}
                                key={id}
                                icon={logo}
                                isSelected={active.includes && active.includes(id)}
                                isDisabled={!!disabled}
                                isStacked
                                isDisplayLarge
                                data-testid={`card-${id}`}
                                onClick={disabled ? undefined : this.handleChange.bind(this, id)}
                              >
                                <div className="creation-view-controls-card-body">
                                  {reserveBadgeSlot && (
                                    <div className="creation-view-controls-card-badge">
                                      {badge ? <Label color="blue">{badge}</Label> : null}
                                    </div>
                                  )}
                                  {title && (
                                    <span className="creation-view-controls-card-title">{title}</span>
                                  )}
                                  {tooltip && (
                                    <div className="card-tooltip-container">
                                      <Tooltip control={{ tooltip }} />
                                    </div>
                                  )}
                                  {text && (
                                    <div className="control-panel-cards__extra-text">{text}</div>
                                  )}
                                </div>
                              </Tile>
                            )
                          })
                        })()}
                      </Gallery>
                    </Stack>
                  </React.Fragment>
                )
              })}
            </Stack>
          </div>
        </div>
      </div>
    )
  }

  render() {
    const { i18n, control, controlId, controlData } = this.props
    const cards = this.renderCards()
    if (!control.name) {
      return <React.Fragment>{cards}</React.Fragment>
    }
    return (
      <div className="creation-view-controls-cards">
        <ControlPanelFormGroup i18n={i18n} controlId={controlId || control.id} control={control} controlData={controlData}>
          {cards}
        </ControlPanelFormGroup>
      </div>
    )
  }

  handleChange(id) {
    const { collapsed } = this.state
    const { control } = this.props
    const { collapseCardsControlOnSelect, availableMap = {} } = control
    if (availableMap[id]?.disabled) {
      return
    }
    if (collapseCardsControlOnSelect) {
      this.setState((prevState) => {
        return { collapsed: !prevState.collapsed }
      })
    }
    this.props.handleChange(collapsed ? null : id)
  }
}

export default ControlPanelCards
