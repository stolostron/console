/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmAlertContext,
    AcmButton,
    AcmForm,
    AcmFormSection,
    AcmLoadingPage,
    AcmMultiSelect,
    AcmPage,
    AcmPageContent,
    AcmPageHeader,
    AcmSelect,
    AcmSubmit,
} from '@open-cluster-management/ui-components'
import {
    ActionGroup,
    ButtonVariant,
    PageSection,
    SelectOption,
    Text,
    TextVariants,
    Divider,
} from '@patternfly/react-core'
import { deleteResource } from '../../../lib/resource-request'
import { useContext, useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, RouteComponentProps, useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { discoveryConfigState } from '../../../atoms'
import { ErrorPage } from '../../../components/ErrorPage'
import { ProviderID } from '../../../lib/providers'
import { NavigationPath } from '../../../NavigationPath'
import { getErrorInfo } from '../../../components/ErrorPage'
import { ConfirmModal, IConfirmModalProps } from '../../../components/ConfirmModal'
import {
    createDiscoveryConfig,
    DiscoveryConfig,
    DiscoveryConfigApiVersion,
    DiscoveryConfigKind,
    getDiscoveryConfig,
    replaceDiscoveryConfig,
} from '../../../resources/discovery-config'
import { listProviderConnections, ProviderConnection } from '../../../resources/provider-connection'
import discoveryVersions from '../../../components/discoveryVersions.json'

export default function DiscoveryConfigPage({ match }: RouteComponentProps<{ namespace: string; name: string }>) {
    const { t } = useTranslation(['discovery'])
    return (
        <AcmPage>
            {match?.params.namespace ? (
                <AcmPageHeader
                    title={t('editDiscoveryConfig.title')}
                    breadcrumb={[
                        { text: t('discoveredClusters'), to: NavigationPath.discoveredClusters },
                        { text: t('editDiscoveryConfig.title'), to: '' },
                    ]}
                />
            ) : (
                <AcmPageHeader
                    title={t('addDiscoveryConfig.title')}
                    breadcrumb={[
                        { text: t('discoveredClusters'), to: NavigationPath.discoveredClusters },
                        { text: t('addDiscoveryConfig.title'), to: '' },
                    ]}
                />
            )}
            <AcmPageContent id="discoveryConfig">
                <PageSection variant="light" isFilled>
                    <AddDiscoveryConfigData namespace={match?.params.namespace} name={match?.params.name} />
                </PageSection>
            </AcmPageContent>
        </AcmPage>
    )
}

export function AddDiscoveryConfigData(props: { namespace: string; name: string }) {
    const { t } = useTranslation(['discovery', 'common'])
    const [error, setError] = useState<Error>()
    const [retry, setRetry] = useState(0)
    const [discoveryConfigs] = useRecoilState(discoveryConfigState)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [credentials, setCredentials] = useState<ProviderConnection[]>([])
    const [discoveryNamespaces, setDiscoveryNamespaces] = useState<string[]>([])

    const [discoveryConfig, setDiscoveryConfig] = useState<DiscoveryConfig>({
        apiVersion: DiscoveryConfigApiVersion,
        kind: DiscoveryConfigKind,
        metadata: {
            name: '',
            namespace: '',
        },
        spec: {
            filters: {
                lastActive: 7,
            },
            credential: '',
        },
    })

    // Used to filter out Credentials which already have a corresponding DiscoveryConfig
    useEffect(() => {
        const namespaces: string[] = []
        discoveryConfigs.forEach((discoveryConfig) => {
            if (discoveryConfig.metadata.namespace) {
                namespaces.push(discoveryConfig.metadata.namespace)
            }
        })
        setDiscoveryNamespaces(namespaces)
    }, [discoveryConfigs])

    // Retrieves set of Credentials
    // If editing a DiscoveryConfig, only show existing CRH Credentials in that namespace
    // If adding a DiscoveryConfig, only show all CRH credentials across all namespaces which are not configured with a DiscoveryConfig.
    useEffect(() => {
        setIsLoading(true)
        const credentialsResult = listProviderConnections().promise
        credentialsResult
            .then((credentials) => {
                const CRHCredentials: ProviderConnection[] = []
                credentials.forEach((credential) => {
                    const labels = credential.metadata.labels!['cluster.open-cluster-management.io/provider']
                    if (labels === ProviderID.RHOCM) {
                        if (
                            !props.namespace &&
                            credential.metadata.namespace &&
                            !discoveryNamespaces.includes(credential.metadata.namespace)
                        ) {
                            // If no namespace is set, and discovery is not configured in namespace, add all credentials
                            CRHCredentials.push(credential)
                        } else if (credential.metadata.namespace === props.namespace) {
                            // else, only retrieve credentials in the namespace of the discoveryconfig
                            CRHCredentials.push(credential)
                        }
                    }
                })
                setCredentials(CRHCredentials)
                setIsLoading(false)
            })
            .catch((err) => {
                setError(err)
            })
    }, [props.namespace, discoveryNamespaces])

    // Get Discovery Config if it editing
    useEffect(() => {
        setIsLoading(true)
        if (props.name) {
            const result = getDiscoveryConfig(props)
            result.promise
                .then((discoveryConfig) => {
                    setDiscoveryConfig(discoveryConfig)
                })
                .catch((err) => {
                    setError(err)
                })
                .finally(() => setIsLoading(false))
            return result.abort
        } else {
            return
        }
    }, [props])

    if (error) {
        return (
            <ErrorPage
                error={error}
                actions={
                    <AcmButton
                        onClick={() => {
                            setRetry(retry + 1)
                        }}
                    >
                        {t('common:retry')}
                    </AcmButton>
                }
            />
        )
    }
    if (isLoading) {
        return <AcmLoadingPage />
    }

    return <DiscoveryConfigPageContent discoveryConfig={discoveryConfig} credentials={credentials} />
}

export function DiscoveryConfigPageContent(props: {
    discoveryConfig: DiscoveryConfig
    credentials: ProviderConnection[]
}) {
    const [discoveryConfig, setDiscoveryConfig] = useState<DiscoveryConfig>(props.discoveryConfig)
    const alertContext = useContext(AcmAlertContext)
    const { t } = useTranslation(['discovery', 'common'])
    const history = useHistory()
    const [editing, setEditing] = useState<boolean>(false)

    const [modalProps, setModalProps] = useState<IConfirmModalProps>({
        open: false,
        confirm: () => {},
        cancel: () => {},
        title: '',
        message: '',
    })

    type LastActive = { day: number; stringDay: string; value: string }
    const lastActive: LastActive[] = [
        { day: 1, stringDay: '1 day', value: '1d' },
        { day: 2, stringDay: '2 days', value: '2d' },
        { day: 3, stringDay: '3 days', value: '3d' },
        { day: 7, stringDay: '7 days', value: '7d' },
        { day: 14, stringDay: '14 days', value: '14d' },
        { day: 21, stringDay: '21 days', value: '21d' },
        { day: 30, stringDay: '30 days', value: '30d' },
    ]

    useEffect(() => {
        if (props.discoveryConfig.metadata.name !== '') {
            setDiscoveryConfig(props.discoveryConfig)
            setEditing(true)
        }
    }, [props.discoveryConfig])

    function updateDiscoveryConfig(update: (discoveryConfig: DiscoveryConfig) => void) {
        const copy = { ...discoveryConfig }
        update(copy)
        setDiscoveryConfig(copy)
    }

    const deleteDiscoveryConfig = async () => {
        setModalProps({
            open: true,
            title: t('disable.title'),
            confirm: async () => {
                try {
                    if (discoveryConfig) {
                        await deleteResource(discoveryConfig)
                        setModalProps({
                            open: false,
                            confirm: () => {},
                            cancel: () => {},
                            title: '',
                            message: '',
                        })
                        history.push(NavigationPath.discoveredClusters)
                    } else {
                        throw Error('Error retrieving discoveryconfigs')
                    }
                } catch (err) {
                    alertContext.addAlert(getErrorInfo(err)) //TODO: not currently displaying within modal
                }
            },
            confirmText: t('discoveryConfig.delete.btn'),
            message: (
                <Trans
                    i18nKey={'discovery:discoveryConfig.delete.message'}
                    components={{ bold: <strong /> }}
                    values={{ discoveryConfigName: discoveryConfig.metadata.name }}
                />
            ),
            isDanger: true,
            cancel: () => {
                setModalProps({
                    open: false,
                    confirm: () => {},
                    cancel: () => {},
                    title: '',
                    message: '',
                })
            },
        })
    }

    const onSubmit = async () => {
        alertContext.clearAlerts()
        return new Promise(async (resolve, reject) => {
            try {
                if (!editing) {
                    discoveryConfig.metadata.name = 'discovery'
                    await createDiscoveryConfig(discoveryConfig).promise
                } else {
                    await replaceDiscoveryConfig(discoveryConfig).promise
                }
                resolve(undefined)
                history.push(NavigationPath.discoveredClusters)
            } catch (err) {
                if (err instanceof Error) {
                    alertContext.addAlert({
                        type: 'danger',
                        title: t('common:request.failed'),
                        message: err.message,
                    })
                    reject()
                }
            }
        })
    }

    return (
        <AcmForm>
            <ConfirmModal {...modalProps} />
            <AcmFormSection title={t('discoveryConfig.filterform.header')}></AcmFormSection>
            <Text component={TextVariants.h3}>{t('discoveryConfig.filterform.subheader')}</Text>
            <AcmSelect
                id="lastActiveFilter"
                label={t('discoveryConfig.lastActiveFilter.label')}
                labelHelp={t('discoveryConfig.lastActiveFilter.labelHelp')}
                value={getDiscoveryConfigLastActive(discoveryConfig)}
                onChange={(lastActive) => {
                    updateDiscoveryConfig((discoveryConfig) => {
                        if (lastActive) {
                            if (!discoveryConfig.spec.filters) {
                                discoveryConfig.spec.filters = {}
                            }
                            discoveryConfig.spec.filters.lastActive = parseInt(
                                lastActive.substring(0, lastActive.length - 1)
                            )
                        }
                    })
                }}
                isRequired
            >
                {lastActive.map((e, i) => (
                    <SelectOption key={e.day} value={e.value}>
                        {e.stringDay}
                    </SelectOption>
                ))}
            </AcmSelect>
            <AcmMultiSelect
                id="discoveryVersions"
                label={t('discoveryConfig.discoveryVersions.label')}
                labelHelp={t('discoveryConfig.discoveryVersions.labelHelp')}
                value={discoveryConfig.spec?.filters?.openShiftVersions}
                onChange={(versions) => {
                    updateDiscoveryConfig((discoveryConfig) => {
                        if (!discoveryConfig.spec.filters) {
                            discoveryConfig.spec.filters = {}
                        }
                        discoveryConfig.spec.filters.openShiftVersions = versions
                    })
                }}
                isRequired
            >
                {discoveryVersions.map((version) => (
                    <SelectOption key={version} value={version}>
                        {version}
                    </SelectOption>
                ))}
            </AcmMultiSelect>
            <AcmFormSection title={t('discoveryConfig.connections.header')}></AcmFormSection>
            <Text component={TextVariants.h3}>{t('discoveryConfig.connections.subheader')}</Text>
            <AcmSelect
                id="credentials"
                label={t('discoveryConfig.connections.label')}
                labelHelp={t('discoveryConfig.connections.labelHelp')}
                value={getDiscoveryConfigCredential(discoveryConfig)}
                onChange={(credential) => {
                    updateDiscoveryConfig((discoveryConfig) => {
                        if (credential) {
                            const metadata = credential.split('/', 2)
                            discoveryConfig.metadata.namespace = metadata[0]
                            discoveryConfig.spec.credential = metadata[1]
                        }
                    })
                }}
                isRequired
            >
                {props.credentials?.map((credential) => (
                    <SelectOption
                        key={credential.metadata.namespace + '/' + credential.metadata.name}
                        value={credential.metadata.namespace + '/' + credential.metadata.name}
                    >
                        {credential.metadata.namespace + '/' + credential.metadata.name}
                    </SelectOption>
                ))}
            </AcmSelect>
            <ActionGroup>
                <AcmSubmit id="applyDiscoveryConfig" onClick={onSubmit} variant={ButtonVariant.primary}>
                    {!editing ? t('discoveryConfig.add') : t('discoveryConfig.edit')}
                </AcmSubmit>
                <Link to={NavigationPath.discoveredClusters} id="cancelDiscoveryConfig">
                    <AcmButton variant={ButtonVariant.link}>{t('discoveryConfig.cancel')}</AcmButton>
                </Link>
                {editing ? <Divider isVertical /> : null}
                {editing ? (
                    <AcmButton
                        style={{ marginLeft: '16px' }}
                        id="deleteDiscoveryConfig"
                        onClick={deleteDiscoveryConfig}
                        variant={ButtonVariant.danger}
                    >
                        {t('discoveryConfig.delete')}
                    </AcmButton>
                ) : null}
            </ActionGroup>
        </AcmForm>
    )
}

export function getDiscoveryConfigLastActive(discoveryConfig: Partial<DiscoveryConfig>) {
    const lastActive = discoveryConfig.spec?.filters?.lastActive || undefined
    if (lastActive === undefined) {
        return '7d'
    }
    return lastActive.toString().concat('d')
}

export function getDiscoveryConfigCredential(discoveryConfig: Partial<DiscoveryConfig>) {
    const credential = discoveryConfig.spec?.credential
    if (credential !== '' && discoveryConfig.metadata) {
        return discoveryConfig.metadata.namespace + '/' + credential
    }
    return ''
}
