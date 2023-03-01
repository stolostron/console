/* Copyright Contributors to the Open Cluster Management project */

import { WizardStrings } from '@patternfly-labs/react-form-wizard'
import { useMemo } from 'react'
import { useTranslation } from './acm-i18next'

export const useWizardStrings = (
  wizardSpecificStrings: Pick<WizardStrings, 'stepsAriaLabel' | 'contentAriaLabel'>
): WizardStrings => {
  const { t } = useTranslation()
  return useMemo(
    () => ({
      ...wizardSpecificStrings,
      reviewLabel: t('Review'),
      unknownError: t('Unknown Error'),
      errorString: t('error'),
      actionAriaLabel: t('Action'),
      detailsAriaLabel: t('Details'),
      sortableMoveItemUpAriaLabel: t('Move item up'),
      sortableMoveItemDownAriaLabel: t('Move item down'),
      removeItemAriaLabel: t('Remove item'),
      deselectAllAriaLabel: t('Deselect all'),
      selectAllAriaLabel: t('Select all'),
      clearButtonTooltip: t('Clear'),
      pasteButtonTooltip: t('Paste'),
      backButtonText: t('Back'),
      cancelButtonText: t('Cancel'),
      nextButtonText: t('Next'),
      fixValidationErrorsMsg: t('Please fix validation errors'),
      submitText: t('Submit'),
      submittingText: t('Submitting'),
      moreInfo: t('More info'),
      hideSecretTooltip: t('Hide secret'),
      showSecretTooltip: t('Show secret'),
      spinnerButtonTooltip: t('Loading'),
      syncButtonTooltip: t('Refresh'),
      required: t('Required'),
      expandToFixValidationErrors: t('Expand to fix validation errors'),
      selectNoItems: t('Select none (0 items)'),
      selectPageItems: (count: number) => t('Select page ({{count}} items)', { count }),
      selectAllItems: (count: number) => t('Select all ({{count}} items)', { count }),
    }),
    [wizardSpecificStrings, t]
  )
}
