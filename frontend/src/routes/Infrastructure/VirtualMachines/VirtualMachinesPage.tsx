/* Copyright Contributors to the Open Cluster Management project */
import { getCurrentClusterVersion, getMajorMinorVersion } from '@openshift-assisted/ui-lib/cim'
import {
  Alert,
  AlertActionCloseButton,
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  PageSection,
  Stack,
  StackItem,
  TextVariants,
  Title,
} from '@patternfly/react-core'
import { ExclamationCircleIcon, ExternalLinkAltIcon } from '@patternfly/react-icons'
import { get } from 'lodash'
import { Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, Outlet, Link } from 'react-router-dom-v5-compat'
import { Pages, usePageVisitMetricHandler } from '../../../hooks/console-metrics'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { OCP_DOC } from '../../../lib/doc-util'
import { PluginContext } from '../../../lib/PluginContext'
import { ConfigMap } from '../../../resources'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import {
  AcmActionGroup,
  AcmButton,
  AcmEmptyState,
  AcmPage,
  AcmPageContent,
  AcmPageHeader,
  AcmSecondaryNav,
  AcmSecondaryNavItem,
  AcmTable,
  AcmTablePaginationContextProvider,
  IAcmTableColumn,
} from '../../../ui-components'
import {
  ClosedDeleteExternalResourceModalProps,
  DeleteExternalResourceModal,
  IDeleteExternalResourceModalProps,
} from '../../Search/components/Modals/DeleteExternalResourceModal'
import {
  ClosedDeleteModalProps,
  DeleteResourceModal,
  IDeleteModalProps,
} from '../../Search/components/Modals/DeleteResourceModal'
import { SearchInfoModal } from '../../Search/components/Modals/SearchInfoModal'
import { Searchbar } from '../../Search/components/Searchbar'
import {
  convertStringToQuery,
  formatSearchbarSuggestions,
  getSearchCompleteString,
  operators,
} from '../../Search/search-helper'
import { searchClient } from '../../Search/search-sdk/search-client'
import {
  useSearchCompleteQuery,
  useSearchResultItemsAndRelatedItemsQuery,
  useSearchSchemaQuery,
} from '../../Search/search-sdk/search-sdk'
import { useSearchDefinitions } from '../../Search/searchDefinitions'
import { ISearchResult } from '../../Search/SearchResults/utils'
import { transformBrowserUrlToSearchString, updateBrowserUrl } from '../../Search/urlQuery'
import { useAllClusters } from '../Clusters/ManagedClusters/components/useAllClusters'
import { ClosedVMActionModalProps, IVMActionModalProps, VMActionModal } from './modals/VMActionModal'
import {
  getVirtualMachineColumnExtensions,
  getVirtualMachineRowActionExtensions,
  getVirtualMachineRowActions,
} from './utils'
import { useCanMigrateVm } from '../../../hooks/use-can-migrate-vm'
import { RoleAssignments } from '../../UserManagement/RoleAssignment/RoleAssignments'

