/* Copyright Contributors to the Open Cluster Management project */

import { ClusterStatus, deleteResource, MachinePool } from '../../../../../../resources'
import {
  AcmEmptyState,
  AcmPageContent,
  AcmTable,
  compareStrings,
  IAcmTableColumn,
} from '../../../../../../ui-components'
import { PageSection } from '@patternfly/react-core'
import { fitContent } from '@patternfly/react-table'
import { useContext, useState } from 'react'
import { Trans, useTranslation } from '../../../../../../lib/acm-i18next'
import { BulkActionModal, BulkActionModalProps } from '../../../../../../components/BulkActionModal'
import { RbacDropdown } from '../../../../../../components/Rbac'
import { rbacDelete, rbacPatch } from '../../../../../../lib/rbac-util'
import { ScaleClusterAlert } from '../../components/ScaleClusterAlert'
import { ClusterContext } from '../ClusterDetails'
import { ScaleMachinePoolModal, ScaleMachinePoolModalProps } from './components/ScaleMachinePoolModal'
import { useSharedAtoms, useRecoilState } from '../../../../../../shared-recoil'

export function MachinePoolsPageContent() {
  return (
    <AcmPageContent id="nodes">
      <PageSection>
        <MachinePoolsTable />
      </PageSection>
    </AcmPageContent>
  )
}

