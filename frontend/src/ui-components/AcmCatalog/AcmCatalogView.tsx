/* Copyright Contributors to the Open Cluster Management project */

import {
  Button,
  EmptyState,
  EmptyStateBody,
  PageSection,
  Pagination,
  PaginationVariant,
  Split,
  SplitItem,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core'
import { PlusCircleIcon } from '@patternfly/react-icons'
import { ReactNode, useEffect, useState } from 'react'
import { useTranslation } from '~/lib/acm-i18next'
import { usePaginationTitles } from '~/lib/paginationStrings'
import { AcmCatalog } from './AcmCatalog'
import { ICatalogCard } from './catalogTypes'

export function AcmCatalogView({
  items,
  itemKeyFn,
  itemToCardFn,
  onBack,
  onCancel,
  customCatalogSection,
}: Readonly<{
  items: ICatalogCard[]
  itemKeyFn: (card: ICatalogCard) => string
  itemToCardFn: (card: ICatalogCard) => ICatalogCard
  onBack?: () => void
  onCancel?: () => void
  customCatalogSection?: ReactNode
}>) {
  const { t } = useTranslation()
  const paginationTitles = usePaginationTitles()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const showPagination = items.length > perPage
  const pagedItems = items.slice((page - 1) * perPage, page * perPage)

  useEffect(() => {
    if (page > Math.ceil(items.length / perPage)) setPage(1)
  }, [items.length, page, perPage])

  return (
    <>
      {items.length === 0 ? (
        <div style={{ paddingTop: 'var(--pf-t--global--spacer--2xl)' }}>
          <EmptyState headingLevel="h2" icon={PlusCircleIcon} titleText={t('No items yet')}>
            <EmptyStateBody>{t('To get started, create an item')}</EmptyStateBody>
          </EmptyState>
        </div>
      ) : (
        <PageSection hasBodyWrapper={false} className="pf-v6-u-flex-grow-1 pf-v6-u-p-lg">
          <AcmCatalog keyFn={itemKeyFn} items={pagedItems} itemToCardFn={itemToCardFn} />
          {customCatalogSection}
        </PageSection>
      )}
      {(onBack || onCancel || showPagination) && (
        <PageSection
          hasBodyWrapper={false}
          padding={{ default: 'noPadding' }}
          style={{ padding: 16 }}
          stickyOnBreakpoint={{ default: 'bottom' }}
        >
          <Split>
            {(onBack || onCancel) && (
              <Toolbar>
                <ToolbarContent>
                  {onBack && (
                    <ToolbarItem>
                      <Button onClick={onBack} variant="secondary">
                        {t('Back')}
                      </Button>
                    </ToolbarItem>
                  )}
                  {onCancel && (
                    <ToolbarItem style={{ paddingLeft: 'var(--pf-t--global--spacer--2xl)' }}>
                      <Button onClick={onCancel} variant="link">
                        {t('Cancel')}
                      </Button>
                    </ToolbarItem>
                  )}
                </ToolbarContent>
              </Toolbar>
            )}
            {showPagination && (
              <SplitItem isFilled>
                <Pagination
                  aria-label={t('Pagination bottom')}
                  titles={paginationTitles}
                  variant={PaginationVariant.bottom}
                  itemCount={items.length}
                  perPage={perPage}
                  page={page}
                  onSetPage={(_event, nextPage) => setPage(nextPage)}
                  onPerPageSelect={(_event, nextPerPage) => setPerPage(nextPerPage)}
                />
              </SplitItem>
            )}
          </Split>
        </PageSection>
      )}
    </>
  )
}
