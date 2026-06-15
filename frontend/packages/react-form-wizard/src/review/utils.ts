/* Copyright Contributors to the Open Cluster Management project */
import { type DescriptionList } from '@patternfly/react-core'
import get from 'get-value'
import { type ComponentProps } from 'react'
import { InputReviewMeta, type InputReviewStepMeta, type WizardDomTreeNode } from './ReviewStepContexts'

export type BuildTreeStepContext = {
  stepId: string
  label: string
}

export function buildTree(
  element: Element,
  stepInputMap: ReadonlyMap<string, InputReviewStepMeta>,
  stepCtx: BuildTreeStepContext
): WizardDomTreeNode {
  const nodes: WizardDomTreeNode[] = []
  for (let i = 0; i < element.children.length; i++) {
    nodes.push(...buildReviewSubtree(element.children[i]!, stepInputMap, stepCtx.stepId, []))
  }

  if (stepCtx.stepId === 'review') {
    const filtered = nodes.filter(subtreeContainsReviewInput)
    if (filtered.length === 1) return filtered[0]!
    if (filtered.length === 0) return {}
    return { children: filtered }
  }

  const sectionNode: WizardDomTreeNode = {
    type: InputReviewMeta.SECTION,
    id: stepCtx.stepId,
    label: stepCtx.label,
    children: nodes,
  }
  if (!subtreeContainsReviewInput(sectionNode)) return {}
  return sectionNode
}

/**
 * Walks the live wizard DOM and builds review tree nodes for elements whose `id` exists in
 * `stepInputMap`. Elements without metadata are skipped as nodes; their descendants are still
 * visited so nested registered controls are not lost.
 *
 * `parentStepId` is threaded so INPUT and ARRAY_INSTANCE nodes can be associated with the enclosing wizard step.
 * `reviewPathPrefixSegments` accumulates ARRAY_INPUT field paths and ARRAY_INSTANCE index segments
 * along the DOM path (in order); registration code uses this for array-aware review paths.
 */