export function MachinePoolsTable() {
  const { t } = useTranslation()
  const { cluster } = useContext(ClusterContext)
  const { machinePoolsState } = useSharedAtoms()
  const [modalProps, setModalProps] = useState<BulkActionModalProps<MachinePool> | { open: false }>({
    open: false,
  })
  const [scaleMachinePool, setScaleMachinePool] = useState<ScaleMachinePoolModalProps | undefined>()
  const [machinePoolState] = useRecoilState(machinePoolsState)
  const machinePools = machinePoolState.filter((mp) => mp.metadata.namespace === cluster!.namespace)

  function getInstanceType(machinePool: MachinePool) {
    let type: string | undefined

    const platform = machinePool.spec?.platform
    const platformKey = platform && Object.keys(platform).length ? Object.keys(platform)[0] : null

    if (platform && platformKey) {
      switch (platformKey) {
        case 'openstack':
          type = platform.openstack?.flavor
          break
        case 'ovirt':
          type = platform.ovirt?.vmType
          break
        default:
          type = (platform as Record<string, { type: string }>)?.[platformKey]?.type
      }
    }
    return type ?? '-'
  }

  function getAutoscaling(machinePool: MachinePool) {
    return machinePool.spec?.autoscaling ? t('enabled') : t('disabled')
  }

  function keyFn(machinePool: MachinePool) {
    return machinePool.metadata.name!
  }

  const columns: IAcmTableColumn<MachinePool>[] = [
    {
      header: t('table.name'),
      sort: 'metadata.name',
      search: 'metadata.name',
      cell: 'metadata.name',
    },
    {
      header: t('table.machineSetReplicas'),
      sort: 'status.replicas',
      search: 'status.replicas',
      cell: (machinePool: MachinePool) => {
        if (machinePool.spec?.replicas !== undefined) {
          return (
            <span style={{ whiteSpace: 'nowrap', display: 'block' }}>
              {t('outOf', {
                firstNumber: machinePool.status?.replicas ?? 0,
                secondNumber: machinePool.spec.replicas,
              })}
            </span>
          )
        } else {
          return '-'
        }
      },
    },
    {
      header: t('table.autoscale'),
      sort: (a: MachinePool, b: MachinePool) => compareStrings(getAutoscaling(a), getAutoscaling(b)),
      search: (machinePool: MachinePool) => getAutoscaling(machinePool),
      cell: (machinePool: MachinePool) => {
        if (machinePool.spec?.replicas !== undefined) {
          return getAutoscaling(machinePool)
        } else {
          return `${getAutoscaling(machinePool)}, ${t('machinePool.replica.count', {
            range: `${machinePool.spec?.autoscaling?.minReplicas}-${machinePool.spec?.autoscaling?.maxReplicas}`,
          })}`
        }
      },
    },
    {
      header: t('table.instanceType'),
      sort: (a: MachinePool, b: MachinePool) => compareStrings(getInstanceType(a), getInstanceType(b)),
      search: (machinePool: MachinePool) => getInstanceType(machinePool),
      cell: (machinePool: MachinePool) => getInstanceType(machinePool),
    },
    {
      header: '',
      cellTransforms: [fitContent],
      cell: (machinePool: MachinePool) => {
        let actions = [
          {
            id: 'scaleMachinePool',
            text: t('machinePool.scale'),
            isAriaDisabled: true,
            rbac: [rbacPatch(machinePool)],
            click: (machinePool: MachinePool) => setScaleMachinePool({ machinePool, mode: 'edit-manualscale' }),
          },
          {
            id: 'editAutoscale',
            text: t('machinePool.editAutoscale'),
            isAriaDisabled: true,
            rbac: [rbacPatch(machinePool)],
            click: (machinePool: MachinePool) => setScaleMachinePool({ machinePool, mode: 'edit-autoscale' }),
          },
          {
            id: 'enableAutoscale',
            text: t('machinePool.enableAutoscale'),
            isAriaDisabled: true,
            rbac: [rbacPatch(machinePool)],
            click: (machinePool: MachinePool) => setScaleMachinePool({ machinePool, mode: 'enable-autoscale' }),
          },
          {
            id: 'disableAutoscale',
            text: t('machinePool.disableAutoscale'),
            isAriaDisabled: true,
            rbac: [rbacPatch(machinePool)],
            click: (machinePool: MachinePool) => setScaleMachinePool({ machinePool, mode: 'disable-autoscale' }),
          },
          {
            id: 'deleteMachinePool',
            text: t('machinePool.delete'),
            isAriaDisabled: true,
            rbac: [rbacDelete(machinePool)],
            click: (machinePool: MachinePool) => {
              setModalProps({
                open: true,
                title: t('bulk.title.deleteMachinePool'),
                action: t('delete'),
                processing: t('deleting'),
                items: [machinePool],
                emptyState: undefined, // there is always 1 item supplied
                description: t('bulk.message.deleteMachinePool'),
                keyFn,
                actionFn: deleteResource,
                confirmText: machinePool.metadata.name!,
                close: () => setModalProps({ open: false }),
                isDanger: true,
                icon: 'warning',
                columns: [
                  {
                    header: t('table.name'),
                    sort: 'metadata.name',
                    search: 'metadata.name',
                    cell: 'metadata.name',
                  },
                  {
                    header: t('table.machineSetReplicas'),
                    sort: 'status.replicas',
                    search: 'status.replicas',
                    cell: (machinePool: MachinePool) => {
                      if (!machinePool.status?.replicas || !machinePool.spec?.replicas) return '-'
                      return `${machinePool.status.replicas}/${machinePool.spec.replicas}`
                    },
                  },
                ],
              })
            },
          },
        ]

        if (machinePool.spec?.autoscaling) {
          actions = actions.filter((action) => action.id !== 'scaleMachinePool')
          actions = actions.filter((action) => action.id !== 'enableAutoscale')
        }

        if (machinePool.spec?.replicas) {
          actions = actions.filter((action) => action.id !== 'disableAutoscale')
          actions = actions.filter((action) => action.id !== 'editAutoscale')
        }

        return (
          <RbacDropdown<MachinePool>
            id={`${machinePool.metadata.name}-actions`}
            item={machinePool}
            isKebab={true}
            text={`${machinePool.metadata.name}-actions`}
            actions={actions}
            tooltip={t('machinePool.menu.disabled.tooltip', { status: t(`status.${cluster!.status}`) })}
            isDisabled={![ClusterStatus.ready, ClusterStatus.degraded].includes(cluster!.status)}
          />
        )
      },
    },
  ]

  return (
    <>
      <ScaleClusterAlert />
      <BulkActionModal<MachinePool> {...modalProps} />
      <ScaleMachinePoolModal {...scaleMachinePool} onClose={() => setScaleMachinePool(undefined)} />
      <AcmTable<MachinePool>
        items={machinePools}
        columns={columns}
        keyFn={keyFn}
        tableActions={[]}
        rowActions={[]}
        emptyState={
          <AcmEmptyState
            key="mcEmptyState"
            title={t('managed.cluster.machinePools.emptyStateHeader')}
            message={
              <Trans i18nKey="managed.cluster.machinePools.emptyStateButton" components={{ bold: <strong /> }} />
            }
          />
        }
      />
    </>
  )
}
