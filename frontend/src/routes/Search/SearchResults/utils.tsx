/* Copyright Contributors to the Open Cluster Management project */
import { get } from 'lodash'
import queryString from 'query-string'
import { useContext, useMemo } from 'react'
import { TFunction } from 'react-i18next'
import { generatePath, NavigateFunction, useNavigate } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { Cluster, fetchRetry, getBackendUrl } from '../../../resources/utils'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmToastContext, compareStrings, IAlertContext } from '../../../ui-components'
import { useAllClusters } from '../../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import {
  ClosedDeleteExternalResourceModalProps,
  IDeleteExternalResourceModalProps,
} from '../components/Modals/DeleteExternalResourceModal'
import { ClosedDeleteModalProps, IDeleteModalProps } from '../components/Modals/DeleteResourceModal'
import { searchClient } from '../search-sdk/search-client'
import { SearchResultItemsQuery } from '../search-sdk/search-sdk'
import { GetUrlSearchParam, SearchColumnDefinition } from '../searchDefinitions'

export interface ISearchResult {
  kind: string
  apiversion: string
  name: string
  apigroup?: string
  __type: string
}

export function handleVMActions(
  action: string,
  path: string,
  item: any,
  refetchVM: () => void, // provide a callback fn to refetch the vm
  toast: IAlertContext,
  t: TFunction
) {
  if (process.env.NODE_ENV === 'test') return
  const abortController = new AbortController()
  fetchRetry({
    method: 'PUT',
    url: `${getBackendUrl()}${path}`,
    data: {
      managedCluster: item.cluster,
      vmName: item.name,
      vmNamespace: item.namespace,
    },
    signal: abortController.signal,
    retries: process.env.NODE_ENV === 'production' ? 2 : 0,
    headers: { Accept: '*/*' },
    disableRedirectUnauthorizedLogin: true,
  })
    .then(() => {
      // Wait 5 seconds to allow search collector to catch up & refetch search results to update table.
      setTimeout(refetchVM, 5000)
    })
    .catch((err) => {
      console.error(`VirtualMachine: ${item.name} ${action} error. ${err}`)

      let errMessage: string = err?.message ?? t('An unexpected error occurred.')
      if (errMessage.includes(':')) errMessage = errMessage.split(':').slice(1).join(':')
      if (errMessage === 'Unauthorized') errMessage = t('Unauthorized to execute this action.')
      toast.addAlert({
        title: t('Error triggering action {{action}} on VirtualMachine {{name}}', {
          name: item.name,
          action,
        }),
        message: errMessage,
        type: 'danger',
      })
    })
}

export const useGetRowActions = (
  resourceKind: string,
  currentQuery: string,
  relatedResource: boolean,
  setDeleteResource: React.Dispatch<React.SetStateAction<IDeleteModalProps>>,
  setDeleteExternalResource: React.Dispatch<React.SetStateAction<IDeleteExternalResourceModalProps>>
) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { settingsState } = useSharedAtoms()
  const vmActionsEnabled = useRecoilValue(settingsState)?.VIRTUAL_MACHINE_ACTIONS === 'enabled'
  const toast = useContext(AcmToastContext)
  const allClusters = useAllClusters(true)

  return useMemo(
    () =>
      getRowActions(
        resourceKind,
        currentQuery,
        relatedResource,
        setDeleteResource,
        setDeleteExternalResource,
        allClusters,
        navigate,
        toast,
        vmActionsEnabled,
        t
      ),
    [
      resourceKind,
      currentQuery,
      relatedResource,
      setDeleteResource,
      setDeleteExternalResource,
      allClusters,
      navigate,
      toast,
      vmActionsEnabled,
      t,
    ]
  )
}

