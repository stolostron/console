/* Copyright Contributors to the Open Cluster Management project */
import {
  Badge,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  ExpandableSection,
  Flex,
  Split,
  SplitItem,
  Stack,
  Title,
  Tooltip,
  useWizardContext,
} from '@patternfly/react-core'
import { css } from '@patternfly/react-styles'
import titleStyles from '@patternfly/react-styles/css/components/Title/title'
import { CheckIcon, ExclamationCircleIcon } from '@patternfly/react-icons'
import {
  Fragment,
  type ComponentProps,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useStringContext } from '../contexts/StringContext'
import { InputReviewMeta, useStepRegister, type WizardDomTreeNode } from './ReviewStepContexts'
import { ReviewPenHoverZone, useReviewEditHandler, type OnReviewEditHandler } from './ReviewStepNavigation'
import { ReviewStepToolbar, useReviewExpandCollapseHandlers, type ReviewToolbarAction } from './ReviewStepToolbar'
import { Step } from '../Step'
import './ReviewStep.css'

export type { ReviewEditIntent, OnReviewEditHandler } from './ReviewStepNavigation'

// --- Types & interfaces ---

export interface ReviewStepProps {
  reviewStorageKey?: string
  /** When false, the review row control that highlights the field in the YAML editor is hidden. */
  showYaml?: boolean
}

export type { WizardDomTreeNode } from './ReviewStepContexts'
export { buildTree, type BuildTreeStepContext } from './utils'

export interface ReviewExpandableSectionProps {
  id: string
  label: string
  children?: ReactNode
  /** Shown in the collapsed toggle row (e.g. summary badges). Composed into `toggleContent` because PatternFly `ExpandableSection` has no `collapsedContent` prop. */
  collapsedContent?: ReactNode
  isExpanded: boolean
  onExpandedChange: (expanded: boolean) => void
}

type HorizontalTermWidthModifier = NonNullable<ComponentProps<typeof DescriptionList>['horizontalTermWidthModifier']>

type WizardInputDomNode = Extract<WizardDomTreeNode, { type: InputReviewMeta.INPUT }>

type ReviewRenderCtx = {
  inputGroupMarginLeft: number
  /** Number of nested ARRAY_INPUT ancestors; top-level array body uses 0. */
  arrayInputNesting: number
  onReviewEdit?: OnReviewEditHandler
  /** When false, hide the arrow control that highlights the field in YAML. */
  showYaml?: boolean
  /** When set, top-level {@link InputReviewMeta.ARRAY_INSTANCE} expandables use this state (same storage keys as review sections). */
  getTopLevelArrayInstanceExpanded?: (storageKey: string) => boolean
  onTopLevelArrayInstanceExpandedChange?: (storageKey: string, expanded: boolean) => void
}

type ReviewExpandableStored = {
  sections: Record<string, boolean>
  lastToolbar: ReviewToolbarAction
}

// --- Constants & module scope ---

const REVIEW_HORIZONTAL_TERM_WIDTH_COMPACT: HorizontalTermWidthModifier = {
  default: '12ch',
  sm: '15ch',
  md: '20ch',
  lg: '28ch',
  xl: '30ch',
  '2xl': '35ch',
}

const REVIEW_HORIZONTAL_TERM_WIDTH_WIDE: HorizontalTermWidthModifier = {
  default: '24ch',
  sm: '30ch',
  md: '40ch',
  lg: '56ch',
  xl: '60ch',
  '2xl': '70ch',
}

const REVIEW_ERROR_TEXT_COLOR = 'var(--pf-t--global--text--color--status--danger--default)'

const REVIEW_EXPANDABLE_LS_PREFIX = 'pf-labs-form-wizard-review-expandable-v1'

