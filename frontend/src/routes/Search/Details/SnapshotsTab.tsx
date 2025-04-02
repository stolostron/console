/* Copyright Contributors to the Open Cluster Management project */
import { Alert, PageSection, Stack } from '@patternfly/react-core'
import { useMemo, useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { useSharedAtoms } from '../../../shared-recoil'
import { AcmLoadingPage, AcmTable } from '../../../ui-components'
import { useAllClusters } from '../../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import {
  ClosedDeleteExternalResourceModalProps,
  DeleteExternalResourceModal,
  IDeleteExternalResourceModalProps,
} from '../components/Modals/DeleteExternalResourceModal'
import {
  ClosedDeleteModalProps,
  DeleteResourceModal,
  IDeleteModalProps,
} from '../components/Modals/DeleteResourceModal'
import { searchClient } from '../search-sdk/search-client'
import { useSearchResultItemsQuery } from '../search-sdk/search-sdk'
import { useSearchDefinitions } from '../searchDefinitions'
import { ISearchResult } from '../SearchResults/utils'

export default function SnapshotsTab() {
  const { t } = useTranslation()
  const { useSearchResultLimit } = useSharedAtoms()
  const searchResultLimit = useSearchResultLimit()
  const searchDefinitions = useSearchDefinitions()
  const allClusters = useAllClusters(true)
  const [deleteResource, setDeleteResource] = useState<IDeleteModalProps>(ClosedDeleteModalProps)
  const [deleteExternalResource, setDeleteExternalResource] = useState<IDeleteExternalResourceModalProps>(
    ClosedDeleteExternalResourceModalProps
  )

  const { data, loading, error } = useSearchResultItemsQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    variables: {
      input: [
        {
          keywords: [],
          filters: [{ property: 'kind', values: ['VirtualMachineSnapshot'] }],
          limit: searchResultLimit,
        },
      ],
    },
  })
  const snapshotItems: ISearchResult[] = useMemo(() => data?.searchResult?.[0]?.items || [], [data?.searchResult])

  if (loading) {
    return (
      <PageSection>
        <AcmLoadingPage />
      </PageSection>
    )
  }
  if (error) {
    return (
      <PageSection>
        <Alert variant={'danger'} isInline={true} title={t('An unexpected error occurred.')}>
          {error.message}
        </Alert>
      </PageSection>
    )
  }

  if (!loading && !error && snapshotItems.length === 0) {
    return (
      <PageSection>
        <Alert variant={'info'} isInline={true} title={t('There are no resources related to your search results.')}>
          {error}
        </Alert>
      </PageSection>
    )
  }

  return (
    <>
      <DeleteResourceModal
        open={deleteResource.open}
        close={deleteResource.close}
        resource={deleteResource.resource}
        currentQuery={deleteResource.currentQuery}
        relatedResource={deleteResource.relatedResource}
      />
      <DeleteExternalResourceModal
        open={deleteExternalResource.open}
        close={deleteExternalResource.close}
        resource={deleteExternalResource.resource}
        hubCluster={deleteExternalResource.hubCluster}
      />
      <PageSection>
        <Stack hasGutter>
          {snapshotItems.length >= searchResultLimit ? (
            <Alert
              variant={'warning'}
              isInline={true}
              title={t(
                'Search result limit has been reached. Your query results have been truncated. View the RHACM documentation to learn how to increase the search results limit.'
              )}
            />
          ) : null}
          <PageSection isFilled={false} variant={'light'}>
            <AcmTable
              items={snapshotItems}
              emptyState={undefined} // table only shown for kinds with related resources
              columns={searchDefinitions['virtualmachinesnapshot'].columns}
              rowActions={[
                {
                  id: 'delete',
                  title: t('Delete virtualmachinesnapshot'),
                  click: (item: any) => {
                    if (item.managedHub && item.managedHub !== 'global-hub') {
                      setDeleteExternalResource({
                        open: true,
                        close: () => setDeleteExternalResource(ClosedDeleteExternalResourceModalProps),
                        resource: item,
                        hubCluster: allClusters.find((cluster) => cluster.name === item.managedHub),
                      })
                    } else {
                      setDeleteResource({
                        open: true,
                        close: () => setDeleteResource(ClosedDeleteModalProps),
                        resource: item,
                        currentQuery: 'kind:VirtualMachineSnapshot',
                        relatedResource: false,
                      })
                    }
                  },
                },
              ]}
              keyFn={(item: any) => item._uid.toString()}
            />
          </PageSection>
        </Stack>
      </PageSection>
    </>
  )
}
