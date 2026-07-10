/* Copyright Contributors to the Open Cluster Management project */
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  Title,
} from '@patternfly/react-core'
import { ExclamationCircleIcon } from '@patternfly/react-icons'
import Fuse from 'fuse.js'
import { klona } from 'klona/json'
import { Fragment, type CSSProperties, type ReactNode, useMemo } from 'react'
import { useDefaultItem } from '../contexts/DefaultDataContext'
import { useItem } from '../contexts/ItemContext'
import { useStringContext } from '../contexts/StringContext'
import {
  ArrayInstanceDiffType,
  InputReviewMeta,
  arrayInputRegisterKey,
  type DefaultArrayInputRegister,
  type WizardDomTreeNode,
  useDefaultArrayInputRegister,
} from './ReviewStepContexts'
import { ReviewPenHoverZone, type OnReviewEditHandler } from './ReviewStepNavigation'
import { getItemValue, horizontalTermWidthModifierForInputRun, REVIEW_ERROR_TEXT_COLOR } from './utils'

type WizardInputDomNode = Extract<WizardDomTreeNode, { type: InputReviewMeta.INPUT }>
type WizardArrayInputDomNode = Extract<WizardDomTreeNode, { type: InputReviewMeta.ARRAY_INPUT }>
type WizardArrayInstanceDomNode = Extract<WizardDomTreeNode, { type: InputReviewMeta.ARRAY_INSTANCE }>
type WizardArrayInstanceDifferenceDomNode = Extract<
  WizardDomTreeNode,
  {
    type: ArrayInstanceDiffType.DELETED | ArrayInstanceDiffType.ADDED | ArrayInstanceDiffType.MATCHED
  }
>
/** Inputs plus array-input containers when surfaced for errors (find list). */
type ReviewFindListDomNode = WizardInputDomNode | WizardArrayInputDomNode | WizardArrayInstanceDifferenceDomNode

const FUSE_LV: Fuse.IFuseOptions<ReviewFindRow> = {
  keys: ['searchLabel', 'searchValue'],
  includeMatches: true,
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 1,
}

const FUSE_PATH: Fuse.IFuseOptions<ReviewFindRow> = {
  keys: ['pathLast'],
  includeMatches: true,
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 1,
}

type ReviewFindRow = {
  node: ReviewFindListDomNode
  stepLabel: string
  searchLabel: string
  searchValue: string
  /** Last `.` segment after stripping `;id=…` only — not display-formatted. */
  pathLast: string
}

export interface ReviewStepFindListProps {
  sectionRoots: WizardDomTreeNode[]
  searchQuery: string
  showChangesOnly: boolean
  onReviewEdit?: OnReviewEditHandler
  showYaml?: boolean
}

// when only showing changes in  Review page, filter out all key/value pairs where the values are equual
// when values aren't equal they will appear in Review page
function rowMatchesChangesOnlyFilter(row: ReviewFindRow, item: object, defaultItem: object): boolean {
  if (isReviewArrayInstanceDifferenceNode(row.node)) {
    return true
  }
  if (!isReviewInputNode(row.node) && !isReviewArrayInputNode(row.node)) {
    return false
  }
  const path = row.node.path
  if (!path) {
    return Boolean(row.node.error)
  }
  if (row.node.error) return true
  const currentVal = getItemValue(item, path)
  const defaultVal =
    isReviewInputNode(row.node) && row.node.defaultValue !== undefined
      ? row.node.defaultValue
      : getItemValue(defaultItem, path)
  return !reviewValuesEqualAtPath(currentVal, defaultVal)
}

function isReviewUnsetValue(value: unknown): boolean {
  return value === null || value === undefined || value === '' || value === false
}

function reviewValuesEqualAtPath(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (isReviewUnsetValue(a) && isReviewUnsetValue(b)) return true
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return a === b
  }
  if (typeof a !== 'object' || typeof b !== 'object') {
    return a === b
  }
  return stableDeepEqual(a, b)
}

function stableDeepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((value, index) => stableDeepEqual(value, b[index]))
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const aRecord = a as Record<string, unknown>
    const bRecord = b as Record<string, unknown>
    const aKeys = Object.keys(aRecord).sort()
    const bKeys = Object.keys(bRecord).sort()
    return (
      aKeys.length === bKeys.length &&
      aKeys.every((key, index) => key === bKeys[index] && stableDeepEqual(aRecord[key], bRecord[key]))
    )
  }
  return false
}

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