export function ReviewStep({ reviewStorageKey = 'default', showYaml }: ReviewStepProps) {
  const { reviewLabel } = useStringContext()
  const handleReviewEdit = useReviewEditHandler()
  const { steps } = useWizardContext()
  const stepRegister = useStepRegister()
  // Top-level review sections: order matches the wizard step list; steps not in the wizard go last.
  // Each step contributes the direct children of its DOM tree root (not nested under a single wrapper).
  const sectionRoots = useMemo(() => {
    if (!stepRegister) return []
    const wizardOrder = new Map<string, number>()
    steps.forEach((s, i) => {
      wizardOrder.set(String(s.id), i)
    })
    const registered = [...stepRegister.getSteps()].sort((a, b) => {
      const ia = wizardOrder.has(a.id) ? wizardOrder.get(a.id)! : Number.MAX_SAFE_INTEGER
      const ib = wizardOrder.has(b.id) ? wizardOrder.get(b.id)! : Number.MAX_SAFE_INTEGER
      if (ia !== ib) return ia - ib
      return a.id.localeCompare(b.id)
    })
    const roots: WizardDomTreeNode[] = []
    for (const step of registered) {
      roots.push(...getWizardDomTreeRootChildren(step.tree))
    }
    return roots
  }, [stepRegister, steps])

  const wizardDomTree = useMemo((): WizardDomTreeNode | null => {
    if (sectionRoots.length === 0) return null
    if (sectionRoots.length === 1) return sectionRoots[0]!
    return { children: sectionRoots }
  }, [sectionRoots])

  const sectionKeys = useMemo(() => sectionRoots.map((child, index) => reviewNodeKey(child, index)), [sectionRoots])
  const topLevelArrayInstanceKeys = useMemo(
    () => collectTopLevelArrayInstanceExpandableKeys(wizardDomTree),
    [wizardDomTree]
  )

  const prevStorageBucketRef = useRef<string | null>(null)
  const [lastToolbarAction, setLastToolbarAction] = useState<ReviewToolbarAction>('expand')
  const [sectionExpanded, setSectionExpanded] = useState<Record<string, boolean>>({})

  useLayoutEffect(() => {
    const stored = readReviewExpandableStorage(reviewStorageKey)
    const bucketChanged = prevStorageBucketRef.current !== reviewStorageKey
    if (bucketChanged) {
      prevStorageBucketRef.current = reviewStorageKey
      setLastToolbarAction(stored.lastToolbar)
    }
    if (sectionKeys.length === 0 && topLevelArrayInstanceKeys.length === 0) return

    setSectionExpanded((prev) => {
      const next: Record<string, boolean> = {}
      for (const key of sectionKeys) {
        if (bucketChanged) {
          next[key] = stored.sections[key] !== undefined ? stored.sections[key]! : stored.lastToolbar === 'expand'
        } else if (key in prev) {
          next[key] = prev[key]!
        } else if (stored.sections[key] !== undefined) {
          next[key] = stored.sections[key]!
        } else {
          next[key] = stored.lastToolbar === 'expand'
        }
      }
      for (const key of topLevelArrayInstanceKeys) {
        if (bucketChanged) {
          next[key] = stored.sections[key] !== undefined ? stored.sections[key]! : false
        } else if (key in prev) {
          next[key] = prev[key]!
        } else if (stored.sections[key] !== undefined) {
          next[key] = stored.sections[key]!
        } else {
          next[key] = false
        }
      }
      return next
    })
  }, [reviewStorageKey, sectionKeys, topLevelArrayInstanceKeys])

  useEffect(() => {
    if (sectionKeys.length === 0 && topLevelArrayInstanceKeys.length === 0) return
    writeReviewExpandableStorage(reviewStorageKey, sectionExpanded, lastToolbarAction)
  }, [reviewStorageKey, sectionExpanded, lastToolbarAction, sectionKeys, topLevelArrayInstanceKeys])

  const onSectionExpandedChange = useCallback((key: string, expanded: boolean) => {
    setSectionExpanded((p) => ({ ...p, [key]: expanded }))
  }, [])

  const { onExpandAll, onCollapseAll } = useReviewExpandCollapseHandlers(
    sectionKeys,
    topLevelArrayInstanceKeys,
    setLastToolbarAction,
    setSectionExpanded
  )

  const showExpandToolbarButton = sectionKeys.some((k) => sectionExpanded[k] === false)
  const showCollapseToolbarButton = sectionKeys.some((k) => sectionExpanded[k] !== false)

  return (
    <Step label={reviewLabel} id="review">
      <Stack hasGutter>
        <ReviewStepToolbar
          onExpandAll={onExpandAll}
          onCollapseAll={onCollapseAll}
          showExpand={showExpandToolbarButton}
          showCollapse={showCollapseToolbarButton}
        />
        <Divider />
        {sectionRoots.map((child, index) => {
          const key = reviewNodeKey(child, index)
          return (
            <ReviewExpandableSection
              id={reviewExpandableSectionId(child, index)}
              key={key}
              label={reviewNodeLabel(child)}
              collapsedContent={
                <ReviewCollapsedContent
                  label={reviewNodeLabel(child)}
                  node={child}
                  onReviewEdit={handleReviewEdit}
                  showYaml={showYaml}
                />
              }
              isExpanded={sectionExpanded[key] ?? true}
              onExpandedChange={(expanded) => onSectionExpandedChange(key, expanded)}
            >
              <ReviewSectionBody
                node={child}
                onReviewEdit={handleReviewEdit}
                showYaml={showYaml}
                getTopLevelArrayInstanceExpanded={(k) => sectionExpanded[k] ?? false}
                onTopLevelArrayInstanceExpandedChange={onSectionExpandedChange}
              />
            </ReviewExpandableSection>
          )
        })}
      </Stack>
    </Step>
  )
}

