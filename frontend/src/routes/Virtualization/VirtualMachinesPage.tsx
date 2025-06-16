/* Copyright Contributors to the Open Cluster Management project */
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  PageSection,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core'
import { ExclamationCircleIcon, ExternalLinkAltIcon } from '@patternfly/react-icons'
import { useContext, useEffect, useMemo, useState } from 'react'
import { Pages, usePageVisitMetricHandler } from '../../hooks/console-metrics'
import { useTranslation } from '../../lib/acm-i18next'
import { PluginContext } from '../../lib/PluginContext'
import { ConfigMap } from '../../resources'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { AcmActionGroup, AcmButton, AcmPage, AcmPageContent, AcmPageHeader } from '../../ui-components'
import { SearchInfoModal } from '../Search/components/Modals/SearchInfoModal'
import { convertStringToQuery, getSearchCompleteString, operators } from '../Search/search-helper'
import { searchClient } from '../Search/search-sdk/search-client'
import {
  SearchInput,
  useSearchCompleteQuery,
  useSearchResultItemsAndRelatedItemsLazyQuery,
  useSearchSchemaQuery,
} from '../Search/search-sdk/search-sdk'
import { ISearchResult } from '../Search/SearchResults/utils'
import VirtualMachineTreeTable, { ISearchResultVM } from './TreeTable'
import { NavigationPath } from '../../NavigationPath'

