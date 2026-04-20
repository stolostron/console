/* Copyright Contributors to the Open Cluster Management project */
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Title,
} from '@patternfly/react-core'
import { ExclamationCircleIcon } from '@patternfly/react-icons'
import Fuse from 'fuse.js'
import { Fragment, type ReactNode, useMemo } from 'react'
import { useStringContext } from '../contexts/StringContext'
import { InputReviewMeta, type WizardDomTreeNode } from './ReviewStepContexts'
import { ReviewPenHoverZone, type OnReviewEditHandler } from './ReviewStepNavigation'
import { horizontalTermWidthModifierForInputRun, REVIEW_ERROR_TEXT_COLOR } from './utils'

type WizardInputDomNode = Extract<WizardDomTreeNode, { type: InputReviewMeta.INPUT }>

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
  node: WizardInputDomNode
  stepLabel: string
  searchLabel: string
  searchValue: string
  /** Last `.` segment after stripping `;id=…` only — not display-formatted. */
  pathLast: string
}

export interface ReviewStepFindListProps {
  sectionRoots: WizardDomTreeNode[]
  searchQuery: string
  onReviewEdit?: OnReviewEditHandler
  showYaml?: boolean
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

function isReviewArrayInstanceNode(
  node: WizardDomTreeNode
): node is Extract<WizardDomTreeNode, { type: InputReviewMeta.ARRAY_INSTANCE }> {
  return 'type' in node && node.type === InputReviewMeta.ARRAY_INSTANCE
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

function formatReviewFindSearchValue(node: WizardInputDomNode, labels: ReviewFindBooleanStrings): string {
  if (node.error) return node.error
  if (typeof node.value === 'boolean') {
    return node.value ? labels.reviewBooleanTrue : labels.reviewBooleanFalse
  }
  if (isReviewValueUnset(node.value)) return labels.reviewBooleanNotSet
  return formatReviewValueString(node.value)
}

function collectVisibleInputsInOrder(nodes: WizardDomTreeNode[], out: WizardInputDomNode[]): void {
  for (const n of nodes) {
    if (isReviewInputNode(n)) {
      out.push(n)
      continue
    }
    if (isReviewArrayInputNode(n)) {
      for (const inst of n.children ?? []) {
        collectVisibleInputsInOrder(inst.children ?? [], out)
      }
      continue
    }
    if (isReviewSectionNode(n) || !('type' in n)) {
      collectVisibleInputsInOrder(n.children ?? [], out)
      continue
    }
    if (isReviewArrayInstanceNode(n)) {
      collectVisibleInputsInOrder(n.children ?? [], out)
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
  node: WizardInputDomNode,
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

function buildFindListModel(
  sectionRoots: WizardDomTreeNode[],
  q: string,
  booleanStrings: ReviewFindBooleanStrings
): FindListModel {
  const sections: { stepLabel: string; rows: ReviewFindRow[] }[] = []
  const allRows: ReviewFindRow[] = []

  for (const root of sectionRoots) {
    const stepLabel = reviewNodeLabel(root)
    const ordered: WizardInputDomNode[] = []
    collectVisibleInputsInOrder(getReviewSectionBodyNodes(root), ordered)
    const rows: ReviewFindRow[] = ordered.map((node) => ({
      node,
      stepLabel,
      searchLabel: node.label ?? node.path,
      searchValue: formatReviewFindSearchValue(node, booleanStrings),
      pathLast: pathLastSegment(node.path),
    }))
    sections.push({ stepLabel, rows })
    allRows.push(...rows)
  }

  const lvByPath = new Map<string, Fuse.FuseResult<ReviewFindRow>>()
  const pathByPath = new Map<string, Fuse.FuseResult<ReviewFindRow>>()

  if (q !== '' && allRows.length > 0) {
    const fuseLv = new Fuse(allRows, FUSE_LV)
    const fusePath = new Fuse(allRows, FUSE_PATH)
    for (const r of fuseLv.search(q)) {
      lvByPath.set(r.item.node.path, r)
    }
    for (const r of fusePath.search(q)) {
      pathByPath.set(r.item.node.path, r)
    }
    const matched = new Set<string>([...lvByPath.keys(), ...pathByPath.keys()])
    for (const s of sections) {
      s.rows = s.rows.filter((row) => matched.has(row.node.path))
    }
  }

  return { sections, lvByPath, pathByPath }
}

export function ReviewStepFindList(props: ReviewStepFindListProps) {
  const { sectionRoots, searchQuery, onReviewEdit, showYaml } = props
  const { noResults, reviewBooleanTrue, reviewBooleanFalse, reviewBooleanNotSet } = useStringContext()
  const q = searchQuery.trim()

  const booleanStrings = useMemo(
    () => ({ reviewBooleanTrue, reviewBooleanFalse, reviewBooleanNotSet }),
    [reviewBooleanTrue, reviewBooleanFalse, reviewBooleanNotSet]
  )

  const { sections, lvByPath, pathByPath } = useMemo(
    () => buildFindListModel(sectionRoots, q, booleanStrings),
    [sectionRoots, q, booleanStrings]
  )

  const yamlVisible = showYaml !== false

  const hasAnyRows = sections.some((s) => s.rows.length > 0)
  if (!hasAnyRows) {
    return <div className="wizard-review-find-list wizard-review-find-list--empty">{noResults}</div>
  }

  return (
    <div className="wizard-review-find-list">
      {sections.map((section, sectionIndex) => {
        if (section.rows.length === 0) return null
        const mod = horizontalTermWidthModifierForInputRun(section.rows.map((r) => r.node))

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
              {section.rows.map((row) => {
                const lv = lvByPath.get(row.node.path)
                const pr = pathByPath.get(row.node.path)
                const pathOnly = lv === undefined && pr !== undefined
                const labelIndices = indicesForKey(lv ?? pr, 'searchLabel')
                const valueIndices = indicesForKey(lv ?? pr, 'searchValue')
                const pathIndices = indicesForKey(pr, 'pathLast')

                const termText = row.node.label ?? row.node.path
                const valueText = row.searchValue
                const pathLastRaw = row.pathLast
                const pathDisplay = formatPathLastSegmentForDisplay(pathLastRaw)
                const rowExact = rowHasExactSubstringMatch(q, termText, valueText, pathLastRaw)

                const labelHighlight = pickHighlightIndices(termText, q, pathOnly ? undefined : labelIndices, rowExact)
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
                  <DescriptionListGroup key={row.node.path} style={{ marginLeft: 32 }}>
                    {onReviewEdit != null ? (
                      <ReviewPenHoverZone
                        ariaLabel="Edit"
                        descriptionListTerm={termBase}
                        descriptionListDescriptionId={row.node.id}
                        onPenClick={() => onReviewEdit(row.node, yamlVisible ? 'highlight' : 'navigate')}
                        onPenIconClick={() => onReviewEdit(row.node, 'navigate')}
                        onArrowClick={yamlVisible ? () => onReviewEdit(row.node, 'highlight') : undefined}
                      >
                        {valueContent}
                      </ReviewPenHoverZone>
                    ) : (
                      <>
                        <DescriptionListTerm>{termBase}</DescriptionListTerm>
                        <DescriptionListDescription id={row.node.id ?? ''}>
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
  )
}