function reviewExpandableStorageKey(reviewStorageKey: string): string {
  return `${REVIEW_EXPANDABLE_LS_PREFIX}:${reviewStorageKey}`
}

function readReviewExpandableStorage(reviewStorageKey: string): ReviewExpandableStored {
  if (typeof localStorage === 'undefined') {
    return { sections: {}, lastToolbar: 'expand' }
  }
  try {
    const raw = localStorage.getItem(reviewExpandableStorageKey(reviewStorageKey))
    if (!raw) return { sections: {}, lastToolbar: 'expand' }
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return { sections: {}, lastToolbar: 'expand' }
    const sections: Record<string, boolean> = {}
    if (
      'sections' in parsed &&
      parsed.sections &&
      typeof parsed.sections === 'object' &&
      !Array.isArray(parsed.sections)
    ) {
      for (const [k, v] of Object.entries(parsed.sections as Record<string, unknown>)) {
        if (typeof v === 'boolean') sections[k] = v
      }
    }
    const lastToolbar =
      'lastToolbar' in parsed && parsed.lastToolbar === 'collapse' ? 'collapse' : ('expand' as ReviewToolbarAction)
    return { sections, lastToolbar }
  } catch {
    return { sections: {}, lastToolbar: 'expand' }
  }
}

function writeReviewExpandableStorage(
  reviewStorageKey: string,
  sections: Record<string, boolean>,
  lastToolbar: ReviewToolbarAction
): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(reviewExpandableStorageKey(reviewStorageKey), JSON.stringify({ sections, lastToolbar }))
  } catch {
    /* ignore quota / private mode */
  }
}

// --- Other components ---

/** PatternFly {@link ExpandableSection} with review-step toggle: {@link Title} when expanded, {@link ToggleContent} when collapsed. */
export function ReviewExpandableSection(props: ReviewExpandableSectionProps) {
  const onToggle = (_event: ReactMouseEvent, expanded: boolean) => {
    props.onExpandedChange(expanded)
  }
  const { label, children, collapsedContent, isExpanded } = props
  return (
    <ExpandableSection
      id={props.id}
      className="wizard-review-expandable-section"
      isExpanded={isExpanded}
      onToggle={onToggle}
      toggleContent={
        isExpanded ? (
          <Title
            headingLevel="h2"
            style={{
              color: 'var(--pf-t--global--text--color--regular)',
            }}
          >
            {label}
          </Title>
        ) : collapsedContent ? (
          <div className="wizard-review-toggle-row">{collapsedContent}</div>
        ) : (
          <ToggleContent label={label} />
        )
      }
    >
      {children}
    </ExpandableSection>
  )
}

function ToggleContent(props: { label: string }) {
  return (
    <div className="wizard-review-toggle-row">
      <Split hasGutter>
        <SplitItem isFilled>{props.label}</SplitItem>
      </Split>
    </div>
  )
}

/** Layout wrapper only; edit pen is shown on review description-list rows (term + value). */
function ReviewDomTreeNodeShell(props: { children: ReactNode }) {
  return <>{props.children}</>
}

function ReviewCollapsedValueBadge(props: {
  content: ReactNode
  error?: string
  inputNode?: WizardDomTreeNode
  onReviewEdit?: OnReviewEditHandler
  showYaml?: boolean
}) {
  const { content, error, inputNode, onReviewEdit, showYaml } = props
  const editable = onReviewEdit != null && inputNode != null
  const yamlVisible = showYaml !== false
  const activateEdit = () => {
    if (inputNode != null && onReviewEdit != null) {
      onReviewEdit(inputNode, yamlVisible ? 'highlight' : 'navigate')
    }
  }
  const badgeProps = editable
    ? {
        role: 'button' as const,
        tabIndex: 0,
        style: { cursor: 'pointer' as const },
        onClick: (e: ReactMouseEvent) => {
          e.stopPropagation()
          activateEdit()
        },
        onKeyDown: (e: ReactKeyboardEvent<HTMLSpanElement>) => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault()
          e.stopPropagation()
          activateEdit()
        },
      }
    : {}
  return (
    <Badge isRead {...badgeProps}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        {content}
        {error ? (
          <Tooltip content={error}>
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <ExclamationCircleIcon color={REVIEW_ERROR_TEXT_COLOR} />
            </span>
          </Tooltip>
        ) : null}
      </span>
    </Badge>
  )
}