function isReviewArrayInstanceNode(node: WizardDomTreeNode): node is WizardArrayInstanceDomNode {
  return 'type' in node && node.type === InputReviewMeta.ARRAY_INSTANCE
}

function isReviewArrayInstanceDifferenceNode(node: WizardDomTreeNode): node is WizardArrayInstanceDifferenceDomNode {
  return (
    'type' in node &&
    (node.type === ArrayInstanceDiffType.DELETED ||
      node.type === ArrayInstanceDiffType.ADDED ||
      node.type === ArrayInstanceDiffType.MATCHED)
  )
}

function arrayInstanceNodesFromChildren(children: WizardDomTreeNode[]): WizardArrayInstanceDomNode[] {
  return children.filter(isReviewArrayInstanceNode)
}

/** Strips only the first numeric path segment (array-instance index) for matching. */
function pathIgnoringNumericSegments(path: string): string {
  const segments = path.split('.').filter((segment) => segment !== '')
  const firstNumericIndex = segments.findIndex((segment) => /^\d+$/.test(segment))
  if (firstNumericIndex === -1) return segments.join('.')
  return [...segments.slice(0, firstNumericIndex), ...segments.slice(firstNumericIndex + 1)].join('.')
}

function arrayInstanceValuesMatch(a: unknown, b: unknown): boolean {
  return Object.is(a, b) || stableDeepEqual(a, b)
}

function inputPathForMatch(node: WizardInputDomNode): string {
  return arrayInputRegisterKey(node.label, node.path)
}

function collectReviewInputNodes(nodes: readonly WizardDomTreeNode[]): WizardInputDomNode[] {
  const inputs: WizardInputDomNode[] = []
  for (const node of nodes) {
    if (isReviewInputNode(node)) {
      inputs.push(node)
    }
    if (node.children?.length) {
      inputs.push(...collectReviewInputNodes(node.children))
    }
  }
  return inputs
}

function findMatchingReviewInputIndex(
  currentInput: WizardInputDomNode,
  defaultInputs: readonly WizardInputDomNode[],
  matchValue: boolean
): number {
  const currentPath = inputPathForMatch(currentInput)
  for (let i = 0; i < defaultInputs.length; i++) {
    const defaultInput = defaultInputs[i]!
    if (inputPathForMatch(defaultInput) !== currentPath) continue
    if (matchValue && !arrayInstanceValuesMatch(currentInput.value, defaultInput.value)) continue
    return i
  }
  return -1
}

function matchedInstanceInputSubtreesMatch(
  current: WizardArrayInstanceDomNode,
  defaultInstance: WizardArrayInstanceDomNode,
  matchValue: boolean
): boolean {
  const currentInputs = collectReviewInputNodes(current.children ?? [])
  const defaultInputs = collectReviewInputNodes(defaultInstance.children ?? [])
  if (currentInputs.length !== defaultInputs.length) return false

  const remainingDefaults = [...defaultInputs]
  for (const currentInput of currentInputs) {
    const matchIndex = findMatchingReviewInputIndex(currentInput, remainingDefaults, matchValue)
    if (matchIndex === -1) return false
    remainingDefaults.splice(matchIndex, 1)
  }
  return true
}

type ProcessingDefaultArrayInstance = WizardArrayInstanceDomNode & { claimed?: boolean }

function findMatchingDefaultInstanceIndex(
  child: WizardArrayInstanceDomNode,
  defaultInstanceArray: readonly ProcessingDefaultArrayInstance[],
  matchValue: boolean
): number {
  for (let i = 0; i < defaultInstanceArray.length; i++) {
    const defaultInstance = defaultInstanceArray[i]!
    if (defaultInstance.claimed) continue
    if (child.label !== defaultInstance.label) continue
    if (matchedInstanceInputSubtreesMatch(child, defaultInstance, matchValue)) {
      return i
    }
  }
  return -1
}

function defaultArrayInstanceNodesFromRegister(
  defaultArrayInputs: DefaultArrayInputRegister,
  arrayInputLabel: string | undefined,
  arrayInputPath: string
): ProcessingDefaultArrayInstance[] {
  const defaultArrayInputNodes = defaultArrayInputs.get(arrayInputRegisterKey(arrayInputLabel, arrayInputPath)) ?? []
  const instances: ProcessingDefaultArrayInstance[] = []
  for (const defaultArrayInputNode of defaultArrayInputNodes) {
    for (const child of defaultArrayInputNode.children ?? []) {
      if (isReviewArrayInstanceNode(child)) {
        instances.push(klona(child))
      }
    }
  }
  return instances
}