function VirtualMachineTable(
  props: Readonly<{ searchResultItems: ISearchResult[] | undefined; vmMenuVisability: boolean }>
) {
  const { searchResultItems, vmMenuVisability } = props
  const { t } = useTranslation()
  const navigate = useNavigate()
  const canMigrateVm = useCanMigrateVm()
  const { useVirtualMachineActionsEnabled, isFineGrainedRbacEnabledState } = useSharedAtoms()
  const isFineGrainedRbacEnabled = useRecoilValue(isFineGrainedRbacEnabledState)
  const vmActionsEnabled = useVirtualMachineActionsEnabled()
  const { acmExtensions } = useContext(PluginContext)
  const allClusters = useAllClusters(true)
  const [deleteResource, setDeleteResource] = useState<IDeleteModalProps>(ClosedDeleteModalProps)
  const [deleteExternalResource, setDeleteExternalResource] = useState<IDeleteExternalResourceModalProps>(
    ClosedDeleteExternalResourceModalProps
  )
  const [VMAction, setVMAction] = useState<IVMActionModalProps>(ClosedVMActionModalProps)
  const searchDefinitions = useSearchDefinitions()
  const { clusterVersionState } = useSharedAtoms()
  const clusterVersions = useRecoilValue(clusterVersionState)
  const clusterVersion = clusterVersions?.[0]
  const ocpVersion = getMajorMinorVersion(getCurrentClusterVersion(clusterVersion)) || 'latest'
  const [pluginModal, setPluginModal] = useState<JSX.Element>()

  const rowActionResolver = useCallback(
    (item: any) => {
      return getVirtualMachineRowActions(
        item,
        allClusters,
        setDeleteResource,
        setDeleteExternalResource,
        setVMAction,
        isFineGrainedRbacEnabled,
        vmActionsEnabled,
        navigate,
        t,
        canMigrateVm,
        vmMenuVisability,
        // get the row action extensions for the virtual machine
        getVirtualMachineRowActionExtensions(item, acmExtensions?.virtualMachineAction || [], setPluginModal)
      )
    },
    [
      allClusters,
      isFineGrainedRbacEnabled,
      vmActionsEnabled,
      navigate,
      t,
      vmMenuVisability,
      canMigrateVm,
      acmExtensions?.virtualMachineAction,
    ]
  )

  const extensionColumns: IAcmTableColumn<ISearchResult>[] = useMemo(
    // get the column extensions for the virtual machine
    () => getVirtualMachineColumnExtensions(acmExtensions?.virtualMachineListColumn || []),
    [acmExtensions]
  )

  const columns: IAcmTableColumn<ISearchResult>[] = useMemo(
    () => [...searchDefinitions['virtualmachinespage'].columns, ...extensionColumns],
    [searchDefinitions, extensionColumns]
  )

  return (
    <Fragment>
      {pluginModal}
      <VMActionModal
        open={VMAction.open}
        close={VMAction.close}
        action={VMAction.action}
        method={VMAction.method}
        item={VMAction.item}
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
      <AcmTablePaginationContextProvider localStorageKey="vm-page-table">
        <AcmTable
          id="virtualMachinesTable"
          items={searchResultItems}
          columns={columns}
          rowActionResolver={rowActionResolver}
          keyFn={(item: any) => item._uid.toString()}
          emptyState={
            <AcmEmptyState
              key="virtual-machine-empty-state"
              title={t('No VirtualMachines found')}
              action={
                <AcmButton
                  variant={'link'}
                  component={TextVariants.a}
                  href={`${OCP_DOC}/${ocpVersion}/html-single/virtualization/about#about-virt`}
                  target="_blank"
                >
                  {t('Learn more about OpenShift Virtualization')}
                  <ExternalLinkAltIcon style={{ marginLeft: '8px' }} />
                </AcmButton>
              }
            />
          }
          showColumnManagement
        />
      </AcmTablePaginationContextProvider>
    </Fragment>
  )
}

