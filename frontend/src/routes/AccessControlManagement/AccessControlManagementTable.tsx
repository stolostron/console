/* Copyright Contributors to the Open Cluster Management project */
import { ButtonVariant, Label } from '@patternfly/react-core'
import {
    CheckCircleIcon,
    TimesCircleIcon
} from '@patternfly/react-icons'
import { fitContent } from '@patternfly/react-table'
import { Fragment, useMemo, useState } from 'react'
import { generatePath, Link, useNavigate } from 'react-router-dom-v5-compat'
import { BulkActionModal, BulkActionModalProps } from '../../components/BulkActionModal'
import { RbacDropdown } from '../../components/Rbac'
import { Trans, useTranslation } from '../../lib/acm-i18next'
import AcmTimestamp from '../../lib/AcmTimestamp'
import { DOC_LINKS, ViewDocumentationLink } from '../../lib/doc-util'
import { rbacCreate, rbacDelete, rbacPatch, useIsAnyNamespaceAuthorized } from '../../lib/rbac-util'
import { getBackCancelLocationLinkProps, navigateToBackCancelLocation, NavigationPath } from '../../NavigationPath'
import {
    DiscoveryConfig,
    IResource,
    OCPAppResource,
    ProviderConnection,
} from '../../resources'
import { AccessControl, AccessControlDefinition } from '../../resources/access-control'
import { deleteResource, getISOStringTimestamp } from '../../resources/utils'
import {
    AcmButton,
    AcmEmptyState,
    AcmLabels,
    AcmTable,
    compareStrings,
    Provider,
    ProviderLongTextMap
} from '../../ui-components'
import { useAllClusters } from '../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'

const getProviderName = (labels: Record<string, string> | undefined) => {
    const label = labels?.['cluster.open-cluster-management.io/type']
    if (label) {
        const providerName = (ProviderLongTextMap as Record<string, string>)[label]
        if (providerName) return providerName
    }
    return 'unknown'
}

