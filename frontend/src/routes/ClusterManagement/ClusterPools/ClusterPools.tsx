/* Copyright Contributors to the Open Cluster Management project */

import { Fragment, useContext, useEffect, useState, useMemo } from 'react'
import {
    AcmAlertContext,
    AcmEmptyState,
    AcmPageContent,
    AcmTable,
    AcmInlineProvider,
    Provider,
} from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { fitContent, TableGridBreakpoint } from '@patternfly/react-table'
import { useTranslation, Trans } from 'react-i18next'
// import { useHistory } from 'react-router-dom'
import { useRecoilValue, waitForAll } from 'recoil'
import { clusterPoolsState } from '../../../atoms'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { RbacDropdown } from '../../../components/Rbac'
import { /*canUser, */ rbacDelete } from '../../../lib/rbac-util'
// import { ResourceErrorCode } from '../../../lib/resource-request'
import { ClusterPool /*, ClusterPoolDefinition */ } from '../../../resources/cluster-pool'
import { deleteResource, ResourceErrorCode } from '../../../lib/resource-request'

export default function ClusterPoolsPage() {
    const alertContext = useContext(AcmAlertContext)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => alertContext.clearAlerts, [])

    return (
        <AcmPageContent id="clusters">
            <PageSection variant="light" isFilled={true}>
                <ClusterPoolsTable />
            </PageSection>
        </AcmPageContent>
    )
}

function ClusterPoolProvider(props: { clusterPool: ClusterPool }) {
    let provider: Provider | undefined
    if (props.clusterPool.spec?.platform?.aws) provider = Provider.aws
    if (props.clusterPool.spec?.platform?.gcp) provider = Provider.gcp
    if (props.clusterPool.spec?.platform?.azure) provider = Provider.azure

    if (!provider) return <>-</>

    return <AcmInlineProvider provider={provider} />
}

export function ClusterPoolsTable() {
    const [clusterPools] = useRecoilValue(waitForAll([clusterPoolsState]))
    const { t } = useTranslation(['cluster'])
    const [modalProps, setModalProps] = useState<IBulkActionModelProps<ClusterPool> | { open: false }>({
        open: false,
    })
    // const history = useHistory()
    // const [canCreateClusterPool, setCanCreateClusterPool] = useState<boolean>(false)
    // useEffect(() => {
    //     const canCreateClusterPool = canUser('create', ClusterPoolDefinition)
    //     canCreateClusterPool.promise
    //         .then((result) => setCanCreateClusterPool(result.status?.allowed!))
    //         .catch((err) => console.error(err))
    //     return () => canCreateClusterPool.abort()
    // }, [])

    const modalColumns = useMemo(
        () => [
            {
                header: t('table.name'),
                cell: (clusterPool: ClusterPool) => (
                    <span style={{ whiteSpace: 'nowrap' }}>{clusterPool.metadata.name}</span>
                ),
                sort: 'metadata.name',
            },
            {
                header: t('table.namespace'),
                sort: 'metadata.namespace',
                search: 'metadata.namespace',
                cell: (clusterPool: ClusterPool) => {
                    return clusterPool.metadata.namespace
                },
            },
            {
                header: t('table.provider'),
                cell: (clusterPool: ClusterPool) => {
                    return <ClusterPoolProvider clusterPool={clusterPool} />
                },
            },
        ],
        [t]
    )

    function mckeyFn(clusterPool: ClusterPool) {
        return clusterPool.metadata.uid!
    }

    return (
        <Fragment>
            <BulkActionModel<ClusterPool> {...modalProps} />
            <AcmTable<ClusterPool>
                gridBreakPoint={TableGridBreakpoint.none}
                plural="clusterPools"
                items={clusterPools}
                columns={[
                    {
                        header: t('table.name'),
                        sort: 'metadata.name',
                        search: 'metadata.name',
                        cell: (clusterPool: ClusterPool) => {
                            return clusterPool.metadata.name
                        },
                    },
                    {
                        header: t('table.namespace'),
                        sort: 'metadata.namespace',
                        search: 'metadata.namespace',
                        cell: (clusterPool: ClusterPool) => {
                            return clusterPool.metadata.namespace
                        },
                    },
                    {
                        header: t('table.provider'),
                        cell: (clusterPool: ClusterPool) => {
                            return <ClusterPoolProvider clusterPool={clusterPool} />
                        },
                    },
                    {
                        header: t('table.available'),
                        cell: (clusterPool: ClusterPool) => {
                            return `${clusterPool?.status?.ready}/${clusterPool.spec!.size}`
                        },
                    },
                    {
                        header: '',
                        cell: (clusterPool) => {
                            const actions = [
                                {
                                    id: 'deleteClusterPool',
                                    text: t('clusterPool.delete'),
                                    isDisabled: true,
                                    click: (clusterPool: ClusterPool) => {
                                        setModalProps({
                                            open: true,
                                            title: t('bulk.title.deleteClusterPool'),
                                            action: t('common:delete'),
                                            processing: t('common:deleting'),
                                            resources: [clusterPool],
                                            description: t('bulk.message.deleteClusterPool'),
                                            columns: modalColumns,
                                            keyFn: mckeyFn,
                                            actionFn: deleteResource,
                                            confirmText: clusterPool.metadata.name!,
                                            close: () => setModalProps({ open: false }),
                                            isDanger: true,
                                        })
                                    },
                                    rbac: [rbacDelete(clusterPool)],
                                },
                            ]
                            return (
                                <RbacDropdown<ClusterPool>
                                    id={`${clusterPool.metadata.name}-actions`}
                                    item={clusterPool}
                                    isKebab={true}
                                    text={`${clusterPool.metadata.name}-actions`}
                                    actions={actions}
                                />
                            )
                        },
                        cellTransforms: [fitContent],
                    },
                ]}
                keyFn={mckeyFn}
                key="clusterPoolsTable"
                bulkActions={[
                    {
                        id: 'deleteClusterPools',
                        title: t('bulk.delete.clusterPools'),
                        click: (clusterPools) => {
                            setModalProps({
                                open: true,
                                title: t('bulk.delete.clusterPools'),
                                action: t('common:delete'),
                                processing: t('common:deleting'),
                                resources: clusterPools,
                                description: t('bulk.message.deleteClusterPool'),
                                columns: modalColumns,
                                keyFn: mckeyFn,
                                actionFn: deleteResource,
                                close: () => setModalProps({ open: false }),
                                isDanger: true,
                                confirmText: t('confirm').toLowerCase(),
                                isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                            })
                        },
                    },
                ]}
                tableActions={[]}
                rowActions={[]}
                emptyState={
                    <AcmEmptyState
                        key="mcEmptyState"
                        title={t('managed.clusterPools.emptyStateHeader')}
                        message={
                            <Trans
                                i18nKey={'cluster:managed.clusterPools.emptyStateMsg'}
                                components={{ bold: <strong />, p: <p /> }}
                            />
                        }
                        // action={
                        //     <AcmButton
                        //         role="link"
                        //         onClick={() => history.push(NavigationPath.clusterPools)}
                        //         disabled={!canCreateClusterPool}
                        //         tooltip={t('common:rbac.unauthorized')}
                        //     >
                        //         {t('managed.createClusterPool')}
                        //     </AcmButton>
                        // }
                    />
                }
            />
        </Fragment>
    )
}
