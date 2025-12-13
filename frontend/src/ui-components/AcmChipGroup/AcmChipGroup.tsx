/* Copyright Contributors to the Open Cluster Management project */

import { Label, LabelGroup, LabelGroupProps, LabelProps } from '@patternfly/react-core'

import { useTranslation } from '../../lib/acm-i18next'

export function AcmChipGroup(
  props: Omit<LabelGroupProps, 'ref'> &
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
    <LabelGroup
      closeBtnAriaLabel={closeBtnAriaLabel ?? t('Clear all')}
      collapsedText={collapsedText ?? t('{{remaining}} more', { remaining: '${remaining}' })}
      expandedText={expandedText ?? t('Show less')}
      {...otherProps}
    >
      {children}
    </LabelGroup>
  )
}

export function AcmChip(props: Omit<LabelProps, 'ref'>) {
  const { children, ...otherProps } = props
  const { t } = useTranslation()
  return (
    <Label variant="outline" closeBtnAriaLabel={t('Close')} {...otherProps}>
      {children}
    </Label>
  )
}
