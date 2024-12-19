/* Copyright Contributors to the Open Cluster Management project */

import { Label, LabelGroup, Popover, PopoverPosition } from '@patternfly/react-core'
import { Fragment, useMemo } from 'react'
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
}) {
  const { t } = useTranslation()
  const labelsRecord: Record<string, string> = useMemo(() => {
    if (props.labels === undefined) return {}
    else if (Array.isArray(props.labels))
      return props.labels.reduce(
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
    else return props.labels
  }, [props.labels])

  const labels: string[] = useMemo(() => {
    return Object.keys(labelsRecord)
      .filter((key) => !props.collapse?.includes(key))
      .map((key: string) => (labelsRecord[key] ? `${key}=${labelsRecord[key]}` : `${key}`))
  }, [labelsRecord, props.collapse])

  const hidden: string[] = useMemo(() => {
    if (props.labels === undefined) return []
    return Object.keys(labelsRecord)
      .filter((key) => props.collapse?.includes(key))
      .map((key: string) => (labelsRecord[key] ? `${key}=${labelsRecord[key]}` : `${key}`))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labelsRecord, props.collapse])

  /* istanbul ignore next */
  let collapsedText = props.collapsedText ?? t('{{count}} more', { count: hidden.length })

  if (hidden.length > 0 && labels.length === 0 && props.allCollapsedText) {
    collapsedText = props.allCollapsedText
  }

  /* istanbul ignore next */
  const expandedText = props.expandedText ?? t('Show less')

  if (props.labels === undefined) return <Fragment />

  const renderLabelGroup = () => {
    return (
      <LabelGroup isCompact numLabels={labels.length} expandedText={expandedText} collapsedText={collapsedText}>
        {labels.map((label) => (
          <Label key={label} className={acmLabel} isCompact>
            {label}
          </Label>
        ))}
        {hidden.map((label) => (
          <Label key={label} className={acmLabel} isCompact>
            {label}
          </Label>
        ))}
      </LabelGroup>
    )
  }
  const labelCount = labels.length + hidden.length
  if (labelCount) {
    return props.isCompact ? (
      <Popover
        id={`${'sdfg'}-label-help-popover`}
        bodyContent={renderLabelGroup()}
        position={PopoverPosition.right}
        flipBehavior={['right', 'right-end', 'right-end']}
      >
        <ul className="pf-v5-c-label-group__list" aria-label="Label group category">
          <li className="pf-v5-c-label-group__list-item">
            <Label isOverflowLabel>{t('{{count}} labels', { count: labelCount })}</Label>
          </li>
        </ul>
      </Popover>
    ) : (
      renderLabelGroup()
    )
  }
  return <div>-</div>
}