export function getRowActions(
  resourceKind: string,
  currentQuery: string,
  relatedResource: boolean,
  setDeleteResource: React.Dispatch<React.SetStateAction<IDeleteModalProps>>,
  setDeleteExternalResource: React.Dispatch<React.SetStateAction<IDeleteExternalResourceModalProps>>,
  allClusters: Cluster[],
  navigate: NavigateFunction,
  toast: IAlertContext,
  vmActionsEnabled: boolean,
  t: TFunction
) {
  const viewApplication = {
    id: 'view-application',
    title: t('View Application'),
    click: (item: any) => {
      const { apigroup, applicationSet, cluster, name, namespace, kind, _hubClusterResource } = item
      if (apigroup === 'app.k8s.io' || apigroup === 'argoproj.io') {
        const path = generatePath(NavigationPath.applicationOverview, {
          namespace,
          name,
        })
        const params = queryString.stringify({
          apiVersion: `${kind}.${apigroup}`.toLowerCase(),
          cluster: !_hubClusterResource ? cluster : undefined,
          applicationset: applicationSet ?? undefined,
        })
        if (item.managedHub === 'global-hub' && !item?._hubClusterResource) {
          const hubUrl = allClusters.find((cluster) => cluster.name === item.cluster)?.consoleURL
          return window.open(`${hubUrl}${path}?${params}`, '_blank')
        }
        return navigate(
          {
            pathname: path,
            search: `?${params}`,
          },
          {
            state: {
              from: NavigationPath.search,
              fromSearch: window.location.search,
            },
          }
        )
      }
      const searchParams = GetUrlSearchParam(item)
      return navigate(
        {
          pathname: NavigationPath.resources,
          search: searchParams,
        },
        {
          state: {
            from: NavigationPath.search,
            fromSearch: window.location.search,
          },
        }
      )
    },
  }
  const viewAppTopology = {
    id: 'view-application-topology',
    title: t('View Application topology'),
    click: (item: any) => {
      const apiversion = encodeURIComponent(`${item?.kind}.${item?.apigroup}`.toLowerCase())
      const path = generatePath(NavigationPath.applicationTopology, { name: item.name, namespace: item.namespace })
      if (item.managedHub && !item?._hubClusterResource) {
        const hubUrl = allClusters.find((cluster) => cluster.name === item.cluster)?.consoleURL
        return window.open(`${hubUrl}${path}?apiVersion=${apiversion}`, '_blank')
      }
      return navigate(
        {
          pathname: path,
          search: `?apiVersion=${apiversion}`,
        },
        {
          state: {
            from: NavigationPath.search,
            fromSearch: window.location.search,
          },
        }
      )
    },
  }
  const editButton = {
    id: 'edit',
    title: t('Edit {{resourceKind}}', { resourceKind }),
    click: (item: any) => {
      const searchParams = GetUrlSearchParam(item)
      if (item.managedHub && item.managedHub !== 'global-hub') {
        // If resource lives on a cluster managed by a managed hub we need to launch user to the managed hub for actions / viewing
        const hubUrl = allClusters.find((cluster) => cluster.name === item.managedHub)?.consoleURL
        return window.open(`${hubUrl}${NavigationPath.resourceYAML}${searchParams}`, '_blank')
      }
      return navigate(
        {
          pathname: NavigationPath.resourceYAML,
          search: searchParams,
        },
        {
          state: {
            from: NavigationPath.search,
            fromSearch: window.location.search,
          },
        }
      )
    },
  }
  const viewRelatedButton = {
    id: 'view-related',
    title: t('View related resources'),
    click: (item: any) => {
      const searchParams = GetUrlSearchParam(item)
      if (item.managedHub && item.managedHub !== 'global-hub') {
        const hubUrl = allClusters.find((cluster) => cluster.name === item.managedHub)?.consoleURL
        return window.open(`${hubUrl}${NavigationPath.resourceRelated}${GetUrlSearchParam(item)}`, '_blank')
      }
      return navigate(
        {
          pathname: NavigationPath.resourceRelated,
          search: searchParams,
        },
        {
          state: {
            from: NavigationPath.search,
            fromSearch: window.location.search,
          },
        }
      )
    },
  }
  const deleteButton = {
    id: 'delete',
    title: t('Delete {{resourceKind}}', { resourceKind }),
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
          currentQuery,
          relatedResource,
        })
      }
    },
  }

  const startVM = {
    id: 'startVM',
    title: t('Start {{resourceKind}}', { resourceKind }),
    click: (item: any) => {
      const path = item?._hubClusterResource
        ? `/apis/subresources.kubevirt.io/v1/namespaces/${item.namespace}/virtualmachines/${item.name}/start`
        : `/virtualmachines/start`
      handleVMActions(
        'start',
        path,
        item,
        () => searchClient.refetchQueries({ include: ['searchResultItems'] }),
        toast,
        t
      )
    },
  }
  const stopVM = {
    id: 'stopVM',
    title: t('Stop {{resourceKind}}', { resourceKind }),
    click: (item: any) => {
      const path = item?._hubClusterResource
        ? `/apis/subresources.kubevirt.io/v1/namespaces/${item.namespace}/virtualmachines/${item.name}/stop`
        : `/virtualmachines/stop`
      handleVMActions(
        'stop',
        path,
        item,
        () => searchClient.refetchQueries({ include: ['searchResultItems'] }),
        toast,
        t
      )
    },
  }
  const restartVM = {
    id: 'restartVM',
    title: t('Restart {{resourceKind}}', { resourceKind }),
    click: (item: any) => {
      const path = item?._hubClusterResource
        ? `/apis/subresources.kubevirt.io/v1/namespaces/${item.namespace}/virtualmachines/${item.name}/restart`
        : `/virtualmachines/restart`
      handleVMActions(
        'restart',
        path,
        item,
        () => searchClient.refetchQueries({ include: ['searchResultItems'] }),
        toast,
        t
      )
    },
  }
  const pauseVM = {
    id: 'pauseVM',
    title: t('Pause {{resourceKind}}', { resourceKind }),
    click: (item: any) => {
      const path = item?._hubClusterResource
        ? `/apis/subresources.kubevirt.io/v1/namespaces/${item.namespace}/virtualmachineinstances/${item.name}/pause`
        : `/virtualmachineinstances/pause`
      handleVMActions(
        'pause',
        path,
        item,
        () => searchClient.refetchQueries({ include: ['searchResultItems'] }),
        toast,
        t
      )
    },
  }
  const unpauseVM = {
    id: 'unpauseVM',
    title: t('Unpause {{resourceKind}}', { resourceKind }),
    click: (item: any) => {
      const path = item?._hubClusterResource
        ? `/apis/subresources.kubevirt.io/v1/namespaces/${item.namespace}/virtualmachineinstances/${item.name}/unpause`
        : `/virtualmachineinstances/unpause`
      handleVMActions(
        'unpause',
        path,
        item,
        () => searchClient.refetchQueries({ include: ['searchResultItems'] }),
        toast,
        t
      )
    },
  }

  if (
    resourceKind.toLowerCase() === 'cluster' ||
    resourceKind.toLowerCase() === 'release' ||
    resourceKind.toLowerCase() === 'policyreport'
  ) {
    return []
  } else if (resourceKind.toLowerCase() === 'application') {
    return [viewApplication, viewAppTopology, editButton, viewRelatedButton, deleteButton]
  } else if (resourceKind.toLowerCase() === 'virtualmachine') {
    return vmActionsEnabled
      ? [
          startVM,
          stopVM,
          restartVM,
          pauseVM,
          unpauseVM,
          { ...editButton, addSeparator: true },
          viewRelatedButton,
          deleteButton,
        ]
      : [editButton, viewRelatedButton, deleteButton]
  }
  return [editButton, viewRelatedButton, deleteButton]
}

