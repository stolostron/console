/* Copyright Contributors to the Open Cluster Management project */
import { Button, DescriptionListDescription, DescriptionListTerm, useWizardContext } from '@patternfly/react-core'
import { ArrowRightIcon, PenIcon } from '@patternfly/react-icons'
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useCallback,
} from 'react'
import { useHighlightEditorPath } from './ReviewStepContexts'
import { InputReviewMeta, type WizardDomTreeNode } from './ReviewStepContexts'

/** Pen / row click: go to step and scroll; arrow: set YAML editor highlight path only. */
export type ReviewEditIntent = 'navigate' | 'highlight'

export type OnReviewEditHandler = (node: WizardDomTreeNode, intent?: ReviewEditIntent) => void

type WizardInputDomNode = Extract<WizardDomTreeNode, { type: InputReviewMeta.INPUT }>

const REVIEW_EDIT_TARGET_HIGHLIGHT_CLASS = 'wizard-review-edit-target-highlight'
const REVIEW_EDIT_TARGET_HIGHLIGHT_VISIBLE_CLASS = 'wizard-review-edit-target-highlight--visible'
const REVIEW_EDIT_TARGET_HIGHLIGHT_EASE_OUT_CLASS = 'wizard-review-edit-target-highlight--ease-out'
/** Fallback if `transitionend` on outline-width does not fire (should exceed ease-out duration). */
const REVIEW_EDIT_HIGHLIGHT_EASE_OUT_MS = 500
/** Time to keep the full outline before easing out (unless focus leaves the target sooner). */
const REVIEW_EDIT_TARGET_HIGHLIGHT_AUTO_DISMISS_MS = 2000

const reviewEditHighlightTeardownByEl = new WeakMap<Element, () => void>()

export function useReviewEditHandler(): OnReviewEditHandler {
  const { goToStepById } = useWizardContext()
  const { setHighlightEditorPath } = useHighlightEditorPath()
  return useCallback<OnReviewEditHandler>(
    (node, intent = 'navigate') => {
      const yamlPath = getReviewNodeYamlHighlightPath(node)
      if (intent === 'highlight') {
        if (yamlPath !== undefined) setHighlightEditorPath(yamlPath)
        return
      }
      const stepId = getReviewNodeStepId(node)
      const domId = getReviewScrollTargetDomId(node)
      if (stepId) goToStepById(stepId)
      if (domId) scrollReviewEditTargetIntoView(domId)
    },
    [goToStepById, setHighlightEditorPath]
  )
}

function isReviewInputNode(node: WizardDomTreeNode): node is WizardInputDomNode {
  return 'type' in node && node.type === InputReviewMeta.INPUT
}

function isReviewSectionNode(
  node: WizardDomTreeNode
): node is Extract<WizardDomTreeNode, { type: InputReviewMeta.SECTION }> {
  return 'type' in node && node.type === InputReviewMeta.SECTION
}

/** Dot path for YAML editor highlight: matches review registration path without `;id=` suffix. */
function getReviewNodeYamlHighlightPath(node: WizardDomTreeNode): string | undefined {
  if (!('path' in node) || typeof node.path !== 'string' || node.path === '') return undefined
  return node.path.replace(/;id=[^;]*$/u, '')
}

