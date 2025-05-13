/* Copyright Contributors to the Open Cluster Management project */
import { Alert, PageSection, Stack } from '@patternfly/react-core'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../lib/acm-i18next'
import { fireManagedClusterView } from '../../../resources/managedclusterview'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmLoadingPage, AcmTable } from '../../../ui-components'
import { useAllClusters } from '../../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import {
  ClosedVMActionModalProps,
  IVMActionModalProps,
  VMActionModal,
} from '../../Infrastructure/VirtualMachines/modals/VMActionModal'
import { getVMSnapshotActions } from '../../Infrastructure/VirtualMachines/utils'
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
import { getResourceParams } from './DetailsPage'

export default function SnapshotsTab() {
  const { t } = useTranslation()
  const { cluster, kind, apiversion, namespace, name } = getResourceParams()
  const { useSearchResultLimit, settingsState } = useSharedAtoms()
  const searchResultLimit = useSearchResultLimit()
  const searchDefinitions = useSearchDefinitions()
  const vmActionsEnabled = useRecoilValue(settingsState)?.VIRTUAL_MACHINE_ACTIONS === 'enabled'
  const navigate = useNavigate()
  const allClusters = useAllClusters(true)
  const [VMAction, setVMAction] = useState<IVMActionModalProps>(ClosedVMActionModalProps)
  const [vmLoading, setVMLoading] = useState<any>(true)
  const [vm, setVM] = useState<any>({})
  const [deleteResource, setDeleteResource] = useState<IDeleteModalProps>(ClosedDeleteModalProps)
  const [deleteExternalResource, setDeleteExternalResource] = useState<IDeleteExternalResourceModalProps>(
    ClosedDeleteExternalResourceModalProps
  )

  useEffect(() => {
    fireManagedClusterView(cluster, kind, apiversion, name, namespace)
      .then((viewResponse) => {
        setVMLoading(false)
        if (viewResponse?.message) {
          console.error('Error fetching parent VM')
        } else {
          setVM(viewResponse?.result)
        }
      })
      .catch((err) => {
        console.error('Error getting VirtualMachine: ', err)
        setVMLoading(false)
      })
  }, [cluster, kind, apiversion, name, namespace])

  const isVMRunning = useMemo(() => vm?.status?.printableStatus === 'Running', [vm?.status?.printableStatus])

  const { data, loading, error } = useSearchResultItemsQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    variables: {
      input: [
        {
          keywords: [],
          filters: [
            { property: 'kind', values: ['VirtualMachineSnapshot'] },
            { property: 'sourceName', values: [name] },
          ],
          limit: searchResultLimit,
        },
      ],
    },
  })
  const snapshotItems: ISearchResult[] = useMemo(() => data?.searchResult?.[0]?.items || [], [data?.searchResult])

  if (loading || vmLoading) {
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
        <Alert
          variant={'info'}
          isInline={true}
          title={t('No VirtualMachineSnapshots found. Take a snapshot of the VirtualMachine to view snapshots here.')}
        >
          {error}
        </Alert>
      </PageSection>
    )
  }

  return (
    <>
      <VMActionModal
        open={VMAction.open}
        close={VMAction.close}
        action={VMAction.action}
        method={VMAction.method}
        item={VMAction.item}
        vm={vm}
      />
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
              rowActionResolver={(item: any) =>
                getVMSnapshotActions(
                  item,
                  isVMRunning,
                  allClusters,
                  vmActionsEnabled,
                  setVMAction,
                  setDeleteResource,
                  setDeleteExternalResource,
                  navigate,
                  t
                )
              }
              keyFn={(item: any) => item._uid.toString()}
            />
          </PageSection>
        </Stack>
      </PageSection>
    </>
  )
}
