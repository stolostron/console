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
import {
  Children,
  isValidElement,
  MouseEvent,
  ReactNode,
  RefObject,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { StepInputEntry, useStepInputs } from './contexts/StepInputsContext'
import { useStringContext } from './contexts/StringContext'
import { InputContainerElement } from './inputs/Input'
import { Step, StepProps } from './Step'
import './ReviewStep.css'

export interface ReviewStepProps {
  children: ReactNode
  wizardRef?: RefObject<HTMLDivElement | null>
}

/** Serializable snapshot of wizard input containers with `__review` (tag, id, class, nested review children). */
export interface WizardDomTreeNode {
  tagName: string
  id: string | null
  className: string | null
  /** Present on nodes from input containers; omitted on synthetic `WIZARD_REVIEW_ROOT`. */
  __review?: NonNullable<InputContainerElement['__review']>
  children: WizardDomTreeNode[]
}

/** Collect review nodes: skip elements without `__review`; flatten wrappers by splicing in descendants that have metadata. */
function buildReviewSubtree(element: Element): WizardDomTreeNode[] {
  if (element instanceof HTMLElement) {
    const review = (element as InputContainerElement).__review
    if (review) {
      const children: WizardDomTreeNode[] = []
      for (let i = 0; i < element.children.length; i++) {
        children.push(...buildReviewSubtree(element.children[i]!))
      }
      return [
        {
          tagName: element.tagName,
          id: element.id || null,
          className: element.className || null,
          __review: review,
          children,
        },
      ]
    }
  }
  const out: WizardDomTreeNode[] = []
  for (let i = 0; i < element.children.length; i++) {
    out.push(...buildReviewSubtree(element.children[i]!))
  }
  return out
}

export function buildTree(element: Element): WizardDomTreeNode {
  const nodes = buildReviewSubtree(element)
  if (nodes.length === 1) return nodes[0]!
  return {
    tagName: 'WIZARD_REVIEW_ROOT',
    id: null,
    className: null,
    children: nodes,
  }
}

export function ReviewStep({ children, wizardRef }: ReviewStepProps) {
  const { reviewLabel } = useStringContext()
  const stepInputs = useStepInputs()
  const wizardDomTreeRef = useRef<WizardDomTreeNode | null>(null)

  useLayoutEffect(() => {
    const root = wizardRef?.current
    if (!root) return
    const treeData = buildTree(root)
    wizardDomTreeRef.current = treeData
  }, [wizardRef])

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
          <ReviewExpandableSection
            key={index}
            label={label}
            entries={reviewEntries}
            wizardDomTreeRef={wizardDomTreeRef}
          >
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

function ReviewExpandableSection(props: {
  label: string
  entries: readonly StepInputEntry[]
  children: ReactNode
  wizardDomTreeRef: RefObject<WizardDomTreeNode | null>
}) {
  const { label, entries, children, wizardDomTreeRef } = props
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
          <ToggleContent label={label} entries={entries} wizardDomTreeRef={wizardDomTreeRef} />
        )
      }
    >
      {children}
    </ExpandableSection>
  )
}

function handleEntryClicked(event: MouseEvent, entry: StepInputEntry, wizardDomTree: WizardDomTreeNode | null): void {
  event.stopPropagation()
  console.log('entry clicked', entry, wizardDomTree)
}

function ToggleContent(props: {
  label: string
  entries: readonly StepInputEntry[]
  wizardDomTreeRef: RefObject<WizardDomTreeNode | null>
}) {
  const { label, entries, wizardDomTreeRef } = props
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
                    <Badge isRead onClick={(e) => handleEntryClicked(e, entry, wizardDomTreeRef.current)}>
                      {entry.label ?? entry.path}
                      {reviewAlertIndicator(entry.error)}
                    </Badge>
                  ) : entry.label ? (
                    <Tooltip content={entry.label}>
                      <Badge isRead onClick={(e) => handleEntryClicked(e, entry, wizardDomTreeRef.current)}>
                        {formatStepInputValue(entry.value)}
                      </Badge>
                    </Tooltip>
                  ) : (
                    <Badge isRead onClick={(e) => handleEntryClicked(e, entry, wizardDomTreeRef.current)}>
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
