/* Copyright Contributors to the Open Cluster Management project */

import {
    deleteResource,
    ManagedClusterSet,
    ManagedClusterSetDefinition,
    ResourceErrorCode,
} from '../../../../../resources'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../../../components/BulkActionModel'
import { RbacDropdown } from '../../../../../components/Rbac'
import { rbacCreate, rbacDelete } from '../../../../../lib/rbac-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { ClusterStatuses } from './ClusterStatuses'
import { ManagedClusterSetBindingModal } from './ManagedClusterSetBindingModal'

export function ClusterSetActionDropdown(props: { managedClusterSet: ManagedClusterSet; isKebab?: boolean }) {
    const { t } = useTranslation()
    const history = useHistory()
    const [modalProps, setModalProps] = useState<IBulkActionModelProps<ManagedClusterSet> | { open: false }>({
        open: false,
    })

    const [showManagedClusterSetBindingModal, setShowManagedClusterSetBindingModal] = useState<boolean>(false)

    const modalColumns = useMemo(
        () => [
            {
                header: t('Name'),
                cell: (managedClusterSet: ManagedClusterSet) => (
                    <span style={{ whiteSpace: 'nowrap' }}>{managedClusterSet.metadata.name}</span>
                ),
                sort: 'name',
            },
            {
                header: t('Clusters'),
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
            text: t('Edit namespace bindings'),
            click: () => setShowManagedClusterSetBindingModal(true),
            isDisabled: true,
            rbac: [rbacCreate(ManagedClusterSetDefinition, undefined, props.managedClusterSet.metadata.name, 'bind')],
        },
        {
            id: 'manage-clusterSet-resources',
            text: t('Manage resource assignments'),
            click: (managedClusterSet: ManagedClusterSet) => {
                history.push(NavigationPath.clusterSetManage.replace(':id', managedClusterSet.metadata.name!))
            },
            isDisabled: true,
            rbac: [rbacCreate(ManagedClusterSetDefinition, undefined, props.managedClusterSet.metadata.name, 'join')],
        },
        {
            id: 'delete-clusterSet',
            text: t('Delete cluster set'),
            click: (managedClusterSet: ManagedClusterSet) => {
                setModalProps({
                    open: true,
                    isDanger: true,
                    icon: 'warning',
                    title: t('Delete cluster sets?'),
                    action: t('Delete'),
                    processing: t('Deleting'),
                    resources: [managedClusterSet],
                    description: t(
                        'Deleting a cluster set will remove all access control permissions to resources in this set for all assigned cluster set users. Resources currently in this cluster set will not be deleted.'
                    ),
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
                text={t('Actions')}
                actions={actions}
            />
        </>
    )
}