/** Renders review content for one wizard section from a {@link WizardDomTreeNode} (step root or wrapper). */
export function ReviewSectionBody(props: {
  node: WizardDomTreeNode
  onReviewEdit?: OnReviewEditHandler
  showYaml?: boolean
  getTopLevelArrayInstanceExpanded?: (storageKey: string) => boolean
  onTopLevelArrayInstanceExpandedChange?: (storageKey: string, expanded: boolean) => void
}) {
  const bodyNodes = getReviewSectionBodyNodes(props.node)
  return (
    <Fragment>
      {renderReviewNodeSequence(
        bodyNodes,
        {
          inputGroupMarginLeft: 32,
          arrayInputNesting: 0,
          onReviewEdit: props.onReviewEdit,
          showYaml: props.showYaml,
          getTopLevelArrayInstanceExpanded: props.getTopLevelArrayInstanceExpanded,
          onTopLevelArrayInstanceExpandedChange: props.onTopLevelArrayInstanceExpandedChange,
        },
        false
      )}
    </Fragment>
  )
}

/** Collapsed review row: section {@link Title} plus summary {@link Badge}s derived from the section DOM tree. */
export function ReviewCollapsedContent(props: {
  label: string
  node: WizardDomTreeNode
  onReviewEdit?: OnReviewEditHandler
  showYaml?: boolean
  titleHeadingLevel?: ComponentProps<typeof Title>['headingLevel']
}) {
  const { titleHeadingLevel = 'h2' } = props
  const bodyNodes = getReviewSectionBodyNodes(props.node)
  const badges = renderCollapsedBadgesFromNodes(bodyNodes, props.onReviewEdit, props.showYaml)
  return (
    <Split hasGutter className="wizard-review-collapsed-split">
      <SplitItem>
        <Title
          className="wizard-review-collapsed-title"
          headingLevel={titleHeadingLevel}
          style={{
            color: 'var(--pf-t--global--text--color--regular)',
          }}
        >
          {props.label}
        </Title>
      </SplitItem>
      <SplitItem isFilled>
        <div className="wizard-review-toggle-entries">
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            flexWrap={{ default: 'wrap' }}
            justifyContent={{ default: 'justifyContentCenter' }}
            spaceItems={{ default: 'spaceItemsSm' }}
          >
            {badges}
          </Flex>
        </div>
      </SplitItem>
    </Split>
  )
}

function renderCollapsedBadgesFromNodes(
  nodes: WizardDomTreeNode[],
  onReviewEdit?: OnReviewEditHandler,
  showYaml?: boolean
): ReactNode[] {
  const out: ReactNode[] = []
  for (let i = 0; i < nodes.length; i++) {
    const child = nodes[i]!
    if (isReviewInputNode(child)) {
      if (!child.error && isReviewInputRowValueHidden(child.value)) {
        continue
      }
      const collapsedInputContent = child.error ? (
        child.label ?? child.path
      ) : child.value === true ? (
        <CheckIcon aria-hidden />
      ) : (
        renderReviewInputDescriptionContent(child)
      )
      out.push(
        <ReviewCollapsedValueBadge
          key={`collapsed-input-${child.path}`}
          content={collapsedInputContent}
          error={child.error}
          inputNode={child}
          onReviewEdit={onReviewEdit}
          showYaml={showYaml}
        />
      )
      continue
    }
    if (isReviewArrayInputNode(child)) {
      const arrChildren = child.children ?? []
      arrChildren.forEach((inst, j) => {
        if (!isReviewArrayInstanceNode(inst)) return
        const instLabel = inst.label && inst.label !== '' ? inst.label : undefined
        if (!instLabel) return
        const err = reviewCollapsedNodeError(inst)
        const pathPart = inst.path ?? String(j)
        out.push(
          <ReviewCollapsedValueBadge
            key={`collapsed-array-${child.path}-${pathPart}`}
            content={instLabel}
            error={err}
            inputNode={inst}
            onReviewEdit={onReviewEdit}
            showYaml={showYaml}
          />
        )
      })
      continue
    }
    if (isReviewSectionNode(child) || !('type' in child)) {
      out.push(...renderCollapsedBadgesFromNodes(child.children ?? [], onReviewEdit, showYaml))
      continue
    }
    if (isReviewArrayInstanceNode(child)) {
      out.push(...renderCollapsedBadgesFromNodes(child.children ?? [], onReviewEdit, showYaml))
      continue
    }
  }
  return out
}

