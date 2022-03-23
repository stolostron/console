/* Copyright Contributors to the Open Cluster Management project */
import {
    AcmButton,
    AcmEmptyState,
    AcmInlineProvider,
    AcmPage,
    AcmPageContent,
    AcmPageHeader,
    AcmRoute,
    AcmTable,
    compareStrings,
    Provider,
    ProviderLongTextMap,
} from '@stolostron/ui-components'
import { ButtonVariant, PageSection, TextContent } from '@patternfly/react-core'
import { fitContent } from '@patternfly/react-table'
import moment from 'moment'
import { Fragment, useEffect, useState } from 'react'
import { Trans, useTranslation } from '../../lib/acm-i18next'
import { Link, useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { acmRouteState, discoveryConfigState, secretsState } from '../../atoms'
import { BulkActionModel, IBulkActionModelProps } from '../../components/BulkActionModel'
import { RbacDropdown } from '../../components/Rbac'
import { rbacDelete, rbacPatch } from '../../lib/rbac-util'
import { NavigationPath } from '../../NavigationPath'
import { deleteResource, DiscoveryConfig, ProviderConnection, Secret, unpackProviderConnection } from '../../resources'
import { DOC_LINKS, viewDocumentation } from '../../lib/doc-util'

export default function CredentialsPage() {
    const { t } = useTranslation()
    const [secrets] = useRecoilState(secretsState)
    const providerConnections = secrets.map(unpackProviderConnection)
    const [discoveryConfigs] = useRecoilState(discoveryConfigState)
    const [, setRoute] = useRecoilState(acmRouteState)
    useEffect(() => setRoute(AcmRoute.Credentials), [setRoute])
    return (
        <AcmPage header={<AcmPageHeader title={t('Credentials')} />}>
            <AcmPageContent id="credentials">
                <PageSection>
                    <CredentialsTable
                        providerConnections={providerConnections}
                        discoveryConfigs={discoveryConfigs}
                        secrets={secrets}
                    />
                </PageSection>
            </AcmPageContent>
        </AcmPage>
    )
}

// Ingoring coverage since this will move one the console header navigation is done
/* istanbul ignore next */
const AddConnectionBtn = () => {
    const { t } = useTranslation()
    return (
        <div>
            <AcmButton component={Link} to={NavigationPath.addCredentials}>
                {t('Add credential')}
            </AcmButton>
            <TextContent>{viewDocumentation(DOC_LINKS.CREATE_CONNECTION, t)}</TextContent>
        </div>
    )
}

function getProviderName(labels: Record<string, string> | undefined) {
    const label = labels?.['cluster.open-cluster-management.io/type']
    if (label) {
        const providerName = (ProviderLongTextMap as Record<string, string>)[label]
        if (providerName) return providerName
    }
    return 'unknown'
}

export function CredentialsTable(props: {
    providerConnections?: ProviderConnection[]
    discoveryConfigs?: DiscoveryConfig[]
    secrets?: Secret[]
}) {
    const { t } = useTranslation()
    const history = useHistory()
    const [modalProps, setModalProps] = useState<IBulkActionModelProps<Secret> | { open: false }>({
        open: false,
    })

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

    return (
        <Fragment>
            <BulkActionModel<Secret> {...modalProps} />
            <AcmTable<Secret>
                emptyState={
                    <AcmEmptyState
                        title={t(`You don't have any credentials`)}
                        message={
                            <Trans
                                i18nKey="Click <bold>Add credential</bold> to create your resource."
                                components={{ bold: <strong /> }}
                            />
                        }
                        action={<AddConnectionBtn />}
                    />
                }
                plural={t('Credentials')}
                items={props.secrets}
                columns={[
                    {
                        header: t('Name'),
                        sort: 'metadata.name',
                        search: 'metadata.name',
                        cell: (secret) => (
                            <span style={{ whiteSpace: 'nowrap' }}>
                                <Link
                                    to={NavigationPath.viewCredentials
                                        .replace(':namespace', secret.metadata.namespace as string)
                                        .replace(':name', secret.metadata.name as string)}
                                >
                                    {secret.metadata.name}
                                </Link>
                            </span>
                        ),
                    },
                    {
                        header: t('Credential type'),
                        sort: /* istanbul ignore next */ (a: Secret, b: Secret) => {
                            return compareStrings(
                                getProviderName(a.metadata?.labels),
                                getProviderName(b.metadata?.labels)
                            )
                        },
                        cell: (item: Secret) => {
                            const provider = item.metadata.labels?.['cluster.open-cluster-management.io/type']
                            if (provider) return <AcmInlineProvider provider={provider as Provider} />
                            else return <Fragment />
                        },
                        search: (item: Secret) => {
                            return getProviderName(item.metadata?.labels)
                        },
                    },
                    {
                        header: t('Namespace'),
                        sort: 'metadata.namespace',
                        search: 'metadata.namespace',
                        cell: 'metadata.namespace',
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
                                    return (
                                        <Link to={NavigationPath.configureDiscovery}>
                                            {t('Configure cluster discovery')}
                                        </Link>
                                    )
                                } else {
                                    return (
                                        <Link to={NavigationPath.createDiscovery}>{t('Create cluster discovery')}</Link>
                                    )
                                }
                            } else {
                                return <span>-</span>
                            }
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
                                {resource.metadata.creationTimestamp &&
                                    moment(new Date(resource.metadata.creationTimestamp)).fromNow()}
                            </span>
                        ),
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
                                        history.push(
                                            NavigationPath.editCredentials
                                                .replace(':namespace', secret.metadata.namespace!)
                                                .replace(':name', secret.metadata.name!)
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
                                            title: t('Permanently delete credentials?'),
                                            action: t('Delete'),
                                            processing: t('Deleting'),
                                            resources: [secret],
                                            description: t(
                                                'You cannot create new clusters from deleted credentials. Clusters that you previously created will not be affected.'
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
                                    text={`${secret.metadata.name}-actions`}
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
                        title: t('Add credential'),
                        click: () => {
                            history.push(NavigationPath.addCredentials)
                        },
                        variant: ButtonVariant.primary,
                    },
                ]}
                tableActions={[
                    {
                        id: 'deleteConnection',
                        title: t('Delete credentials'),
                        click: (secrets: Secret[]) => {
                            setModalProps({
                                open: true,
                                title: t('Permanently delete credentials?'),
                                action: t('Delete'),
                                processing: t('Deleting'),
                                resources: [...secrets],
                                description: t(
                                    'You cannot create new clusters from deleted credentials. Clusters that you previously created will not be affected.'
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
                        variant: 'bulk-action',
                    },
                ]}
                rowActions={[]}
            />
        </Fragment>
    )
}