function domNodePathKey(node: WizardDomTreeNode): string | undefined {
  if ('path' in node && typeof node.path === 'string' && node.path !== '') {
    const label = 'label' in node ? node.label : undefined
    return arrayInputRegisterKey(label, node.path)
  }
  if ('id' in node && typeof node.id === 'string' && node.id !== '') {
    return pathIgnoringNumericSegments(pathWithoutSemicolonIdSuffix(node.id))
  }
  return undefined
}

function findMatchingDefaultNodeAmongChildren(
  currentNode: WizardDomTreeNode,
  defaultChildren: readonly WizardDomTreeNode[]
): WizardDomTreeNode | undefined {
  const key = domNodePathKey(currentNode)
  if (!key) return undefined
  for (const defaultNode of defaultChildren) {
    if (domNodePathKey(defaultNode) === key) return defaultNode
  }
  return undefined
}

/** Recursively walks paired instance subtrees and copies default input values onto current inputs. */
function applyDefaultValuesFromMatchedInstance(
  currentChildren: WizardDomTreeNode[] | undefined,
  defaultChildren: WizardDomTreeNode[] | undefined
): WizardDomTreeNode[] | undefined {
  if (!currentChildren) return undefined

  return currentChildren.map((currentNode) => {
    const matchingDefaultNode = findMatchingDefaultNodeAmongChildren(currentNode, defaultChildren ?? [])

    if (isReviewInputNode(currentNode) && matchingDefaultNode && isReviewInputNode(matchingDefaultNode)) {
      return { ...klona(currentNode), defaultValue: matchingDefaultNode.value }
    }

    const cloned = klona(currentNode)
    if (cloned.children?.length) {
      return {
        ...cloned,
        children: applyDefaultValuesFromMatchedInstance(cloned.children, matchingDefaultNode?.children),
      }
    }
    return cloned
  })
}

type NormalizedArrayInstances = {
  matchedArray: WizardArrayInstanceDifferenceDomNode[]
  deletedArray: WizardArrayInstanceDifferenceDomNode[]
  addedArray: WizardArrayInstanceDifferenceDomNode[]
}

function labelWithParentArrayInstancePrefixes(
  label: string | undefined,
  parentArrayInstanceLabels: readonly string[]
): string | undefined {
  if (parentArrayInstanceLabels.length === 0) return label
  const prefix = parentArrayInstanceLabels.join('/')
  if (!label) return prefix
  return `${prefix}/${label}`
}

function findMatchingDefaultNodes(
  arrayInputNode: WizardArrayInputDomNode,
  defaultArrayInputs: DefaultArrayInputRegister
): NormalizedArrayInstances {
  const arrayInputPath = arrayInputNode.path
  const defaultArrayInputsByPath = arrayInputPath
    ? defaultArrayInstanceNodesFromRegister(defaultArrayInputs, arrayInputNode.label, arrayInputPath)
    : []

  const matchedArray: WizardArrayInstanceDifferenceDomNode[] = []
  const deletedArray: WizardArrayInstanceDifferenceDomNode[] = []
  const addedArray: WizardArrayInstanceDifferenceDomNode[] = []

  for (const child of arrayInstanceNodesFromChildren(arrayInputNode.children ?? [])) {
    let matchIndex = findMatchingDefaultInstanceIndex(child, defaultArrayInputsByPath, true)
    if (matchIndex === -1) {
      matchIndex = findMatchingDefaultInstanceIndex(child, defaultArrayInputsByPath, false)
    }

    let matchedDefault: WizardArrayInstanceDomNode | undefined
    if (matchIndex !== -1) {
      const matchedFromPath = defaultArrayInputsByPath[matchIndex]!
      matchedFromPath.claimed = true
      matchedDefault = matchedFromPath
    }
    if (matchedDefault) {
      matchedArray.push({
        ...klona(child),
        type: ArrayInstanceDiffType.MATCHED,
        children: applyDefaultValuesFromMatchedInstance(child.children, matchedDefault.children),
      })
      continue
    }

    addedArray.push({
      ...klona(child),
      type: ArrayInstanceDiffType.ADDED,
      children: child.children,
    })
  }

  for (const remaining of defaultArrayInputsByPath) {
    if (remaining.claimed) continue
    if (!remaining.children?.length) continue
    deletedArray.push({
      ...klona(remaining),
      type: ArrayInstanceDiffType.DELETED,
      children: undefined,
    })
  }

  return { matchedArray, deletedArray, addedArray }
}

