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
} from '@patternfly/react-core'
import { css } from '@patternfly/react-styles'
import titleStyles from '@patternfly/react-styles/css/components/Title/title'
import { ExclamationCircleIcon } from '@patternfly/react-icons'
import {
  Fragment,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useReviewDomTreeVersion } from './contexts/ReviewDomTreeSyncContext'
import { useStringContext } from './contexts/StringContext'
import { InputReviewStepMeta, InputReviewMeta, useStepInputsRegistry } from './contexts/StepInputsContext'
import { Step } from './Step'
import './ReviewStep.css'

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

function ToggleContent(props: { label: string }) {
  return (
    <div className="wizard-review-toggle-row">
      <Split hasGutter>
        <SplitItem isFilled>{props.label}</SplitItem>
      </Split>
    </div>
  )
}

export interface ReviewExpandableSectionProps {
  label: string
  children?: ReactNode
  /** Shown in the collapsed toggle row (e.g. summary badges). Composed into `toggleContent` because PatternFly `ExpandableSection` has no `collapsedContent` prop. */
  collapsedContent?: ReactNode
  isExpanded: boolean
  onExpandedChange: (expanded: boolean) => void
}

export function ReviewStep({ wizardRef, reviewStorageKey = 'default' }: ReviewStepProps) {
  const { reviewLabel } = useStringContext()
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
    if (sectionKeys.length === 0) return

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
      return next
    })
  }, [reviewStorageKey, sectionKeys])

  useEffect(() => {
    if (sectionKeys.length === 0) return
    writeReviewExpandableStorage(reviewStorageKey, sectionExpanded, lastToolbarAction)
  }, [reviewStorageKey, sectionExpanded, lastToolbarAction, sectionKeys])

  const onSectionExpandedChange = useCallback((key: string, expanded: boolean) => {
    setSectionExpanded((p) => ({ ...p, [key]: expanded }))
  }, [])

  /** Uniform expand: clears per-section differences for persisted state. */
  const onExpandAll = useCallback(() => {
    setLastToolbarAction('expand')
    setSectionExpanded(() => {
      const next: Record<string, boolean> = {}
      for (const k of sectionKeys) next[k] = true
      return next
    })
  }, [sectionKeys])

  /** Uniform collapse: clears per-section differences for persisted state. */
  const onCollapseAll = useCallback(() => {
    setLastToolbarAction('collapse')
    setSectionExpanded(() => {
      const next: Record<string, boolean> = {}
      for (const k of sectionKeys) next[k] = false
      return next
    })
  }, [sectionKeys])

  const showExpandToolbarButton = lastToolbarAction !== 'expand'
  const showCollapseToolbarButton = lastToolbarAction !== 'collapse'

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
              collapsedContent={<ReviewCollapsedContent label={reviewNodeLabel(child)} node={child} />}
              isExpanded={sectionExpanded[key] ?? true}
              onExpandedChange={(expanded) => onSectionExpandedChange(key, expanded)}
            >
              <ReviewSectionBody node={child} />
            </ReviewExpandableSection>
          )
        })}
      </Stack>
    </Step>
  )
}