function reviewCollapsedNodeError(node: WizardDomTreeNode): string | undefined {
  if ('error' in node && typeof (node as { error?: unknown }).error === 'string') {
    return (node as { error: string }).error
  }
  for (const child of node.children ?? []) {
    const err = reviewCollapsedNodeError(child)
    if (err !== undefined) return err
  }
  return undefined
}

// --- Shared helpers (used by multiple components or exported) ---

function isReviewInputNode(node: WizardDomTreeNode): node is WizardInputDomNode {
  return 'type' in node && node.type === InputReviewMeta.INPUT
}

function isReviewArrayInputNode(
  node: WizardDomTreeNode
): node is Extract<WizardDomTreeNode, { type: InputReviewMeta.ARRAY_INPUT }> {
  return 'type' in node && node.type === InputReviewMeta.ARRAY_INPUT
}

function isReviewSectionNode(
  node: WizardDomTreeNode
): node is Extract<WizardDomTreeNode, { type: InputReviewMeta.SECTION }> {
  return 'type' in node && node.type === InputReviewMeta.SECTION
}

function isReviewArrayInstanceNode(
  node: WizardDomTreeNode
): node is Extract<WizardDomTreeNode, { type: InputReviewMeta.ARRAY_INSTANCE }> {
  return 'type' in node && node.type === InputReviewMeta.ARRAY_INSTANCE
}

/** Top-level review sections: either `{ children: [...] }` from multiple roots, or a single tree node. */
function getWizardDomTreeRootChildren(root: WizardDomTreeNode | null): WizardDomTreeNode[] {
  if (!root || Object.keys(root).length === 0) return []
  const keys = Object.keys(root)
  if (keys.length === 1 && keys[0] === 'children') {
    return root.children ?? []
  }
  return [root]
}

/** Last `.`-delimited segment that is not entirely digits; used for review labels derived from paths/ids. */
function formatReviewPathOrIdLabel(raw: string): string {
  if (!raw) return ''
  const segments = raw.split('.')
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i]!
    if (seg !== '' && !/^\d+$/.test(seg)) {
      return seg.charAt(0).toUpperCase() + seg.slice(1)
    }
  }
  const fallback = segments[segments.length - 1] ?? raw
  return fallback.charAt(0).toUpperCase() + fallback.slice(1)
}

function reviewNodeLabel(node: WizardDomTreeNode): string {
  if ('label' in node && node.label) return node.label
  if (!('type' in node)) return ''
  switch (node.type) {
    case InputReviewMeta.SECTION:
      return node.label && node.label !== '' ? node.label : formatReviewPathOrIdLabel(node.id)
    case InputReviewMeta.INPUT:
    case InputReviewMeta.ARRAY_INPUT:
      return formatReviewPathOrIdLabel(node.path)
    case InputReviewMeta.ARRAY_INSTANCE:
      return formatReviewPathOrIdLabel(node.path ?? '')
    default:
      return ''
  }
}

function reviewNodeKey(node: WizardDomTreeNode, index: number): string {
  if (!('type' in node)) return `node-${index}`
  switch (node.type) {
    case InputReviewMeta.INPUT:
      return `input-${node.path}`
    case InputReviewMeta.SECTION:
      return `step-${node.id}`
    case InputReviewMeta.ARRAY_INPUT:
      return `array-${node.path}`
    case InputReviewMeta.ARRAY_INSTANCE:
      return `inst-${node.path ?? index}`
    default:
      return `node-${index}`
  }
}

/** DOM id for top-level review expandables; wrapper-only roots have no `id`, use the same key as localStorage. */
function reviewExpandableSectionId(node: WizardDomTreeNode, index: number): string {
  if ('type' in node) return node.id
  return reviewNodeKey(node, index)
}

function getReviewSectionBodyNodes(node: WizardDomTreeNode): WizardDomTreeNode[] {
  if (!('type' in node)) {
    return node.children ?? []
  }
  if (node.type === InputReviewMeta.SECTION) {
    return node.children ?? []
  }
  return [node]
}

