import React, { useContext, useEffect, useState } from 'react'
import {
    AcmAlertContext,
    AcmAlertProvider,
    AcmSubmit,
    AcmButton,
    AcmForm,
    AcmLoadingPage,
    AcmPageCard,
    AcmPageHeader,
    AcmSelect,
    AcmFormSection,
    AcmMultiSelect,
} from '@open-cluster-management/ui-components'
import { useQuery } from '../../../lib/useQuery'
import { getErrorInfo } from '../../../components/ErrorPage'
import { Page, SelectOption, Text, TextVariants, ButtonVariant, ActionGroup } from '@patternfly/react-core'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { ErrorPage } from '../../../components/ErrorPage'
import { NavigationPath } from '../../../NavigationPath'
import { Link } from 'react-router-dom'
import { ResourceErrorCode } from '../../../lib/resource-request'

import { listMultiClusterHubs } from '../../../resources/multi-cluster-hub'

import { listProviderConnections, ProviderConnection } from '../../../resources/provider-connection'
import {
    createDiscoveryConfig,
    replaceDiscoveryConfig,
    DiscoveryConfig,
    DiscoveryConfigApiVersion,
    DiscoveryConfigKind,
    getDiscoveryConfig,
} from '../../../resources/discovery-config'

export default function DiscoveryConfigPage() {
    const { t } = useTranslation(['cluster'])
    return (
        <AcmAlertProvider>
            <Page>
                <AcmPageHeader
                    title={t('discoveryConfig.title')}
                    breadcrumb={[{ text: t('clusters'), to: NavigationPath.clusters }]}
                />
                <AddDiscoveryConfigData />
            </Page>
        </AcmAlertProvider>
    )
}

export function AddDiscoveryConfigData() {
    const { t } = useTranslation(['cluster', 'common'])
    const [error, setError] = useState<Error>()
    const [retry, setRetry] = useState(0)
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const [discoveryConfig, setDiscoveryConfig] = useState<DiscoveryConfig>({
        apiVersion: DiscoveryConfigApiVersion,
        kind: DiscoveryConfigKind,
        metadata: {
            name: '',
            namespace: '',
        },
        spec: {
            filters: {
                lastActive: 0,
            },
            providerConnections: [],
        },
    })

    // Get MCH Namespace
    useEffect(() => {
        if (!discoveryConfig.metadata.namespace) {
            setIsLoading(true)
            const result = listMultiClusterHubs()
            result.promise
                .then((mch) => {
                    // only one mch can exist
                    if (mch.length === 1) {
                        discoveryConfig.metadata.namespace = mch[0].metadata.namespace
                    } else {
                        setError(Error('Only 1 MulticlusterHub resource may exist'))
                    }
                })
                .catch((err) => {
                    setError(err)
                })
                .finally(() => setIsLoading(false))
            return result.abort
        }
    }, [discoveryConfig])

    // Get Discovery Config if it exists
    useEffect(() => {
        if (discoveryConfig.metadata.namespace) {
            setIsLoading(true)
            const result = getDiscoveryConfig(discoveryConfig.metadata.namespace)
            result.promise
                .then((discoveryConfig) => {
                    setDiscoveryConfig(discoveryConfig)
                })
                .catch((err) => {
                    if (err.code !== ResourceErrorCode.NotFound) {
                        setError(err)
                    }
                })
                .finally(() => setIsLoading(false))
            return result.abort
        }
    }, [discoveryConfig.metadata.namespace])

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

    return <DiscoveryConfigPageContent discoveryConfig={discoveryConfig} />
}

let lastData: ProviderConnection[] | undefined
let lastTime: number = 0

