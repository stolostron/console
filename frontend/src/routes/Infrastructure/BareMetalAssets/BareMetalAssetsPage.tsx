/* Copyright Contributors to the Open Cluster Management project */

import {
    BareMetalAsset,
    BareMetalAssetConditionReasons,
    BareMetalAssetConditionTypes,
    createBareMetalAssetNamespaces,
    deleteResource,
    importBareMetalAsset,
    ImportedBareMetalAsset,
    IRequestResult,
    ManagedClusterDefinition,
} from '../../../resources'
import {
    AcmButton,
    AcmEmptyState,
    AcmPage,
    AcmPageContent,
    AcmPageHeader,
    AcmRoute,
    AcmTable,
} from '@open-cluster-management/ui-components'
import { ActionList, ActionListItem, Bullseye, ButtonVariant, PageSection } from '@patternfly/react-core'
import { fitContent } from '@patternfly/react-table'
import { Fragment, useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { acmRouteState, bareMetalAssetsState } from '../../../atoms'
import { BulkActionModel, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { RbacDropdown } from '../../../components/Rbac'
import { importBMAs } from '../../../lib/bare-metal-assets'
import { deleteResources } from '../../../lib/delete-resources'
import { DOC_LINKS } from '../../../lib/doc-util'
import { canUser, rbacDelete, rbacPatch } from '../../../lib/rbac-util'
import { NavigationPath } from '../../../NavigationPath'

export default function BareMetalAssetsPage() {
    const [, setRoute] = useRecoilState(acmRouteState)
    useEffect(() => setRoute(AcmRoute.BareMetalAssets), [setRoute])

    const [bareMetalAssets] = useRecoilState(bareMetalAssetsState)
    const { t } = useTranslation()

    return (
        <AcmPage
            hasDrawer
            header={
                <AcmPageHeader
                    title={t('Bare metal assets')}
                    titleTooltip={
                        <>
                            {t('View all bare metal assets')}
                            <a
                                href={DOC_LINKS.BARE_METAL_ASSETS}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'block', marginTop: '4px' }}
                            >
                                {t('Learn more')}
                            </a>
                        </>
                    }
                />
            }
        >
            <AcmPageContent id="bare-metal-assets">
                <PageSection>
                    <BareMetalAssetsTable bareMetalAssets={bareMetalAssets} deleteBareMetalAsset={deleteResource} />
                </PageSection>
            </AcmPageContent>
        </AcmPage>
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
        { open: false }
    )
    const history = useHistory()
    const { t } = useTranslation()

    useEffect(() => {
        const canCreateManagedCluster = canUser('create', ManagedClusterDefinition)
        canCreateManagedCluster.promise
            .then((result) => setCanCreateCluster(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canCreateManagedCluster.abort()
    }, [])

    function keyFn(bareMetalAsset: BareMetalAsset) {
        return bareMetalAsset.metadata.uid as string
    }

    function setImportModalProps() {
        setImportedProps({
            open: true,
            icon: 'default',
            title: t('Import bare metal assets'),
            action: t('Import'),
            processing: '',
            description: '',
            keyFn: (bareMetalAsset: ImportedBareMetalAsset) => bareMetalAsset.uid as string,
            actionFn: (bareMetalAsset: ImportedBareMetalAsset) => importBareMetalAsset(bareMetalAsset),
            resources: [],
            columns: [{ header: '', cell: '' }],
            close: () => setImportedProps({ open: false }),
            emptyState: (
                <AcmEmptyState
                    title={t('Specify CSV file')}
                    message={t(
                        'The first line of the CSV file must be a comma deliniated header row that defines the following columns: hostName, hostNamespace, bmcAddress, macAddress, role (optional), username, password.'
                    )}
                    showIcon={false}
                    action={
                        <AcmButton
                            id="import-button"
                            variant="primary"
                            onClick={async () => {
                                const result = await importBMAs()
                                setImportedProps({
                                    open: true,
                                    icon: 'default',
                                    title: t('Import bare metal assets'),
                                    action: t('Import'),
                                    processing: t('Importing'),
                                    description: t('Importing bare metal assets also creates required namespaces.'),
                                    resources: result,
                                    columns: [
                                        {
                                            header: t('Name'),
                                            cell: 'name',
                                            sort: 'name',
                                        },
                                        {
                                            header: t('Namespace'),
                                            cell: 'namespace',
                                            sort: 'namespace',
                                        },
                                        {
                                            header: t('MAC address'),
                                            cell: 'bootMACAddress',
                                            sort: 'bootMACAddress',
                                        },
                                        {
                                            header: t('Controller address'),
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
                            {t('Open file')}
                        </AcmButton>
                    }
                />
            ),
        })
    }

    function getBmaStatusMessage(mostCurrentReason: String, t:(string: String)=> string){
        switch (mostCurrentReason) {
            case 'clusterDeploymentNameNotFound':
                return t('Cluster deployment name is unspecified')
            case 'SecretFound':
                return t('Credentials found')
            case 'SecretNotFound':
                return t('No credentials found')
            case 'ClusterDeploymentFound':
                return t('Cluster deployment found')
            case 'SyncSetCreationFailed':
                return t('Failed to create Hive SyncSet')
            case 'SyncSetCreated':
                return t('SyncSet created successfully')
            case 'SyncSetGetFailed':
                return t('Failed to get SyncSet')
            case 'SyncSetUpdateFailed':
                return t('Failed to update SyncSet')
            case 'SyncSetUpdated':
                return t('SyncSet updated successfully')
            case 'SyncStatusNotFound':
                return t('Problem getting Hive SyncSet')
            case 'SyncSetNotApplied':
                return t('SyncSet not yet been applied')
            case 'SyncSetAppliedSuccessful':
                return t('Successfully applied SyncSet')
            case 'SyncSetAppliedFailed':
                return t('Failed to apply SyncSet')
            case 'UnexpectedResourceCount':
                return t('Unexpected number of resources found on SyncSet')
            default:
                break;
        }
    }

    return (
        <Fragment>
            <BulkActionModel<BareMetalAsset> {...modalProps} />
            <BulkActionModel<ImportedBareMetalAsset> {...importedProps} />
            <AcmTable<BareMetalAsset>
                emptyState={
                    <AcmEmptyState
                        title={t("You don't have any bare metal assets.")}
                        message={
                            <Trans
                                i18nKey={
                                    'Click the <bold>Create bare metal asset</bold> or <bold>Import bare metal assets</bold> button to create your resource'
                                }
                                components={{ bold: <strong /> }}
                            />
                        }
                        action={
                            <Bullseye>
                                <ActionList>
                                    <ActionListItem>
                                        <AcmButton
                                            variant="primary"
                                            onClick={() => {
                                                history.push(NavigationPath.createBareMetalAsset)
                                            }}
                                        >
                                            {t('Create bare metal asset')}
                                        </AcmButton>
                                    </ActionListItem>
                                    <ActionListItem>
                                        <AcmButton
                                            variant="primary"
                                            onClick={() => {
                                                setImportModalProps()
                                            }}
                                        >
                                            {t('Import bare metal assets')}
                                        </AcmButton>
                                    </ActionListItem>
                                </ActionList>
                            </Bullseye>
                        }
                    />
                }
                plural="bare metal assets"
                items={props.bareMetalAssets}
                columns={[
                    {
                        header: t('Name'),
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
                        header: t('Namespace'),
                        cell: 'metadata.namespace',
                        search: 'metadata.namespace',
                    },
                    {
                        header: t('Cluster'),
                        cell: (bareMetalAsset: BareMetalAsset) =>
                            bareMetalAsset.metadata.labels?.['metal3.io/cluster-deployment-name'] || '-',
                        search: 'metal3.io/cluster-deployment-name',
                    },
                    {
                        header: t('Role'),
                        cell: (bareMetalAsset: BareMetalAsset) =>
                            bareMetalAsset.metadata.labels?.['metal3.io/role'] || '-',
                        search: 'metal3.io/role',
                    },
                    {
                        header: t('Status'),
                        cell: (bareMetalAsset) => {
                            if (bareMetalAsset.status) {
                                let mostCurrentStatusTime = new Date(
                                    bareMetalAsset.status!.conditions[0].lastTransitionTime
                                )
                                let mostCurrentStatus = bareMetalAsset.status!.conditions[0].type
                                let mostCurrentReason = bareMetalAsset.status.conditions[0].reason
                                for (const conditions of bareMetalAsset.status!.conditions) {
                                    if (
                                        new Date(conditions.lastTransitionTime).getTime() >
                                        mostCurrentStatusTime!.getTime()
                                    ) {
                                        mostCurrentStatusTime = new Date(conditions.lastTransitionTime)
                                        mostCurrentStatus = conditions.type
                                        mostCurrentReason = conditions.reason
                                    }
                                    // if status time is equivalent, take the status at that was added last
                                    else if (
                                        new Date(conditions.lastTransitionTime).getTime() ===
                                        mostCurrentStatusTime.getTime()
                                    ) {
                                        mostCurrentStatusTime = new Date(conditions.lastTransitionTime)
                                        mostCurrentStatus = conditions.type
                                        mostCurrentReason = conditions.reason
                                    }
                                }

                                if (
                                    mostCurrentReason === BareMetalAssetConditionReasons.NoneSpecified &&
                                    mostCurrentStatus === BareMetalAssetConditionTypes.ConditionClusterDeploymentFound
                                )
                                    return t('Cluster deployment name is unspecified')
                                // TODO - Handle interpolation
                                else return getBmaStatusMessage(mostCurrentReason, t)
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
                                    text: t('Edit asset'),
                                    isDisabled: true,
                                    click: (bareMetalAsset: BareMetalAsset) => {
                                        history.push(
                                            NavigationPath.editBareMetalAsset.replace(
                                                ':namespace/:name',
                                                `${bareMetalAsset.metadata?.namespace}/${bareMetalAsset.metadata?.name}` as string
                                            )
                                        )
                                    },
                                    rbac: [rbacPatch(bareMetalAsset)],
                                },
                                {
                                    id: 'deleteAsset',
                                    text: t('Delete asset'),
                                    isDisabled: true,
                                    click: (bareMetalAsset: BareMetalAsset) => {
                                        setModalProps({
                                            open: true,
                                            title: t('Permanently delete bare metal assets?'),
                                            action: t('Delete'),
                                            processing: t('Deleting'),
                                            resources: [bareMetalAsset],
                                            description: t(
                                                'You are about to delete bare metal assets. The bare metal assets will no longer be available.'
                                            ),
                                            columns: [
                                                {
                                                    header: t('Name'),
                                                    cell: 'metadata.name',
                                                    sort: 'metadata.name',
                                                },
                                                {
                                                    header: t('Namespace'),
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
                                            icon: 'warning',
                                        })
                                    },
                                    rbac: [rbacDelete(bareMetalAsset)],
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
                tableActionButtons={[
                    {
                        id: 'createAsset',
                        title: t('Create asset'),
                        click: () => history.push(NavigationPath.createBareMetalAsset),
                        variant: ButtonVariant.primary,
                    },
                    {
                        id: 'importAsset',
                        title: t('Import assets'),
                        click: () => setImportModalProps(),
                        variant: ButtonVariant.secondary,
                    },
                ]}
                tableActions={[
                    {
                        id: 'deleteBareMetalAsset',
                        title: t('Delete assets'),
                        click: (bareMetalAssets: BareMetalAsset[]) => {
                            setModalProps({
                                open: true,
                                title: t('Permanently delete bare metal assets?'),
                                action: t('Delete'),
                                processing: t('Deleting'),
                                resources: [...bareMetalAssets],
                                description: t(
                                    'You are about to delete bare metal assets. The bare metal assets will no longer be available.'
                                ),
                                columns: [
                                    {
                                        header: t('Name'),
                                        cell: 'metadata.name',
                                        sort: 'metadata.name',
                                    },
                                    {
                                        header: t('Namespace'),
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
                                icon: 'warning',
                            })
                        },
                        variant: 'bulk-action',
                    },
                    {
                        id: 'createBareMetalAssetCluster',
                        title: t('Create cluster'),
                        click: (items) => {
                            const params = new URLSearchParams()
                            const bmaIDs = items.map((bma) => bma.metadata.uid)
                            params.set('bmas', bmaIDs.join(','))
                            history.push(`${NavigationPath.createCluster}?${params}`)
                        },
                        isDisabled: !canCreateCluster,
                        tooltip: !canCreateCluster
                            ? t(
                                'You are not authorized to complete this action. See your cluster administrator for role-based access control information.'
                            )
                            : '',
                        variant: 'bulk-action',
                    },
                ]}
                rowActions={[]}
            />
        </Fragment>
    )
}