/** Storage keys for {@link ReviewTopLevelArrayInstanceExpandable} — same `sections` map as review step expandables. */
function collectTopLevelArrayInstanceExpandableKeys(root: WizardDomTreeNode | null): string[] {
  const out: string[] = []
  if (!root) return out

  const walkSequence = (nodes: WizardDomTreeNode[], arrayInputNesting: number) => {
    let i = 0
    while (i < nodes.length) {
      const n = nodes[i]!
      if (isReviewInputNode(n)) {
        while (i < nodes.length && isReviewInputNode(nodes[i]!)) i++
        continue
      }
      if (isReviewArrayInputNode(n)) {
        const children = n.children ?? []
        children.forEach((child, index) => {
          if (isReviewArrayInstanceNode(child) && arrayInputNesting === 0) {
            out.push(reviewNodeKey(child, index))
          }
          if (isReviewArrayInstanceNode(child)) {
            walkSequence(child.children ?? [], arrayInputNesting + 1)
          }
        })
        i++
        continue
      }
      if (isReviewSectionNode(n) || !('type' in n)) {
        walkSequence(n.children ?? [], arrayInputNesting)
        i++
        continue
      }
      if (isReviewArrayInstanceNode(n)) {
        if (arrayInputNesting === 0) {
          out.push(reviewNodeKey(n, i))
        }
        walkSequence(n.children ?? [], arrayInputNesting + 1)
        i++
        continue
      }
      i++
    }
  }

  for (const sectionRoot of getWizardDomTreeRootChildren(root)) {
    walkSequence(getReviewSectionBodyNodes(sectionRoot), 0)
  }
  return [...new Set(out)]
}

