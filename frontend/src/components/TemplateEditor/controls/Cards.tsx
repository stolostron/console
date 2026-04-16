/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React, { useEffect, useState } from 'react'
import groupBy from 'lodash/groupBy'
import isEmpty from 'lodash/isEmpty'
import { Title, TitleSizes, Gallery, Stack } from '@patternfly/react-core'
import { Tile } from '@patternfly/react-core/deprecated'
import Tooltip from '~/components/TemplateEditor/components/Tooltip'
import { ControlPanelCardsProps, TemplateControl } from '../types'

type CardChoice = {
  id: string
  hidden?: boolean
  title: string
  tooltip?: React.ReactNode
  text?: React.ReactNode
  logo?: React.ReactNode
  section?: string
}

export default function ControlPanelCards({ control, handleChange, fetchData }: ControlPanelCardsProps) {
  const { active, collapseCardsControlOnSelect } = control as {
    active?: unknown
    collapseCardsControlOnSelect?: boolean
  }

  const [collapsed, setCollapsed] = useState(() => !!(collapseCardsControlOnSelect && !isEmpty(active)))

  const setControlRef = (c: TemplateControl, ref: HTMLDivElement | null) => {
    c.ref = ref
  }

  useEffect(() => {
    const { active: a } = control as {
      active?: string | ((c: TemplateControl, fd?: Record<string, unknown>) => string)
    }
    if (typeof a === 'function') {
      const activeID = a(control, fetchData)
      if (activeID) {
        handleChange(activeID)
      }
    }
    // Match class componentDidMount: run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { available = [], availableMap } = control as {
    available?: string[]
    availableMap?: Record<string, CardChoice>
  }
  let { active: activeIds } = control as { active?: string[] }
  activeIds = activeIds || []

  const availableCards = Object.keys(availableMap || {}).reduce<CardChoice[]>((acc, curr) => {
    if (available.includes(curr)) {
      acc.push(availableMap![curr])
    }
    return acc
  }, [])
  const cardGroups = groupBy(availableCards, (c) => c.section)
  const sectionTooltips = (control as { sectionTooltips?: Record<string, React.ReactNode> }).sectionTooltips

  const onCardClick = (id: string) => {
    const { collapseCardsControlOnSelect: collapseOnSelect } = control as {
      collapseCardsControlOnSelect?: boolean
    }
    if (collapseOnSelect) {
      setCollapsed((prev) => !prev)
    }
    handleChange(collapsed ? null : id)
  }

  return (
    <React.Fragment>
      <div className="creation-view-controls-card-container" ref={(ref) => setControlRef(control, ref)}>
        <div>
          <div className={'tf--grid'}>
            <Stack hasGutter>
              {Object.keys(cardGroups).map((group) => {
                const groupTooltip = group && sectionTooltips?.[group]
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
                              className="control-panel-cards__group-tooltip"
                            />
                          )}
                        </Title>
                      )}
                      <Gallery hasGutter>
                        {cardGroups[group]
                          .filter((choice) => {
                            return activeIds.length === 0 || !collapsed || activeIds.includes(choice.id)
                          })
                          .map((choice) => {
                            const { id, hidden, title, tooltip, text, logo } = choice
                            return (
                              !hidden && (
                                <Tile
                                  id={title.replaceAll(/\s+/g, '-').toLowerCase()}
                                  key={id}
                                  title={title}
                                  icon={logo}
                                  isSelected={activeIds.includes && activeIds.includes(id)}
                                  isStacked
                                  isDisplayLarge
                                  data-testid={`card-${id}`}
                                  onClick={() => onCardClick(id)}
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
