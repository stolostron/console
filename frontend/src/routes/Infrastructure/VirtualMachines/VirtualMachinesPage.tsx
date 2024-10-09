/* Copyright Contributors to the Open Cluster Management project */

import { getCurrentClusterVersion, getMajorMinorVersion } from '@openshift-assisted/ui-lib/cim'
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  PageSection,
  Stack,
  StackItem,
  TextVariants,
  Title,
} from '@patternfly/react-core'
import { ExclamationCircleIcon, ExternalLinkAltIcon } from '@patternfly/react-icons'
import { Fragment, useMemo, useState } from 'react'
import { Pages, usePageVisitMetricHandler } from '../../../hooks/console-metrics'
import { useTranslation } from '../../../lib/acm-i18next'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import {
  AcmButton,
  AcmEmptyState,
  AcmPage,
  AcmPageContent,
  AcmPageHeader,
  AcmTable,
  compareStrings,
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
import { ISearchResult, useGetRowActions } from '../../Search/SearchResults/utils'

function VirtualMachineTable() {
  const { t } = useTranslation()
  const [deleteResource, setDeleteResource] = useState<IDeleteModalProps>(ClosedDeleteModalProps)
  const [deleteExternalResource, setDeleteExternalResource] = useState<IDeleteExternalResourceModalProps>(
    ClosedDeleteExternalResourceModalProps
  )
  const searchDefinitions = useSearchDefinitions()
  const { clusterVersionState } = useSharedAtoms()
  const clusterVersions = useRecoilValue(clusterVersionState)
  const clusterVersion = clusterVersions?.[0]
  const ocpVersion = getMajorMinorVersion(getCurrentClusterVersion(clusterVersion)) || 'latest'

  const rowActions = useGetRowActions(
    'virtualmachine',
    'kind:VirtualMachine,VirtualMachineInstance',
    false,
    setDeleteResource,
    setDeleteExternalResource
  )

  const { data, loading, error } = useSearchResultItemsQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    variables: { input: [convertStringToQuery('kind:VirtualMachine,VirtualMachineInstance', -1)] }, // no limit - return all resources
  })
  const searchResultItems: ISearchResult[] | undefined = useMemo(() => {
    if (error) {
      return []
    } else if (loading) {
      return undefined
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
    return Object.values(reducedVMAndVMI)
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

  if (error) {
    return (
      <EmptyState>
        <EmptyStateIcon icon={ExclamationCircleIcon} color={'var(--pf-global--danger-color--100)'} />
        <Title size="lg" headingLevel="h4">
          {t('Error querying for VirtualMachines')}
        </Title>
        <EmptyStateBody>
          <Stack>
            <StackItem>{t('Error occurred while contacting the search service.')}</StackItem>
            <StackItem>{error ? error.message : ''}</StackItem>
          </Stack>
        </EmptyStateBody>
      </EmptyState>
    )
  }

  return (
    <Fragment>
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
        items={searchResultItems}
        columns={searchDefinitions['virtualmachinespage'].columns}
        filters={filters}
        rowActions={rowActions}
        keyFn={(item: any) => item._uid.toString()}
        emptyState={
          <AcmEmptyState
            key="virtual-machine-empty-state"
            title={t('No VirtualMachines found')}
            action={
              <AcmButton
                variant={'link'}
                component={TextVariants.a}
                href={`https://docs.openshift.com/container-platform/${ocpVersion}/virt/about_virt/about-virt.html`}
                target="_blank"
              >
                {t('Learn more about OpenShift Virtualization')}
                <ExternalLinkAltIcon style={{ marginLeft: '8px' }} />
              </AcmButton>
            }
          />
        }
      ></AcmTable>
    </Fragment>
  )
}

export default function VirtualMachinesPage() {
  const { t } = useTranslation()
  usePageVisitMetricHandler(Pages.virtualMachines)

  return (
    <AcmPage hasDrawer header={<AcmPageHeader title={t('Virtual machines')} />}>
      <AcmPageContent id="virtual-machines">
        <PageSection>
          <VirtualMachineTable />
        </PageSection>
      </AcmPageContent>
    </AcmPage>
  )
}
