/* Copyright Contributors to the Open Cluster Management project */

import { DataViewStrings } from '@stolostron/react-data-view'
import { useMemo } from 'react'
import { useTranslation } from './acm-i18next'

export const useDataViewStrings = (): DataViewStrings => {
  const { t } = useTranslation()
  return useMemo(
    () => ({
      backLabel: t('Back'),
      cancelLabel: t('Cancel'),
      noItemsString: t('No items yet'),
      getStartedMessage: t('To get started, create an item'),
      createItemString: t('Create item'),
    }),
    [t]
  )
}
