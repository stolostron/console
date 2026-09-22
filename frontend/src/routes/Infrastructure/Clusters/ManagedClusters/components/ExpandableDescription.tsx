/* Copyright Contributors to the Open Cluster Management project */
import { css } from '@emotion/css'
import useResizeObserver from '@react-hook/resize-observer'
import { Markdown } from '@redhat-cloud-services/rule-components/Markdown'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { AcmButton } from '../../../../../ui-components'

/** UX guidance: keep long descriptions to about 3–4 lines (max 4). */
export const DEFAULT_MAX_DESCRIPTION_LINES = 4

const descriptionContent = css({
  whiteSpace: 'pre-wrap',
})

const descriptionClamped = css({
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
})

export function ExpandableDescription(props: { description: string; maxLines?: number }) {
  const { t } = useTranslation()
  const maxLines = props.maxLines ?? DEFAULT_MAX_DESCRIPTION_LINES
  const [isExpanded, setIsExpanded] = useState(false)
  const [isTruncatable, setIsTruncatable] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const updateTruncatable = useCallback(() => {
    const element = contentRef.current
    if (!element || isExpanded) {
      return
    }
    setIsTruncatable(element.scrollHeight > element.clientHeight + 1)
  }, [isExpanded])

  useLayoutEffect(() => {
    updateTruncatable()
  }, [props.description, maxLines, updateTruncatable])

  // Recalculate when the container reflows (narrower width, text zoom, etc.)
  useResizeObserver(contentRef, () => {
    requestAnimationFrame(updateTruncatable)
  })

  return (
    <div>
      <div
        ref={contentRef}
        className={`${descriptionContent}${!isExpanded ? ` ${descriptionClamped}` : ''}`}
        style={!isExpanded ? { WebkitLineClamp: maxLines } : undefined}
      >
        <Markdown template={props.description} />
      </div>
      {isTruncatable && (
        <AcmButton variant="link" isInline onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? t('Show less') : t('Show more')}
        </AcmButton>
      )}
    </div>
  )
}
