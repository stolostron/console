/* Copyright Contributors to the Open Cluster Management project */

import { useMemo, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../../components/BulkActionModel'
import { RbacDropdown } from '../../../../components/Rbac'
import { ManagedClusterSet, ManagedClusterSetDefinition } from '../../../../resources/managed-cluster-set'
import { deleteResource, ResourceErrorCode } from '../../../../lib/resource-request'
import { ClusterStatuses } from './ClusterStatuses'
import { rbacCreate, rbacDelete } from '../../../../lib/rbac-util'
import { NavigationPath } from '../../../../NavigationPath'
import { ManagedClusterSetBindingModal } from './ManagedClusterSetBindingModal'

export function ClusterSetActionDropdown(props: { managedClusterSet: ManagedClusterSet; isKebab?: boolean }) {
    const { t } = useTranslation(['cluster'])
    const history = useHistory()
    const [modalProps, setModalProps] = useState<IBulkActionModelProps<ManagedClusterSet> | { open: false }>({
        open: false,
    })

    const [showManagedClusterSetBindingModal, setShowManagedClusterSetBindingModal] = useState<boolean>(false)

    const modalColumns = useMemo(
        () => [
            {
                header: t('table.name'),
                cell: (managedClusterSet: ManagedClusterSet) => (
                    <span style={{ whiteSpace: 'nowrap' }}>{managedClusterSet.metadata.name}</span>
                ),
                sort: 'name',
            },
            {
                header: t('table.clusters'),
                sort: 'status',
                cell: (managedClusterSet: ManagedClusterSet) => (
                    <ClusterStatuses managedClusterSet={managedClusterSet} />
                ),
            },
        ],
        [t]
    )

    const actions = [
        {
            id: 'edit-bindings',
            text: t('set.edit-bindings'),
            click: () => setShowManagedClusterSetBindingModal(true),
            isDisabled: true,
            rbac: [rbacCreate(ManagedClusterSetDefinition, undefined, props.managedClusterSet.metadata.name, 'bind')],
        },
        {
            id: 'manage-clusterSet-resources',
            text: t('set.manage-resources'),
            click: (managedClusterSet: ManagedClusterSet) => {
                history.push(NavigationPath.clusterSetManage.replace(':id', managedClusterSet.metadata.name!))
            },
            isDisabled: true,
            rbac: [rbacCreate(ManagedClusterSetDefinition, undefined, props.managedClusterSet.metadata.name, 'join')],
        },
        {
            id: 'delete-clusterSet',
            text: t('set.delete'),
            click: (managedClusterSet: ManagedClusterSet) => {
                setModalProps({
                    open: true,
                    isDanger: true,
                    title: t('bulk.title.deleteSet'),
                    action: t('delete'),
                    processing: t('deleting'),
                    resources: [managedClusterSet],
                    description: t('bulk.message.deleteSet'),
                    columns: modalColumns,
                    keyFn: (managedClusterSet) => managedClusterSet.metadata.name! as string,
                    actionFn: deleteResource,
                    close: () => {
                        setModalProps({ open: false })
                    },
                    confirmText: managedClusterSet.metadata.name!,
                    isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                })
            },
            isDisabled: true,
            rbac: [rbacDelete(ManagedClusterSetDefinition, undefined, props.managedClusterSet.metadata.name)],
        },
    ]

    return (
        <>
            <ManagedClusterSetBindingModal
                clusterSet={showManagedClusterSetBindingModal ? props.managedClusterSet : undefined}
                onClose={() => setShowManagedClusterSetBindingModal(false)}
            />
            <BulkActionModel<ManagedClusterSet> {...modalProps} />
            <RbacDropdown<ManagedClusterSet>
                id={`${props.managedClusterSet.metadata.name}-actions`}
                item={props.managedClusterSet}
                isKebab={props.isKebab}
                text={t('actions')}
                actions={actions}
            />
        </>
    )
}