const DIFFERENCE_TITLE_PREFIX_WIDTH = '1.25ch'

const REVIEW_DIFFERENCE_ADDED_COLOR = 'var(--pf-t--global--icon--color--status--success--default)'
const REVIEW_DIFFERENCE_DELETED_COLOR = 'var(--pf-t--global--icon--color--status--danger--default)'

type ReviewDifferenceTitleStrings = {
  reviewArrayInstanceAdded: string
  reviewArrayInstanceDeleted: string
}

function renderDifferenceTitle(
  node: WizardArrayInstanceDifferenceDomNode,
  addTopPadding: boolean,
  labels: ReviewDifferenceTitleStrings
): ReactNode {
  const displayName = node.label ?? ''
  let prefixChar: string | undefined
  let titleStyle: CSSProperties
  let nameStyle: CSSProperties = {}
  let statusLabel: ReactNode | null = null

  if (node.type === ArrayInstanceDiffType.ADDED) {
    prefixChar = '+'
    titleStyle = { color: REVIEW_DIFFERENCE_ADDED_COLOR }
    nameStyle = { color: REVIEW_DIFFERENCE_ADDED_COLOR }
    statusLabel = (
      <Label color="green" isCompact>
        {labels.reviewArrayInstanceAdded}
      </Label>
    )
  } else if (node.type === ArrayInstanceDiffType.DELETED) {
    prefixChar = '-'
    titleStyle = { color: REVIEW_DIFFERENCE_DELETED_COLOR }
    nameStyle = { color: REVIEW_DIFFERENCE_DELETED_COLOR }
    statusLabel = (
      <Label color="red" isCompact>
        {labels.reviewArrayInstanceDeleted}
      </Label>
    )
  } else {
    titleStyle = { color: 'var(--pf-t--global--text--color--regular)' }
  }

  if (addTopPadding) {
    titleStyle = { ...titleStyle, paddingTop: 16 }
  }

  return (
    <DescriptionListGroup
      className="wizard-review-find-difference-title"
      style={{ marginLeft: 32, gridColumn: '1 / -1' }}
    >
      <DescriptionListTerm>
        <Title headingLevel="h4" style={titleStyle}>
          {prefixChar != null ? (
            <span style={{ display: 'inline-block', width: DIFFERENCE_TITLE_PREFIX_WIDTH, marginRight: '0.25ch' }}>
              {prefixChar}
            </span>
          ) : null}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {statusLabel}
            <span style={nameStyle}>{displayName}</span>
          </span>
        </Title>
      </DescriptionListTerm>
    </DescriptionListGroup>
  )
}

function filterDifferenceTitlesWithoutFollowingRows(rows: ReviewFindRow[]): ReviewFindRow[] {
  return rows.filter((row, index) => {
    if (!isReviewArrayInstanceDifferenceNode(row.node)) return true
    if (row.node.type === ArrayInstanceDiffType.DELETED) return true
    for (let i = index + 1; i < rows.length; i++) {
      if (isReviewArrayInstanceDifferenceNode(rows[i]!.node)) break
      return true
    }
    return false
  })
}

function computeRowsAfterDifferenceTitlePadding(rows: ReviewFindRow[]): boolean[] {
  const pad = rows.map(() => false)
  let afterDifferenceTitle = false
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!
    if (isReviewArrayInstanceDifferenceNode(row.node)) {
      afterDifferenceTitle = true
    } else if (afterDifferenceTitle) {
      pad[i] = true
    }
  }
  return pad
}

function computeRowsAfterDifferenceTitleTermColor(rows: ReviewFindRow[]): (string | undefined)[] {
  const colors = rows.map((): string | undefined => undefined)
  let currentColor: string | undefined
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!
    if (isReviewArrayInstanceDifferenceNode(row.node)) {
      if (row.node.type === ArrayInstanceDiffType.ADDED) {
        currentColor = REVIEW_DIFFERENCE_ADDED_COLOR
      } else if (row.node.type === ArrayInstanceDiffType.DELETED) {
        currentColor = REVIEW_DIFFERENCE_DELETED_COLOR
      } else {
        currentColor = undefined
      }
    } else if (currentColor !== undefined) {
      colors[i] = currentColor
    }
  }
  return colors
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

