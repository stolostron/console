/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmButton,
    AcmEmptyState,
    AcmTable,
    AcmTablePaginationContextProvider,
} from '@open-cluster-management/ui-components'
import { Page, PageSection } from '@patternfly/react-core'
import { fitContent, TableGridBreakpoint } from '@patternfly/react-table'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { bareMetalAssetsState } from '../../atoms'
import { BulkActionModel, IBulkActionModelProps } from '../../components/BulkActionModel'
import { RbacDropdown } from '../../components/Rbac'
import { importBMAs } from '../../lib/bare-metal-assets'
import { deleteResources } from '../../lib/delete-resources'
import { getResourceAttributes, getUserAccess } from '../../lib/rbac-util'
import { deleteResource, IRequestResult } from '../../lib/resource-request'
import { NavigationPath } from '../../NavigationPath'
import {
    BareMetalAsset,
    BareMetalAssetDefinition,
    createBareMetalAssetNamespaces,
    importBareMetalAsset,
    ImportedBareMetalAsset,
} from '../../resources/bare-metal-asset'
import { ManagedClusterDefinition } from '../../resources/managed-cluster'

const baremetalasset = 'bare metal asset'
const baremetalassets = 'bare metal assets'

export default function BareMetalAssetsPage() {
    const [bareMetalAssets] = useRecoilState(bareMetalAssetsState)
    return (
        <Page>
            <BareMetalAssetsTable bareMetalAssets={bareMetalAssets} deleteBareMetalAsset={deleteResource} />
        </Page>
    )
}

export function deleteBareMetalAssets(bareMetalAssets: BareMetalAsset[]) {
    return deleteResources(bareMetalAssets).promise
}