function formatReviewValue(value: unknown): ReactNode {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  if (value === true) return ''
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function isReviewValueUnset(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string' && value === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

/** True when the review row should be omitted: no user-visible value (still show rows with errors). */
function isReviewInputRowValueHidden(value: unknown): boolean {
  if (value === false) return true
  return isReviewValueUnset(value)
}

function renderReviewInputDescriptionContent(node: WizardInputDomNode): ReactNode {
  if (node.error) {
    return <span style={{ color: REVIEW_ERROR_TEXT_COLOR, fontStyle: 'italic' }}>{node.error}</span>
  }
  if (!isReviewValueUnset(node.value)) {
    return formatReviewValue(node.value)
  }
  return <></>
}

function horizontalTermWidthModifierForInputRun(nodes: readonly WizardInputDomNode[]): HorizontalTermWidthModifier {
  let maxLen = 0
  for (const n of nodes) {
    const termText = n.label ?? n.path
    maxLen = Math.max(maxLen, termText.length)
  }
  return maxLen < 64 ? REVIEW_HORIZONTAL_TERM_WIDTH_COMPACT : REVIEW_HORIZONTAL_TERM_WIDTH_WIDE
}

/** Base margin 32px; each nested ARRAY_INPUT adds 2px. */
function reviewArrayInstanceMarginLeft(arrayInputNesting: number): number {
  return 32 + 2 * arrayInputNesting
}

function shouldShowArrayInstanceTitle(
  node: Extract<WizardDomTreeNode, { type: InputReviewMeta.ARRAY_INSTANCE }>
): boolean {
  if (!node.label) return false
  if (node.path !== undefined && node.path !== '' && node.label === node.path) return false
  return true
}

function ReviewTopLevelArrayInstanceExpandable(props: {
  toggleLabel: string
  instanceNode: WizardDomTreeNode
  isExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  onReviewEdit?: OnReviewEditHandler
  showYaml?: boolean
  children: ReactNode
}) {
  const [localExpanded, setLocalExpanded] = useState(false)
  const isControlled = props.isExpanded !== undefined && props.onExpandedChange !== undefined
  const isExpanded = isControlled ? props.isExpanded! : localExpanded
  const onToggle = (_event: ReactMouseEvent, expanded: boolean) => {
    if (isControlled) props.onExpandedChange!(expanded)
    else setLocalExpanded(expanded)
  }
  return (
    <ExpandableSection
      className="wizard-review-expandable-section"
      isExpanded={isExpanded}
      onToggle={onToggle}
      toggleContent={
        isExpanded ? (
          <span className={css(titleStyles.title, titleStyles.modifiers.h4, 'wizard-review-expanded-title')}>
            {props.toggleLabel}
          </span>
        ) : (
          <div className="wizard-review-toggle-row">
            <ReviewCollapsedContent
              label={props.toggleLabel}
              node={props.instanceNode}
              onReviewEdit={props.onReviewEdit}
              showYaml={props.showYaml}
              titleHeadingLevel="h4"
            />
          </div>
        )
      }
    >
      {isExpanded ? props.children : null}
    </ExpandableSection>
  )
}

/** Pen / YAML controls on the instance row only when collapsed; expanded state from review storage or local fallback. */
function TopLevelArrayInstancePenWrap(props: {
  storageKey: string
  toggleLabel: string
  instanceNode: WizardDomTreeNode
  onReviewEdit?: OnReviewEditHandler
  showYaml?: boolean
  children: ReactNode
  getTopLevelArrayInstanceExpanded?: (key: string) => boolean
  onTopLevelArrayInstanceExpandedChange?: (key: string, expanded: boolean) => void
}) {
  const useCtx =
    props.getTopLevelArrayInstanceExpanded !== undefined && props.onTopLevelArrayInstanceExpandedChange !== undefined
  const [internalExpanded, setInternalExpanded] = useState(false)

  const isExpanded = useCtx ? props.getTopLevelArrayInstanceExpanded!(props.storageKey) : internalExpanded

  const onExpandedChange = useCallback(
    (expanded: boolean) => {
      if (useCtx) props.onTopLevelArrayInstanceExpandedChange!(props.storageKey, expanded)
      else setInternalExpanded(expanded)
    },
    [useCtx, props.storageKey, props.onTopLevelArrayInstanceExpandedChange]
  )

  const expandable = (
    <ReviewTopLevelArrayInstanceExpandable
      toggleLabel={props.toggleLabel}
      instanceNode={props.instanceNode}
      isExpanded={isExpanded}
      onExpandedChange={onExpandedChange}
      onReviewEdit={props.onReviewEdit}
      showYaml={props.showYaml}
    >
      {props.children}
    </ReviewTopLevelArrayInstanceExpandable>
  )

  const { onReviewEdit, instanceNode: node, showYaml } = props
  if (onReviewEdit == null) return expandable

  if (isExpanded) return expandable

  const yamlVisible = showYaml !== false
  return (
    <ReviewPenHoverZone
      ariaLabel="Edit"
      zoneClickable={false}
      onPenClick={() => onReviewEdit(node, yamlVisible ? 'highlight' : 'navigate')}
      onPenIconClick={() => onReviewEdit(node, 'navigate')}
      onArrowClick={yamlVisible ? () => onReviewEdit(node, 'highlight') : undefined}
    >
      {expandable}
    </ReviewPenHoverZone>
  )
}

function renderReviewInputRows(nodes: readonly WizardInputDomNode[], ctx: ReviewRenderCtx): ReactNode {
  const visibleNodes = nodes.filter((n) => n.error || !isReviewInputRowValueHidden(n.value))
  if (visibleNodes.length === 0) return null
  const mod = horizontalTermWidthModifierForInputRun(visibleNodes)
  const onReviewEdit = ctx.onReviewEdit
  return (
    <DescriptionList
      key={`dl-${visibleNodes[0]!.path}`}
      isHorizontal
      horizontalTermWidthModifier={mod}
      style={{ rowGap: 0 }}
    >
      {visibleNodes.map((inputNode) => {
        const termText = inputNode.label ?? inputNode.path
        const termContent =
          !inputNode.error && inputNode.value === true ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <CheckIcon aria-hidden />
              {termText}
            </span>
          ) : (
            termText
          )
        const valueContent = inputNode.error ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {renderReviewInputDescriptionContent(inputNode)}
            <ExclamationCircleIcon color={REVIEW_ERROR_TEXT_COLOR} />
          </span>
        ) : (
          renderReviewInputDescriptionContent(inputNode)
        )
        const yamlVisible = ctx.showYaml !== false
        return (
          <DescriptionListGroup key={inputNode.path} style={{ marginLeft: ctx.inputGroupMarginLeft }}>
            {onReviewEdit != null ? (
              <ReviewPenHoverZone
                ariaLabel="Edit"
                descriptionListTerm={termContent}
                descriptionListDescriptionId={inputNode.id}
                onPenClick={() => onReviewEdit(inputNode, yamlVisible ? 'highlight' : 'navigate')}
                onPenIconClick={() => onReviewEdit(inputNode, 'navigate')}
                onArrowClick={yamlVisible ? () => onReviewEdit(inputNode, 'highlight') : undefined}
              >
                {valueContent}
              </ReviewPenHoverZone>
            ) : (
              <>
                <DescriptionListTerm>{termContent}</DescriptionListTerm>
                <DescriptionListDescription id={inputNode.id ?? ''}>
                  <span className="wizard-review-inline-value">{valueContent}</span>
                </DescriptionListDescription>
              </>
            )}
          </DescriptionListGroup>
        )
      })}
    </DescriptionList>
  )
}

