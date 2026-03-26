/* Copyright Contributors to the Open Cluster Management project */
import { createContext, ReactNode, RefObject, useCallback, useContext, useLayoutEffect, useRef, useState } from 'react'
import { useReviewDomTreeVersion } from './contexts/ReviewDomTreeSyncContext'
import { useStringContext } from './contexts/StringContext'
import { InputContainerElement, InputReviewMeta, InputReviewStepMeta } from './inputs/Input'
import { Step } from './Step'
import './ReviewStep.css'

export interface ReviewStepProps {
  wizardRef?: RefObject<HTMLDivElement | null>
}

type InputOrArrayInputMeta = Extract<InputReviewStepMeta, { type: InputReviewMeta.INPUT | InputReviewMeta.ARRAY_INPUT }>

/** Snapshot of wizard input containers: merged `InputReviewStepMeta`, nested `children` when non-empty. The review step (`id === 'review'`) is omitted; its descendants are hoisted. Root may be `{ children }` only. `stepId` is set only on {@link InputReviewMeta.INPUT} nodes (nearest enclosing wizard step). */
export type WizardDomTreeNode =
  | (Extract<InputReviewStepMeta, { type: InputReviewMeta.STEP }> & { children?: WizardDomTreeNode[] })
  | (Omit<InputOrArrayInputMeta, 'type'> & {
      type: InputReviewMeta.INPUT
      stepId: string
      children?: WizardDomTreeNode[]
    })
  | (Omit<InputOrArrayInputMeta, 'type'> & { type: InputReviewMeta.ARRAY_INPUT; children?: WizardDomTreeNode[] })
  | (Extract<InputReviewStepMeta, { type: InputReviewMeta.ARRAY_INSTANCE }> & { children?: WizardDomTreeNode[] })
  | { children?: WizardDomTreeNode[] }

const ReviewStepOutlineIdContext = createContext('')

const ReviewStepSetOutlineIdContext = createContext<((id: string) => void) | undefined>(undefined)

export function ReviewStepOutlineIdProvider(props: { children: ReactNode }) {
  const [outlineId, setOutlineIdState] = useState('')
  const setOutlineId = useCallback((id: string) => setOutlineIdState(id), [])
  return (
    <ReviewStepOutlineIdContext.Provider value={outlineId}>
      <ReviewStepSetOutlineIdContext.Provider value={setOutlineId}>
        {props.children}
      </ReviewStepSetOutlineIdContext.Provider>
    </ReviewStepOutlineIdContext.Provider>
  )
}

/** Current review-step outline target id (step input id path segment), updated via {@link useSetReviewStepOutlineId}. */
export function useReviewStepOutlineId(): string {
  return useContext(ReviewStepOutlineIdContext)
}

/** Returns `setOutlineId(id)` to update which input id is outlined on the review step; no-op outside {@link ReviewStepOutlineIdProvider}. */
export function useSetReviewStepOutlineId(): (id: string) => void {
  const set = useContext(ReviewStepSetOutlineIdContext)
  return set ?? (() => {})
}

export function ReviewStep({ wizardRef }: ReviewStepProps) {
  const { reviewLabel } = useStringContext()
  const reviewDomTreeVersion = useReviewDomTreeVersion()
  const outlineId = useReviewStepOutlineId()
  const setOutlineId = useSetReviewStepOutlineId()
  const wizardDomTreeRef = useRef<WizardDomTreeNode | null>(null)
  useLayoutEffect(() => {
    setOutlineId('123')
    return () => setOutlineId('')
  }, [setOutlineId])
  useLayoutEffect(() => {
    const root = wizardRef?.current
    if (!root) return
    const treeData = buildTree(root)
    wizardDomTreeRef.current = treeData
  }, [wizardRef, reviewDomTreeVersion])

  return (
    <Step label={reviewLabel} id="review">
      <div
        style={{ outline: outlineId ? '2px solid blue' : undefined }}
        data-review-outline-id={outlineId || undefined}
      >
        <h3>{reviewLabel}</h3>
      </div>
      {/* {Children.map(children, (child, index) => {
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
      })} */}
    </Step>
  )
}

// function ReviewExpandableSection(props: {
//   label: string
//   entries: readonly InputReviewStepMeta[]
//   children: ReactNode
//   wizardDomTreeRef: RefObject<WizardDomTreeNode | null>
// }) {
//   const { label, entries, children, wizardDomTreeRef } = props
//   const [isExpanded, setIsExpanded] = useState(false)

