/* Copyright Contributors to the Open Cluster Management project */

import { Label, LabelGroup, Popover, PopoverPosition } from '@patternfly/react-core'
import { useMemo } from 'react'
import { css } from '@emotion/css'
import { useTranslation } from '../../lib/acm-i18next'

const acmLabel = css({
  display: 'inline-grid',
  '--pf-v5-c-label__text--MaxWidth': 'unset',
})

export function AcmLabels(props: {
  labels?: string[] | Record<string, string>
  collapse?: string[]
  collapsedText?: string
  expandedText?: string
  allCollapsedText?: string
  isCompact?: boolean
  isVertical?: boolean
  id?: string
}) {
  const { t } = useTranslation()
  const { labelsRecord, sortedKeys } = useMemo(() => {
    let record: Record<string, string>
    if (props.labels === undefined) {
      record = {}
    } else if (Array.isArray(props.labels)) {
      record = props.labels.reduce(
        (labels, label) => {
          const parts = label.split('=')
          /* istanbul ignore if */
          if (parts.length === 1) {
            labels[parts[0]] = ''
          } else {
            labels[parts[0]] = parts.slice(1).join('=')
          }
          return labels
        },
        {} as Record<string, string>
      )
    } else {
      record = props.labels
    }

    // Sort keys once here for reuse across popoverId, labels, and hidden
    const sorted = Object.keys(record).sort((a, b) => a.localeCompare(b))

    return { labelsRecord: record, sortedKeys: sorted }
  }, [props.labels])

  // Generate a unique ID for the popover based on label content
  const popoverId = useMemo(() => {
    if (props.id) return props.id
    const labelKeys = sortedKeys.join('-')
    return `labels-popover-${labelKeys.substring(0, 50).replace(/[^a-zA-Z0-9-]/g, '-')}`
  }, [props.id, sortedKeys])

  const labels: string[] = useMemo(() => {
    return sortedKeys
      .filter((key) => !props.collapse?.includes(key))
      .map((key: string) => (labelsRecord[key] ? `${key}=${labelsRecord[key]}` : `${key}`))
  }, [sortedKeys, labelsRecord, props.collapse])

  const hidden: string[] = useMemo(() => {
    if (props.labels === undefined) return []
    return sortedKeys
      .filter((key) => props.collapse?.includes(key))
      .map((key: string) => (labelsRecord[key] ? `${key}=${labelsRecord[key]}` : `${key}`))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedKeys, labelsRecord, props.collapse])

  /* istanbul ignore next */
  let collapsedText = props.collapsedText ?? t('{{count}} more', { count: hidden.length })

  if (hidden.length > 0 && labels.length === 0 && props.allCollapsedText) {
    collapsedText = props.allCollapsedText
  }

  /* istanbul ignore next */
  const expandedText = props.expandedText ?? t('Show less')

  if (props.labels === undefined) return <div>-</div>
  const labelCount = labels.length + hidden.length

  const renderLabelGroup = () => {
    return (
      <LabelGroup
        isVertical={props.isVertical ?? true}
        numLabels={labels.length}
        expandedText={expandedText}
        collapsedText={collapsedText}
      >
        {labels.map((label) => (
          <Label key={label} className={acmLabel} isCompact={labelCount > 10}>
            {label}
          </Label>
        ))}
        {hidden.map((label) => (
          <Label key={label} className={acmLabel} isCompact={labelCount > 10}>
            {label}
          </Label>
        ))}
      </LabelGroup>
    )
  }
  if (labelCount) {
    return props.isCompact ? (
      <Popover
        id={popoverId}
        bodyContent={renderLabelGroup()}
        position={PopoverPosition.left}
        flipBehavior={['left', 'left-end', 'left-end']}
        hasAutoWidth
      >
        <Label style={{ width: 'fit-content' }} variant="overflow">
          {t('{{count}} labels', { count: labelCount })}
        </Label>
      </Popover>
    ) : (
      renderLabelGroup()
    )
  }
  return <div>-</div>
}