export default function VirtualMachinesPage() {
  const { search } = useLocation()
  const location = useLocation()
  const { presetSearchQuery = '' } = transformBrowserUrlToSearchString(search)
  const { t } = useTranslation()
  const navigate = useNavigate()

  const isVirtualMachinesActive = location.pathname === NavigationPath.virtualMachines
  const isRoleAssignmentsActive = location.pathname.startsWith(NavigationPath.virtualMachineRoleAssignments)
  const { dataContext, isSearchAvailable } = useContext(PluginContext)
  const { loadStarted } = useContext(dataContext)
  const {
    clusterManagementAddonsState,
    configMapsState,
    useIsObservabilityInstalled,
    useSearchAutocompleteLimit,
    useVitualMachineSearchResultLimit,
    useMigrateVMMenu,
  } = useSharedAtoms()
  const vmResultLimit = useVitualMachineSearchResultLimit()
  const vmMenuVisability = useMigrateVMMenu()
  const searchAutocompleteLimit = useSearchAutocompleteLimit()
  const isObservabilityInstalled = useIsObservabilityInstalled()
  const configMaps = useRecoilValue(configMapsState)
  const clusterManagementAddons = useRecoilValue(clusterManagementAddonsState)
  usePageVisitMetricHandler(Pages.virtualMachines)
  const [toggleOpen, setToggleOpen] = useState<boolean>(false)
  const [currentSearch, setCurrentSearch] = useState<string>(presetSearchQuery)
  const [isLimitAlertOpen, setIsLimitAlertOpen] = useState(false)

  const parsedCurrentSearch = useMemo(() => {
    if (presetSearchQuery) {
      return `kind:VirtualMachine,VirtualMachineInstance ${presetSearchQuery}`
    }
    return 'kind:VirtualMachine,VirtualMachineInstance'
  }, [presetSearchQuery])

  const { data, loading, error, refetch } = useSearchResultItemsAndRelatedItemsQuery({
    skip:
      !isSearchAvailable &&
      currentSearch.endsWith(':') &&
      operators.some((operator: string) => currentSearch.endsWith(operator)),
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    variables: {
      input: [
        {
          ...convertStringToQuery(parsedCurrentSearch, vmResultLimit ?? -1),
          relatedKinds: ['VirtualMachine', 'VirtualMachineInstance'],
        },
      ],
    },
  })

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
      const overviewDashboard = vmDashboard?.[0]?.data?.['acm-openshift-virtualization-clusters-overview.json']
      if (vmDashboard.length > 0 && overviewDashboard) {
        try {
          const parsedDashboardData = JSON.parse(overviewDashboard)
          const dashboardId = parsedDashboardData?.uid
          return `${grafanaLink}/d/${dashboardId}/executive-dashboards-clusters-overview?orgId=1`
        } catch (error) {
          console.error(error)
        }
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
    fetchPolicy: 'cache-and-network',
    variables: {
      query: convertStringToQuery(parsedCurrentSearch, searchAutocompleteLimit),
    },
  })

  const { searchCompleteValue, searchCompleteQuery } = useMemo(() => {
    const value = getSearchCompleteString(currentSearch)
    const query = convertStringToQuery(parsedCurrentSearch, -1)
    query.filters = query.filters.filter((filter) => {
      return filter.property !== value
    })
    return { searchCompleteValue: value, searchCompleteQuery: query }
  }, [currentSearch, parsedCurrentSearch])

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

  const suggestions = useMemo(() => {
    return currentSearch === '' ||
      (!currentSearch.endsWith(':') && !operators.some((operator: string) => currentSearch.endsWith(operator)))
      ? formatSearchbarSuggestions(
          get(searchSchemaData, 'searchSchema.allProperties', [
            'name',
            'namespace',
            'label',
            'cluster',
            'apigroup',
            'created',
          ]).filter((data: string) => data !== 'kind' && data !== 'kind_plural'), // don't allow searching for other kinds on VM page
          'filter',
          '', // Dont need to de-dupe filters
          -1,
          searchSchemaLoading,
          t
        )
      : formatSearchbarSuggestions(
          get(searchCompleteData || [], 'searchComplete') ?? [],
          'value',
          currentSearch, // pass current search query in order to de-dupe already selected values
          -1,
          searchCompleteLoading,
          t
        )
  }, [
    currentSearch,
    // parsedCurrentSearch,
    searchSchemaData,
    searchSchemaLoading,
    searchCompleteData,
    searchCompleteLoading,
    t,
  ])
  const searchResultItems = useMemo(() => data?.searchResult?.[0]?.items ?? [], [data?.searchResult])
  const vmTableItems: ISearchResult[] | undefined = useMemo(() => {
    if (error) return []
    else if (loading) return undefined // undefined items triggers loading state table

    // combine VMI data into VM object
    const combinedMap = new Map<string, any>()
    searchResultItems?.forEach((item) => {
      const key = `${item.name}/${item.namespace}/${item.cluster}`
      const existing = combinedMap.get(key)
      const labels = [item?.label, combinedMap.get(key)?.label].filter(Boolean).join('; ') // have to combine label stings from VMs & VMIs
      const mergedItem: ISearchResult = {
        ...existing,
        ...item,
        label: labels,
        // Set kind to VM in case VMI is parsed first in reduce.
        // If VMI is parsed first the navigation to search details will be for the VMI resource not VM
        kind: 'VirtualMachine',
        kind_plural: 'virtualmachines',
      }
      combinedMap.set(key, mergedItem)
    })

    // If there are any related VM/VMI resources - they need to be added to the existing VM/VMI from main search results.
    // Related VM/VMIs would result from search parameters that only match one resource type.
    // ex: searching for nodes would only return VMIs (as that data point does not exist in VM CR definition) so we would get related VMs.
    // We need to reduce the related data with the main data so there is no missing data in the table.
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
              kind_plural: 'virtualmachines',
            })
          }
        }
      })
    })

    // Status only exists from VM resource data - If there is no status then we only have the VMI data without the associated VM.
    // We need to remove objects contaning only VMI data as this means the VM is either not present in search data OR does not actually exist at all meaning VMI may be stale.
    return Array.from(combinedMap.values()).filter((item) => item.status)
  }, [data?.searchResult, searchResultItems, error, loading])

  useEffect(() => {
    setIsLimitAlertOpen(vmResultLimit !== -1 && searchResultItems.length >= vmResultLimit)
  }, [searchResultItems.length, vmResultLimit])

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

  return (
    <AcmPage
      hasDrawer
      header={
        <AcmPageHeader
          title={t('Virtual machines')}
          description={t('Manage virtual machines and their role assignments')}
          navigation={
            <AcmSecondaryNav>
              <AcmSecondaryNavItem isActive={isVirtualMachinesActive}>
                <Link to={NavigationPath.virtualMachines}>{t('Virtual machines')}</Link>
              </AcmSecondaryNavItem>
              <AcmSecondaryNavItem isActive={isRoleAssignmentsActive}>
                <Link to={NavigationPath.virtualMachineRoleAssignments}>{t('Role assignments')}</Link>
              </AcmSecondaryNavItem>
            </AcmSecondaryNav>
          }
          actions={
            isObservabilityInstalled && vmMetricLink ? (
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
        />
      }
    >
      <SearchInfoModal isOpen={toggleOpen} onClose={() => setToggleOpen(false)} />
      <AcmPageContent id="virtual-machines">
        {isRoleAssignmentsActive ? (
          // TODO: implement that part
          <RoleAssignments roleAssignments={[]} isLoading={false} hiddenColumns={['cluster']} />
        ) : (
          <>
            {isLimitAlertOpen ? (
              <PageSection style={{ paddingBottom: '0' }}>
                <Alert
                  variant={'warning'}
                  isInline={true}
                  title={t(
                    'VirtualMachine result limit has been reached. Your table items have been truncated. Update or remove the "VM_RESULT_LIMIT" environment variable to view more VirtualMachines.'
                  )}
                  actionClose={<AlertActionCloseButton onClose={() => setIsLimitAlertOpen(false)} />}
                />
              </PageSection>
            ) : null}
            <PageSection>
              <Searchbar
                queryString={currentSearch}
                saveSearchTooltip={undefined}
                setSaveSearch={undefined}
                suggestions={suggestions}
                currentQueryCallback={(newQuery) => {
                  setCurrentSearch(newQuery)
                  if (newQuery === '') {
                    updateBrowserUrl(navigate, newQuery)
                  }
                }}
                toggleInfoModal={() => setToggleOpen(!toggleOpen)}
                updateBrowserUrl={updateBrowserUrl}
                savedSearchQueries={[]}
                searchResultData={data}
                refetchSearch={refetch}
                inputPlaceholder={currentSearch === '' ? t('Filter VirtualMachines') : ''}
                exportEnabled={false}
              />
            </PageSection>
            <PageSection>
              <VirtualMachineTable searchResultItems={vmTableItems} vmMenuVisability={vmMenuVisability} />
              <Outlet />
            </PageSection>
          </>
        )}
      </AcmPageContent>
    </AcmPage>
  )
}