export default function VirtualMachinesPage() {
  const { t } = useTranslation()
  const { dataContext, isSearchAvailable } = useContext(PluginContext)
  const { loadStarted } = useContext(dataContext)
  const {
    clusterManagementAddonsState,
    configMapsState,
    useIsObservabilityInstalled,
    useSearchAutocompleteLimit,
    useVitualMachineSearchResultLimit,
  } = useSharedAtoms()
  const vmResultLimit = useVitualMachineSearchResultLimit()
  const searchAutocompleteLimit = useSearchAutocompleteLimit()
  const isObservabilityInstalled = useIsObservabilityInstalled()
  const configMaps = useRecoilValue(configMapsState)
  const clusterManagementAddons = useRecoilValue(clusterManagementAddonsState)
  usePageVisitMetricHandler(Pages.virtualMachines)
  const [toggleOpen, setToggleOpen] = useState<boolean>(false)
  const [currentSearch, setCurrentSearch] = useState<string>('')

  const [getSearchResults, { data, loading, error }] = useSearchResultItemsAndRelatedItemsLazyQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
  })

  const parsedCurrentSearch = useMemo(() => {
    if (currentSearch) {
      return `kind:VirtualMachine,VirtualMachineInstance ${currentSearch}`
    }
    return 'kind:VirtualMachine,VirtualMachineInstance'
  }, [currentSearch])

  useEffect(() => {
    if (
      isSearchAvailable &&
      !currentSearch.endsWith(':') &&
      !operators.some((operator: string) => currentSearch.endsWith(operator))
    ) {
      const searchQuery: SearchInput = convertStringToQuery(parsedCurrentSearch, vmResultLimit ?? -1)
      searchQuery.relatedKinds = ['VirtualMachine', 'VirtualMachineInstance']
      getSearchResults({
        client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
        variables: {
          input: [searchQuery],
        },
      })
    }
  }, [currentSearch, getSearchResults, isSearchAvailable, parsedCurrentSearch, vmResultLimit])

  const vmMetricLink = useMemo(() => {
    const obsCont = clusterManagementAddons.filter((cma) => cma.metadata.name === 'observability-controller')
    let grafanaLink = obsCont?.[0]?.metadata?.annotations?.['console.open-cluster-management.io/launch-link']
    if (grafanaLink) {
      grafanaLink = new URL(grafanaLink).origin
    }
    if (isObservabilityInstalled) {
      const vmDashboard = configMaps.filter(
        (cm: ConfigMap) => cm.metadata.name === 'grafana-dashboard-acm-openshift-virtualization-clusters-overview'
      )
      if (vmDashboard.length > 0) {
        const parsedDashboardData = JSON.parse(
          vmDashboard[0].data?.['acm-openshift-virtualization-clusters-overview.json']
        )
        const dashboardId = parsedDashboardData?.uid
        return `${grafanaLink}/d/${dashboardId}/executive-dashboards-clusters-overview?orgId=1`
      }
    }
    return ''
  }, [clusterManagementAddons, configMaps, isObservabilityInstalled])

  const {
    data: searchSchemaData,
    loading: searchSchemaLoading,
    error: searchSchemaError,
  } = useSearchSchemaQuery({
    skip: currentSearch.endsWith(':') || operators.some((operator: string) => currentSearch.endsWith(operator)),
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    fetchPolicy: 'cache-first',
    variables: {
      query: convertStringToQuery(parsedCurrentSearch, searchAutocompleteLimit),
    },
  })

  const { searchCompleteValue, searchCompleteQuery } = useMemo(() => {
    const value = getSearchCompleteString(parsedCurrentSearch)
    const query = convertStringToQuery(parsedCurrentSearch, -1)
    query.filters = query.filters.filter((filter) => {
      return filter.property !== value
    })
    return { searchCompleteValue: value, searchCompleteQuery: query }
  }, [parsedCurrentSearch])

  const {
    data: searchCompleteData,
    loading: searchCompleteLoading,
    error: searchCompleteError,
  } = useSearchCompleteQuery({
    skip: !currentSearch.endsWith(':') && !operators.some((operator: string) => currentSearch.endsWith(operator)),
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    fetchPolicy: 'cache-and-network',
    variables: {
      property: searchCompleteValue,
      query: searchCompleteQuery,
      limit: -1,
    },
  })

  const searchResultItems: ISearchResultVM[] | undefined = useMemo(() => {
    if (error) return []
    else if (loading) return undefined

    const combinedMap = new Map<string, any>()
    data?.searchResult?.[0]?.items?.forEach((item) => {
      const key = `${item.name}/${item.namespace}/${item.cluster}`
      const existing = combinedMap.get(key)
      const labels = [item?.label, combinedMap.get(key)?.label].filter(Boolean).join('; ')
      const mergedItem: ISearchResult = {
        ...existing,
        ...item,
        labels,
        kind: 'VirtualMachine',
      }
      combinedMap.set(key, mergedItem)
    })

    const relatedItemsMap = new Map<string, any>()
    const searchRelatedData = data?.searchResult?.[0]?.related ?? []
    searchRelatedData.forEach((relatedKindData) => {
      relatedKindData?.items?.forEach((relatedItem) => {
        const key = `${relatedItem.name}/${relatedItem.namespace}/${relatedItem.cluster}`
        relatedItemsMap.set(key, relatedItem)
        for (const [key, existing] of combinedMap) {
          if (existing.name === relatedItem.name) {
            combinedMap.set(key, {
              ...existing,
              ...relatedItemsMap.get(key),
              kind: 'VirtualMachine',
            })
          }
        }
      })
    })

    return Array.from(combinedMap.values()).filter((item) => item.status)
  }, [data?.searchResult, error, loading])

  if (loadStarted) {
    if (!isSearchAvailable) {
      return (
        <EmptyState>
          <EmptyStateIcon icon={ExclamationCircleIcon} color={'var(--pf-global--danger-color--100)'} />
          <Title size="lg" headingLevel="h4">
            {t('Unable to display virtual machines')}
          </Title>
          <EmptyStateBody>
            <Stack>
              <StackItem>
                {t('To view managed virtual machines, you must enable Search for Red Hat Advanced Cluster Management.')}
              </StackItem>
            </Stack>
          </EmptyStateBody>
        </EmptyState>
      )
    } else if (error || searchSchemaError || searchCompleteError) {
      const errorMessage = searchSchemaError?.message ?? searchCompleteError?.message ?? error?.message ?? ''
      return (
        <EmptyState>
          <EmptyStateHeader
            titleText={<>{t('Error querying for VirtualMachines')}</>}
            icon={<EmptyStateIcon icon={ExclamationCircleIcon} color={'var(--pf-global--danger-color--100)'} />}
            headingLevel="h4"
          />
          <EmptyStateBody>
            <Stack>
              <StackItem>{t('Error occurred while contacting the search service.')}</StackItem>
              <StackItem>{errorMessage}</StackItem>
            </Stack>
          </EmptyStateBody>
        </EmptyState>
      )
    }
  }

  const breadcrumbs = [{ text: t('Virtualization'), to: NavigationPath.virtualizationManagement }]
  return (
    <AcmPage
      hasDrawer
      header={
        <AcmPageHeader
          title={t('Virtual machines')}
          actions={
            isObservabilityInstalled ? (
              <AcmActionGroup>
                {[
                  <AcmButton
                    key={'observability-launch-link'}
                    variant="link"
                    component="a"
                    target="_blank"
                    isInline={true}
                    href={vmMetricLink}
                    icon={<ExternalLinkAltIcon />}
                    iconPosition="right"
                  >
                    {t('Observability dashboards')}
                  </AcmButton>,
                ]}
              </AcmActionGroup>
            ) : undefined
          }
          description={t(
            'Explore your virtual machines, organized by cluster, to quickly find and see their status and details.'
          )}
          breadcrumb={breadcrumbs}
        />
      }
    >
      <SearchInfoModal isOpen={toggleOpen} onClose={() => setToggleOpen(false)} />
      <AcmPageContent id="virtual-machines">
        <PageSection>
          <VirtualMachineTreeTable searchResultItems={searchResultItems} />
        </PageSection>
      </AcmPageContent>
    </AcmPage>
  )
}