function renderReviewNodeSequence(
  nodes: WizardDomTreeNode[],
  ctx: ReviewRenderCtx,
  afterDescriptionListGroup: boolean
): ReactNode[] {
  const out: ReactNode[] = []
  let i = 0
  let precedingDlGroup = afterDescriptionListGroup
  while (i < nodes.length) {
    const n = nodes[i]!
    if (isReviewInputNode(n)) {
      const run: WizardInputDomNode[] = []
      while (i < nodes.length && isReviewInputNode(nodes[i]!)) {
        run.push(nodes[i] as WizardInputDomNode)
        i++
      }
      out.push(renderReviewInputRows(run, ctx))
      precedingDlGroup = true
      continue
    }
    if (isReviewArrayInputNode(n)) {
      out.push(renderReviewArrayInputSection(n, ctx, precedingDlGroup))
      precedingDlGroup = false
      i++
      continue
    }
    if (isReviewSectionNode(n) || !('type' in n)) {
      const inner = n.children ?? []
      const shellKey = isReviewSectionNode(n) ? `step-${n.id}` : 'children-wrap'
      out.push(
        <ReviewDomTreeNodeShell key={shellKey}>
          <Fragment>{renderReviewNodeSequence(inner, ctx, precedingDlGroup)}</Fragment>
        </ReviewDomTreeNodeShell>
      )
      precedingDlGroup = false
      i++
      continue
    }
    if (isReviewArrayInstanceNode(n)) {
      out.push(renderReviewArrayInstanceContainer(n, ctx, precedingDlGroup, undefined, i))
      precedingDlGroup = false
      i++
      continue
    }
    i++
  }
  return out
}

function renderReviewArrayInputSection(
  node: Extract<WizardDomTreeNode, { type: InputReviewMeta.ARRAY_INPUT }>,
  ctx: ReviewRenderCtx,
  afterDescriptionListGroup: boolean
): ReactNode {
  const children = node.children ?? []
  const marginLeft = reviewArrayInstanceMarginLeft(ctx.arrayInputNesting)
  return (
    <ReviewDomTreeNodeShell key={`array-${node.path}`}>
      <Fragment>
        {children.map((child, index) =>
          renderReviewArrayInstanceContainer(child, ctx, afterDescriptionListGroup && index === 0, marginLeft, index)
        )}
      </Fragment>
    </ReviewDomTreeNodeShell>
  )
}

function renderReviewArrayInstanceContainer(
  node: WizardDomTreeNode,
  ctx: ReviewRenderCtx,
  addTopMarginAfterDl: boolean,
  /** When omitted, derived from ctx.arrayInputNesting */
  marginLeftOverride?: number,
  instanceIndex = 0
): ReactNode {
  const marginLeft = marginLeftOverride ?? reviewArrayInstanceMarginLeft(ctx.arrayInputNesting)
  const innerCtx: ReviewRenderCtx = {
    inputGroupMarginLeft: 8,
    arrayInputNesting: ctx.arrayInputNesting + 1,
    onReviewEdit: ctx.onReviewEdit,
    showYaml: ctx.showYaml,
    getTopLevelArrayInstanceExpanded: ctx.getTopLevelArrayInstanceExpanded,
    onTopLevelArrayInstanceExpandedChange: ctx.onTopLevelArrayInstanceExpandedChange,
  }
  const key = reviewNodeKey(node, instanceIndex)
  const showTitle = isReviewArrayInstanceNode(node) && shouldShowArrayInstanceTitle(node)
  const childNodes = node.children ?? []
  const isTopLevelArrayInstance = isReviewArrayInstanceNode(node) && ctx.arrayInputNesting === 0
  const paddedBody = (
    <div
      style={{
        paddingLeft: 12,
      }}
    >
      {renderReviewNodeSequence(childNodes, innerCtx, false)}
    </div>
  )

  const topLevelToggleLabel =
    showTitle && node.label ? node.label : reviewNodeLabel(node) || `Item ${instanceIndex + 1}`

  return (
    <ReviewDomTreeNodeShell key={key}>
      <div
        style={{
          marginLeft,
          marginBottom: 16,
          marginTop: addTopMarginAfterDl ? 24 : undefined,
        }}
      >
        {isTopLevelArrayInstance ? (
          <TopLevelArrayInstancePenWrap
            storageKey={key}
            toggleLabel={topLevelToggleLabel}
            instanceNode={node}
            onReviewEdit={ctx.onReviewEdit}
            showYaml={ctx.showYaml}
            getTopLevelArrayInstanceExpanded={ctx.getTopLevelArrayInstanceExpanded}
            onTopLevelArrayInstanceExpandedChange={ctx.onTopLevelArrayInstanceExpandedChange}
          >
            {paddedBody}
          </TopLevelArrayInstancePenWrap>
        ) : (
          <Fragment>
            {showTitle ? (
              <div style={{ marginBottom: 16 }} className={css(titleStyles.title, titleStyles.modifiers.h4)}>
                {node.label}
              </div>
            ) : null}
            {paddedBody}
          </Fragment>
        )}
      </div>
    </ReviewDomTreeNodeShell>
  )
}
