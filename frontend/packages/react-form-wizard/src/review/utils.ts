/* Copyright Contributors to the Open Cluster Management project */
import { type DescriptionList } from '@patternfly/react-core'
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

// --- Review description-list layout (shared by ReviewStep, ReviewStepFindList) ---

type WizardInputDomNode = Extract<WizardDomTreeNode, { type: InputReviewMeta.INPUT }>

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

export const REVIEW_ERROR_TEXT_COLOR = 'var(--pf-t--global--text--color--status--danger--default)'

export function horizontalTermWidthModifierForInputRun(
  nodes: readonly WizardInputDomNode[]
): HorizontalTermWidthModifier {
  let maxLen = 0
  for (const n of nodes) {
    const termText = n.label ?? n.path
    maxLen = Math.max(maxLen, termText.length)
  }
  return maxLen < 64 ? REVIEW_HORIZONTAL_TERM_WIDTH_COMPACT : REVIEW_HORIZONTAL_TERM_WIDTH_WIDE
}

/** For each whitespace-delimited word in `label`, if it contains `/`, drop the prefix through the first `/`. */
function simplifyLabelWordSlashes(label: string): string {
  return label.replace(/\S+/g, (word) => {
    const i = word.indexOf('/')
    if (i === -1) return word
    return word.slice(i + 1)
  })
}

/**
 * Returns a deep copy of `roots` with the same shape, but every `label` simplified per
 * {@link simplifyLabelWordSlashes}. Does not mutate the input trees.
 */
export function simplifyLabels(roots: readonly WizardDomTreeNode[]): WizardDomTreeNode[] {
  return roots.map(simplifyLabelsInNode)
}

function simplifyLabelsInNode(node: WizardDomTreeNode): WizardDomTreeNode {
  const children = node.children?.map(simplifyLabelsInNode)
  const next = children !== undefined ? { ...node, children } : node

  if ('label' in next && next.label !== undefined) {
    return { ...next, label: simplifyLabelWordSlashes(next.label) }
  }
  return next
}
