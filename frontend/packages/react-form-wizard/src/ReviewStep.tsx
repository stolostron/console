/* Copyright Contributors to the Open Cluster Management project */
import {
  Badge,
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  ExpandableSection,
  Icon,
  Split,
  SplitItem,
  Title,
  Tooltip,
} from '@patternfly/react-core'
import { ExclamationCircleIcon } from '@patternfly/react-icons'
import { Children, isValidElement, MouseEvent, ReactNode, useMemo, useState } from 'react'
import { StepInputEntry, useStepInputs } from './contexts/StepInputsContext'
import { useStringContext } from './contexts/StringContext'
import { Step, StepProps } from './Step'
import './ReviewStep.css'

export interface ReviewStepProps {
  children: ReactNode
}

export function ReviewStep({ children }: ReviewStepProps) {
  const { reviewLabel } = useStringContext()
  const stepInputs = useStepInputs()

  const inputsByStepId = useMemo(() => {
    const m = new Map<string, StepInputEntry[]>()
    for (const entry of stepInputs) {
      const list = [...(m.get(entry.stepId) ?? []), entry]
      m.set(entry.stepId, list)
    }
    return m
  }, [stepInputs])

  return (
    <Step label={reviewLabel} id="review">
      {Children.map(children, (child, index) => {
        if (!isValidElement(child) || typeof (child.props as StepProps).label !== 'string') {
          return child
        }
        const stepId = (child.props as StepProps).id
        const entries = stepId ? inputsByStepId.get(stepId) ?? [] : []
        const reviewEntries = entries.filter((e) => !!e.error || !isStepInputValueEmpty(e.value))
        const label = (child.props as StepProps).label
        return (
          <ReviewExpandableSection key={index} label={label} entries={reviewEntries}>
            <DescriptionList
              isHorizontal
              horizontalTermWidthModifier={{
                default: '12ch',
                sm: '15ch',
                md: '20ch',
                lg: '28ch',
                xl: '30ch',
                '2xl': '35ch',
              }}
              style={{ paddingLeft: 32, paddingBottom: 16, paddingRight: 16 }}
            >
              {entries.length > 0
                ? entries.map((entry) => (
                    <DescriptionListGroup key={entry.path}>
                      <DescriptionListTerm>
                        {entry.label ?? entry.path}
                        {entry.error && isStepInputValueEmpty(entry.value) ? reviewAlertIndicator(entry.error) : null}
                      </DescriptionListTerm>
                      <DescriptionListDescription>
                        {formatStepInputValue(entry.value)}
                        {entry.error && !isStepInputValueEmpty(entry.value) ? reviewAlertIndicator(entry.error) : null}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  ))
                : child}
            </DescriptionList>
          </ReviewExpandableSection>
        )
      })}
    </Step>
  )
}

function ReviewExpandableSection(props: { label: string; entries: readonly StepInputEntry[]; children: ReactNode }) {
  const { label, entries, children } = props
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <ExpandableSection
      className="wizard-review-expandable-section"
      isExpanded={isExpanded}
      onToggle={(_event, expanded) => setIsExpanded(expanded)}
      toggleContent={
        isExpanded ? (
          <Title
            headingLevel="h3"
            style={{
              color: 'var(--pf-t--global--text--color--regular)',
            }}
          >
            {label}
          </Title>
        ) : (
          <ToggleContent label={label} entries={entries} />
        )
      }
    >
      {children}
    </ExpandableSection>
  )
}

function handleEntryClicked(event: MouseEvent, entry: StepInputEntry): void {
  event.stopPropagation()
  console.log('entry clicked', entry)
  void entry
}

function ToggleContent(props: { label: string; entries: readonly StepInputEntry[] }) {
  const { label, entries } = props
  return (
    <div className="wizard-review-toggle-row">
      <Split hasGutter isWrappable style={{ alignItems: 'center', flex: 1, minWidth: 0, position: 'relative' }}>
        <SplitItem>
          <Title
            headingLevel="h3"
            style={{
              color: 'var(--pf-t--global--text--color--regular)',
            }}
          >
            {label}
          </Title>
        </SplitItem>
        <SplitItem isFilled>
          <div className="wizard-review-toggle-entries" style={{ overflow: 'hidden' }}>
            <Split hasGutter isWrappable style={{ minWidth: 0, maxWidth: '100%' }}>
              {entries.map((entry) => (
                <SplitItem key={entry.path}>
                  {entry.error ? (
                    <Badge isRead onClick={(e) => handleEntryClicked(e, entry)}>
                      {entry.label ?? entry.path}
                      {reviewAlertIndicator(entry.error)}
                    </Badge>
                  ) : entry.label ? (
                    <Tooltip content={entry.label}>
                      <Badge isRead onClick={(e) => handleEntryClicked(e, entry)}>
                        {formatStepInputValue(entry.value)}
                      </Badge>
                    </Tooltip>
                  ) : (
                    <Badge isRead onClick={(e) => handleEntryClicked(e, entry)}>
                      {formatStepInputValue(entry.value)}
                    </Badge>
                  )}
                </SplitItem>
              ))}
            </Split>
          </div>
        </SplitItem>
      </Split>
    </div>
  )
}

const reviewAlertIndicatorMarginStyle = {
  marginLeft: 'var(--pf-t--global--spacer--xs)',
  verticalAlign: 'middle' as const,
}

function reviewAlertIndicator(content: string): ReactNode {
  return (
    <Tooltip content={content}>
      <Button type="button" variant="plain" isInline aria-label={content} style={reviewAlertIndicatorMarginStyle}>
        <Icon status="danger">
          <ExclamationCircleIcon />
        </Icon>
      </Button>
    </Tooltip>
  )
}

function isStepInputValueEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value as object).length === 0
  return false
}

function formatStepInputValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}
