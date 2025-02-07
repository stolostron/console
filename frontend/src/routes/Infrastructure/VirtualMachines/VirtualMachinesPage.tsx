/* Copyright Contributors to the Open Cluster Management project */

import { getCurrentClusterVersion, getMajorMinorVersion } from '@openshift-assisted/ui-lib/cim'
import {
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
import { Fragment, useCallback, useContext, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom-v5-compat'
import { Pages, usePageVisitMetricHandler } from '../../../hooks/console-metrics'
import { useTranslation } from '../../../lib/acm-i18next'
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
  AcmTable,
  AcmToastContext,
  compareStrings,
  IAcmTableColumn,
  ITableFilter,
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
import { convertStringToQuery } from '../../Search/search-helper'
import { searchClient } from '../../Search/search-sdk/search-client'
import { useSearchResultItemsQuery } from '../../Search/search-sdk/search-sdk'
import { useSearchDefinitions } from '../../Search/searchDefinitions'
import { ISearchResult } from '../../Search/SearchResults/utils'
import { useAllClusters } from '../Clusters/ManagedClusters/components/useAllClusters'
import {
  getVirtualMachineColumnExtensions,
  getVirtualMachineRowActions,
  getVirtualMachineRowActionExtensions,
} from './utils'

function VirtualMachineTable() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { settingsState, useIsSearchAvailable } = useSharedAtoms()
  const vmActionsEnabled = useRecoilValue(settingsState)?.VIRTUAL_MACHINE_ACTIONS === 'enabled'
  const isSearchAvailable = useIsSearchAvailable()
  const toast = useContext(AcmToastContext)
  const { dataContext, acmExtensions } = useContext(PluginContext)
  const { loadStarted } = useContext(dataContext)
  const allClusters = useAllClusters(true)
  const [deleteResource, setDeleteResource] = useState<IDeleteModalProps>(ClosedDeleteModalProps)
  const [deleteExternalResource, setDeleteExternalResource] = useState<IDeleteExternalResourceModalProps>(
    ClosedDeleteExternalResourceModalProps
  )
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
        vmActionsEnabled,
        toast,
        navigate,
        t,
        // get the row action extensions for the virtual machine
        getVirtualMachineRowActionExtensions(item, acmExtensions?.virtualMachineAction, setPluginModal)
      )
    },
    [allClusters, navigate, t, toast, vmActionsEnabled]
  )

  const { data, loading, error } = useSearchResultItemsQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    variables: { input: [convertStringToQuery('kind:VirtualMachine,VirtualMachineInstance', -1)] }, // no limit - return all resources
  })
  const searchResultItems: ISearchResult[] | undefined = useMemo(() => {
    if (error) {
      return []
    } else if (loading) {
      return undefined // undefined items triggers loading state table
    }
    // combine VMI node & ip address data in VM object
    const reducedVMAndVMI = data?.searchResult?.[0]?.items?.reduce((acc, curr) => {
      const key = `${curr.name}/${curr.namespace}/${curr.cluster}`
      if (curr.kind === 'VirtualMachine') {
        acc[key] = {
          ...acc[key],
          ...curr,
        }
      } else if (curr.kind === 'VirtualMachineInstance') {
        acc[key] = {
          ...acc[key],
          node: curr.node ?? '-',
          ipaddress: curr.ipaddress ?? '-',
        }
      }
      return acc
    }, {})
    return Object.values(reducedVMAndVMI ?? {})
  }, [data?.searchResult, error, loading])

  const filters = useMemo<ITableFilter<any>[]>(() => {
    const statusOptions: string[] = []
    // dynamically get VM status options
    searchResultItems?.forEach((vm: any) => {
      if (!statusOptions.includes(vm.status)) {
        statusOptions.push(vm.status)
      }
    })
    return [
      {
        id: 'status',
        label: t('table.status'),
        options: statusOptions
          .map((status) => ({
            label: status,
            value: status,
          }))
          .sort((lhs, rhs) => compareStrings(lhs.label, rhs.label)),
        tableFilterFn: (selectedValues, vm) => selectedValues.includes(vm.status),
      },
    ]
  }, [searchResultItems, t])

  const extensionColumns: IAcmTableColumn<ISearchResult>[] = useMemo(
    // get the column extensions for the virtual machine
    () => getVirtualMachineColumnExtensions(acmExtensions?.virtualMachineListColumn || []),
    [acmExtensions]
  )

  const columns: IAcmTableColumn<ISearchResult>[] = useMemo(
    () => [...searchDefinitions['virtualmachinespage'].columns, ...extensionColumns],
    [searchDefinitions, extensionColumns]
  )

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
    } else if (error) {
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
              <StackItem>{error ? error.message : ''}</StackItem>
            </Stack>
          </EmptyStateBody>
        </EmptyState>
      )
    }
  }

  return (
    <Fragment>
      {pluginModal}
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
      <AcmTable
        id="virtualMachinesTable"
        items={searchResultItems}
        columns={columns}
        filters={filters}
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
        showColumManagement
      ></AcmTable>
    </Fragment>
  )
}

export default function VirtualMachinesPage() {
  const { t } = useTranslation()
  const { useIsObservabilityInstalled, clusterManagementAddonsState, configMapsState } = useSharedAtoms()
  const isObservabilityInstalled = useIsObservabilityInstalled()
  const configMaps = useRecoilValue(configMapsState)
  const clusterManagementAddons = useRecoilValue(clusterManagementAddonsState)
  usePageVisitMetricHandler(Pages.virtualMachines)

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
        />
      }
    >
      <AcmPageContent id="virtual-machines">
        <PageSection>
          <VirtualMachineTable />
        </PageSection>
      </AcmPageContent>
    </AcmPage>
  )
}
