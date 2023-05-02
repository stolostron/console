/* Copyright Contributors to the Open Cluster Management project */

import { Chip, ChipGroup, ChipProps, ChipGroupProps } from '@patternfly/react-core'
import { useTranslation } from '../../lib/acm-i18next'

export function AcmChipGroup(
  props: Omit<ChipGroupProps, 'ref'> &
    ({ categoryName: string; 'aria-label'?: never } | { categoryName?: never; 'aria-label': string })
) {
  const {
    'aria-label': ariaLabel,
    categoryName,
    closeBtnAriaLabel,
    collapsedText,
    expandedText,
    children,
    ...otherProps
  } = props
  const { t } = useTranslation()
  return (
    <ChipGroup
      closeBtnAriaLabel={closeBtnAriaLabel ?? t('Clear all')}
      collapsedText={collapsedText ?? t('{{remaining}} more', { remaining: '${remaining}' })}
      expandedText={expandedText ?? t('Show less')}
      {...otherProps}
    >
      {children}
    </ChipGroup>
  )
}

export function AcmChip(props: Omit<ChipProps, 'ref'>) {
  const { children, ...otherProps } = props
  const { t } = useTranslation()
  return (
    <Chip closeBtnAriaLabel={t('Close')} {...otherProps}>
      {children}
    </Chip>
  )
}
