/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { useTranslation } from './acm-i18next'

export const usePaginationTitles = () => {
    const { t } = useTranslation()
    return useMemo(
        () => ({
            currPage: t('current page'),
            items: t('items'),
            itemsPerPage: t('items per page'),
            ofWord: t('of'),
            page: t('page'),
            pages: t('pages'),
            paginationTitle: t('pagination'),
            perPageSuffix: t('per page'),
            toFirstPage: t('to first page'),
            toLastPage: t('to last page'),
            toNextPage: t('to next page'),
            toPreviousPage: t('to previous page'),
        }),
        [t]
    )
}