const AccessControlManagementTable = (props: {
    providerConnections?: ProviderConnection[]
    discoveryConfigs?: DiscoveryConfig[]
    accessControls?: AccessControl[]
}) => {
    const LABELS_LENGTH = 5
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [modalProps, setModalProps] = useState<BulkActionModalProps<AccessControl> | { open: false }>({
        open: false,
    })
    const unauthorizedMessage = t('rbac.unauthorized')
    const canAddAccessControl = useIsAnyNamespaceAuthorized(rbacCreate(AccessControlDefinition))

    function getAdditionalActions(item: AccessControl) {
        const label = item.metadata.labels?.['cluster.open-cluster-management.io/type']
        if (label === Provider.redhatcloud && !CredentialIsInUseByDiscovery(item)) {
            return t('Create cluster discovery')
        } else {
            return t('Configure cluster discovery')
        }
    }

    function CredentialIsInUseByDiscovery(credential: AccessControl) {
        let inUse = false
        if (props.discoveryConfigs) {
            props.discoveryConfigs.forEach((discoveryConfig) => {
                if (
                    discoveryConfig.metadata &&
                    discoveryConfig.spec.credential !== '' &&
                    credential.metadata &&
                    discoveryConfig.metadata.namespace === credential.metadata.namespace
                ) {
                    inUse = true
                    return
                }
            })
        }
        return inUse
    }

    const getAdditionalActionsText = (item: AccessControl) => {
        const label = item.metadata.labels?.['cluster.open-cluster-management.io/type']
        if (label === Provider.redhatcloud) {
            if (CredentialIsInUseByDiscovery(item)) {
                return t('Configure cluster discovery')
            } else {
                return t('Create cluster discovery')
            }
        } else {
            return '-'
        }
    }

    const managedClusters = useAllClusters(true)
    const filters = useMemo(
        () => [
            {
                id: 'cluster',
                label: t('Cluster'),
                options: Object.values(managedClusters)
                    .map((cluster) => ({
                        label: cluster.name,
                        value: cluster.name,
                    }))
                    .sort((lhs, rhs) => compareStrings(lhs.label, rhs.label)),
                // TODO: to properly filter
                tableFilterFn: (selectedValues: string[], item: IResource | OCPAppResource) => true,
            },
            {
                id: 'user',
                label: t('access.add.userGroup'),
                // TODO: to get users 
                options: [{
                    label: "user-x",
                    value: "user-x",
                }, {
                    label: "user-y",
                    value: "user-y",
                }, {
                    label: "user-z",
                    value: "user-z",
                }]
                    .sort((lhs, rhs) => compareStrings(lhs.label, rhs.label)),
                // TODO: to properly filter
                tableFilterFn: (selectedValues: string[], item: IResource | OCPAppResource) => true,
            },
            {
                id: 'role',
                label: t('Role'),
                // TODO: to get roles 
                options: [{
                    label: "role-x",
                    value: "role-x",
                }, {
                    label: "role-y",
                    value: "role-y",
                }, {
                    label: "role-z",
                    value: "role-z",
                }]
                    .sort((lhs, rhs) => compareStrings(lhs.label, rhs.label)),
                // TODO: to properly filter
                tableFilterFn: (selectedValues: string[], item: IResource | OCPAppResource) => true,
            },
        ],
        [t, managedClusters]
    )

    return (
        <Fragment>
            <BulkActionModal<AccessControl> {...modalProps} />
            <AcmTable<AccessControl>
                showExportButton
                exportFilePrefix="access-control-management"
                emptyState={
                    <AcmEmptyState
                        title={t(`You don't have any access control`)}
                        message={
                            <Trans
                                i18nKey="Click <bold>Add Access Control</bold> to create your resource."
                                components={{ bold: <strong /> }}
                            />
                        }
                        action={
                            <div>
                                <AcmButton
                                    isDisabled={!canAddAccessControl}
                                    tooltip={!canAddAccessControl ? unauthorizedMessage : ''}
                                    component={Link}
                                    {...getBackCancelLocationLinkProps(NavigationPath.addAccessControlManagement)}
                                >
                                    {t('Add Access Control')}
                                </AcmButton>
                                <ViewDocumentationLink doclink={DOC_LINKS.CREATE_CONNECTION} />
                            </div>
                        }
                    />
                }
                items={props.accessControls}
                filters={filters}
                columns={[
                    {
                        header: t('ID'),
                        sort: 'data.id',
                        search: 'data.id',
                        cell: (accessControl) => (
                            <span style={{ whiteSpace: 'nowrap' }}>
                                <Link
                                    to={generatePath(NavigationPath.viewAccessControlManagement, {
                                        id: accessControl.data?.id!,
                                    })}
                                >
                                    {accessControl.data?.id}
                                </Link>
                            </span>
                        ),
                        exportContent: (accessControl) => accessControl.data?.id!,
                    }, {
                        header: t('Clusters'),
                        sort: 'data.clusters',
                        search: 'data.clusters',
                        cell: (accessControl) => accessControl.data?.clusters ? (
                            <AcmLabels
                                labels={accessControl.data.clusters}
                                expandedText={t('Show less')}
                                collapsedText={t('show.more', { count: accessControl.data.clusters.length })}
                                // TODO: To properly translate 'count.items'
                                allCollapsedText={t('count.items', { count: accessControl.data.clusters.length })}
                                isCompact={accessControl.data.clusters.length > LABELS_LENGTH}
                            />
                        ) : '-',
                        exportContent: (accessControl) => accessControl.data?.clusters!,
                    }, {
                        header: t('Users/Groups'),
                        // TODO: users or groups
                        sort: 'data.users',
                        search: 'data.users',
                        cell: (accessControl) => accessControl.data?.users ? (
                            <AcmLabels
                                labels={accessControl.data.users}
                                expandedText={t('Show less')}
                                collapsedText={t('show.more', { count: accessControl.data.users.length })}
                                // TODO: To properly translate 'count.items'
                                allCollapsedText={t('count.items', { count: accessControl.data.users.length })}
                                isCompact={accessControl.data.users.length > LABELS_LENGTH}
                            />
                        ) : '-',
                        exportContent: (accessControl) => accessControl.data?.users!,
                    }, {
                        header: t('Roles'),
                        sort: 'data.roles',
                        search: 'data.roles',
                        cell: (accessControl) => accessControl.data?.roles ? (
                            <AcmLabels
                                labels={accessControl.data.roles}
                                expandedText={t('Show less')}
                                collapsedText={t('show.more', { count: accessControl.data.roles.length })}
                                // TODO: To properly translate 'count.items'
                                allCollapsedText={t('count.items', { count: accessControl.data.roles.length })}
                                isCompact={accessControl.data.roles.length > LABELS_LENGTH}
                            />
                        ) : '-',
                        exportContent: (accessControl) => accessControl.data?.roles!,
                    }, {
                        header: t('Namespaces'),
                        sort: 'data.namespaces',
                        search: 'data.namespaces',
                        cell: (accessControl) => accessControl.data?.namespaces ? (
                            <AcmLabels
                                labels={accessControl.data.namespaces}
                                expandedText={t('Show less')}
                                collapsedText={t('show.more', { count: accessControl.data.namespaces.length })}
                                // TODO: To properly translate 'count.items'
                                allCollapsedText={t('count.items', { count: accessControl.data.namespaces.length })}
                                isCompact={accessControl.data.namespaces.length > LABELS_LENGTH}
                            />
                        ) : '-',
                        exportContent: (accessControl) => accessControl.data?.namespaces!,
                    }, {
                        header: t('Status'),
                        sort: 'data.id',
                        search: 'data.id',
                        cell: (accessControl) => {
                            return <span style={{ whiteSpace: 'nowrap' }}>
                                {
                                    accessControl.data?.isActive ?
                                        <Label color="green" icon={<CheckCircleIcon />}>{t('Active')}</Label>
                                        : <Label color="red" icon={<TimesCircleIcon />}>{t('Disabled')}</Label>
                                }
                            </span>
                        },
                        exportContent: (accessControl) => accessControl.data?.isActive ? 'Active' : 'Disabled',
                    },
                    {
                        header: t('Created'),
                        sort: 'data.creationTimestamp',
                        cell: (resource) => (
                            <span style={{ whiteSpace: 'nowrap' }}>
                                <AcmTimestamp timestamp={resource.data?.creationTimestamp} />
                            </span>
                        ),
                        exportContent: (item: AccessControl) => {
                            if (item.data?.creationTimestamp) {
                                return getISOStringTimestamp(item.data?.creationTimestamp)
                            }
                        },
                    },
                    {
                        header: '',
                        cellTransforms: [fitContent],
                        cell: (accessControl: AccessControl) => {
                            const actions = [
                                {
                                    id: 'editConnection',
                                    text: t('Edit Access Control'),
                                    isAriaDisabled: true,
                                    click: (accessControl: AccessControl) => {
                                        navigate(
                                            generatePath(NavigationPath.editAccessControlManagement, {
                                                id: accessControl.data?.id!,
                                            })
                                        )
                                    },
                                    rbac: [rbacPatch(accessControl)], // validate that this is working
                                },
                                {
                                    id: 'deleteConnection',
                                    text: t('Delete Access Control'),
                                    isAriaDisabled: true,
                                    click: (accessControl: AccessControl) => {
                                        setModalProps({
                                            open: true,
                                            title: t('Permanently delete Access Control?'),
                                            action: t('Delete'),
                                            processing: t('Deleting'),
                                            items: [accessControl],
                                            emptyState: undefined, // there is always 1 item supplied
                                            description: t(
                                                'You cannot create new clusters from deleted Access Control. Clusters that you previously created will not be affected.'
                                            ),
                                            columns: [
                                                {
                                                    header: t('ID'),
                                                    cell: 'data.id',
                                                    sort: 'data.id',
                                                },
                                            ],
                                            keyFn: (accessControl: AccessControl) => accessControl.data?.id as string,
                                            actionFn: deleteResource,
                                            close: () => setModalProps({ open: false }),
                                            isDanger: true,
                                            icon: 'warning',
                                        })
                                    },
                                    rbac: [rbacDelete(accessControl)],
                                },
                            ]

                            return (
                                <RbacDropdown<AccessControl>
                                    id={`${accessControl.metadata.name}-actions`}
                                    item={accessControl}
                                    isKebab={true}
                                    text={t('Actions')}
                                    actions={actions}
                                />
                            )
                        },
                    },
                ]}
                keyFn={(accessControl) => {
                    console.log("KIKE keyFn", accessControl)
                    return accessControl.data?.id as string
                }}
                tableActionButtons={[
                    {
                        id: 'add',
                        title: t('Add Access Control'),
                        click: () => {
                            navigateToBackCancelLocation(navigate, NavigationPath.addAccessControlManagement)
                        },
                        variant: ButtonVariant.primary,
                        isDisabled: !canAddAccessControl,
                        tooltip: !canAddAccessControl ? unauthorizedMessage : '',
                    },
                ]}
                tableActions={[
                    {
                        id: 'deleteConnection',
                        title: t('Delete Access Controls'),
                        click: (accessControls: AccessControl[]) => {
                            setModalProps({
                                open: true,
                                title: t('Permanently delete Access Controls?'),
                                action: t('Delete'),
                                processing: t('Deleting'),
                                items: [...accessControls],
                                emptyState: undefined, // table action is only enabled when items are selected
                                description: t(
                                    'You cannot create new clusters from deleted Access Controls. Clusters that you previously created will not be affected.'
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
                                keyFn: (accessControl: AccessControl) => accessControl.metadata.uid as string,
                                actionFn: deleteResource,
                                close: () => setModalProps({ open: false }),
                                isDanger: true,
                            })
                        },
                        variant: 'bulk-action',
                    },
                ]}
                rowActions={[]}
            />
        </Fragment>
    )
}

export { AccessControlManagementTable }