//   return (
//     <ExpandableSection
//       className="wizard-review-expandable-section"
//       isExpanded={isExpanded}
//       onToggle={(_event, expanded) => setIsExpanded(expanded)}
//       toggleContent={
//         isExpanded ? (
//           <Title
//             headingLevel="h3"
//             style={{
//               color: 'var(--pf-t--global--text--color--regular)',
//             }}
//           >
//             {label}
//           </Title>
//         ) : (
//           <ToggleContent label={label} entries={entries} wizardDomTreeRef={wizardDomTreeRef} />
//         )
//       }
//     >
//       {children}
//     </ExpandableSection>
//   )
// }
// const reviewAlertIndicatorMarginStyle = {
//   marginLeft: 'var(--pf-t--global--spacer--xs)',
//   verticalAlign: 'middle' as const,
// }

// function reviewAlertIndicator(content: string): ReactNode {
//   return (
//     <Tooltip content={content}>
//       <Button type="button" variant="plain" isInline aria-label={content} style={reviewAlertIndicatorMarginStyle}>
//         <Icon status="danger">
//           <ExclamationCircleIcon />
//         </Icon>
//       </Button>
//     </Tooltip>
//   )
// }

// function isStepInputValueEmpty(value: unknown): boolean {
//   if (value === null || value === undefined) return true
//   if (typeof value === 'string') return value.trim() === ''
//   if (Array.isArray(value)) return value.length === 0
//   if (typeof value === 'object') return Object.keys(value as object).length === 0
//   return false
// }

// function formatStepInputValue(value: unknown): string {
//   if (value === null || value === undefined) return '—'
//   if (typeof value === 'string') return value
//   if (typeof value === 'number' || typeof value === 'boolean') return String(value)
//   try {
//     return JSON.stringify(value)
//   } catch {
//     return String(value)
//   }
// }

export function buildTree(element: Element): WizardDomTreeNode {
  const nodes = buildReviewSubtree(element)
  if (nodes.length === 1) return nodes[0]!
  if (nodes.length === 0) return {}
  return { children: nodes }
}

function buildReviewSubtree(
  element: Element,
  parentStepId = '',
  /** ARRAY_INPUT field paths and ARRAY_INSTANCE index segments from root to current node, in DOM order. */
  reviewPathPrefixSegments: readonly string[] = []
): WizardDomTreeNode[] {
  if (element instanceof HTMLElement) {
    const props = (element as InputContainerElement).__reviewStepProps
    if (props) {
      const stepIdForChildren = props.type === InputReviewMeta.STEP ? props.id : parentStepId
      let segmentsForChildren = reviewPathPrefixSegments
      if (props.type === InputReviewMeta.ARRAY_INPUT && props.path != null && props.path !== '') {
        segmentsForChildren = [...reviewPathPrefixSegments, props.path]
      } else if (props.type === InputReviewMeta.ARRAY_INSTANCE && props.path !== undefined && props.path !== '') {
        segmentsForChildren = [...reviewPathPrefixSegments, props.path]
      }
      const children: WizardDomTreeNode[] = []
      for (let i = 0; i < element.children.length; i++) {
        children.push(...buildReviewSubtree(element.children[i]!, stepIdForChildren, segmentsForChildren))
      }
      const hasChildren = children.length > 0
      if (props.type === InputReviewMeta.STEP) {
        if (props.id === 'review') {
          return children
        }
        return [hasChildren ? { ...props, children } : { ...props }]
      }
      if (props.type === InputReviewMeta.INPUT) {
        const path =
          reviewPathPrefixSegments.length > 0 ? [...reviewPathPrefixSegments, props.path].join('.') : props.path
        return [
          hasChildren
            ? { ...props, type: InputReviewMeta.INPUT, stepId: parentStepId, path, children }
            : { ...props, type: InputReviewMeta.INPUT, stepId: parentStepId, path },
        ]
      }
      if (props.type === InputReviewMeta.ARRAY_INPUT) {
        return [
          hasChildren
            ? { ...props, type: InputReviewMeta.ARRAY_INPUT, children }
            : { ...props, type: InputReviewMeta.ARRAY_INPUT },
        ]
      }
      return [
        hasChildren
          ? { ...props, type: InputReviewMeta.ARRAY_INSTANCE, children }
          : { ...props, type: InputReviewMeta.ARRAY_INSTANCE },
      ]
    }
  }
  const out: WizardDomTreeNode[] = []
  for (let i = 0; i < element.children.length; i++) {
    out.push(...buildReviewSubtree(element.children[i]!, parentStepId, reviewPathPrefixSegments))
  }
  return out
}