export function BareMetalAssetsTable(props: {
    bareMetalAssets?: BareMetalAsset[]
    deleteBareMetalAsset: (bareMetalAsset: BareMetalAsset) => IRequestResult
}) {
    const [canCreateCluster, setCanCreateCluster] = useState<boolean>(true)
    const [modalProps, setModalProps] = useState<IBulkActionModelProps<BareMetalAsset> | { open: false }>({
        open: false,
    })
    const [importedProps, setImportedProps] = useState<IBulkActionModelProps<ImportedBareMetalAsset> | { open: false }>(
        {
            open: false,
        }
    )
    const history = useHistory()
    const { t } = useTranslation(['bma', 'common'])

    useEffect(() => {
        const canCreateCluster = getUserAccess('create', ManagedClusterDefinition)

        canCreateCluster.promise
            .then((result) => setCanCreateCluster(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canCreateCluster.abort()
    }, [])

    function keyFn(bareMetalAsset: BareMetalAsset) {
        return bareMetalAsset.metadata.uid as string
    }

    function setImportModalProps() {
        setImportedProps({
            open: true,
            singular: t(baremetalasset),
            plural: t(baremetalassets),
            action: t('common:import'),
            processing: '',
            description: '',
            keyFn: (bareMetalAsset: ImportedBareMetalAsset) => bareMetalAsset.uid as string,
            actionFn: (bareMetalAsset: ImportedBareMetalAsset) => importBareMetalAsset(bareMetalAsset),
            resources: [],
            columns: [{ header: '', cell: '' }],
            emptyState: (
                <AcmEmptyState
                    title={t('bareMetalAsset.importAction.title')}
                    message={t('bareMetalAsset.importAction.message')}
                    showIcon={false}
                    action={
                        <AcmButton
                            id="import-button"
                            variant="primary"
                            onClick={async () => {
                                const result = await importBMAs()
                                setImportedProps({
                                    open: true,
                                    singular: t(baremetalasset),
                                    plural: t(baremetalassets),
                                    action: t('common:import'),
                                    processing: t('common:importing'),
                                    description: t('modal.import.content.batch'),
                                    resources: result,
                                    columns: [
                                        {
                                            header: t('bareMetalAsset.tableHeader.name'),
                                            cell: 'name',
                                            sort: 'name',
                                        },
                                        {
                                            header: t('bareMetalAsset.tableHeader.namespace'),
                                            cell: 'namespace',
                                            sort: 'namespace',
                                        },
                                        {
                                            header: t('bareMetalAsset.tableHeader.macaddress'),
                                            cell: 'bootMACAddress',
                                            sort: 'bootMACAddress',
                                        },
                                        {
                                            header: t('bareMetalAsset.tableHeader.address'),
                                            cell: 'bmc.address',
                                            sort: 'bmc.address',
                                        },
                                    ],
                                    keyFn: (bareMetalAsset: ImportedBareMetalAsset) => bareMetalAsset.uid as string,
                                    preActionFn: async (bareMetalAssets: ImportedBareMetalAsset[], errors) => {
                                        const responses = await createBareMetalAssetNamespaces(bareMetalAssets)
                                        responses.forEach((response) => {
                                            if (response.status === 'rejected') {
                                                if (response.reason.code !== 409) {
                                                    errors.push({
                                                        error: response.reason.message,
                                                        item: bareMetalAssets[0],
                                                    })
                                                }
                                            }
                                        })
                                    },
                                    actionFn: (bareMetalAsset: ImportedBareMetalAsset) =>
                                        importBareMetalAsset(bareMetalAsset),
                                    close: () => {
                                        setImportedProps({ open: false })
                                    },
                                })
                            }}
                        >
                            {t('bareMetalAsset.importAction.button')}
                        </AcmButton>
                    }
                />
            ),
            close: () => {
                setImportedProps({ open: false })
            },
        })
    }

    return (
        <PageSection variant="light" isFilled={true}>
            <BulkActionModel<BareMetalAsset> {...modalProps} />
            <BulkActionModel<ImportedBareMetalAsset> {...importedProps} />
            <AcmTablePaginationContextProvider localStorageKey="table-bare-metal-assets">
                <AcmTable<BareMetalAsset>
                    gridBreakPoint={TableGridBreakpoint.none}
                    emptyState={
                        <AcmEmptyState
                            title={t('bareMetalAsset.emptyState.title')}
                            action={
                                <div style={{ display: 'flex', justifyContent: 'space-evenly', margin: 'auto' }}>
                                    <AcmButton
                                        variant="primary"
                                        onClick={() => {
                                            history.push(NavigationPath.createBareMetalAsset)
                                        }}
                                    >
                                        {t('createBareMetalAsset.title')}
                                    </AcmButton>
                                    <AcmButton
                                        variant="primary"
                                        onClick={() => {
                                            setImportModalProps()
                                        }}
                                    >
                                        {t('importBareMetalAssets.title')}
                                    </AcmButton>
                                </div>
                            }
                        />
                    }
                    plural="bare metal assets"
                    items={props.bareMetalAssets}
                    columns={[
                        {
                            header: t('bareMetalAsset.tableHeader.name'),
                            sort: 'metadata.name',
                            search: 'metadata.name',
                            cell: (bareMetalAsset) => (
                                <span style={{ whiteSpace: 'nowrap' }}>
                                    <Link
                                        to={NavigationPath.editBareMetalAsset
                                            .replace(':namespace', bareMetalAsset.metadata.namespace as string)
                                            .replace(':name', bareMetalAsset.metadata.name as string)}
                                    >
                                        {bareMetalAsset.metadata.name}
                                    </Link>
                                </span>
                            ),
                        },
                        {
                            header: t('bareMetalAsset.tableHeader.namespace'),
                            cell: 'metadata.namespace',
                            search: 'metadata.namespace',
                        },
                        {
                            header: t('bareMetalAsset.tableHeader.cluster'),
                            cell: (bareMetalAsset: BareMetalAsset) =>
                                bareMetalAsset.metadata.labels?.['metal3.io/cluster-deployment-name'] || '-',
                            search: 'metal3.io/cluster-deployment-name',
                        },
                        {
                            header: t('bareMetalAsset.tableHeader.role'),
                            cell: (bareMetalAsset: BareMetalAsset) =>
                                bareMetalAsset.metadata.labels?.['metal3.io/role'] || '-',
                            search: 'metal3.io/role',
                        },
                        {
                            header: t('bareMetalAsset.tableHeader.status'),
                            cell: (bareMetalAsset) => {
                                if (bareMetalAsset.status) {
                                    let mostCurrentStatusTime = bareMetalAsset.status!.conditions[0].lastTransitionTime
                                    let mostCurrentStatus = bareMetalAsset.status!.conditions[0].type
                                    for (let conditions of bareMetalAsset.status!.conditions) {
                                        if (conditions.lastTransitionTime > mostCurrentStatusTime!) {
                                            mostCurrentStatusTime = conditions.lastTransitionTime
                                            mostCurrentStatus = conditions.type
                                        }
                                        // if status time is equivalent, take the status at that was added last
                                        else if (conditions.lastTransitionTime === mostCurrentStatusTime) {
                                            mostCurrentStatusTime = conditions.lastTransitionTime
                                            mostCurrentStatus = conditions.type
                                        }
                                    }
                                    switch (mostCurrentStatus) {
                                        // returns translation strings
                                        case 'CredentialsFound':
                                            return t('bareMetalAsset.statusMessage.credentialsFound')
                                        case 'AssetSyncStarted':
                                            return t('bareMetalAsset.statusMessage.assetSyncStarted')
                                        case 'ClusterDeploymentFound':
                                            return t('bareMetalAsset.statusMessage.clusterDeploymentFound')
                                        case 'AssetSyncCompleted':
                                            return t('bareMetalAsset.statusMessage.assetSyncCompleted')
                                        case 'Ready':
                                            return t('bareMetalAsset.statusMessage.ready')
                                        default:
                                            return ''
                                    }
                                }
                                return ''
                            },
                        },
                        {
                            header: '',
                            cellTransforms: [fitContent],
                            cell: (bareMetalAsset) => {
                                const actions = [
                                    {
                                        id: 'editAsset',
                                        text: t('bareMetalAsset.rowAction.editAsset.title'),
                                        isDisabled: true,
                                        click: (bareMetalAsset: BareMetalAsset) => {
                                            history.push(
                                                NavigationPath.editBareMetalAsset.replace(
                                                    ':namespace/:name',
                                                    `${bareMetalAsset.metadata?.namespace}/${bareMetalAsset.metadata?.name}` as string
                                                )
                                            )
                                        },
                                        rbac: [
                                            getResourceAttributes(
                                                'patch',
                                                BareMetalAssetDefinition,
                                                bareMetalAsset.metadata?.namespace,
                                                bareMetalAsset.metadata?.name
                                            ),
                                        ],
                                    },
                                    {
                                        id: 'deleteAsset',
                                        text: t('bareMetalAsset.rowAction.deleteAsset.title'),
                                        isDisabled: true,
                                        click: (bareMetalAsset: BareMetalAsset) => {
                                            setModalProps({
                                                open: true,
                                                singular: t(baremetalasset),
                                                plural: t(baremetalassets),
                                                action: t('common:delete'),
                                                processing: t('common:deleting'),
                                                resources: [bareMetalAsset],
                                                description: t('modal.delete.content.batch'),
                                                columns: [
                                                    {
                                                        header: t('bareMetalAsset.tableHeader.name'),
                                                        cell: 'metadata.name',
                                                        sort: 'metadata.name',
                                                    },
                                                    {
                                                        header: t('bareMetalAsset.tableHeader.namespace'),
                                                        cell: 'metadata.namespace',
                                                        sort: 'metadata.namespace',
                                                    },
                                                ],
                                                keyFn: (bareMetalAsset: BareMetalAsset) =>
                                                    bareMetalAsset.metadata.uid as string,
                                                actionFn: (bareMetalAsset: BareMetalAsset) =>
                                                    deleteResource(bareMetalAsset),
                                                close: () => {
                                                    setModalProps({ open: false })
                                                },
                                                isDanger: true,
                                            })
                                        },
                                        rbac: [
                                            getResourceAttributes(
                                                'delete',
                                                BareMetalAssetDefinition,
                                                bareMetalAsset.metadata?.namespace,
                                                bareMetalAsset.metadata?.name
                                            ),
                                        ],
                                    },
                                ]

                                return (
                                    <RbacDropdown<BareMetalAsset>
                                        id={`${bareMetalAsset.metadata.name}-actions`}
                                        item={bareMetalAsset}
                                        isKebab={true}
                                        text={`${bareMetalAsset.metadata.name}-actions`}
                                        actions={actions}
                                    />
                                )
                            },
                        },
                    ]}
                    keyFn={keyFn}
                    tableActions={[
                        {
                            id: 'createAsset',
                            title: t('bareMetalAsset.bulkAction.createAsset'),
                            click: () => {
                                history.push(NavigationPath.createBareMetalAsset)
                            },
                        },
                        {
                            id: 'importAsset',
                            title: t('bareMetalAsset.bulkAction.importAssets'),
                            click: () => {
                                setImportModalProps()
                            },
                        },
                    ]}
                    bulkActions={[
                        {
                            id: 'deleteBareMetalAsset',
                            title: t('bareMetalAsset.bulkAction.deleteAsset'),
                            click: (bareMetalAssets: BareMetalAsset[]) => {
                                setModalProps({
                                    open: true,
                                    singular: t(baremetalasset),
                                    plural: t(baremetalassets),
                                    action: t('common:delete'),
                                    processing: t('common:deleting'),
                                    resources: [...bareMetalAssets],
                                    description: t('modal.delete.content.batch'),
                                    columns: [
                                        {
                                            header: t('bareMetalAsset.tableHeader.name'),
                                            cell: 'metadata.name',
                                            sort: 'metadata.name',
                                        },
                                        {
                                            header: t('bareMetalAsset.tableHeader.namespace'),
                                            cell: 'metadata.namespace',
                                            sort: 'metadata.namespace',
                                        },
                                    ],
                                    keyFn: (bareMetalAsset: BareMetalAsset) => bareMetalAsset.metadata.uid as string,
                                    actionFn: (bareMetalAsset: BareMetalAsset) => deleteResource(bareMetalAsset),
                                    close: () => {
                                        setModalProps({ open: false })
                                    },
                                    isDanger: true,
                                })
                            },
                        },
                        {
                            id: 'createBareMetalAssetCluster',
                            title: t('bareMetalAsset.bulkAction.createCluster'),
                            click: (items) => {
                                const params = new URLSearchParams()
                                const bmaIDs = items.map((bma) => bma.metadata.uid)
                                params.set('bmas', bmaIDs.join(','))
                                history.push(`${NavigationPath.createCluster}?${params}`)
                            },
                            isDisabled: !canCreateCluster,
                            tooltip: !canCreateCluster ? t('common:rbac.unauthorized') : '',
                        },
                    ]}
                    rowActions={[]}
                />
            </AcmTablePaginationContextProvider>
        </PageSection>
    )
}
