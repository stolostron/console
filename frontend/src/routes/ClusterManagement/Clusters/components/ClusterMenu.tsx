import React from 'react'
import { AcmDropdown } from '@open-cluster-management/ui-components'
import { Cluster, ClusterStatus } from '../../../../lib/get-cluster'
import i18n from '../../../../lib/i18n'

export enum Actions {
    editLabels = 'edit-labels',
    launchCluster = 'launch-cluster',
    upgradeCluster = 'upgrade-cluster',
    searchCluster = 'search-cluster',
    detachCluster = 'detach-cluster',
    destroyCluster = 'destroy-cluster'
}

export function ClusterMenu(cluster: Cluster) {
    let actions = [
        {
            id: Actions.editLabels,
            title: i18n.t('managed.editLabels'),
            click: (cluster) => setEditClusterLabels(cluster),
        },
        { id: Actions.launchCluster, title: i18n.t('managed.launch'), click: (managedCluster) => window.open(managedCluster.consoleURL, '_blank') },
        { id: Actions.upgradeCluster, title: i18n.t('managed.upgrade'), click: (managedCluster) => {} },
        { id: Actions.searchCluster, title: i18n.t('managed.search'), click: (managedCluster) => {} },
        {
            id: Actions.detachCluster,
            title: i18n.t('managed.detached'),
            click: (managedCluster) => {
                setConfirm({
                    title: i18n.t('modal.detach.title'),
                    message: `You are about to detach ${managedCluster.name}. This action is irreversible.`,
                    open: true,
                    confirm: () => {
                        deleteCluster(managedCluster.name!, false).promise.then((results) => {
                            results.forEach((result) => {
                                if (result.status === 'rejected') {
                                    setErrors([
                                        `Failed to detach managed cluster ${managedCluster.name}. ${result.reason}`,
                                    ])
                                }
                            })
                        })
                        setConfirm(ClosedConfirmModalProps)
                    },
                    cancel: () => {
                        setConfirm(ClosedConfirmModalProps)
                    },
                })
                props.refresh()
            },
        },
        {
            id: Actions.destroyCluster,
            title: i18n.t('managed.destroySelected'),
            click: (managedCluster) => {
                setConfirm({
                    title: i18n.t('modal.destroy.title'),
                    message: `You are about to destroy ${managedCluster.name}. This action is irreversible.`,
                    open: true,
                    confirm: () => {
                        deleteCluster(managedCluster.name!, false).promise.then((results) => {
                            results.forEach((result) => {
                                if (result.status === 'rejected') {
                                    setErrors([
                                        `Failed to destroy managed cluster ${managedCluster.name}. ${result.reason}`,
                                    ])
                                }
                            })
                        })
                        setConfirm(ClosedConfirmModalProps)
                    },
                    cancel: () => {
                        setConfirm(ClosedConfirmModalProps)
                    },
                })
                props.refresh()
            },
        },
    ]

    if (!cluster.consoleURL) {
        actions = actions.filter((a) => a.id !== 'launch-cluster')
    }

    if (!cluster.distribution?.ocp?.availableUpdates) {
        actions = actions.filter((a) => a.id !== 'upgrade-cluster')
    }

    if (!cluster.isManaged) {
        actions = actions.filter((a) => a.id !== 'search-cluster')
    }

    if (cluster.status === ClusterStatus.detached) {
        actions = actions.filter((a) => a.id !== Actions.detachCluster)
    }

    if (!cluster.isHive) {
        actions = actions.filter((a) => a.id !== 'destroy-cluster')
    }

    return actions
}
