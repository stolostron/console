/* Copyright Contributors to the Open Cluster Management project */
import { css } from '@emotion/css'
import {
  ExpandableSection,
  ExpandableSectionToggle,
  ExpandableSectionVariant,
} from '@patternfly/react-core'
import { Markdown } from '@redhat-cloud-services/rule-components/Markdown'
import { useId, useLayoutEffect, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'

/** UX guidance: keep long descriptions to about 3–4 lines (max 4). */
export const DEFAULT_MAX_DESCRIPTION_LINES = 4

const descriptionContent = css({
  // Avoid pre-wrap: marked emits a trailing newline that inflates scrollHeight and
  // false-triggers truncate ellipsis when no text is hidden (ACM-50219).
  lineHeight: 1.5,
  '& p': {
    margin: 0,
  },
})

export function ExpandableDescription(
  props: Readonly<{ description: string; maxLines?: number }>
) {
  const { t } = useTranslation()
  const maxLines = props.maxLines ?? DEFAULT_MAX_DESCRIPTION_LINES
  const [isExpanded, setIsExpanded] = useState(false)
  const [isTruncatable, setIsTruncatable] = useState(false)
  const contentId = useId()
  const toggleId = useId()

  // Detached truncate always renders our toggle; only show it when content overflows.
  useLayoutEffect(() => {
    if (isExpanded) {
      return
    }
    const element = document.getElementById(contentId)
    if (!element) {
      return
    }
    const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight)
    if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
      setIsTruncatable(false)
      return
    }
    setIsTruncatable(element.scrollHeight / lineHeight > maxLines + 0.5)
  }, [props.description, maxLines, isExpanded, contentId])

  return (
    <>
      <ExpandableSection
        className={descriptionContent}
        variant={ExpandableSectionVariant.truncate}
        truncateMaxLines={maxLines}
        isDetached
        isExpanded={isExpanded}
        contentId={contentId}
        toggleId={toggleId}
        direction="up"
      >
        <Markdown template={props.description} />
      </ExpandableSection>
      {isTruncatable && (
        <ExpandableSectionToggle
          isExpanded={isExpanded}
          onToggle={setIsExpanded}
          contentId={contentId}
          toggleId={toggleId}
          direction="up"
          hasTruncatedContent
          isDetached
        >
          {isExpanded ? t('Show less') : t('Show more')}
        </ExpandableSectionToggle>
      )}
    </>
  )
}