export function generateSearchResultExport(
  exportFileName: string,
  searchResultData: SearchResultItemsQuery | undefined,
  searchDefinitions: any,
  toastContext: IAlertContext,
  t: TFunction<string, undefined>
) {
  toastContext.addAlert({
    title: t('Generating data. Download may take a moment to start.'),
    type: 'info',
    autoClose: true,
  })

  const searchResultItems: ISearchResult[] = searchResultData?.searchResult?.[0]?.items || []
  const kindSearchResultItems: Record<string, ISearchResult[]> = {}
  for (const searchResultItem of searchResultItems) {
    const apiGroup = searchResultItem?.apigroup
    const groupAndKind = apiGroup ? `${searchResultItem.kind}.${apiGroup}` : searchResultItem.kind
    const existing = kindSearchResultItems[groupAndKind]
    if (!existing) {
      kindSearchResultItems[groupAndKind] = [searchResultItem]
    } else {
      kindSearchResultItems[groupAndKind].push(searchResultItem)
    }
  }
  // Sort kinds alphabetically by kind then apigroup if same kind
  const kinds = Object.keys(kindSearchResultItems).sort((a, b) => {
    const strCompareRes = compareStrings(kindSearchResultItems[a][0].kind, kindSearchResultItems[b][0].kind)
    const getApiGroup = (type: string) =>
      kindSearchResultItems[type][0]?.apigroup
        ? `${kindSearchResultItems[type][0]?.apigroup}/${kindSearchResultItems[type][0]?.apiversion}`
        : ''
    return strCompareRes !== 0 ? strCompareRes : compareStrings(getApiGroup(a), getApiGroup(b))
  })

  // Sort resources alphabetically by name
  kinds.forEach((kind: string) => {
    kindSearchResultItems[kind] = kindSearchResultItems[kind].sort((a, b) => {
      return compareStrings(a.name, b.name)
    })
  })

  const defaulColumns = ['name', 'namespace', 'kind', 'cluster', 'created', 'label']
  let columns: SearchColumnDefinition[] = defaulColumns.map((defaultCol: string) => {
    return {
      header: defaultCol,
      sort: defaultCol,
      cell: defaultCol,
    }
  })

  // If only 1 resource kind -> use column headers from searchDefinitions
  if (kinds.length === 1) {
    const kindAndGroup =
      kinds[0].split('.')[0].toLowerCase() === 'subscription'
        ? `subscription.${searchResultItems[0].apigroup}`
        : kinds[0].split('.')[0].toLowerCase()
    columns = get(searchDefinitions, `['${kindAndGroup}'].columns`, searchDefinitions['genericresource'].columns)
    // Filter column definitions that do NOT contain sort field. Sort is the only way to confidently get resource fields
    columns = columns.filter((col: SearchColumnDefinition) => {
      return !!col.sort
    })
  }

  // Variable to store the final csv data
  const csv_data: string[] = [`${columns.map((col) => col.sort).join(',')}`]
  kinds.forEach((kind: string) => {
    kindSearchResultItems[kind].forEach((item: any) => {
      const csv_row: string[] = []
      columns.forEach((column: SearchColumnDefinition) => {
        csv_row.push(item[column.sort!] ?? '-') // Columns without a sort are filtered above
      })
      // Combine each column value with comma
      csv_data.push(csv_row.join(','))
    })
  })
  // Combine each row data with new line character
  const csv_string = csv_data.join('\n')

  // Create download
  const CSVFile = new Blob([csv_string], { type: 'text/csv' })
  const temp_link = document.createElement('a')
  temp_link.download = exportFileName
  const url = window.URL.createObjectURL(CSVFile)
  temp_link.href = url
  // This link should not be displayed
  temp_link.style.display = 'none'
  document.body.appendChild(temp_link)
  // Automatically click the link to trigger download
  temp_link.click()
  document.body.removeChild(temp_link)

  toastContext.addAlert({
    title: t('Export successful'),
    type: 'success',
    autoClose: true,
  })
}