function buildReviewSubtree(
  element: Element,
  stepInputMap: ReadonlyMap<string, InputReviewStepMeta>,
  parentStepId: string,
  reviewPathPrefixSegments: readonly string[] = []
): WizardDomTreeNode[] {
  if (element instanceof HTMLElement) {
    const props = stepInputMap.get(element.id)
    if (props) {
      let segmentsForChildren = reviewPathPrefixSegments
      if (props.type === InputReviewMeta.ARRAY_INPUT && props.path != null && props.path !== '') {
        segmentsForChildren = [...reviewPathPrefixSegments, props.path]
      } else if (props.type === InputReviewMeta.ARRAY_INSTANCE && props.path !== undefined && props.path !== '') {
        segmentsForChildren = [...reviewPathPrefixSegments, props.path]
      }
      const children: WizardDomTreeNode[] = []
      for (let i = 0; i < element.children.length; i++) {
        children.push(...buildReviewSubtree(element.children[i]!, stepInputMap, parentStepId, segmentsForChildren))
      }
      const hasChildren = children.length > 0
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
      if (props.type === InputReviewMeta.GROUP) {
        return [
          hasChildren ? { ...props, type: InputReviewMeta.GROUP, children } : { ...props, type: InputReviewMeta.GROUP },
        ]
      }
      /* ARRAY_INSTANCE: repeat-group row or similar; `path` often carries the instance index segment. */
      return [
        hasChildren
          ? { ...props, type: InputReviewMeta.ARRAY_INSTANCE, stepId: parentStepId, children }
          : { ...props, type: InputReviewMeta.ARRAY_INSTANCE, stepId: parentStepId },
      ]
    }
  }
  /* No metadata on this node (or non-HTMLElement): flatten by collecting subtrees from each child. */
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

/** Trailing wizard path annotation, e.g. `…#["CreateNamespace=true"]` (see ReviewStepFindList display notes). */
const YAML_PATH_HASH_BRACKET_SUFFIX = /#\["([^"]*)"\]$/u

const NON_ALPHANUMERIC = /[^a-zA-Z0-9]/u

/** `value` is `key` or `key` followed by a boundary (next char not alphanumeric). */
function arrayStringStartsWithKeyAtNonAlphanumericBoundary(value: string, key: string): boolean {
  if (!value.startsWith(key)) return false
  if (value.length === key.length) return true
  return NON_ALPHANUMERIC.test(value[key.length]!)
}

function bracketAnnotationKey(inner: string): string {
  const eq = inner.indexOf('=')
  return eq >= 0 ? inner.slice(0, eq) : inner
}

/** Value segment after the first `=` in `#["key=value"]` inner text; `undefined` if there is no `=`. */
function bracketAnnotationValue(inner: string): string | undefined {
  const eq = inner.indexOf('=')
  return eq >= 0 ? inner.slice(eq + 1) : undefined
}

/** Dot-path for `get-value` on a resource object (strip leading `kind.` when it matches the object). */
function resourceGetPathForGetValue(target: object, normalized: string): string {
  const ik = (target as { kind?: unknown }).kind
  if (ik == null || String(ik) === '') return normalized
  const k = String(ik)
  if (normalized === k) return ''
  if (normalized.startsWith(`${k}.`)) return normalized.slice(k.length + 1)
  return normalized
}

function yamlPathValueBelongsToTarget(target: object, normalized: string): boolean {
  const resourcePath = resourceGetPathForGetValue(target, normalized)
  if (resourcePath === '') return true

  const m = resourcePath.match(YAML_PATH_HASH_BRACKET_SUFFIX)
  const pathWasAppended = m !== null
  const basePath = pathWasAppended ? resourcePath.slice(0, m.index) : resourcePath

  const got = get(target, basePath)
  if (got === undefined) return false

  if (pathWasAppended && Array.isArray(got)) {
    const inner = m[1]
    const key = bracketAnnotationKey(inner)
    if (key === '') return false
    const expectedValue = bracketAnnotationValue(inner)
    return got.some((el) => {
      if (typeof el !== 'string') return false
      if (!arrayStringStartsWithKeyAtNonAlphanumericBoundary(el, key)) return false
      if (expectedValue === undefined) return true
      const eqInEl = el.indexOf('=')
      if (eqInEl === -1) return false
      return el.slice(0, eqInEl) === key && el.slice(eqInEl + 1) === expectedValue
    })
  }

  return true
}

/**
 * Resolves `yamlPath` against `item` the same way as YAML highlight / review navigation (resource array + `kind` head,
 * `;id=` strip, escaped dots) and returns the value at the resolved path, or `undefined` if the path does not apply.
 */
export function getItemValue(item: unknown, yamlPath: string): unknown {
  const clean = yamlPath.replace(/;id=[^;]*$/u, '').trim()
  if (!clean) return undefined
  const normalized = clean.replace(/\\\./g, '.')
  const firstDot = normalized.indexOf('.')
  const kindHead = firstDot === -1 ? normalized : normalized.slice(0, firstDot)

  let target: unknown = item
  if (Array.isArray(item)) {
    target = item.find((res) => {
      if (!res || typeof res !== 'object') return false
      const rk = (res as { kind?: unknown }).kind
      return rk != null && String(rk) !== '' && String(rk) === kindHead
    })
    if (!target) return undefined
  }

  if (target && typeof target === 'object') {
    if (!yamlPathValueBelongsToTarget(target as object, normalized)) return undefined
    const resourcePath = resourceGetPathForGetValue(target as object, normalized)
    if (resourcePath === '') return target

    const m = resourcePath.match(YAML_PATH_HASH_BRACKET_SUFFIX)
    const pathWasAppended = m !== null
    const basePath = pathWasAppended ? resourcePath.slice(0, m.index) : resourcePath
    const got = get(target as object, basePath)
    if (!pathWasAppended || m === null) {
      return got
    }
    if (!Array.isArray(got)) {
      return undefined
    }
    const inner = m[1]
    const key = bracketAnnotationKey(inner)
    if (key === '') {
      return undefined
    }
    const expectedValue = bracketAnnotationValue(inner)
    for (const el of got) {
      if (typeof el !== 'string') continue
      if (!arrayStringStartsWithKeyAtNonAlphanumericBoundary(el, key)) continue
      const eqInEl = el.indexOf('=')
      if (expectedValue === undefined) {
        if (eqInEl === -1) {
          if (el === key) return el
          continue
        }
        if (el.slice(0, eqInEl) === key) return el.slice(eqInEl + 1)
        continue
      }
      if (eqInEl === -1) continue
      if (el.slice(0, eqInEl) === key && el.slice(eqInEl + 1) === expectedValue) {
        return el.slice(eqInEl + 1)
      }
    }
    return undefined
  }

  return undefined
}

// --- Review description-list layout (shared by ReviewStep, ReviewStepFindList) ---

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
  default: '12ch',
  sm: '15ch',
  md: '20ch',
  lg: '28ch',
  xl: '30ch',
  '2xl': '70ch',
}

export const REVIEW_ERROR_TEXT_COLOR = 'var(--pf-t--global--text--color--status--danger--default)'

export function horizontalTermWidthModifierForInputRun(
  nodes: readonly { label?: string; path: string }[]
): HorizontalTermWidthModifier {
  if (nodes.length === 0) {
    return REVIEW_HORIZONTAL_TERM_WIDTH_COMPACT
  }
  let longCount = 0
  for (const n of nodes) {
    const termText = n.label ?? n.path
    if (termText.length > 32) {
      longCount++
    }
  }
  return longCount / nodes.length >= 0.6 ? REVIEW_HORIZONTAL_TERM_WIDTH_WIDE : REVIEW_HORIZONTAL_TERM_WIDTH_COMPACT
}
