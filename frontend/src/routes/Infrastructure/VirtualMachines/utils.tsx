/* Copyright Contributors to the Open Cluster Management project */

import { Dispatch, SetStateAction } from 'react'
import { TFunction } from 'react-i18next'
import { NavigateFunction } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../../NavigationPath'
import { ActionExtensionProps, ListColumnExtensionProps } from '../../../plugin-extensions/properties'
import { IResourceDefinition } from '../../../resources'
import { Cluster } from '../../../resources/utils'
import { IAcmRowAction, IAcmTableColumn } from '../../../ui-components'
import {
  ClosedDeleteExternalResourceModalProps,
  IDeleteExternalResourceModalProps,
} from '../../Search/components/Modals/DeleteExternalResourceModal'
import { ClosedDeleteModalProps, IDeleteModalProps } from '../../Search/components/Modals/DeleteResourceModal'
import { GetUrlSearchParam } from '../../Search/searchDefinitions'
import { ClosedVMActionModalProps, IVMActionModalProps } from './modals/VMActionModal'

export function isResourceTypeOf(item: any, resourceType: IResourceDefinition | IResourceDefinition[]) {
  const apiVersion = item?.apigroup ? `${item.apigroup}/${item.apiversion}` : item?.apiversion ?? item?.apiVersion

  return Array.isArray(resourceType)
    ? resourceType.some((rt) => rt.apiVersion === apiVersion && rt.kind === item.kind)
    : apiVersion === resourceType.apiVersion && item.kind === resourceType.kind
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
  actionExtensions: ActionExtensionProps[],
  setPluginModal: Dispatch<SetStateAction<JSX.Element | undefined>>
): IAcmRowAction<any>[] {
  if (!actionExtensions?.length || !setPluginModal) return []

  return actionExtensions
    .filter((action) => isResourceTypeOf(item, action.model as IResourceDefinition[]))
    .map((action) => {
      const ModalComp = action.component
      const close = () => setPluginModal(<></>)
      return {
        id: action.id,
        title: action.title,
        click: (item: any) => setPluginModal(<ModalComp isOpen={true} close={close} resource={item} />),
      }
    })
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
  setVMAction: Dispatch<SetStateAction<IVMActionModalProps>>,
  vmActionsEnabled: boolean,
  navigate: NavigateFunction,
  t: TFunction<string, undefined>,
  extensionButtons: IAcmRowAction<any>[] = []
): IAcmRowAction<any>[] {
  const printableStatus = item?.status
  // https://github.com/kubevirt-ui/kubevirt-plugin/blob/main/src/views/virtualmachines/actions/VirtualMachineActionFactory.tsx#L141
  const isVMDeleteDisabled = (printableStatus: string, item: any) =>
    printableStatus === 'Running' || item?.label?.split('; ').includes('kubevirt.io/vm-delete-protection=true')

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
    isDisabled: isVMDeleteDisabled(printableStatus, item),
    tooltip: isVMDeleteDisabled(printableStatus, item)
      ? t(
          'VirtualMachine is either running or delete protected and cannot be deleted. To enable deletion, stop the VirtualMachine if running, or go to VirtualMachine details and disable deletion protection.'
        )
      : undefined,
  }

  const startVM = {
    id: 'startVM',
    title: t('Start VirtualMachine'),
    click: (item: any) => {
      setVMAction({
        open: true,
        close: () => setVMAction(ClosedVMActionModalProps),
        action: 'Start',
        method: 'PUT',
        item,
      })
    },
    isDisabled: ['Migrating', 'Provisioning', 'Running', 'Starting', 'Stopping', 'Terminating', 'Unknown'].includes(
      printableStatus
    ),
  }
  const stopVM = {
    id: 'stopVM',
    title: t('Stop VirtualMachine'),
    click: (item: any) => {
      setVMAction({
        open: true,
        close: () => setVMAction(ClosedVMActionModalProps),
        action: 'Stop',
        method: 'PUT',
        item,
      })
    },
    isDisabled: ['Provisioning', 'Stopped', 'Stopping', 'Terminating', 'Unknown'].includes(printableStatus),
  }
  const restartVM = {
    id: 'restartVM',
    title: t('Restart VirtualMachine'),
    click: (item: any) => {
      setVMAction({
        open: true,
        close: () => setVMAction(ClosedVMActionModalProps),
        action: 'Restart',
        method: 'PUT',
        item,
      })
    },
    isDisabled: ['Migrating', 'Provisioning', 'Stopped', 'Stopping', 'Terminating', 'Unknown'].includes(
      printableStatus
    ),
  }
  const pauseVM = {
    id: 'pauseVM',
    title: t('Pause VirtualMachine'),
    click: (item: any) => {
      setVMAction({
        open: true,
        close: () => setVMAction(ClosedVMActionModalProps),
        action: 'Pause',
        method: 'PUT',
        item,
      })
    },
    isDisabled: printableStatus !== 'Running',
  }
  const unpauseVM = {
    id: 'unpauseVM',
    title: t('Unpause VirtualMachine'),
    click: (item: any) => {
      setVMAction({
        open: true,
        close: () => setVMAction(ClosedVMActionModalProps),
        action: 'Unpause',
        method: 'PUT',
        item,
      })
    },
    isDisabled: printableStatus !== 'Paused',
  }
  const snapshotVM = {
    id: 'snapshotVM',
    title: t('Take snapshot'),
    click: (item: any) => {
      setVMAction({
        open: true,
        close: () => setVMAction(ClosedVMActionModalProps),
        action: 'Snapshot',
        method: 'POST',
        item,
      })
    },
  }
  // OCP console vm actions - https://github.com/kubevirt-ui/kubevirt-plugin/blob/519d55ee9489ad7dc1caf81b4306676a95aee96a/src/views/virtualmachines/actions/hooks/useVirtualMachineActionsProvider.ts#L36
  return vmActionsEnabled
    ? [
        printableStatus === 'Stopped' ? startVM : stopVM,
        restartVM,
        printableStatus === 'Paused' ? unpauseVM : pauseVM,
        snapshotVM,
        { ...editButton, addSeparator: true },
        viewRelatedButton,
        deleteButton,
        ...extensionButtons,
      ]
    : [editButton, viewRelatedButton, deleteButton, ...extensionButtons]
}

export function getVMSnapshotActions(
  item: any,
  isVMRunning: boolean,
  allClusters: Cluster[],
  vmActionsEnabled: boolean,
  setVMAction: Dispatch<SetStateAction<IVMActionModalProps>>,
  setDeleteResource: Dispatch<SetStateAction<IDeleteModalProps>>,
  setDeleteExternalResource: Dispatch<SetStateAction<IDeleteExternalResourceModalProps>>,
  navigate: NavigateFunction,
  t: TFunction<string, undefined>
): IAcmRowAction<any>[] {
  const restoreSnapshot = {
    id: 'restoreVM',
    title: t('Restore VirtualMachine from snapshot'),
    click: (item: any) => {
      setVMAction({
        open: true,
        close: () => setVMAction(ClosedVMActionModalProps),
        action: 'Restore',
        method: 'POST',
        item,
      })
    },
    isDisabled: isVMRunning || item?.phase !== 'Succeeded',
  }
  const editSnapshot = {
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
  const deleteSnapshot = {
    id: 'delete',
    title: t('Delete VirtualMachineSnapshot'),
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
  }

  return vmActionsEnabled
    ? [restoreSnapshot, { ...editSnapshot, addSeparator: true }, viewRelatedButton, deleteSnapshot]
    : [editSnapshot, viewRelatedButton, deleteSnapshot]
}
