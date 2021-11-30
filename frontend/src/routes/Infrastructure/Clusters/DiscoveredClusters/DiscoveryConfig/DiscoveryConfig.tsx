/* Copyright Contributors to the Open Cluster Management project */

import {
    createDiscoveryConfig,
    deleteResource,
    DiscoveryConfig,
    DiscoveryConfigApiVersion,
    DiscoveryConfigDefinition,
    DiscoveryConfigKind,
    replaceDiscoveryConfig,
    ResourceError,
    Secret,
} from '../../../../../resources'
import {
    AcmAlertContext,
    AcmButton,
    AcmForm,
    AcmFormSection,
    AcmIcon,
    AcmIconVariant,
    AcmMultiSelect,
    AcmPage,
    AcmPageContent,
    AcmPageHeader,
    AcmSelect,
    AcmSubmit,
    AcmToastContext,
    Provider,
} from '@open-cluster-management/ui-components'
import {
    ActionGroup,
    ButtonVariant,
    Divider,
    Flex,
    FlexItem,
    PageSection,
    SelectOption,
    Text,
    TextVariants,
} from '@patternfly/react-core'
import { Fragment, useContext, useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useHistory, useLocation } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { discoveryConfigState, secretsState } from '../../../../../atoms'
import { ConfirmModal, IConfirmModalProps } from '../../../../../components/ConfirmModal'
import { getErrorInfo } from '../../../../../components/ErrorPage'
import { canUser } from '../../../../../lib/rbac-util'
import { NavigationPath } from '../../../../../NavigationPath'

const discoveryVersions = ['4.6', '4.7', '4.8', '4.9']

export default function DiscoveryConfigPage() {
    const { t } = useTranslation()
    const location = useLocation()

    return (
        <AcmPage
            header={
                location.pathname === NavigationPath.configureDiscovery ? (
                    <AcmPageHeader
                        title={t('Configure discovery settings')}
                        breadcrumb={[
                            { text: t('Clusters'), to: NavigationPath.clusters },
                            { text: t('Discovered clusters'), to: NavigationPath.discoveredClusters },
                            { text: t('Configure discovery settings'), to: '' },
                        ]}
                    />
                ) : (
                    <AcmPageHeader
                        title={t('Create a discovery setting')}
                        breadcrumb={[
                            { text: t('Clusters'), to: NavigationPath.clusters },
                            { text: t('Discovered clusters'), to: NavigationPath.discoveredClusters },
                            { text: t('Create a discovery setting'), to: '' },
                        ]}
                    />
                )
            }
        >
            <AcmPageContent id="discoveryConfigPageContent">
                <PageSection variant="light">
                    <AddDiscoveryConfigData />
                </PageSection>
            </AcmPageContent>
        </AcmPage>
    )
}

export function AddDiscoveryConfigData() {
    const [discoveryConfigs] = useRecoilState(discoveryConfigState)
    const [secrets] = useRecoilState(secretsState)
    const [credentials, setCredentials] = useState<Secret[]>([])
    const [discoveryNamespaces, setDiscoveryNamespaces] = useState<string[]>([])

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

    // Retrieves RHOCM Credentials
    useEffect(() => {
        const CRHCredentials: Secret[] = []
        secrets.forEach((credential) => {
            const provider = credential.metadata.labels?.['cluster.open-cluster-management.io/type']
            if (provider === Provider.redhatcloud) {
                CRHCredentials.push(credential)
            }
        })
        setCredentials(CRHCredentials)
    }, [secrets])

    return (
        <DiscoveryConfigPageContent
            discoveryConfigs={discoveryConfigs}
            credentials={credentials}
            discoveryNamespaces={discoveryNamespaces}
        />
    )
}

