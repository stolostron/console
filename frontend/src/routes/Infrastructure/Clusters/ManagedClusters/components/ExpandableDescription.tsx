/* Copyright Contributors to the Open Cluster Management project */
import {
  ExpandableSection,
  ExpandableSectionVariant,
  Label
} from '@patternfly/react-core'
import { Markdown } from '@redhat-cloud-services/rule-components/Markdown'
import { useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'

/** UX guidance: keep long descriptions to about 3–4 lines (max 4). */
export const DEFAULT_MAX_DESCRIPTION_LINES = 4

export function ExpandableDescription(
  props: Readonly<{ description: string; maxLines?: number }>
) {
  const { t } = useTranslation()
  const maxLines = props.maxLines ?? DEFAULT_MAX_DESCRIPTION_LINES
  const [isExpanded, setIsExpanded] = useState(false)
  const toggleExpanded = () => isExpanded ? t('Show less') : t('Show more')

  return (
    <ExpandableSection
      variant={ExpandableSectionVariant.truncate}
      toggleContent={() =>
        <Label style={{ width: 'fit-content' }} variant="overflow" onClick={toggleExpanded}>
          {isExpanded
            ? t('Show less')
            : t('Show more')}
        </Label>
      }
      truncateMaxLines={maxLines}
      onToggle={(_e, isExpanded) => setIsExpanded(isExpanded)}
      isExpanded={isExpanded}
    >
      <Markdown template={props.description} />
    </ExpandableSection>
  )
}
