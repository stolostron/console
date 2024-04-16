/* Copyright Contributors to the Open Cluster Management project */
import queryString from 'query-string'
import { TFunction } from 'react-i18next'
import { generatePath, useHistory } from 'react-router-dom'
import { NavigationPath } from '../../../../NavigationPath'
import { IAlertContext } from '../../../../ui-components'
import { ClosedDeleteModalProps, IDeleteModalProps } from '../components/Modals/DeleteResourceModal'
import { SearchResultItemsQuery } from '../search-sdk/search-sdk'
import { GetUrlSearchParam } from '../searchDefinitions'

export interface ISearchResult {
  kind: string
  apiversion: string
  apigroup?: string
  __type: string
}

export function GetRowActions(
  resourceKind: string,
  currentQuery: string,
  relatedResource: boolean,
  setDeleteResource: React.Dispatch<React.SetStateAction<IDeleteModalProps>>,
  t: TFunction
) {
  const history = useHistory()

  const viewApplication = {
    id: 'view-application',
    title: t('View Application'),
    click: (item: any) => {
      const { apigroup, applicationSet, cluster, name, namespace, kind } = item
      if (apigroup === 'app.k8s.io' || apigroup === 'argoproj.io') {
        const params = queryString.stringify({
          apiVersion: `${kind}.${apigroup}`.toLowerCase(),
          cluster: cluster === 'local-cluster' ? undefined : cluster,
          applicationset: applicationSet ?? undefined,
        })
        return history.push({
          pathname: generatePath(NavigationPath.applicationOverview, {
            namespace,
            name,
          }),
          search: `?${params}`,
          state: {
            from: NavigationPath.search,
            fromSearch: window.location.search,
          },
        })
      }
      const searchParams = GetUrlSearchParam(item)
      return history.push({
        pathname: NavigationPath.resourceRelated,
        search: searchParams,
        state: {
          from: NavigationPath.search,
          fromSearch: window.location.search,
        },
      })
    },
  }
  const viewAppTopology = {
    id: 'view-application-topology',
    title: t('View Application topology'),
    click: (item: any) => {
      const apiversion = encodeURIComponent(`${item?.kind}.${item?.apigroup}`.toLowerCase())
      return history.push({
        pathname: generatePath(NavigationPath.applicationTopology, { name: item?.name, namespace: item?.namespace }),
        search: `?apiVersion=${apiversion}`,
        state: {
          from: NavigationPath.search,
          fromSearch: window.location.search,
        },
      })
    },
  }
  const editButton = {
    id: 'edit',
    title: t('Edit {{resourceKind}}', { resourceKind }),
    click: (item: any) => {
      const searchParams = GetUrlSearchParam(item)
      return history.push({
        pathname: NavigationPath.resourceYAML,
        search: searchParams,
        state: {
          from: NavigationPath.search,
          fromSearch: window.location.search,
        },
      })
    },
  }
  const viewRelatedButton = {
    id: 'view-related',
    title: t('View related resources'),
    click: (item: any) => {
      const searchParams = GetUrlSearchParam(item)
      return history.push({
        pathname: NavigationPath.resourceRelated,
        search: searchParams,
        state: {
          from: NavigationPath.search,
          fromSearch: window.location.search,
        },
      })
    },
  }
  const deleteButton = {
    id: 'delete',
    title: t('Delete {{resourceKind}}', { resourceKind }),
    click: (item: any) => {
      setDeleteResource({
        open: true,
        close: () => setDeleteResource(ClosedDeleteModalProps),
        resource: item,
        currentQuery,
        relatedResource,
      })
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
  }
  return [editButton, viewRelatedButton, deleteButton]
}

// Triggers csv file export for search results using the default headers:
// name, namespace, kind, cluster, created_at, label, _uid
export function generateSearchResultExport(
  searchResultData: SearchResultItemsQuery | undefined,
  toastContext: IAlertContext,
  t: TFunction<string, undefined>
) {
  toastContext.addAlert({
    title: t('Generating data. Download may take a moment to start.'),
    type: 'info',
    autoClose: true,
  })

  const searchResultItems: ISearchResult[] = searchResultData?.searchResult?.[0]?.items || []
  let columns = ['name', 'namespace', 'kind', 'cluster', 'created', 'label']

  // Variable to store the final csv data
  const csv_data: string[] = [`${columns.join(',')}`]
  searchResultItems.forEach((item: any) => {
    const csv_row: string[] = []
    columns.forEach((column: string) => {
      csv_row.push(item[column] ?? '-')
    })
    // Combine each column value with comma
    csv_data.push(csv_row.join(','))
  })
  // Combine each row data with new line character
  const csv_string = csv_data.join('\n')

  // Create download
  const CSVFile = new Blob([csv_string], { type: 'text/csv' })
  let temp_link = document.createElement('a')
  temp_link.download = `search_result_${Date.now()}.csv`
  let url = window.URL.createObjectURL(CSVFile)
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
