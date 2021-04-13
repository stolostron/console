/* Copyright Contributors to the Open Cluster Management project */

import { useContext, useState } from 'react'
import { useRecoilState } from 'recoil'
import { useTranslation, Trans } from 'react-i18next'
import {
    AcmPageContent,
    AcmTable,
    IAcmTableColumn,
    AcmEmptyState,
    compareStrings,
} from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { fitContent, TableGridBreakpoint } from '@patternfly/react-table'
import { MachinePool } from '../../../../../resources/machine-pool'
import { ClusterContext } from '../ClusterDetails'
import { machinePoolsState } from '../../../../../atoms'
import { rbacDelete } from '../../../../../lib/rbac-util'
import { BulkActionModel, IBulkActionModelProps } from '../../../../../components/BulkActionModel'
import { RbacDropdown } from '../../../../../components/Rbac'
import { deleteResource } from '../../../../../lib/resource-request'

export function MachinePoolsPageContent() {
    return (
        <AcmPageContent id="nodes">
            <PageSection variant="light" isFilled>
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
    const [machinePoolState] = useRecoilState(machinePoolsState)
    const machinePools = machinePoolState.filter((mp) => mp.metadata.namespace === cluster!.namespace)

    function getInstanceType(machinePool: MachinePool) {
        const platformKey = Object.keys(machinePool.spec!.platform)?.[0] ?? ''
        const type = platformKey && machinePool?.spec?.platform?.[platformKey]?.type
        return type ?? '-'
    }

    function getAutoscaling(machinePool: MachinePool) {
        return machinePool.spec!.autoscaling ? t('common:enabled') : t('common:disabled')
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
                return `${machinePool.status!.replicas}/${machinePool.spec!.replicas}`
            },
        },
        {
            header: t('table.instanceType'),
            sort: (a: MachinePool, b: MachinePool) => compareStrings(getInstanceType(a), getInstanceType(b)),
            search: (machinePool: MachinePool) => getInstanceType(machinePool),
            cell: (machinePool: MachinePool) => getInstanceType(machinePool),
        },
        {
            header: t('table.autoscale'),
            sort: (a: MachinePool, b: MachinePool) => compareStrings(getAutoscaling(a), getAutoscaling(b)),
            search: (machinePool: MachinePool) => getAutoscaling(machinePool),
            cell: (machinePool: MachinePool) => getAutoscaling(machinePool),
        },
        {
            header: '',
            cellTransforms: [fitContent],
            cell: (machinePool: MachinePool) => {
                const actions = [
                    {
                        id: 'deleteMachinePool',
                        text: t('machinePool.delete'),
                        isDisabled: true,
                        click: (machinePool: MachinePool) => {
                            setModalProps({
                                open: true,
                                title: t('bulk.title.deleteMachinePool'),
                                action: t('common:delete'),
                                processing: t('common:deleting'),
                                resources: [machinePool],
                                description: t('bulk.message.deleteMachinePool'),
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
                                            return `${machinePool.status!.replicas}/${machinePool.spec!.replicas}`
                                        },
                                    },
                                ],
                                keyFn,
                                actionFn: deleteResource,
                                confirmText: machinePool.metadata.name!,
                                close: () => setModalProps({ open: false }),
                                isDanger: true,
                            })
                        },
                        rbac: [rbacDelete(machinePool)],
                    },
                ]

                return (
                    <RbacDropdown<MachinePool>
                        id={`${machinePool.metadata.name}-actions`}
                        item={machinePool}
                        isKebab={true}
                        text={`${machinePool.metadata.name}-actions`}
                        actions={actions}
                    />
                )
            },
        },
    ]

    return (
        <>
            <BulkActionModel<MachinePool> {...modalProps} />
            <AcmTable<MachinePool>
                plural="machinepools"
                gridBreakPoint={TableGridBreakpoint.none}
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