/** PatternFly {@link ExpandableSection} with review-step toggle: {@link Title} when expanded, {@link ToggleContent} when collapsed. */
export function ReviewExpandableSection(props: ReviewExpandableSectionProps) {
  const onToggle = (_event: MouseEvent, expanded: boolean) => {
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

function subtreeContainsReviewInput(node: WizardDomTreeNode): boolean {
  if ('type' in node && node.type === InputReviewMeta.INPUT) {
    return true
  }
  const ch = node.children
  if (!ch?.length) return false
  return ch.some(subtreeContainsReviewInput)
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
    out.push(...buildReviewSubtree(element.children[i]!, stepInputMap, parentStepId, reviewPathPrefixSegments))
  }
  return out
}

type HorizontalTermWidthModifier = NonNullable<ComponentProps<typeof DescriptionList>['horizontalTermWidthModifier']>

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

function horizontalTermWidthModifierForInputRun(nodes: readonly WizardInputDomNode[]): HorizontalTermWidthModifier {
  let maxLen = 0
  for (const n of nodes) {
    const termText = n.label ?? n.path
    maxLen = Math.max(maxLen, termText.length)
  }
  return maxLen < 64 ? REVIEW_HORIZONTAL_TERM_WIDTH_COMPACT : REVIEW_HORIZONTAL_TERM_WIDTH_WIDE
}

type WizardInputDomNode = Extract<WizardDomTreeNode, { type: InputReviewMeta.INPUT }>

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

function getReviewSectionBodyNodes(node: WizardDomTreeNode): WizardDomTreeNode[] {
  if (!('type' in node)) {
    return node.children ?? []
  }
  if (node.type === InputReviewMeta.STEP) {
    return node.children ?? []
  }
  return [node]
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

const REVIEW_ERROR_TEXT_COLOR = 'var(--pf-t--global--text--color--status--danger--default)'

type ReviewRenderCtx = {
  inputGroupMarginLeft: number
  /** Number of nested ARRAY_INPUT ancestors; top-level array body uses 0. */
  arrayInputNesting: number
}

/** Top-level array section uses 16px; each nested ARRAY_INPUT adds 16px (not 16). */
function reviewArrayInstanceMarginLeft(arrayInputNesting: number): number {
  return 16 + 16 * arrayInputNesting
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

function renderReviewInputRows(nodes: readonly WizardInputDomNode[], ctx: ReviewRenderCtx): ReactNode {
  const mod = horizontalTermWidthModifierForInputRun(nodes)
  return (
    <DescriptionList key={`dl-${nodes[0]!.path}`} isHorizontal horizontalTermWidthModifier={mod}>
      <DescriptionListGroup key={nodes[0]!.path} style={{ marginLeft: ctx.inputGroupMarginLeft }}>
        {nodes.map((inputNode) => {
          const termText = inputNode.label ?? inputNode.path
          return (
            <Fragment key={inputNode.path}>
              <DescriptionListTerm>{termText}</DescriptionListTerm>
              <DescriptionListDescription>
                {inputNode.error ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    {renderReviewInputDescriptionContent(inputNode)}
                    <ExclamationCircleIcon color={REVIEW_ERROR_TEXT_COLOR} />
                  </span>
                ) : (
                  renderReviewInputDescriptionContent(inputNode)
                )}
              </DescriptionListDescription>
            </Fragment>
          )
        })}
      </DescriptionListGroup>
    </DescriptionList>
  )
}

function shouldShowArrayInstanceTitle(
  node: Extract<WizardDomTreeNode, { type: InputReviewMeta.ARRAY_INSTANCE }>
): boolean {
  if (!node.label) return false
  if (node.path !== undefined && node.path !== '' && node.label === node.path) return false
  return true
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
      out.push(
        <Fragment key={isReviewStepNode(n) ? `step-${n.id}` : 'children-wrap'}>
          {renderReviewNodeSequence(inner, ctx, precedingDlGroup)}
        </Fragment>
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
    <Fragment key={`array-${node.path}`}>
      {children.map((child, index) =>
        renderReviewArrayInstanceContainer(child, ctx, afterDescriptionListGroup && index === 0, marginLeft, index)
      )}
    </Fragment>
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
  }
  const key = reviewNodeKey(node, instanceIndex)
  const showTitle = isReviewArrayInstanceNode(node) && shouldShowArrayInstanceTitle(node)

  return (
    <div
      key={key}
      style={{
        marginLeft,
        marginBottom: 32,
        marginTop: addTopMarginAfterDl ? 32 : undefined,
      }}
    >
      {showTitle ? (
        <div style={{ marginBottom: 16 }}>
          <Badge isRead className={css(titleStyles.title, titleStyles.modifiers.h4)}>
            {node.label}
          </Badge>
        </div>
      ) : null}
      <div
        style={{
          paddingLeft: 12,
          borderLeft: '3px solid var(--pf-t--global--border--color--200, #d2d2d2)',
        }}
      >
        {renderReviewNodeSequence(node.children ?? [], innerCtx, false)}
      </div>
    </div>
  )
}

/** Renders review content for one wizard section from a {@link WizardDomTreeNode} (step root or wrapper). */
export function ReviewSectionBody(props: { node: WizardDomTreeNode }) {
  const bodyNodes = getReviewSectionBodyNodes(props.node)
  return (
    <Fragment>
      {renderReviewNodeSequence(bodyNodes, { inputGroupMarginLeft: 16, arrayInputNesting: 0 }, false)}
    </Fragment>
  )
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

function ReviewCollapsedValueBadge(props: { content: ReactNode; error?: string }) {
  const { content, error } = props
  return (
    <Badge isRead>
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

function renderCollapsedBadgesFromNodes(nodes: WizardDomTreeNode[]): ReactNode[] {
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
          />
        )
      })
      continue
    }
    if (isReviewStepNode(child) || !('type' in child)) {
      out.push(...renderCollapsedBadgesFromNodes(child.children ?? []))
      continue
    }
    if (isReviewArrayInstanceNode(child)) {
      out.push(...renderCollapsedBadgesFromNodes(child.children ?? []))
      continue
    }
  }
  return out
}

/** Collapsed review row: section {@link Title} plus summary {@link Badge}s derived from the section DOM tree. */
export function ReviewCollapsedContent(props: { label: string; node: WizardDomTreeNode }) {
  const bodyNodes = getReviewSectionBodyNodes(props.node)
  const badges = renderCollapsedBadgesFromNodes(bodyNodes)
  return (
    <Split hasGutter>
      <SplitItem>
        <Title
          headingLevel="h2"
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

type ReviewToolbarAction = 'expand' | 'collapse'

type ReviewExpandableStored = {
  sections: Record<string, boolean>
  lastToolbar: ReviewToolbarAction
}

const REVIEW_EXPANDABLE_LS_PREFIX = 'pf-labs-form-wizard-review-expandable-v1'

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

type ReviewStepToolbarProps = {
  onExpandAll: () => void
  onCollapseAll: () => void
  showExpand: boolean
  showCollapse: boolean
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