function isReviewValueUnset(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string' && value === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

function formatReviewValueString(value: unknown): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

/** Strip a trailing `;id=…` clause (YAML-style path annotations) before taking the last `.` segment. */
function pathWithoutSemicolonIdSuffix(path: string): string {
  return path.replace(/;id=.*$/, '')
}

function pathLastSegment(path: string): string {
  const cleaned = pathWithoutSemicolonIdSuffix(path)
  const idx = cleaned.lastIndexOf('.')
  return idx >= 0 ? cleaned.slice(idx + 1) : cleaned
}

/**
 * Display-only: path suffix `#["CreateNamespace=true"]` → `["CreateNamespace"]` (strip `=<tail>` after first `=` in the bracketed string).
 * Also handles a trailing `#["…"]` on a longer last segment, e.g. `policy#["x=y"]` → `policy["x"]`.
 * Do not use for Fuse indexing — `ReviewFindRow.pathLast` stays the raw last segment from the tree.
 */
function formatPathLastSegmentForDisplay(segment: string): string {
  return segment.replace(/#\["([^"]*)"\]$/, (_full, inner: string) => {
    const eq = inner.indexOf('=')
    const key = eq >= 0 ? inner.slice(0, eq) : inner
    return `["${key}"]`
  })
}

type ReviewFindBooleanStrings = {
  reviewBooleanTrue: string
  reviewBooleanFalse: string
  reviewBooleanNotSet: string
}

function formatReviewFindSearchValue(
  node: WizardInputDomNode | WizardArrayInputDomNode,
  labels: ReviewFindBooleanStrings
): string {
  if (node.error) return node.error
  if (typeof node.value === 'boolean') {
    return node.value ? labels.reviewBooleanTrue : labels.reviewBooleanFalse
  }
  if (isReviewValueUnset(node.value)) return labels.reviewBooleanNotSet
  return formatReviewValueString(node.value)
}

function ownArrayInstanceLabel(node: { label?: string; id?: string; path?: string }): string {
  if (node.label) return node.label
  if ('path' in node && node.path) return formatReviewPathOrIdLabel(node.path)
  if (node.id) return formatReviewPathOrIdLabel(node.id)
  return ''
}

function nestedParentArrayInstanceLabels(
  parentArrayInstanceLabels: readonly string[],
  instanceLabel: string
): readonly string[] {
  return instanceLabel ? [...parentArrayInstanceLabels, instanceLabel] : parentArrayInstanceLabels
}

function collectVisibleInputsInOrder(
  nodes: WizardDomTreeNode[],
  out: ReviewFindListDomNode[],
  item: object,
  defaultArrayInputs: DefaultArrayInputRegister,
  parentArrayInstanceLabels: readonly string[] = []
): void {
  for (const n of nodes) {
    if (isReviewInputNode(n)) {
      out.push(n)
      continue
    }
    if (isReviewArrayInputNode(n)) {
      if (n.error) {
        out.push(n)
      }

      const { matchedArray, deletedArray, addedArray } = findMatchingDefaultNodes(n, defaultArrayInputs)
      for (const diffNode of [...matchedArray, ...addedArray, ...deletedArray]) {
        const ownLabel = ownArrayInstanceLabel(diffNode)
        out.push({
          ...diffNode,
          label: labelWithParentArrayInstancePrefixes(ownLabel, parentArrayInstanceLabels),
        })
        collectVisibleInputsInOrder(
          diffNode.children ?? [],
          out,
          item,
          defaultArrayInputs,
          nestedParentArrayInstanceLabels(parentArrayInstanceLabels, ownLabel)
        )
      }
      continue
    }
    if (isReviewSectionNode(n) || !('type' in n)) {
      collectVisibleInputsInOrder(n.children ?? [], out, item, defaultArrayInputs, parentArrayInstanceLabels)
      continue
    }
    if (isReviewArrayInstanceNode(n)) {
      const instanceLabel = ownArrayInstanceLabel(n)
      collectVisibleInputsInOrder(
        n.children ?? [],
        out,
        item,
        defaultArrayInputs,
        nestedParentArrayInstanceLabels(parentArrayInstanceLabels, instanceLabel)
      )
      continue
    }
  }
}

function mergeRanges(indices: readonly Fuse.RangeTuple[]): Fuse.RangeTuple[] {
  const sorted = [...indices].sort((a, b) => a[0] - b[0])
  const merged: Fuse.RangeTuple[] = []
  for (const [start, end] of sorted) {
    if (merged.length === 0) {
      merged.push([start, end])
      continue
    }
    const last = merged[merged.length - 1]!
    if (start <= last[1] + 1) {
      last[1] = Math.max(last[1], end)
    } else {
      merged.push([start, end])
    }
  }
  return merged
}

