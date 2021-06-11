/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmEmptyState,
    AcmPageContent,
    AcmTable,
    compareStrings,
    IAcmTableColumn,
} from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { fitContent } from '@patternfly/react-table'
import { useContext, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useRecoilState } from 'recoil'
import { machinePoolsState } from '../../../../../../atoms'
import { BulkActionModel, IBulkActionModelProps } from '../../../../../../components/BulkActionModel'
import { RbacDropdown } from '../../../../../../components/Rbac'
import { ClusterStatus } from '../../../../../../lib/get-cluster'
import { rbacDelete, rbacPatch } from '../../../../../../lib/rbac-util'
import { deleteResource } from '../../../../../../lib/resource-request'
import { MachinePool } from '../../../../../../resources/machine-pool'
import { ScaleClusterAlert } from '../../components/ScaleClusterAlert'
import { ClusterContext } from '../ClusterDetails'
import { ScaleMachinePoolModal, ScaleMachinePoolModalProps } from './components/ScaleMachinePoolModal'
import { TechPreviewAlert } from '../../../../../../components/TechPreviewAlert'
import { DOC_LINKS } from '../../../../../../lib/doc-util'

export function MachinePoolsPageContent() {
    return (
        <AcmPageContent id="nodes">
            <PageSection>
                <TechPreviewAlert i18nKey="cluster:preview.machinePools" docHref={DOC_LINKS.MACHINE_POOLS} />
                <MachinePoolsTable />
            </PageSection>
        </AcmPageContent>
    )
}

export function MachinePoolsTable() {
    const { t } = useTranslation(['cluster', 'common'])
    const { cluster } = useContext(ClusterContext)
    const [modalProps, setModalProps] = useState<IBulkActionModelProps<MachinePool> | { open: false }>({
        open: false,
    })
    const [scaleMachinePool, setScaleMachinePool] = useState<ScaleMachinePoolModalProps | undefined>()
    const [machinePoolState] = useRecoilState(machinePoolsState)
    const machinePools = machinePoolState.filter((mp) => mp.metadata.namespace === cluster!.namespace)

    function getInstanceType(machinePool: MachinePool) {
        const platformKey =
            machinePool.spec?.platform && Object.keys(machinePool.spec.platform).length > 0
                ? Object.keys(machinePool.spec.platform)?.[0]
                : ''
        const type =
            platformKey && (machinePool?.spec?.platform as Record<string, { type: string }>)?.[platformKey]?.type
        return type ?? '-'
    }

    function getAutoscaling(machinePool: MachinePool) {
        return machinePool.spec?.autoscaling ? t('common:enabled') : t('common:disabled')
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
                            {t('common:outOf', {
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
                        isDisabled: true,
                        rbac: [rbacPatch(machinePool)],
                        click: (machinePool: MachinePool) =>
                            setScaleMachinePool({ machinePool, mode: 'edit-manualscale' }),
                    },
                    {
                        id: 'editAutoscale',
                        text: t('machinePool.editAutoscale'),
                        isDisabled: true,
                        rbac: [rbacPatch(machinePool)],
                        click: (machinePool: MachinePool) =>
                            setScaleMachinePool({ machinePool, mode: 'edit-autoscale' }),
                    },
                    {
                        id: 'enableAutoscale',
                        text: t('machinePool.enableAutoscale'),
                        isDisabled: true,
                        rbac: [rbacPatch(machinePool)],
                        click: (machinePool: MachinePool) =>
                            setScaleMachinePool({ machinePool, mode: 'enable-autoscale' }),
                    },
                    {
                        id: 'disableAutoscale',
                        text: t('machinePool.disableAutoscale'),
                        isDisabled: true,
                        rbac: [rbacPatch(machinePool)],
                        click: (machinePool: MachinePool) =>
                            setScaleMachinePool({ machinePool, mode: 'disable-autoscale' }),
                    },
                    {
                        id: 'deleteMachinePool',
                        text: t('machinePool.delete'),
                        isDisabled: true,
                        rbac: [rbacDelete(machinePool)],
                        click: (machinePool: MachinePool) => {
                            setModalProps({
                                open: true,
                                title: t('bulk.title.deleteMachinePool'),
                                action: t('common:delete'),
                                processing: t('common:deleting'),
                                resources: [machinePool],
                                description: t('bulk.message.deleteMachinePool'),
                                keyFn,
                                actionFn: deleteResource,
                                confirmText: machinePool.metadata.name!,
                                close: () => setModalProps({ open: false }),
                                isDanger: true,
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
            <BulkActionModel<MachinePool> {...modalProps} />
            <ScaleMachinePoolModal {...scaleMachinePool} onClose={() => setScaleMachinePool(undefined)} />
            <AcmTable<MachinePool>
                plural="machinepools"
                items={machinePools}
                columns={columns}
                keyFn={keyFn}
                tableActions={[]}
                bulkActions={[]}
                rowActions={[]}
                emptyState={
                    <AcmEmptyState
                        key="mcEmptyState"
                        title={t('managed.cluster.machinePools.emptyStateHeader')}
                        message={
                            <Trans
                                i18nKey={'cluster:managed.cluster.machinePools.emptyStateButton'}
                                components={{ bold: <strong /> }}
                            />
                        }
                    />
                }
            />
        </>
    )
}