export function DiscoveryConfigPageContent(props: {
    discoveryConfigs: DiscoveryConfig[]
    credentials: Secret[]
    discoveryNamespaces: string[]
}) {
    const toastContext = useContext(AcmToastContext)
    const [credentialsRef] = useState<string>(sessionStorage.getItem('DiscoveryCredential') || '')
    const [discoveryConfig, setDiscoveryConfig] = useState<DiscoveryConfig>({
        apiVersion: DiscoveryConfigApiVersion,
        kind: DiscoveryConfigKind,
        metadata: {
            name: '',
            namespace: credentialsRef.split('/', 2)[0] || '',
        },
        spec: {
            filters: {
                lastActive: 7,
            },
            credential: credentialsRef.split('/', 2)[1] || '',
        },
    })
    const alertContext = useContext(AcmAlertContext)
    const { t } = useTranslation()
    const history = useHistory()
    const location = useLocation()
    const [editing] = useState<boolean>(location.pathname === NavigationPath.configureDiscovery)
    const [credentials, setCredentials] = useState<Secret[]>([])
    const [modalProps, setModalProps] = useState<IConfirmModalProps>({
        open: false,
        confirm: () => {},
        cancel: () => {},
        title: 'deleteModal',
        message: '',
    })

    // Trims list of credentials
    useEffect(() => {
        const credentials: Secret[] = []
        props.credentials.forEach((credential) => {
            if (!editing) {
                // If adding a new DiscoveryConfig, include all credentials not configured with discovery
                if (!props.discoveryNamespaces.includes(credential.metadata.namespace!)) {
                    credentials.push(credential)
                }
            } else if (credential.metadata.namespace === discoveryConfig?.metadata?.namespace) {
                // Else if editing, only show Credentials in the current discoveryConfigs namespace
                credentials.push(credential)
            }
        })
        setCredentials(credentials)
    }, [props.credentials, discoveryConfig, editing, props.discoveryNamespaces])

    type LastActive = { day: number; stringDay: string; value: string }
    const lastActiveArray: LastActive[] = [
        { day: 1, stringDay: '1 day', value: '1d' },
        { day: 2, stringDay: '2 days', value: '2d' },
        { day: 3, stringDay: '3 days', value: '3d' },
        { day: 7, stringDay: '7 days', value: '7d' },
        { day: 14, stringDay: '14 days', value: '14d' },
        { day: 21, stringDay: '21 days', value: '21d' },
        { day: 30, stringDay: '30 days', value: '30d' },
    ]

    function updateDiscoveryConfig(update: (discoveryConfig: DiscoveryConfig) => void) {
        const copy = { ...discoveryConfig } as DiscoveryConfig
        update(copy)
        setDiscoveryConfig(copy)
    }

    const deleteDiscoveryConfig = async () => {
        alertContext.clearAlerts()
        return new Promise(async (resolve, reject) => {
            try {
                setModalProps({
                    open: true,
                    title: t('Delete discovery settings'),
                    confirm: async () => {
                        try {
                            if (discoveryConfig) {
                                const deletecmd = await deleteResource(discoveryConfig as DiscoveryConfig).promise
                                setModalProps({
                                    open: false,
                                    confirm: () => {},
                                    cancel: () => {},
                                    title: '',
                                    message: '',
                                })
                                resolve(deletecmd)
                                toastContext.addAlert({
                                    // TODO - Handle interpolation
                                    title: t('{{credentialName}} discovery setting was removed successfully'),
                                    message: t('You can configure settings in Clusters > Discovered clusters'),
                                    type: 'success',
                                    autoClose: true,
                                })
                                history.push(NavigationPath.discoveredClusters)
                            } else {
                                throw Error('Error retrieving discoveryconfigs')
                            }
                        } catch (err) {
                            toastContext.clearAlerts()
                            alertContext.addAlert(getErrorInfo(err)) //TODO: not currently displaying within modal
                        }
                    },
                    confirmText: t('Delete'),
                    message: (
                        <Trans
                            i18nKey={
                                'You are deleting the <bold>{{discoveryConfigNamespace}}</bold> discovery setting. All related discovered clusters will be deleted.'
                            }
                            components={{ bold: <strong /> }}
                            values={{ discoveryConfigNamespace: discoveryConfig!.metadata!.namespace }}
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
            } catch (err) {
                toastContext.clearAlerts()
                if (err instanceof Error) {
                    alertContext.addAlert({
                        type: 'danger',
                        title: t('Request failed'),
                        message: err.message,
                    })
                    reject()
                }
            }
        })
    }

    const onSubmit = async () => {
        alertContext.clearAlerts()
        return new Promise(async (resolve, reject) => {
            try {
                if (!editing) {
                    discoveryConfig.metadata!.name = 'discovery'
                    const importcmd = await createDiscoveryConfig(discoveryConfig as DiscoveryConfig).promise
                    resolve(importcmd)
                    toastContext.addAlert({
                        // TODO - Handle interpolation
                        title: t('{{credentialName}} discovery setting was created successfully'),
                        message: t('You can configure settings in Clusters > Discovered clusters'),
                        type: 'success',
                        autoClose: true,
                    })
                    history.push(NavigationPath.discoveredClusters)
                } else {
                    const importcmd = await replaceDiscoveryConfig(discoveryConfig as DiscoveryConfig).promise
                    resolve(importcmd)
                    toastContext.addAlert({
                        // TODO - Handle interpolation
                        title: t('{{credentialName}} discovery setting was updated successfully'),
                        message: t('You can configure settings in Clusters > Discovered clusters'),
                        type: 'success',
                        autoClose: true,
                    })
                    history.push(NavigationPath.discoveredClusters)
                }
            } catch (err) {
                toastContext.clearAlerts()
                if (err instanceof Error) {
                    alertContext.addAlert({
                        type: 'danger',
                        title: t('Request failed'),
                        message: err.message,
                    })
                    reject()
                }
            }
        })
    }

    useEffect(() => {
        alertContext.clearAlerts()
        if (discoveryConfig.metadata.namespace === '') {
            return
        }
        if (editing) {
            const canUpdateDiscoveryConfig = canUser(
                'update',
                DiscoveryConfigDefinition,
                discoveryConfig.metadata.namespace,
                'discovery'
            )

            canUpdateDiscoveryConfig.promise
                .then((result) =>
                    !result.status?.allowed ? alertContext.addAlert(getErrorInfo(new ResourceError('', 403))) : null
                )
                .catch((err) => alertContext.addAlert(getErrorInfo(err)))
            return () => {
                canUpdateDiscoveryConfig.abort()
            }
        } else {
            const canCreateDiscoveryConfig = canUser(
                'create',
                DiscoveryConfigDefinition,
                discoveryConfig.metadata.namespace,
                'discovery'
            )
            canCreateDiscoveryConfig.promise
                .then((result) =>
                    !result.status?.allowed ? alertContext.addAlert(getErrorInfo(new ResourceError('', 403))) : null
                )
                .catch((err) => alertContext.addAlert(getErrorInfo(err)))
            return () => {
                canCreateDiscoveryConfig.abort()
            }
        }
    }, [editing, discoveryConfig.metadata.namespace])

    return (
        <AcmForm>
            <ConfirmModal {...modalProps} />
            <AcmFormSection
                title={editing ? t('Configure discovery settings') : t('Select a credential')}
            ></AcmFormSection>
            <Text component={TextVariants.h3}>
                {t(
                    'Red Hat OpenShift Cluster Manager credentials enable you to discover clusters. After you save these changes, the filtered clusters appear in the Discovered clusters tab of the Clusters page.'
                )}
            </Text>
            {editing ? (
                <AcmSelect
                    id="namespaces"
                    label={t('Namespace')}
                    labelHelp={t('Select the namespace that contains your credentials.')}
                    value={discoveryConfig?.metadata?.namespace}
                    placeholder={t('Select a namespace')}
                    onChange={(namespace) => {
                        for (let i = 0; i < props.discoveryConfigs.length; i = i + 1) {
                            if (props.discoveryConfigs[i].metadata.namespace === namespace) {
                                updateDiscoveryConfig((discoveryConfig) => {
                                    discoveryConfig.metadata.name = props.discoveryConfigs[i].metadata.name
                                    discoveryConfig.metadata.namespace = props.discoveryConfigs[i].metadata.namespace
                                    discoveryConfig.metadata.resourceVersion =
                                        props.discoveryConfigs[i].metadata.resourceVersion
                                    discoveryConfig.spec.credential = props.discoveryConfigs[i].spec.credential
                                    if (!discoveryConfig.spec.filters) {
                                        discoveryConfig.spec.filters = {}
                                    }
                                    discoveryConfig.spec.filters.lastActive =
                                        props.discoveryConfigs[i].spec.filters?.lastActive
                                    discoveryConfig.spec.filters.openShiftVersions =
                                        props.discoveryConfigs[i].spec.filters?.openShiftVersions
                                })
                                break
                            }
                        }
                    }}
                    isRequired
                >
                    {props.discoveryNamespaces?.map((namespace) => (
                        <SelectOption key={namespace} value={namespace}>
                            {namespace}
                        </SelectOption>
                    ))}
                </AcmSelect>
            ) : null}
            <AcmSelect
                id="credentials"
                label={t('Credential')}
                labelHelp={t('Select a credential within that namespace.')}
                value={getDiscoveryConfigCredential(discoveryConfig)}
                placeholder={t('Select a credential')}
                onChange={(credential) => {
                    updateDiscoveryConfig((discoveryConfig) => {
                        if (credential) {
                            const metadata = credential.split('/', 2)
                            discoveryConfig.metadata.namespace = metadata[0]
                            discoveryConfig.spec.credential = metadata[1]
                        }
                    })
                }}
                isDisabled={editing && !discoveryConfig.metadata.namespace}
                isRequired
            >
                {credentials?.map((credential) => (
                    <SelectOption
                        key={credential.metadata.namespace + '/' + credential.metadata.name}
                        value={credential.metadata.namespace + '/' + credential.metadata.name}
                    >
                        {credential.metadata.namespace + '/' + credential.metadata.name}
                    </SelectOption>
                ))}
            </AcmSelect>
            <Flex style={{ marginTop: '0px' }}>
                <FlexItem align={{ default: 'alignRight' }}>
                    <Link to={NavigationPath.addCredentials}>
                        {t('Add credential')} <AcmIcon icon={AcmIconVariant.openNewTab} />
                    </Link>
                </FlexItem>
            </Flex>
            {discoveryConfig.metadata!.namespace ? (
                <Fragment>
                    <AcmFormSection title={t('Set filters to discover clusters')}></AcmFormSection>
                    <Text component={TextVariants.h3}>{t('Set filters to discover only relevant clusters.')}</Text>
                    <AcmSelect
                        id="lastActiveFilter"
                        label={t('Last active')}
                        labelHelp={t('Only discovered clusters active within this time period are found.')}
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
                        {lastActiveArray.map((e) => (
                            <SelectOption key={e.day} value={e.value}>
                                {e.stringDay}
                            </SelectOption>
                        ))}
                    </AcmSelect>
                    <AcmMultiSelect
                        id="discoveryVersions"
                        label={t('Red Hat OpenShift version')}
                        labelHelp={t(
                            'All Red Hat OpenShift versions are included by default unless specified in this drop-down menu.'
                        )}
                        value={discoveryConfig?.spec?.filters?.openShiftVersions}
                        placeholder={t('All available Red Hat OpenShift versions are included by default')}
                        onChange={(versions) => {
                            updateDiscoveryConfig((discoveryConfig) => {
                                if (!discoveryConfig.spec.filters) {
                                    discoveryConfig.spec.filters = {}
                                }
                                discoveryConfig.spec.filters.openShiftVersions = versions
                            })
                        }}
                    >
                        {discoveryVersions.map((version) => (
                            <SelectOption key={version} value={version}>
                                {version}
                            </SelectOption>
                        ))}
                    </AcmMultiSelect>
                </Fragment>
            ) : null}
            <ActionGroup>
                <AcmSubmit id="applyDiscoveryConfig" onClick={onSubmit} variant={ButtonVariant.primary}>
                    {!editing ? t('Create') : t('Save')}
                </AcmSubmit>
                <Link to={NavigationPath.discoveredClusters} id="cancelDiscoveryConfig">
                    <AcmButton variant={ButtonVariant.link}>{t('Cancel')}</AcmButton>
                </Link>
                {editing ? <Divider isVertical /> : null}
                {editing ? (
                    <AcmButton
                        style={{ marginLeft: '16px' }}
                        id="deleteDiscoveryConfig"
                        onClick={deleteDiscoveryConfig}
                        variant={ButtonVariant.danger}
                        isDisabled={discoveryConfig.metadata!.namespace === ''}
                    >
                        {t('Delete')}
                    </AcmButton>
                ) : null}
            </ActionGroup>
        </AcmForm>
    )
}

export function getDiscoveryConfigLastActive(discoveryConfig?: DiscoveryConfig) {
    const lastActive = discoveryConfig?.spec?.filters?.lastActive || undefined
    if (lastActive === undefined) {
        return '7d'
    }
    return lastActive.toString().concat('d')
}

export function getDiscoveryConfigCredential(discoveryConfig?: DiscoveryConfig) {
    const credential = discoveryConfig?.spec?.credential
    if (credential !== '' && discoveryConfig?.metadata) {
        return discoveryConfig?.metadata.namespace + '/' + credential
    }
    return ''
}
