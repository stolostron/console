/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { useTranslation } from './acm-i18next'
import { PaginationTitles } from '@patternfly/react-core'

export const usePaginationTitles = (): PaginationTitles => {
  const { t } = useTranslation()
  return useMemo(
    () => ({
      currPage: t('Current page'),
      items: t('items'),
      itemsPerPage: t('items per page'),
      optionsToggleAriaLabel: t('items per page'),
      ofWord: t('of'),
      page: t('page'),
      pages: t('pages'),
      paginationTitle: t('pagination'),
      perPageSuffix: t('per page'),
      toFirstPage: t('Go to first page'),
      toLastPage: t('Go to last page'),
      toNextPage: t('Go to next page'),
      toPreviousPage: t('Go to previous page'),
    }),
    [t]
  )
}