/** All case-insensitive occurrences of `needle` in `haystack`, merged into contiguous ranges. */
function exactSubstringMatchRanges(haystack: string, needle: string): readonly Fuse.RangeTuple[] | undefined {
  const n = needle.trim()
  if (n === '' || haystack === '') return undefined
  const lowerH = haystack.toLowerCase()
  const lowerN = n.toLowerCase()
  const len = lowerN.length
  const ranges: Fuse.RangeTuple[] = []
  let searchFrom = 0
  while (searchFrom <= haystack.length - len) {
    const idx = lowerH.indexOf(lowerN, searchFrom)
    if (idx === -1) break
    ranges.push([idx, idx + len - 1])
    searchFrom = idx + len
  }
  return ranges.length > 0 ? mergeRanges(ranges) : undefined
}

function rowHasExactSubstringMatch(needle: string, termText: string, valueText: string, pathLast: string): boolean {
  return (
    (exactSubstringMatchRanges(termText, needle)?.length ?? 0) > 0 ||
    (exactSubstringMatchRanges(valueText, needle)?.length ?? 0) > 0 ||
    (exactSubstringMatchRanges(pathLast, needle)?.length ?? 0) > 0
  )
}

/** If `text` contains an exact substring match, highlight only that; else Fuse indices unless another field on the row matched exactly (then no fuzzy highlight here). */
function pickHighlightIndices(
  text: string,
  needle: string,
  fuseIndices: readonly Fuse.RangeTuple[] | undefined,
  rowHasExact: boolean
): readonly Fuse.RangeTuple[] | undefined {
  const exact = exactSubstringMatchRanges(text, needle)
  if (exact !== undefined && exact.length > 0) return exact
  if (rowHasExact) return undefined
  return fuseIndices
}

function renderHighlighted(text: string, indices: readonly Fuse.RangeTuple[] | undefined): ReactNode {
  if (!indices || indices.length === 0) return text
  const merged = mergeRanges(indices)
  const parts: ReactNode[] = []
  let cursor = 0
  let k = 0
  for (const [start, end] of merged) {
    if (start > cursor) parts.push(text.slice(cursor, start))
    parts.push(
      <span key={`h-${k++}`} className="wizard-review-find-match">
        {text.slice(start, end + 1)}
      </span>
    )
    cursor = end + 1
  }
  if (cursor < text.length) parts.push(text.slice(cursor))
  return parts.length === 1 ? parts[0] : <>{parts}</>
}

function indicesForKey(
  result: Fuse.FuseResult<ReviewFindRow> | undefined,
  key: 'searchLabel' | 'searchValue' | 'pathLast'
): readonly Fuse.RangeTuple[] | undefined {
  if (!result?.matches) return undefined
  const m = result.matches.find((x) => x.key === key)
  return m?.indices
}

function renderFindValueContent(
  node: WizardInputDomNode | WizardArrayInputDomNode,
  searchValue: string,
  valueIndices: readonly Fuse.RangeTuple[] | undefined
): ReactNode {
  if (node.error) {
    return (
      <span style={{ color: REVIEW_ERROR_TEXT_COLOR, fontStyle: 'italic' }}>
        {renderHighlighted(node.error, valueIndices)}
      </span>
    )
  }
  return renderHighlighted(searchValue, valueIndices)
}

type FindListModel = {
  sections: { stepLabel: string; rows: ReviewFindRow[] }[]
  lvByPath: Map<string, Fuse.FuseResult<ReviewFindRow>>
  pathByPath: Map<string, Fuse.FuseResult<ReviewFindRow>>
}

function reviewFindRowKey(node: ReviewFindListDomNode): string {
  if ('path' in node && node.path) return node.path
  return node.id
}