/** Wizard step id for navigating from review: explicit on INPUT / SECTION, else first descendant INPUT's `stepId`. */
function getReviewNodeStepId(node: WizardDomTreeNode): string | undefined {
  if (isReviewInputNode(node)) {
    return node.stepId && node.stepId !== '' ? node.stepId : undefined
  }
  if (isReviewSectionNode(node)) {
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
      case InputReviewMeta.SECTION:
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
        autoDismissId = setTimeout(() => {
          autoDismissId = undefined
          dismiss()
        }, REVIEW_EDIT_TARGET_HIGHLIGHT_AUTO_DISMISS_MS)
      })
    })

    let easeOutFallbackId: ReturnType<typeof setTimeout> | undefined
    let autoDismissId: ReturnType<typeof setTimeout> | undefined

    const finishHighlight = () => {
      if (autoDismissId !== undefined) {
        clearTimeout(autoDismissId)
        autoDismissId = undefined
      }
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
      if (autoDismissId !== undefined) {
        clearTimeout(autoDismissId)
        autoDismissId = undefined
      }
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
      if (autoDismissId !== undefined) {
        clearTimeout(autoDismissId)
        autoDismissId = undefined
      }
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

export function ReviewPenHoverZone({
  as,
  style,
  children,
  ariaLabel,
  arrowAriaLabel = 'Highlight in YAML',
  onPenClick,
  onPenIconClick,
  onArrowClick,
  descriptionListTerm,
  descriptionListDescriptionId,
  zoneClickable = true,
}: {
  as?: 'div' | 'span'
  style?: CSSProperties
  children: ReactNode
  ariaLabel: string
  /** Shown on the arrow control when {@link onArrowClick} is set. */
  arrowAriaLabel?: string
  /** Row / term / value click (not the pen or arrow buttons). */
  onPenClick: (e: ReactMouseEvent<HTMLElement>) => void
  /** Pen icon button; defaults to {@link onPenClick} when omitted. */
  onPenIconClick?: (e: ReactMouseEvent<HTMLElement>) => void
  onArrowClick?: (e: ReactMouseEvent<HTMLElement>) => void
  /** When set, render term + description as one grid row so the hover zone includes the term. */
  descriptionListTerm?: ReactNode
  /** `id` on the value cell (scroll target); same as non-pen description rows. */
  descriptionListDescriptionId?: string
  /**
   * When false, only the pen / arrow buttons activate edit; the wrapper is not clickable.
   * Use beside controls that need their own click targets (e.g. an expandable toggle).
   */
  zoneClickable?: boolean
}) {
  const Comp = as ?? 'div'
  const zoneClassName = [
    'wizard-review-pen-hover-zone',
    descriptionListTerm != null ? 'wizard-review-pen-hover-zone--dl-group-row' : 'wizard-review-inline-value',
    zoneClickable ? null : 'wizard-review-pen-hover-zone--controls-only',
  ]
    .filter(Boolean)
    .join(' ')

  const onZoneClick = useCallback(
    (e: ReactMouseEvent<HTMLElement>) => {
      const t = e.target as HTMLElement | null
      if (t?.closest?.('.wizard-review-edit-btn')) return
      e.stopPropagation()
      onPenClick(e)
    },
    [onPenClick]
  )

  const onZoneKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLElement>) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      const t = e.target as HTMLElement | null
      if (t?.closest?.('.wizard-review-edit-btn')) return
      e.preventDefault()
      e.stopPropagation()
      onPenClick(e as unknown as ReactMouseEvent<HTMLElement>)
    },
    [onPenClick]
  )

  const controls = (
    <span className="wizard-review-pen-controls">
      <Button
        type="button"
        variant="plain"
        className="wizard-review-edit-btn"
        aria-label={ariaLabel}
        onClick={(e) => {
          e.stopPropagation()
          const handler = onPenIconClick ?? onPenClick
          handler(e)
        }}
      >
        <PenIcon />
      </Button>
      {onArrowClick ? (
        <Button
          type="button"
          variant="plain"
          className="wizard-review-edit-btn"
          aria-label={arrowAriaLabel}
          onClick={(e) => {
            e.stopPropagation()
            onArrowClick(e)
          }}
        >
          <ArrowRightIcon />
        </Button>
      ) : null}
    </span>
  )

  return descriptionListTerm != null ? (
    <div
      role={zoneClickable ? 'button' : undefined}
      tabIndex={zoneClickable ? 0 : undefined}
      className={zoneClassName}
      style={style}
      onClick={zoneClickable ? onZoneClick : undefined}
      onKeyDown={zoneClickable ? onZoneKeyDown : undefined}
    >
      <DescriptionListTerm>{descriptionListTerm}</DescriptionListTerm>
      <DescriptionListDescription id={descriptionListDescriptionId ?? ''}>
        <span className="wizard-review-inline-value">
          {children}
          {controls}
        </span>
      </DescriptionListDescription>
    </div>
  ) : (
    <Comp className={zoneClassName} style={style} onClick={zoneClickable ? onZoneClick : undefined}>
      {children}
      {controls}
    </Comp>
  )
}
