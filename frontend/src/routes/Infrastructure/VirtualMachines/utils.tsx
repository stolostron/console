/* Copyright Contributors to the Open Cluster Management project */

import { Dispatch, SetStateAction } from 'react'
import { TFunction } from 'react-i18next'
import { NavigateFunction } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../../NavigationPath'
import { Cluster } from '../../../resources/utils'
import { IAcmRowAction, IAcmTableColumn, IAlertContext } from '../../../ui-components'
import {
  ClosedDeleteExternalResourceModalProps,
  IDeleteExternalResourceModalProps,
} from '../../Search/components/Modals/DeleteExternalResourceModal'
import { ClosedDeleteModalProps, IDeleteModalProps } from '../../Search/components/Modals/DeleteResourceModal'
import { searchClient } from '../../Search/search-sdk/search-client'
import { GetUrlSearchParam } from '../../Search/searchDefinitions'
import { handleVMActions } from '../../Search/SearchResults/utils'
import { ActionExtensionProps, ListColumnExtensionProps } from '../../../plugin-extensions/properties'
import { IResourceDefinition } from '../../../resources'

export function isResourceTypeOf(item: any, resourceType: IResourceDefinition | IResourceDefinition[]) {
  const apiVersion = item?.apigroup ? `${item.apigroup}/${item.apiversion}` : item?.apiversion ?? item?.apiVersion
  if (Array.isArray(resourceType)) {
    let isTypeOf = false
    resourceType.forEach((rt) => {
      if (rt.apiVersion === apiVersion && rt.kind === item.kind) {
        isTypeOf = true
      }
    })
    return isTypeOf
  } else {
    return apiVersion === resourceType.apiVersion && item.kind === resourceType.kind
  }
}

export function getVirtualMachineColumnExtensions(
  listColumnExtensions: ListColumnExtensionProps[]
): IAcmTableColumn<any>[] {
  const columnExtensions: IAcmTableColumn<any>[] = []
  listColumnExtensions.forEach((listColumnExtension) => {
    const CellComp = listColumnExtension.cell
    columnExtensions.push({
      header: listColumnExtension.header,
      transforms: listColumnExtension?.transforms,
      cellTransforms: listColumnExtension?.cellTransforms,
      tooltip: listColumnExtension?.tooltip,
      isActionCol: listColumnExtension?.isActionCol ?? true,
      cell: (item: any) => {
        return <CellComp resource={item} />
      },
    })
  })
  return columnExtensions
}

export function getVirtualMachineRowActionExtensions(
  item: any,
  actionExtensions?: ActionExtensionProps[],
  setPluginModal?: Dispatch<SetStateAction<JSX.Element | undefined>>
): IAcmRowAction<any>[] {
  const buttonsExtension: IAcmRowAction<any>[] = []
  if (actionExtensions?.length && !!setPluginModal) {
    actionExtensions.forEach((actionExtension) => {
      // apiversion: kubevirt.io, apigroup: v1, kind: VirtualMachine
      if (isResourceTypeOf(item, actionExtension?.model as IResourceDefinition[])) {
        const ModalComp = actionExtension.component
        const close = () => setPluginModal(<></>)
        buttonsExtension.push({
          id: actionExtension.id,
          title: actionExtension.title,
          click: async (item: any) => {
            setPluginModal(<ModalComp isOpen={true} close={close} resource={item} />)
          },
        })
      }
    })
  }
  return buttonsExtension
}

// https://github.com/kubevirt/api/blob/9689e71fe2bed9e7da5f165760bbbf6981cc1087/core/v1/types.go#L1277
export const printableVMStatus = {
  Migrating: 'Migrating',
  Paused: 'Paused',
  Provisioning: 'Provisioning',
  Running: 'Running',
  Starting: 'Starting',
  Stopped: 'Stopped',
  Stopping: 'Stopping',
  Terminating: 'Terminating',
  Unknown: 'Unknown',
  WaitingForVolumeBinding: 'WaitingForVolumeBinding',
}

export function getVirtualMachineRowActions(
  item: any,
  allClusters: Cluster[],
  setDeleteResource: Dispatch<SetStateAction<IDeleteModalProps>>,
  setDeleteExternalResource: Dispatch<SetStateAction<IDeleteExternalResourceModalProps>>,
  vmActionsEnabled: boolean,
  toast: IAlertContext,
  navigate: NavigateFunction,
  t: TFunction<string, undefined>,
  extensionButtons: IAcmRowAction<any>[] = []
): IAcmRowAction<any>[] {
  const printableStatus = item?.status

  const editButton = {
    id: 'edit',
    title: t('Edit VirtualMachine'),
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
    title: t('Delete VirtualMachine'),
    click: (item: any) => {
      return item.managedHub && item.managedHub !== 'global-hub'
        ? setDeleteExternalResource({
            open: true,
            close: () => setDeleteExternalResource(ClosedDeleteExternalResourceModalProps),
            resource: item,
            hubCluster: allClusters.find((cluster) => cluster.name === item.managedHub),
          })
        : setDeleteResource({
            open: true,
            close: () => setDeleteResource(ClosedDeleteModalProps),
            resource: item,
            currentQuery: 'kind:VirtualMachine,VirtualMachineInstance',
            relatedResource: false,
          })
    },
  }

  const startVM = {
    id: 'startVM',
    title: t('Start VirtualMachine'),
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
    isDisabled: ['Migrating', 'Provisioning', 'Running', 'Starting', 'Stopping', 'Terminating', 'Unknown'].includes(
      printableStatus
    ),
  }
  const stopVM = {
    id: 'stopVM',
    title: t('Stop VirtualMachine'),
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
    isDisabled: ['Provisioning', 'Stopped', 'Stopping', 'Terminating', 'Unknown'].includes(printableStatus),
  }
  const restartVM = {
    id: 'restartVM',
    title: t('Restart VirtualMachine'),
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
    isDisabled: ['Migrating', 'Provisioning', 'Stopped', 'Stopping', 'Terminating', 'Unknown'].includes(
      printableStatus
    ),
  }
  const pauseVM = {
    id: 'pauseVM',
    title: t('Pause VirtualMachine'),
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
    isDisabled: printableStatus !== 'Running',
  }
  const unpauseVM = {
    id: 'unpauseVM',
    title: t('Unpause VirtualMachine'),
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
    isDisabled: printableStatus !== 'Paused',
  }

  // OCP console vm actions - https://github.com/kubevirt-ui/kubevirt-plugin/blob/519d55ee9489ad7dc1caf81b4306676a95aee96a/src/views/virtualmachines/actions/hooks/useVirtualMachineActionsProvider.ts#L36
  return vmActionsEnabled
    ? [
        printableStatus === 'Stopped' ? startVM : stopVM,
        restartVM,
        printableStatus === 'Paused' ? unpauseVM : pauseVM,
        { ...editButton, addSeparator: true },
        viewRelatedButton,
        deleteButton,
        ...extensionButtons,
      ]
    : [editButton, viewRelatedButton, deleteButton, ...extensionButtons]
}