function buildFindListModel(
  sectionRoots: WizardDomTreeNode[],
  q: string,
  booleanStrings: ReviewFindBooleanStrings,
  showChangesOnly: boolean,
  item: object,
  defaultItem: object,
  defaultArrayInputs: DefaultArrayInputRegister
): FindListModel {
  const sections: { stepLabel: string; rows: ReviewFindRow[] }[] = []
  const allRows: ReviewFindRow[] = []

  for (const root of sectionRoots) {
    const stepLabel = reviewNodeLabel(root)
    const ordered: ReviewFindListDomNode[] = []
    collectVisibleInputsInOrder(getReviewSectionBodyNodes(root), ordered, item, defaultArrayInputs)
    let rows: ReviewFindRow[] = ordered.map((node) => ({
      node,
      stepLabel,
      searchLabel: isReviewArrayInstanceDifferenceNode(node) ? (node.label ?? '') : (node.label ?? node.path),
      searchValue: isReviewArrayInstanceDifferenceNode(node)
        ? (node.label ?? '')
        : formatReviewFindSearchValue(node, booleanStrings),
      pathLast: 'path' in node && node.path ? pathLastSegment(node.path) : (node.label ?? node.id),
    }))
    if (showChangesOnly) {
      rows = rows.filter((row) => rowMatchesChangesOnlyFilter(row, item, defaultItem))
    }
    rows = filterDifferenceTitlesWithoutFollowingRows(rows)
    sections.push({ stepLabel, rows })
    allRows.push(...rows)
  }

  const lvByPath = new Map<string, Fuse.FuseResult<ReviewFindRow>>()
  const pathByPath = new Map<string, Fuse.FuseResult<ReviewFindRow>>()

  if (q !== '' && allRows.length > 0) {
    const fuseLv = new Fuse(allRows, FUSE_LV)
    const fusePath = new Fuse(allRows, FUSE_PATH)
    for (const r of fuseLv.search(q)) {
      lvByPath.set(reviewFindRowKey(r.item.node), r)
    }
    for (const r of fusePath.search(q)) {
      pathByPath.set(reviewFindRowKey(r.item.node), r)
    }
    const matched = new Set<string>([...lvByPath.keys(), ...pathByPath.keys()])
    for (const s of sections) {
      s.rows = s.rows.filter((row) => matched.has(reviewFindRowKey(row.node)))
      s.rows = filterDifferenceTitlesWithoutFollowingRows(s.rows)
    }
  }

  return { sections, lvByPath, pathByPath }
}

