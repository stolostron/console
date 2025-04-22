/* Copyright Contributors to the Open Cluster Management project */
import { ButtonVariant } from '@patternfly/react-core'
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
    Secret,
    SecretDefinition
} from '../../resources'
import { deleteResource, getISOStringTimestamp } from '../../resources/utils'
import {
    AcmButton,
    AcmEmptyState,
    AcmInlineProvider,
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
    secrets?: Secret[]
}) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [modalProps, setModalProps] = useState<BulkActionModalProps<Secret> | { open: false }>({
        open: false,
    })
    const unauthorizedMessage = t('rbac.unauthorized')
    const canAddCredential = useIsAnyNamespaceAuthorized(rbacCreate(SecretDefinition))

    sessionStorage.removeItem('DiscoveryCredential')

    function getAdditionalActions(item: Secret) {
        const label = item.metadata.labels?.['cluster.open-cluster-management.io/type']
        if (label === Provider.redhatcloud && !CredentialIsInUseByDiscovery(item)) {
            return t('Create cluster discovery')
        } else {
            return t('Configure cluster discovery')
        }
    }

    function CredentialIsInUseByDiscovery(credential: Secret) {
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

    const getAdditionalActionsText = (item: Secret) => {
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
            <BulkActionModal<Secret> {...modalProps} />
            <AcmTable<Secret>
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
                                    isDisabled={!canAddCredential}
                                    tooltip={!canAddCredential ? unauthorizedMessage : ''}
                                    component={Link}
                                    {...getBackCancelLocationLinkProps(NavigationPath.addCredentials)}
                                >
                                    {t('Add Access Control')}
                                </AcmButton>
                                <ViewDocumentationLink doclink={DOC_LINKS.CREATE_CONNECTION} />
                            </div>
                        }
                    />
                }
                items={props.secrets}
                filters={filters}
                columns={[
                    {
                        header: t('Name'),
                        sort: 'metadata.name',
                        search: 'metadata.name',
                        cell: (secret) => (
                            <span style={{ whiteSpace: 'nowrap' }}>
                                <Link
                                    to={generatePath(NavigationPath.viewCredentials, {
                                        namespace: secret.metadata.namespace!,
                                        name: secret.metadata.name!,
                                    })}
                                >
                                    {secret.metadata.name}
                                </Link>
                            </span>
                        ),
                        exportContent: (secret) => secret.metadata.name,
                    },
                    {
                        header: t('Credential type'),
                        sort: /* istanbul ignore next */ (a: Secret, b: Secret) => {
                            return compareStrings(getProviderName(a.metadata?.labels), getProviderName(b.metadata?.labels))
                        },
                        cell: (item: Secret) => {
                            const provider = item.metadata.labels?.['cluster.open-cluster-management.io/type']
                            if (provider) return <AcmInlineProvider provider={provider as Provider} />
                            else return <Fragment />
                        },
                        search: (item: Secret) => {
                            return getProviderName(item.metadata?.labels)
                        },
                        exportContent: (item: Secret) => {
                            return getProviderName(item.metadata.labels)
                        },
                    },
                    {
                        header: t('Namespace'),
                        sort: 'metadata.namespace',
                        search: 'metadata.namespace',
                        cell: 'metadata.namespace',
                        exportContent: (item: Secret) => {
                            return item.metadata.namespace
                        },
                    },
                    {
                        header: t('Additional actions'),
                        search: (item: Secret) => {
                            return getAdditionalActions(item)
                        },
                        cell: (item: Secret) => {
                            const label = item.metadata.labels?.['cluster.open-cluster-management.io/type']
                            if (label === Provider.redhatcloud) {
                                if (CredentialIsInUseByDiscovery(item)) {
                                    return <Link to={NavigationPath.configureDiscovery}>{t('Configure cluster discovery')}</Link>
                                } else {
                                    return <Link to={NavigationPath.createDiscovery}>{t('Create cluster discovery')}</Link>
                                }
                            } else {
                                return <span>-</span>
                            }
                        },
                        exportContent: (item: Secret) => {
                            return getAdditionalActionsText(item)
                        },
                        sort: /* istanbul ignore next */ (a: Secret, b: Secret) => {
                            return compareStrings(getAdditionalActions(a), getAdditionalActions(b))
                        },
                    },
                    {
                        header: t('Created'),
                        sort: 'metadata.creationTimestamp',
                        cell: (resource) => (
                            <span style={{ whiteSpace: 'nowrap' }}>
                                <AcmTimestamp timestamp={resource.metadata?.creationTimestamp} />
                            </span>
                        ),
                        exportContent: (item: Secret) => {
                            if (item.metadata.creationTimestamp) {
                                return getISOStringTimestamp(item.metadata.creationTimestamp)
                            }
                        },
                    },
                    {
                        header: '',
                        cellTransforms: [fitContent],
                        cell: (secret: Secret) => {
                            const actions = [
                                {
                                    id: 'editConnection',
                                    text: t('Edit credential'),
                                    isAriaDisabled: true,
                                    click: (secret: Secret) => {
                                        navigate(
                                            generatePath(NavigationPath.editCredentials, {
                                                namespace: secret.metadata.namespace!,
                                                name: secret.metadata.name!,
                                            })
                                        )
                                    },
                                    rbac: [rbacPatch(secret)], // validate that this is working
                                },
                                {
                                    id: 'deleteConnection',
                                    text: t('Delete credential'),
                                    isAriaDisabled: true,
                                    click: (secret: Secret) => {
                                        setModalProps({
                                            open: true,
                                            title: t('Permanently delete Access Control?'),
                                            action: t('Delete'),
                                            processing: t('Deleting'),
                                            items: [secret],
                                            emptyState: undefined, // there is always 1 item supplied
                                            description: t(
                                                'You cannot create new clusters from deleted Access Control. Clusters that you previously created will not be affected.'
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
                                            keyFn: (secret: Secret) => secret.metadata.uid as string,
                                            actionFn: deleteResource,
                                            close: () => setModalProps({ open: false }),
                                            isDanger: true,
                                            icon: 'warning',
                                        })
                                    },
                                    rbac: [rbacDelete(secret)],
                                },
                            ]

                            return (
                                <RbacDropdown<Secret>
                                    id={`${secret.metadata.name}-actions`}
                                    item={secret}
                                    isKebab={true}
                                    text={t('Actions')}
                                    actions={actions}
                                />
                            )
                        },
                    },
                ]}
                keyFn={(secret) => secret.metadata?.uid as string}
                tableActionButtons={[
                    {
                        id: 'add',
                        title: t('Add Access Control'),
                        click: () => {
                            navigateToBackCancelLocation(navigate, NavigationPath.addCredentials)
                        },
                        variant: ButtonVariant.primary,
                        isDisabled: !canAddCredential,
                        tooltip: !canAddCredential ? unauthorizedMessage : '',
                    },
                ]}
                tableActions={[
                    {
                        id: 'deleteConnection',
                        title: t('Delete Access Controls'),
                        click: (secrets: Secret[]) => {
                            setModalProps({
                                open: true,
                                title: t('Permanently delete Access Controls?'),
                                action: t('Delete'),
                                processing: t('Deleting'),
                                items: [...secrets],
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
                                keyFn: (secret: Secret) => secret.metadata.uid as string,
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
