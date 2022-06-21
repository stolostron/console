'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import groupBy from 'lodash/groupBy'
import { Title, TitleSizes, Gallery, Tile, Stack } from '@patternfly/react-core'
import Tooltip from '../components/Tooltip'
import isEmpty from 'lodash/isEmpty'

class ControlPanelCards extends React.Component {
  static propTypes = {
    control: PropTypes.object,
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

  render() {
    const { i18n, control, showEditor } = this.props
    const { available = [], availableMap } = control
    const { collapsed } = this.state
    let { active } = control
    active = active || []
    const gridClasses = classNames({
      'tf--grid-container': true,
      small: showEditor,
    })

    const availableCards = Object.keys(availableMap).reduce((acc, curr) => {
      if (available.includes(curr)) {
        acc.push(availableMap[curr])
      }
      return acc
    }, [])
    const cardGroups = groupBy(availableCards, (c) => c.section)
    return (
      <React.Fragment>
        <div className="creation-view-controls-card-container" ref={this.setControlRef.bind(this, control)}>
          <div className={gridClasses}>
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
                          {cardGroups[group]
                            .filter((choice) => {
                              return active.length === 0 || !collapsed || active.includes(choice.id)
                            })
                            .map((choice) => {
                              const { id, hidden, title, tooltip, text, logo } = choice
                              return (
                                !hidden && (
                                  <Tile
                                    id={title.replace(/\s+/g, '-').toLowerCase()}
                                    key={id}
                                    title={title}
                                    icon={logo}
                                    isSelected={active.includes && active.includes(id)}
                                    isStacked
                                    isDisplayLarge
                                    data-testid={`card-${id}`}
                                    onClick={this.handleChange.bind(this, id)}
                                  >
                                    {tooltip && (
                                      <div className="card-tooltip-container">
                                        <Tooltip control={{ tooltip }} />
                                      </div>
                                    )}
                                    {text && <div className="control-panel-cards__extra-text">{text}</div>}
                                  </Tile>
                                )
                              )
                            })}
                        </Gallery>
                      </Stack>
                    </React.Fragment>
                  )
                })}
              </Stack>
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  }

  handleChange(id) {
    const { collapsed } = this.state
    const { control } = this.props
    const { collapseCardsControlOnSelect } = control
    if (collapseCardsControlOnSelect) {
      this.setState((prevState) => {
        return { collapsed: !prevState.collapsed }
      })
    }
    this.props.handleChange(collapsed ? null : id)
  }
}

export default ControlPanelCards