export function ReviewStepFindList(props: ReviewStepFindListProps) {
  const { sectionRoots, searchQuery, showChangesOnly, onReviewEdit, showYaml } = props
  const item = useItem<object>()
  const defaultItem = useDefaultItem<object>()
  const defaultArrayInputs = useDefaultArrayInputRegister()
  const {
    noResults,
    reviewBooleanTrue,
    reviewBooleanFalse,
    reviewBooleanNotSet,
    reviewArrayInstanceAdded,
    reviewArrayInstanceDeleted,
  } = useStringContext()
  const q = searchQuery.trim()

  const differenceTitleStrings = useMemo(
    () => ({ reviewArrayInstanceAdded, reviewArrayInstanceDeleted }),
    [reviewArrayInstanceAdded, reviewArrayInstanceDeleted]
  )

  const booleanStrings = useMemo(
    () => ({ reviewBooleanTrue, reviewBooleanFalse, reviewBooleanNotSet }),
    [reviewBooleanTrue, reviewBooleanFalse, reviewBooleanNotSet]
  )

  const { sections, lvByPath, pathByPath } = useMemo(
    () => buildFindListModel(sectionRoots, q, booleanStrings, showChangesOnly, item, defaultItem, defaultArrayInputs),
    [sectionRoots, q, booleanStrings, showChangesOnly, item, defaultItem, defaultArrayInputs]
  )

  const yamlVisible = showYaml !== false

  const hasAnyRows = sections.some((s) => s.rows.length > 0)

  if (!hasAnyRows) {
    const emptyClassName = [
      'wizard-review-find-list',
      showChangesOnly && 'wizard-review-find-list--changes-only',
      'wizard-review-find-list--empty',
    ]
      .filter(Boolean)
      .join(' ')
    return <div className={emptyClassName}>{noResults}</div>
  }

  return (
    <div className="wizard-review-find-list">
      <div className={showChangesOnly ? 'wizard-review-find-list--changes-only' : undefined}>
        {sections.map((section, sectionIndex) => {
          if (section.rows.length === 0) return null
          const inputRows = section.rows.filter(
            (r): r is ReviewFindRow & { node: WizardInputDomNode | WizardArrayInputDomNode } =>
              isReviewInputNode(r.node) || isReviewArrayInputNode(r.node)
          )
          const mod = horizontalTermWidthModifierForInputRun(inputRows.map((r) => r.node))
          const afterDifferenceTitlePad = computeRowsAfterDifferenceTitlePadding(section.rows)
          const afterDifferenceTitleTermColor = computeRowsAfterDifferenceTitleTermColor(section.rows)

          return (
            <Fragment key={`review-find-section-${sectionIndex}`}>
              <Title
                headingLevel="h2"
                style={{
                  color: 'var(--pf-t--global--text--color--regular)',
                  marginBottom: 12,
                }}
              >
                {section.stepLabel}
              </Title>
              <DescriptionList isHorizontal horizontalTermWidthModifier={mod} style={{ rowGap: 0, marginBottom: 24 }}>
                {section.rows.map((row, rowIndex) => {
                  if (isReviewArrayInstanceDifferenceNode(row.node)) {
                    return (
                      <Fragment key={row.node.id}>
                        {renderDifferenceTitle(row.node, rowIndex > 0, differenceTitleStrings)}
                      </Fragment>
                    )
                  }

                  const lv = lvByPath.get(reviewFindRowKey(row.node))
                  const pr = pathByPath.get(reviewFindRowKey(row.node))
                  const pathOnly = lv === undefined && pr !== undefined
                  const labelIndices = indicesForKey(lv ?? pr, 'searchLabel')
                  const valueIndices = indicesForKey(lv ?? pr, 'searchValue')
                  const pathIndices = indicesForKey(pr, 'pathLast')

                  const termText = row.node.label ?? row.node.path
                  const valueText = row.searchValue
                  const pathLastRaw = row.pathLast
                  const pathDisplay = formatPathLastSegmentForDisplay(pathLastRaw)
                  const rowExact = rowHasExactSubstringMatch(q, termText, valueText, pathLastRaw)

                  const labelHighlight = pickHighlightIndices(
                    termText,
                    q,
                    pathOnly ? undefined : labelIndices,
                    rowExact
                  )
                  const valueHighlight = pickHighlightIndices(valueText, q, valueIndices, rowExact)
                  const pathHighlight =
                    pathDisplay === pathLastRaw
                      ? pickHighlightIndices(pathLastRaw, q, pathIndices, rowExact)
                      : pickHighlightIndices(pathDisplay, q, undefined, rowExact)

                  const termBase = (
                    <>
                      {renderHighlighted(termText, labelHighlight)}
                      {pathOnly ? (
                        <>
                          {' '}
                          <span className="wizard-review-find-path-suffix">
                            ({renderHighlighted(pathDisplay, pathHighlight)})
                          </span>
                        </>
                      ) : null}
                    </>
                  )
                  const termColor = afterDifferenceTitleTermColor[rowIndex]
                  const termContent =
                    termColor !== undefined ? <span style={{ color: termColor }}>{termBase}</span> : termBase

                  const valueContent = row.node.error ? (
                    <span className="wizard-review-find-value-with-trailing-icon">
                      <span className="wizard-review-find-inline-body">
                        {renderFindValueContent(row.node, row.searchValue, valueHighlight)}
                      </span>
                      <ExclamationCircleIcon color={REVIEW_ERROR_TEXT_COLOR} />
                    </span>
                  ) : (
                    <span className="wizard-review-find-inline-body">
                      {renderFindValueContent(row.node, row.searchValue, valueHighlight)}
                    </span>
                  )

                  return (
                    <DescriptionListGroup
                      key={reviewFindRowKey(row.node)}
                      className="wizard-review-find-dl-group"
                      style={{ marginLeft: 32 + (afterDifferenceTitlePad[rowIndex] ? 16 : 0) }}
                    >
                      {onReviewEdit != null ? (
                        <ReviewPenHoverZone
                          ariaLabel="Edit"
                          descriptionListTerm={termContent}
                          descriptionListDescriptionId={row.node.id}
                          onPenClick={() => onReviewEdit(row.node, yamlVisible ? 'highlight' : 'navigate')}
                          onPenIconClick={() => onReviewEdit(row.node, 'navigate')}
                          onArrowClick={yamlVisible ? () => onReviewEdit(row.node, 'highlight') : undefined}
                        >
                          {valueContent}
                        </ReviewPenHoverZone>
                      ) : (
                        <>
                          <DescriptionListTerm>{termContent}</DescriptionListTerm>
                          <DescriptionListDescription id={row.node.id ?? ''} style={{ whiteSpace: 'pre-wrap' }}>
                            <span className="wizard-review-inline-value">{valueContent}</span>
                          </DescriptionListDescription>
                        </>
                      )}
                    </DescriptionListGroup>
                  )
                })}
              </DescriptionList>
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
