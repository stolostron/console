/* Copyright Contributors to the Open Cluster Management project */
import {
  Badge,
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  ExpandableSection,
  Flex,
  FlexItem,
  Split,
  SplitItem,
  Stack,
  Title,
  Toolbar,
  ToolbarContent,
  Tooltip,
  useWizardContext,
} from '@patternfly/react-core'
import { css } from '@patternfly/react-styles'
import titleStyles from '@patternfly/react-styles/css/components/Title/title'
import { ExclamationCircleIcon, PenIcon } from '@patternfly/react-icons'
import {
  createContext,
  Fragment,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useHighlightEditorPath } from './contexts/HighlightEditorPathContext'
import { useReviewDomTreeVersion } from './contexts/ReviewDomTreeSyncContext'
import { useStringContext } from './contexts/StringContext'
import { InputReviewStepMeta, InputReviewMeta, useStepInputsRegistry } from './contexts/StepInputsContext'
import { Step } from './Step'
import './ReviewStep.css'

// --- Types & interfaces ---

export interface ReviewStepProps {
  wizardRef?: RefObject<HTMLDivElement | null>
  reviewStorageKey?: string
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

export interface ReviewExpandableSectionProps {
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
  onReviewEdit?: (node: WizardDomTreeNode) => void
  /** When set, top-level {@link InputReviewMeta.ARRAY_INSTANCE} expandables use this state (same storage keys as review sections). */
  getTopLevelArrayInstanceExpanded?: (storageKey: string) => boolean
  onTopLevelArrayInstanceExpandedChange?: (storageKey: string, expanded: boolean) => void
}

type ReviewToolbarAction = 'expand' | 'collapse'

type ReviewExpandableStored = {
  sections: Record<string, boolean>
  lastToolbar: ReviewToolbarAction
}

type ReviewStepToolbarProps = {
  onExpandAll: () => void
  onCollapseAll: () => void
  showExpand: boolean
  showCollapse: boolean
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

const REVIEW_EDIT_TARGET_HIGHLIGHT_CLASS = 'wizard-review-edit-target-highlight'
const REVIEW_EDIT_TARGET_HIGHLIGHT_VISIBLE_CLASS = 'wizard-review-edit-target-highlight--visible'
const REVIEW_EDIT_TARGET_HIGHLIGHT_EASE_OUT_CLASS = 'wizard-review-edit-target-highlight--ease-out'
const REVIEW_EDIT_HIGHLIGHT_EASE_OUT_MS = 500

const REVIEW_PEN_HOVER_REVEAL_MS = 200

const REVIEW_ERROR_TEXT_COLOR = 'var(--pf-t--global--text--color--status--danger--default)'

const REVIEW_EXPANDABLE_LS_PREFIX = 'pf-labs-form-wizard-review-expandable-v1'

/** Nested review pen zones call this so only the innermost hovered region can show the pen after the delay. */
const ReviewPenParentCancelContext = createContext<(() => void) | undefined>(undefined)
ReviewPenParentCancelContext.displayName = 'ReviewPenParentCancelContext'

const reviewEditHighlightTeardownByEl = new WeakMap<Element, () => void>()

// --- ReviewStep ---

export function ReviewStep({ wizardRef, reviewStorageKey = 'default' }: ReviewStepProps) {
  const { reviewLabel } = useStringContext()
  const { goToStepById } = useWizardContext()
  const { setHighlightEditorPath } = useHighlightEditorPath()
  const stepInputsRegistry = useStepInputsRegistry()
  const reviewDomTreeVersion = useReviewDomTreeVersion()
  const stepInputMapRef = stepInputsRegistry?.get()
  const wizardDomTreeRef = useRef<WizardDomTreeNode | null>(null)
  const [wizardDomTree, setWizardDomTree] = useState<WizardDomTreeNode | null>(null)
  useLayoutEffect(() => {
    const root = wizardRef?.current
    if (!root) return
    const treeData = buildTree(root, stepInputMapRef?.current ?? new Map<string, InputReviewStepMeta>())
    wizardDomTreeRef.current = treeData
    setWizardDomTree(treeData)
  }, [wizardRef, stepInputMapRef, reviewDomTreeVersion])

  const sectionRoots = useMemo(() => getWizardDomTreeRootChildren(wizardDomTree), [wizardDomTree])
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

  /** Uniform expand: clears per-section differences for persisted state. */
  const onExpandAll = useCallback(() => {
    setLastToolbarAction('expand')
    setSectionExpanded(() => {
      const next: Record<string, boolean> = {}
      for (const k of sectionKeys) next[k] = true
      for (const k of topLevelArrayInstanceKeys) next[k] = false
      return next
    })
  }, [sectionKeys, topLevelArrayInstanceKeys])

  /** Uniform collapse: clears per-section differences for persisted state. */
  const onCollapseAll = useCallback(() => {
    setLastToolbarAction('collapse')
    setSectionExpanded(() => {
      const next: Record<string, boolean> = {}
      for (const k of sectionKeys) next[k] = false
      for (const k of topLevelArrayInstanceKeys) next[k] = false
      return next
    })
  }, [sectionKeys, topLevelArrayInstanceKeys])

  const handleReviewEdit = useCallback(
    (node: WizardDomTreeNode) => {
      const yamlPath = getReviewNodeYamlHighlightPath(node)
      if (yamlPath !== undefined) setHighlightEditorPath(yamlPath)
      const stepId = getReviewNodeStepId(node)
      const domId = getReviewScrollTargetDomId(node)
      if (stepId) goToStepById(stepId)
      if (domId) scrollReviewEditTargetIntoView(domId)
    },
    [goToStepById, setHighlightEditorPath]
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
              key={key}
              label={reviewNodeLabel(child)}
              collapsedContent={
                <ReviewCollapsedContent label={reviewNodeLabel(child)} node={child} onReviewEdit={handleReviewEdit} />
              }
              isExpanded={sectionExpanded[key] ?? true}
              onExpandedChange={(expanded) => onSectionExpandedChange(key, expanded)}
            >
              <ReviewSectionBody
                node={child}
                onReviewEdit={handleReviewEdit}
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

function ReviewStepToolbar(props: ReviewStepToolbarProps) {
  const { reviewExpandAllTooltip, reviewCollapseAllTooltip } = useStringContext()
  const toolbarItems = (
    <Flex direction={{ default: 'row' }} style={{ width: '100%' }}>
      <FlexItem flex={{ default: 'flex_1' }} />
      {props.showExpand ? (
        <FlexItem>
          <Button variant="link" onClick={props.onExpandAll}>
            {reviewExpandAllTooltip}
          </Button>
        </FlexItem>
      ) : null}
      {props.showCollapse ? (
        <FlexItem>
          <Button variant="link" onClick={props.onCollapseAll}>
            {reviewCollapseAllTooltip}
          </Button>
        </FlexItem>
      ) : null}
    </Flex>
  )

  return (
    <Toolbar
      className="pf-m-toggle-group-container"
      style={{
        rowGap: '14px',
        width: '100%',
      }}
    >
      <ToolbarContent>{toolbarItems}</ToolbarContent>
    </Toolbar>
  )
}

function ReviewPenHoverZone({
  as,
  style,
  children,
  ariaLabel,
  onPenClick,
}: {
  as?: 'div' | 'span'
  style?: CSSProperties
  children: ReactNode
  ariaLabel: string
  onPenClick: (e: ReactMouseEvent<HTMLElement>) => void
}) {
  const cancelParentPen = useContext(ReviewPenParentCancelContext)
  const [penVisible, setPenVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const cancelMe = useCallback(() => {
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current)
      timerRef.current = undefined
    }
    setPenVisible(false)
  }, [])

  const onEnter = useCallback(() => {
    cancelParentPen?.()
    if (timerRef.current !== undefined) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setPenVisible(true), REVIEW_PEN_HOVER_REVEAL_MS)
  }, [cancelParentPen])

  const onLeave = useCallback(() => {
    cancelMe()
  }, [cancelMe])

  useEffect(
    () => () => {
      if (timerRef.current !== undefined) clearTimeout(timerRef.current)
    },
    []
  )

  const Comp = as ?? 'div'
  const penRevealedClass = penVisible ? ' wizard-review-edit-btn--revealed' : ''
  const zoneClassName = 'wizard-review-pen-hover-zone wizard-review-inline-value'

  const onZoneClick = useCallback(
    (e: ReactMouseEvent<HTMLElement>) => {
      const t = e.target as HTMLElement | null
      if (t?.closest?.('.wizard-review-edit-btn')) return
      e.stopPropagation()
      onPenClick(e)
    },
    [onPenClick]
  )

  return (
    <ReviewPenParentCancelContext.Provider value={cancelMe}>
      <Comp className={zoneClassName} style={style} onMouseEnter={onEnter} onMouseLeave={onLeave} onClick={onZoneClick}>
        {children}
        <Button
          type="button"
          variant="plain"
          className={`wizard-review-edit-btn${penRevealedClass}`}
          aria-label={ariaLabel}
          onClick={(e) => {
            e.stopPropagation()
            onPenClick(e)
          }}
        >
          <PenIcon />
        </Button>
      </Comp>
    </ReviewPenParentCancelContext.Provider>
  )
}

/** Layout wrapper only; edit pen is shown only inside {@link DescriptionListDescription} rows. */
function ReviewDomTreeNodeShell(props: { children: ReactNode }) {
  return <>{props.children}</>
}

function ReviewCollapsedValueBadge(props: {
  content: ReactNode
  error?: string
  inputNode?: WizardDomTreeNode
  onReviewEdit?: (node: WizardDomTreeNode) => void
}) {
  const { content, error, inputNode, onReviewEdit } = props
  const editable = onReviewEdit != null && inputNode != null
  const activateEdit = () => {
    if (inputNode != null && onReviewEdit != null) onReviewEdit(inputNode)
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
  onReviewEdit?: (node: WizardDomTreeNode) => void
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
  onReviewEdit?: (node: WizardDomTreeNode) => void
  titleHeadingLevel?: ComponentProps<typeof Title>['headingLevel']
}) {
  const { titleHeadingLevel = 'h2' } = props
  const bodyNodes = getReviewSectionBodyNodes(props.node)
  const badges = renderCollapsedBadgesFromNodes(bodyNodes, props.onReviewEdit)
  return (
    <Split hasGutter>
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
          <Flex spaceItems={{ default: 'spaceItemsSm' }} flexWrap={{ default: 'wrap' }}>
            {badges}
          </Flex>
        </div>
      </SplitItem>
    </Split>
  )
}

function renderCollapsedBadgesFromNodes(
  nodes: WizardDomTreeNode[],
  onReviewEdit?: (node: WizardDomTreeNode) => void
): ReactNode[] {
  const out: ReactNode[] = []
  for (let i = 0; i < nodes.length; i++) {
    const child = nodes[i]!
    if (isReviewInputNode(child)) {
      if (isReviewValueUnset(child.value) && !child.error) {
        continue
      }
      out.push(
        <ReviewCollapsedValueBadge
          key={`collapsed-input-${child.path}`}
          content={child.error ? child.label ?? child.path : renderReviewInputDescriptionContent(child)}
          error={child.error}
          inputNode={child}
          onReviewEdit={onReviewEdit}
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
          />
        )
      })
      continue
    }
    if (isReviewStepNode(child) || !('type' in child)) {
      out.push(...renderCollapsedBadgesFromNodes(child.children ?? [], onReviewEdit))
      continue
    }
    if (isReviewArrayInstanceNode(child)) {
      out.push(...renderCollapsedBadgesFromNodes(child.children ?? [], onReviewEdit))
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

function isReviewStepNode(node: WizardDomTreeNode): node is Extract<WizardDomTreeNode, { type: InputReviewMeta.STEP }> {
  return 'type' in node && node.type === InputReviewMeta.STEP
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

function reviewNodeLabel(node: WizardDomTreeNode): string {
  if ('label' in node && node.label) return node.label
  if (!('type' in node)) return ''
  switch (node.type) {
    case InputReviewMeta.STEP:
      return node.id
    case InputReviewMeta.INPUT:
    case InputReviewMeta.ARRAY_INPUT:
      return node.path
    case InputReviewMeta.ARRAY_INSTANCE:
      return node.path ?? ''
    default:
      return ''
  }
}

function reviewNodeKey(node: WizardDomTreeNode, index: number): string {
  if (!('type' in node)) return `node-${index}`
  switch (node.type) {
    case InputReviewMeta.INPUT:
      return `input-${node.path}`
    case InputReviewMeta.STEP:
      return `step-${node.id}`
    case InputReviewMeta.ARRAY_INPUT:
      return `array-${node.path}`
    case InputReviewMeta.ARRAY_INSTANCE:
      return `inst-${node.path ?? index}`
    default:
      return `node-${index}`
  }
}

function getReviewSectionBodyNodes(node: WizardDomTreeNode): WizardDomTreeNode[] {
  if (!('type' in node)) {
    return node.children ?? []
  }
  if (node.type === InputReviewMeta.STEP) {
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
      if (isReviewStepNode(n) || !('type' in n)) {
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

function formatReviewValue(value: unknown): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
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

function renderReviewInputDescriptionContent(node: WizardInputDomNode): ReactNode {
  if (node.error) {
    return <span style={{ color: REVIEW_ERROR_TEXT_COLOR, fontStyle: 'italic' }}>{node.error}</span>
  }
  if (!isReviewValueUnset(node.value)) {
    return formatReviewValue(node.value)
  }
  return <span style={{ fontStyle: 'italic' }}>{'<not set>'}</span>
}

function horizontalTermWidthModifierForInputRun(nodes: readonly WizardInputDomNode[]): HorizontalTermWidthModifier {
  let maxLen = 0
  for (const n of nodes) {
    const termText = n.label ?? n.path
    maxLen = Math.max(maxLen, termText.length)
  }
  return maxLen < 64 ? REVIEW_HORIZONTAL_TERM_WIDTH_COMPACT : REVIEW_HORIZONTAL_TERM_WIDTH_WIDE
}

/** Top-level array section uses 16px; each nested ARRAY_INPUT adds 16px (not 16). */
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
  onReviewEdit?: (node: WizardDomTreeNode) => void
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
          <span className={css(titleStyles.title, titleStyles.modifiers.h4)}>{props.toggleLabel}</span>
        ) : (
          <div className="wizard-review-toggle-row">
            <ReviewCollapsedContent
              label={props.toggleLabel}
              node={props.instanceNode}
              onReviewEdit={props.onReviewEdit}
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

function renderReviewInputRows(nodes: readonly WizardInputDomNode[], ctx: ReviewRenderCtx): ReactNode {
  const mod = horizontalTermWidthModifierForInputRun(nodes)
  const onReviewEdit = ctx.onReviewEdit
  return (
    <DescriptionList key={`dl-${nodes[0]!.path}`} isHorizontal horizontalTermWidthModifier={mod} style={{ rowGap: 0 }}>
      {nodes.map((inputNode) => {
        const termText = inputNode.label ?? inputNode.path
        const valueContent = inputNode.error ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {renderReviewInputDescriptionContent(inputNode)}
            <ExclamationCircleIcon color={REVIEW_ERROR_TEXT_COLOR} />
          </span>
        ) : (
          renderReviewInputDescriptionContent(inputNode)
        )
        return (
          <DescriptionListGroup key={inputNode.path} style={{ marginLeft: ctx.inputGroupMarginLeft }}>
            <DescriptionListTerm>{termText}</DescriptionListTerm>
            <DescriptionListDescription>
              {onReviewEdit != null ? (
                <ReviewPenHoverZone as="span" ariaLabel="Edit" onPenClick={() => onReviewEdit(inputNode)}>
                  {valueContent}
                </ReviewPenHoverZone>
              ) : (
                <span className="wizard-review-inline-value">{valueContent}</span>
              )}
            </DescriptionListDescription>
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
    if (isReviewStepNode(n) || !('type' in n)) {
      const inner = n.children ?? []
      const shellKey = isReviewStepNode(n) ? `step-${n.id}` : 'children-wrap'
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
          <ReviewTopLevelArrayInstanceExpandable
            toggleLabel={showTitle && node.label ? node.label : reviewNodeLabel(node) || `Item ${instanceIndex + 1}`}
            instanceNode={node}
            isExpanded={ctx.getTopLevelArrayInstanceExpanded?.(key)}
            onExpandedChange={(expanded) => ctx.onTopLevelArrayInstanceExpandedChange?.(key, expanded)}
            onReviewEdit={ctx.onReviewEdit}
          >
            {paddedBody}
          </ReviewTopLevelArrayInstanceExpandable>
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

/** Dot path for YAML editor highlight: matches review registration path without `;id=` suffix. */
function getReviewNodeYamlHighlightPath(node: WizardDomTreeNode): string | undefined {
  if (!('path' in node) || typeof node.path !== 'string' || node.path === '') return undefined
  return node.path.replace(/;id=[^;]*$/u, '')
}

/** Wizard step id for navigating from review: explicit on INPUT / STEP, else first descendant INPUT's `stepId`. */
function getReviewNodeStepId(node: WizardDomTreeNode): string | undefined {
  if (isReviewInputNode(node)) {
    return node.stepId && node.stepId !== '' ? node.stepId : undefined
  }
  if (isReviewStepNode(node)) {
    return node.id && node.id !== '' ? node.id : undefined
  }
  for (const c of node.children ?? []) {
    const id = getReviewNodeStepId(c)
    if (id) return id
  }
  return undefined
}

/** DOM `id` to scroll to after leaving review: matches {@link Step} / input wrappers (`id` on the element). */
function getReviewScrollTargetDomId(node: WizardDomTreeNode): string | undefined {
  if ('type' in node) {
    switch (node.type) {
      case InputReviewMeta.STEP:
      case InputReviewMeta.INPUT:
      case InputReviewMeta.ARRAY_INPUT:
      case InputReviewMeta.ARRAY_INSTANCE: {
        const id = 'id' in node ? (node as { id?: string }).id : undefined
        return id && id !== '' ? id : undefined
      }
      default:
        break
    }
  }
  for (const child of node.children ?? []) {
    const id = getReviewScrollTargetDomId(child)
    if (id) return id
  }
  return undefined
}

function scrollReviewEditTargetIntoView(domId: string) {
  const run = () => {
    const el = document.getElementById(domId) as HTMLElement | null
    if (!el) return
    const inputTarget = resolveReviewEditInputTarget(el)
    const highlightEl = reviewEditHighlightTarget(el)
    highlightEl.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
    if (inputTarget instanceof HTMLInputElement && isSelectableTextInput(inputTarget)) {
      inputTarget.focus()
      inputTarget.select()
    }
    clearReviewEditHighlight(highlightEl)
    highlightEl.classList.add(REVIEW_EDIT_TARGET_HIGHLIGHT_CLASS)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        highlightEl.classList.add(REVIEW_EDIT_TARGET_HIGHLIGHT_VISIBLE_CLASS)
      })
    })

    let easeOutFallbackId: ReturnType<typeof setTimeout> | undefined

    const finishHighlight = () => {
      if (easeOutFallbackId !== undefined) {
        clearTimeout(easeOutFallbackId)
        easeOutFallbackId = undefined
      }
      highlightEl.removeEventListener('transitionend', onTransitionEnd)
      highlightEl.classList.remove(
        REVIEW_EDIT_TARGET_HIGHLIGHT_CLASS,
        REVIEW_EDIT_TARGET_HIGHLIGHT_VISIBLE_CLASS,
        REVIEW_EDIT_TARGET_HIGHLIGHT_EASE_OUT_CLASS
      )
      reviewEditHighlightTeardownByEl.delete(highlightEl)
    }

    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.target !== highlightEl || e.propertyName !== 'outline-width') return
      if (!highlightEl.classList.contains(REVIEW_EDIT_TARGET_HIGHLIGHT_EASE_OUT_CLASS)) return
      finishHighlight()
    }

    function dismiss() {
      highlightEl.removeEventListener('focusout', onHighlightFocusOut)
      window.removeEventListener('blur', onWindowBlur)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      highlightEl.addEventListener('transitionend', onTransitionEnd)
      easeOutFallbackId = setTimeout(finishHighlight, REVIEW_EDIT_HIGHLIGHT_EASE_OUT_MS)
      highlightEl.classList.add(REVIEW_EDIT_TARGET_HIGHLIGHT_EASE_OUT_CLASS)
    }

    function onHighlightFocusOut(e: FocusEvent) {
      const next = e.relatedTarget
      if (next instanceof Node && highlightEl.contains(next)) return
      dismiss()
    }

    function onWindowBlur() {
      dismiss()
    }
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') dismiss()
    }

    function abort() {
      if (easeOutFallbackId !== undefined) {
        clearTimeout(easeOutFallbackId)
        easeOutFallbackId = undefined
      }
      highlightEl.removeEventListener('focusout', onHighlightFocusOut)
      window.removeEventListener('blur', onWindowBlur)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      highlightEl.removeEventListener('transitionend', onTransitionEnd)
      highlightEl.classList.remove(
        REVIEW_EDIT_TARGET_HIGHLIGHT_CLASS,
        REVIEW_EDIT_TARGET_HIGHLIGHT_VISIBLE_CLASS,
        REVIEW_EDIT_TARGET_HIGHLIGHT_EASE_OUT_CLASS
      )
      reviewEditHighlightTeardownByEl.delete(highlightEl)
    }

    window.addEventListener('blur', onWindowBlur)
    document.addEventListener('visibilitychange', onVisibilityChange)
    highlightEl.addEventListener('focusout', onHighlightFocusOut)
    reviewEditHighlightTeardownByEl.set(highlightEl, abort)
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(run)
  })
}

function clearReviewEditHighlight(highlightEl: HTMLElement) {
  const abort = reviewEditHighlightTeardownByEl.get(highlightEl)
  if (abort) abort()
  else {
    highlightEl.classList.remove(
      REVIEW_EDIT_TARGET_HIGHLIGHT_CLASS,
      REVIEW_EDIT_TARGET_HIGHLIGHT_VISIBLE_CLASS,
      REVIEW_EDIT_TARGET_HIGHLIGHT_EASE_OUT_CLASS
    )
  }
}

function reviewEditHighlightTarget(el: HTMLElement): HTMLElement {
  if (el instanceof HTMLInputElement) {
    let parent = el.parentElement
    while (parent && parent.tagName === 'SPAN') {
      parent = parent.parentElement
    }
    return parent ?? el
  }
  return el
}

/** Prefer a descendant control for outline/scroll/focus when the id is on a wrapper. */
function resolveReviewEditInputTarget(el: HTMLElement): HTMLElement {
  if (el instanceof HTMLInputElement) return el
  for (const input of Array.from(el.querySelectorAll('input'))) {
    if (input instanceof HTMLInputElement && input.type !== 'hidden') {
      return input
    }
  }
  return el
}

/** `input.type` is normalized (e.g. missing `type` → `text`). */
function isSelectableTextInput(input: HTMLInputElement): boolean {
  const t = input.type
  return t === 'text' || t === 'search' || t === 'url' || t === 'tel' || t === 'password' || t === 'email'
}

export function buildTree(element: Element, stepInputMap: ReadonlyMap<string, InputReviewStepMeta>): WizardDomTreeNode {
  const nodes = buildReviewSubtree(element, stepInputMap)
  if (nodes.length === 1) return nodes[0]!
  if (nodes.length === 0) return {}
  return { children: nodes }
}

function buildReviewSubtree(
  element: Element,
  stepInputMap: ReadonlyMap<string, InputReviewStepMeta>,
  parentStepId = '',
  /** ARRAY_INPUT field paths and ARRAY_INSTANCE index segments from root to current node, in DOM order. */
  reviewPathPrefixSegments: readonly string[] = []
): WizardDomTreeNode[] {
  if (element instanceof HTMLElement) {
    const props = stepInputMap.get(element.id)
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
        children.push(...buildReviewSubtree(element.children[i]!, stepInputMap, stepIdForChildren, segmentsForChildren))
      }
      const hasChildren = children.length > 0
      if (props.type === InputReviewMeta.STEP) {
        if (props.id === 'review') {
          return children.filter(subtreeContainsReviewInput)
        }
        const stepNode: WizardDomTreeNode = hasChildren ? { ...props, children } : { ...props }
        if (!subtreeContainsReviewInput(stepNode)) {
          return []
        }
        return [stepNode]
      }
      if (props.type === InputReviewMeta.INPUT) {
        /* `props.path` is already the full path (array prefixes applied at registration in `useInput`). */
        return [
          hasChildren
            ? { ...props, type: InputReviewMeta.INPUT, stepId: parentStepId, children }
            : { ...props, type: InputReviewMeta.INPUT, stepId: parentStepId },
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
    out.push(...buildReviewSubtree(element.children[i]!, stepInputMap, parentStepId, reviewPathPrefixSegments))
  }
  return out
}

function subtreeContainsReviewInput(node: WizardDomTreeNode): boolean {
  if ('type' in node && node.type === InputReviewMeta.INPUT) {
    return true
  }
  const ch = node.children
  if (!ch?.length) return false
  return ch.some(subtreeContainsReviewInput)
}
