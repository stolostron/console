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
      noItemsString: (plural: string) => t('No {{plural}} yet', { plural }),
      getStartedMessage: (article: string, singular: string) =>
        t('To get started, create {{article}} {{singular}}.', { article, singular }),
      createItemString: t('Create item'),
    }),
    [t]
  )
}