export function DiscoveryConfigPageContent(props: { discoveryConfig: DiscoveryConfig }) {
    const [discoveryConfig, setDiscoveryConfig] = useState<DiscoveryConfig>(
        JSON.parse(JSON.stringify(props.discoveryConfig))
    )
    const alertContext = useContext(AcmAlertContext)
    const { t } = useTranslation(['cluster'])
    const history = useHistory()
    const [submitted, setSubmitted] = useState<boolean>(false)
    const [, setLoading] = useState<boolean>(false)
    const [, setError] = useState<string | undefined>()
    const [editing, setEditing] = useState<boolean>(false)

    const supportedVersions = ['4.5', '4.6', '4.7', '4.8']

    type LastActive = { day: number; stringDay: string; value: string }
    let lastActive: LastActive[]
    lastActive = []
    lastActive.push(
        { day: 1, stringDay: '1 day', value: '1d' },
        { day: 2, stringDay: '2 days', value: '2d' },
        { day: 3, stringDay: '3 days', value: '3d' },
        { day: 7, stringDay: '7 days', value: '7d' },
        { day: 14, stringDay: '14 days', value: '14d' },
        { day: 21, stringDay: '21 days', value: '21d' },
        { day: 30, stringDay: '30 days', value: '30d' }
    )

    useEffect(() => {
        if (props.discoveryConfig.metadata.name !== '') {
            setDiscoveryConfig(props.discoveryConfig)
            setEditing(true)
        }
    }, [props.discoveryConfig])

    const { error, data, startPolling } = useQuery(
        listProviderConnections,
        Date.now() - lastTime < 5 * 60 * 1000 ? lastData : undefined
    )

    useEffect(() => {
        if (process.env.NODE_ENV !== 'test') {
            lastData = data
            lastTime = Date.now()
        }
    }, [data])

    useEffect(startPolling, [startPolling])

    useEffect(() => {
        alertContext.clearAlerts()
        if (error) {
            alertContext.addAlert(getErrorInfo(error))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error])

    function updateDiscoveryConfig(update: (discoveryConfig: DiscoveryConfig) => void) {
        const copy = { ...discoveryConfig }
        update(copy)
        setDiscoveryConfig(copy)
    }

    const onSubmit = async () => {
        setSubmitted(true)
        setError(undefined)
        return new Promise(async (resolve, reject) => {
            try {
                if (!editing) {
                    discoveryConfig.metadata.name = 'discovery'
                    await createDiscoveryConfig(discoveryConfig).promise
                } else {
                    await replaceDiscoveryConfig(discoveryConfig).promise
                }
            } catch (err) {
                setError(err.message)
                setSubmitted(false)
                reject()
            } finally {
                setLoading(false)
                resolve(undefined)
                history.push(NavigationPath.discoveredClusters)
            }
        })
    }

    return (
        <AcmPageCard>
            <AcmForm>
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
                    isDisabled={submitted}
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
                    isDisabled={submitted}
                    isRequired
                >
                    {supportedVersions.map((version) => (
                        <SelectOption key={version} value={version}>
                            {version}
                        </SelectOption>
                    ))}
                </AcmMultiSelect>
                <AcmFormSection title={t('discoveryConfig.connections.header')}></AcmFormSection>
                <Text component={TextVariants.h3}>{t('discoveryConfig.connections.subheader')}</Text>
                <AcmSelect
                    id="providerConnections"
                    label={t('discoveryConfig.connections.label')}
                    labelHelp={t('discoveryConfig.connections.labelHelp')}
                    value={getDiscoveryConfigProviderConnection(discoveryConfig)}
                    onChange={(providerConnection) => {
                        updateDiscoveryConfig((discoveryConfig) => {
                            if (providerConnection) {
                                discoveryConfig.spec.providerConnections = []
                                discoveryConfig.spec.providerConnections.push(providerConnection)
                            }
                        })
                    }}
                    isDisabled={submitted}
                    isRequired
                >
                    {data?.map((providerConnection) => (
                        <SelectOption key={providerConnection.metadata.name} value={providerConnection.metadata.name}>
                            {providerConnection.metadata.name}
                        </SelectOption>
                    ))}
                </AcmSelect>

                <ActionGroup>
                    <AcmSubmit
                        id="applyDiscoveryConfig"
                        onClick={onSubmit}
                        variant={ButtonVariant.primary}
                        isDisabled={submitted}
                    >
                        {t('discoveryConfig.enable')}
                    </AcmSubmit>
                    <Link to={NavigationPath.discoveredClusters} id="cancelDiscoveryConfig">
                        <AcmButton variant={ButtonVariant.link}>{t('discoveryConfig.cancel')}</AcmButton>
                    </Link>
                </ActionGroup>
            </AcmForm>
        </AcmPageCard>
    )
}

export function getDiscoveryConfigLastActive(discoveryConfig: Partial<DiscoveryConfig>) {
    let lastActive = discoveryConfig.spec?.filters?.lastActive || undefined
    if (lastActive === undefined) {
        return '7d' as string
    }
    return lastActive.toString().concat('d') as string
}

export function getDiscoveryConfigProviderConnection(discoveryConfig: Partial<DiscoveryConfig>) {
    let providerConnection = discoveryConfig.spec?.providerConnections || undefined
    if (providerConnection !== undefined && providerConnection[0] !== undefined) {
        return providerConnection[0] as string
    }
    return '' as string
}

export function getDiscoveryConfigVersions(discoveryConfig: Partial<DiscoveryConfig>) {
    return discoveryConfig.spec?.filters?.openShiftVersions
}
