/* Copyright Contributors to the Open Cluster Management project */

import { ClusterStatus, deleteResource, MachinePool } from '../../../../../../resources'
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
import { TechPreviewAlert } from '../../../../../../components/TechPreviewAlert'
import { DOC_LINKS } from '../../../../../../lib/doc-util'
import { rbacDelete, rbacPatch } from '../../../../../../lib/rbac-util'
import { ScaleClusterAlert } from '../../components/ScaleClusterAlert'
import { ClusterContext } from '../ClusterDetails'
import { ScaleMachinePoolModal, ScaleMachinePoolModalProps } from './components/ScaleMachinePoolModal'

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
    const { t } = useTranslation()
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
        return machinePool.spec?.autoscaling ? t('Enabled') : t('Disabled')
    }

    function keyFn(machinePool: MachinePool) {
        return machinePool.metadata.name!
    }

    const columns: IAcmTableColumn<MachinePool>[] = [
        {
            header: t('Name'),
            sort: 'metadata.name',
            search: 'metadata.name',
            cell: 'metadata.name',
        },
        {
            header: t('Machine set replicas'),
            sort: 'status.replicas',
            search: 'status.replicas',
            cell: (machinePool: MachinePool) => {
                if (machinePool.spec?.replicas !== undefined) {
                    return (
                        <span style={{ whiteSpace: 'nowrap', display: 'block' }}>
                            {/* TODO - Handle interpolation */}
                            {t('{{firstNumber}} out of {{secondNumber}}', {
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
            header: t('Autoscale'),
            sort: (a: MachinePool, b: MachinePool) => compareStrings(getAutoscaling(a), getAutoscaling(b)),
            search: (machinePool: MachinePool) => getAutoscaling(machinePool),
            cell: (machinePool: MachinePool) => {
                if (machinePool.spec?.replicas !== undefined) {
                    return getAutoscaling(machinePool)
                } else {
                    // TODO - Handle interpolation
                    return `${getAutoscaling(machinePool)}, ${t('{{range}} replicas', {
                        range: `${machinePool.spec?.autoscaling?.minReplicas}-${machinePool.spec?.autoscaling?.maxReplicas}`,
                    })}`
                }
            },
        },
        {
            header: t('Instance type'),
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
                        text: t('Scale machine pool'),
                        isDisabled: true,
                        rbac: [rbacPatch(machinePool)],
                        click: (machinePool: MachinePool) =>
                            setScaleMachinePool({ machinePool, mode: 'edit-manualscale' }),
                    },
                    {
                        id: 'editAutoscale',
                        text: t('Edit autoscale'),
                        isDisabled: true,
                        rbac: [rbacPatch(machinePool)],
                        click: (machinePool: MachinePool) =>
                            setScaleMachinePool({ machinePool, mode: 'edit-autoscale' }),
                    },
                    {
                        id: 'enableAutoscale',
                        text: t('Enable autoscale'),
                        isDisabled: true,
                        rbac: [rbacPatch(machinePool)],
                        click: (machinePool: MachinePool) =>
                            setScaleMachinePool({ machinePool, mode: 'enable-autoscale' }),
                    },
                    {
                        id: 'disableAutoscale',
                        text: t('Disable autoscale'),
                        isDisabled: true,
                        rbac: [rbacPatch(machinePool)],
                        click: (machinePool: MachinePool) =>
                            setScaleMachinePool({ machinePool, mode: 'disable-autoscale' }),
                    },
                    {
                        id: 'deleteMachinePool',
                        text: t('Delete machine pool'),
                        isDisabled: true,
                        rbac: [rbacDelete(machinePool)],
                        click: (machinePool: MachinePool) => {
                            setModalProps({
                                open: true,
                                title: t('Permanently delete machine pools?'),
                                action: t('Delete'),
                                processing: t('Deleting'),
                                resources: [machinePool],
                                description: t(
                                    'Deleting a machine pool will destroy any machine sets in the machine pool and associated nodes will be deprovisioned. Deleting a machine pool may result in insufficient resources for applications running on this cluster.'
                                ),
                                keyFn,
                                actionFn: deleteResource,
                                confirmText: machinePool.metadata.name!,
                                close: () => setModalProps({ open: false }),
                                isDanger: true,
                                icon: 'warning',
                                columns: [
                                    {
                                        header: t('Name'),
                                        sort: 'metadata.name',
                                        search: 'metadata.name',
                                        cell: 'metadata.name',
                                    },
                                    {
                                        header: t('Machine set replicas'),
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

                function getMenuTooltip(cStatus: ClusterStatus, t: (string: String) => string) {
                    switch (cStatus) {
                        case 'pending':
                            return t(
                                'The current status of the cluster (Pending) does not allow any actions to be taken on the machine pool.'
                            )
                        case 'destroying':
                            return t(
                                'The current status of the cluster (Destroying) does not allow any actions to be taken on the machine pool.'
                            )
                        case 'creating':
                            return t(
                                'The current status of the cluster (Creating) does not allow any actions to be taken on the machine pool.'
                            )
                        case 'detached':
                            return t(
                                'The current status of the cluster (Detached) does not allow any actions to be taken on the machine pool.'
                            )
                        case 'detaching':
                            return t(
                                'The current status of the cluster (Detaching) does not allow any actions to be taken on the machine pool.'
                            )
                        case 'notaccepted':
                            return t(
                                'The current status of the cluster (Not accepted) does not allow any actions to be taken on the machine pool.'
                            )
                        case 'needsapproval':
                            return t(
                                'The current status of the cluster (Needs approval) does not allow any actions to be taken on the machine pool.'
                            )
                        case 'pendingimport':
                            return t(
                                'The current status of the cluster (Pending import) does not allow any actions to be taken on the machine pool.'
                            )
                        case 'importing':
                            return t(
                                'The current status of the cluster (Importing) does not allow any actions to be taken on the machine pool.'
                            )
                        case 'ready':
                            return t(
                                'The current status of the cluster (Ready) does not allow any actions to be taken on the machine pool.'
                            )
                        case 'offline':
                            return t(
                                'The current status of the cluster (Offline) does not allow any actions to be taken on the machine pool.'
                            )
                        case 'hibernating':
                            return t(
                                'The current status of the cluster (Hibernating) does not allow any actions to be taken on the machine pool.'
                            )
                        case 'stopping':
                            return t(
                                'The current status of the cluster (Stopping) does not allow any actions to be taken on the machine pool.'
                            )
                        case 'resuming':
                            return t(
                                'The current status of the cluster (Resuming) does not allow any actions to be taken on the machine pool.'
                            )
                        case 'degraded':
                            return t(
                                'The current status of the cluster (Degraded) does not allow any actions to be taken on the machine pool.'
                            )
                        case 'unknown':
                            return t(
                                'The current status of the cluster (Unknown) does not allow any actions to be taken on the machine pool.'
                            )
                        case 'prehookjob':
                            return t(
                                'The current status of the cluster (Prehook) does not allow any actions to be taken on the machine pool.'
                            )
                        case 'posthookjob':
                            return t(
                                'The current status of the cluster (Posthook) does not allow any actions to be taken on the machine pool.'
                            )
                        case 'draft':
                            return t(
                                'The current status of the cluster (Draft) does not allow any actions to be taken on the machine pool.'
                            )
                        case 'failed':
                        case 'provisionfailed':
                        case 'deprovisionfailed':
                        case 'prehookfailed':
                        case 'posthookfailed':
                        case 'importfailed':
                            return t(
                                'The current status of the cluster (Failed) does not allow any actions to be taken on the machine pool.'
                            )

                        default:
                            break
                    }
                }

                return (
                    <RbacDropdown<MachinePool>
                        id={`${machinePool.metadata.name}-actions`}
                        item={machinePool}
                        isKebab={true}
                        text={`${machinePool.metadata.name}-actions`}
                        actions={actions}
                        tooltip={getMenuTooltip(cluster!.status, t)}
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
                rowActions={[]}
                emptyState={
                    <AcmEmptyState
                        key="mcEmptyState"
                        title={t('No machine pools found.')}
                        message={
                            <Trans
                                i18nKey={"This cluster doesn't have any machine pools."}
                                components={{ bold: <strong /> }}
                            />
                        }
                    />
                }
            />
        </>
    )
}
