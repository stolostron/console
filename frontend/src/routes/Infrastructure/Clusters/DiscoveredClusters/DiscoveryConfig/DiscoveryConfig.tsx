/* Copyright Contributors to the Open Cluster Management project */

import {
    ActionGroup,
    ButtonVariant,
    Divider,
    Modal,
    ModalVariant,
    PageSection,
    SelectOption,
    Text,
    TextVariants,
} from '@patternfly/react-core'
import { Fragment, useCallback, useContext, useEffect, useState } from 'react'
import { Link, useHistory, useLocation } from 'react-router-dom'
import { ConfirmModal, IConfirmModalProps } from '../../../../../components/ConfirmModal'
import { CreateCredentialModal } from '../../../../../components/CreateCredentialModal'
import { getErrorInfo } from '../../../../../components/ErrorPage'
import { GetProjects } from '../../../../../components/GetProjects'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import { canUser } from '../../../../../lib/rbac-util'
import { NavigationPath } from '../../../../../NavigationPath'
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
import { useSharedAtoms, useRecoilState } from '../../../../../shared-recoil'
import {
    AcmAlertContext,
    AcmButton,
    AcmForm,
    AcmFormSection,
    AcmMultiSelect,
    AcmPage,
    AcmPageContent,
    AcmPageHeader,
    AcmSelect,
    AcmSubmit,
    AcmToastContext,
    Provider,
} from '../../../../../ui-components'
import { CredentialsForm } from '../../../../Credentials/CredentialsForm'

const discoveryVersions = ['4.9', '4.10', '4.11', '4.12']

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
                            { text: t('Create a discovery setting'), to: '' },
                        ]}
                    />
                ) : (
                    <AcmPageHeader
                        title={t('addDiscoveryConfig.title')}
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
    const { discoveryConfigState, secretsState } = useSharedAtoms()
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

    const updateDiscoveryConfig = useCallback(
        (update: (discoveryConfig: DiscoveryConfig) => void) => {
            const copy = { ...discoveryConfig } as DiscoveryConfig
            update(copy)
            setDiscoveryConfig(copy)
        },
        [discoveryConfig, setDiscoveryConfig]
    )

    const deleteDiscoveryConfig = async () => {
        alertContext.clearAlerts()
        return new Promise(async (resolve, reject) => {
            try {
                setModalProps({
                    open: true,
                    title: t('disable.title'),
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
                                    title: t('alert.deleted.header', {
                                        credentialName: getDiscoveryConfigCredential(discoveryConfig),
                                    }),
                                    message: t('alert.msg'),
                                    type: 'success',
                                    autoClose: true,
                                })
                                history.push(NavigationPath.discoveredClusters)
                            } else {
                                throw Error('Error retrieving discoveryconfigs')
                            }
                        } catch (err) {
                            toastContext.clearAlerts()
                            alertContext.addAlert(getErrorInfo(err, t)) //TODO: not currently displaying within modal
                        }
                    },
                    confirmText: t('discoveryConfig.delete.btn'),
                    message: (
                        <Trans
                            i18nKey="discoveryConfig.delete.message"
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
                        title: t('request.failed'),
                        message: err.message,
                    })
                    reject()
                }
            }
        })
    }

    const { projects } = GetProjects()

    const onSubmit = async () => {
        alertContext.clearAlerts()
        return new Promise(async (resolve, reject) => {
            try {
                if (!editing) {
                    discoveryConfig.metadata!.name = 'discovery'
                    const importcmd = await createDiscoveryConfig(discoveryConfig as DiscoveryConfig).promise
                    resolve(importcmd)
                    toastContext.addAlert({
                        title: t('alert.created.header', {
                            credentialName: getDiscoveryConfigCredential(discoveryConfig),
                        }),
                        message: t('alert.msg'),
                        type: 'success',
                        autoClose: true,
                    })
                    history.push(NavigationPath.discoveredClusters)
                } else {
                    const importcmd = await replaceDiscoveryConfig(discoveryConfig as DiscoveryConfig).promise
                    resolve(importcmd)
                    toastContext.addAlert({
                        title: t('alert.updated.header', {
                            credentialName: getDiscoveryConfigCredential(discoveryConfig),
                        }),
                        message: t('alert.msg'),
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
                        title: t('request.failed'),
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
                    !result.status?.allowed ? alertContext.addAlert(getErrorInfo(new ResourceError('', 403), t)) : null
                )
                .catch((err) => alertContext.addAlert(getErrorInfo(err, t)))
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
                    !result.status?.allowed ? alertContext.addAlert(getErrorInfo(new ResourceError('', 403), t)) : null
                )
                .catch((err) => alertContext.addAlert(getErrorInfo(err, t)))
            return () => {
                canCreateDiscoveryConfig.abort()
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editing, discoveryConfig.metadata.namespace, t])

    const [isModalOpen, setIsModalOpen] = useState(false)
    const handleModalToggle = () => {
        setIsModalOpen(!isModalOpen)
    }
    const [newSecret, setNewSecret] = useState<Secret>()

    useEffect(() => {
        if (newSecret) {
            updateDiscoveryConfig((discoveryConfig) => {
                discoveryConfig.metadata.namespace = newSecret.metadata.namespace
                discoveryConfig.spec.credential = newSecret.metadata.name!
            })
        }
    }, [newSecret, updateDiscoveryConfig])

    return (
        <AcmForm>
            <ConfirmModal {...modalProps} />
            <Fragment>
                <Modal
                    variant={ModalVariant.large}
                    showClose={false}
                    isOpen={isModalOpen}
                    aria-labelledby="modal-wizard-label"
                    aria-describedby="modal-wizard-description"
                    onClose={handleModalToggle}
                    hasNoBodyWrapper
                >
                    <CredentialsForm
                        namespaces={projects}
                        isEditing={false}
                        isViewing={false}
                        credentialsType={Provider.redhatcloud}
                        handleModalToggle={handleModalToggle}
                        hideYaml={true}
                        newCredentialCallback={setNewSecret}
                    />
                </Modal>
            </Fragment>
            <AcmFormSection
                title={editing ? t('discoveryConfig.header.edit') : t('discoveryConfig.header.add')}
            ></AcmFormSection>
            <Text component={TextVariants.h3}>{t('discoveryConfig.subheader')}</Text>
            {editing ? (
                <AcmSelect
                    id="namespaces"
                    label={t('discoveryConfig.namespaces.label')}
                    labelHelp={t('discoveryConfig.namespaces.labelHelp')}
                    value={discoveryConfig?.metadata?.namespace}
                    placeholder={t('discoveryConfig.namespaces.placeholder')}
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
                label={t('discoveryConfig.connections.label')}
                labelHelp={t('discoveryConfig.connections.labelHelp')}
                value={getDiscoveryConfigCredential(discoveryConfig)}
                placeholder={t('discoveryConfig.connections.placeholder')}
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
                footer={<CreateCredentialModal handleModalToggle={handleModalToggle} />}
            >
                {credentials?.map((credential) => {
                    const credentialName = credential.metadata.namespace + '/' + credential.metadata.name
                    return (
                        <SelectOption key={credentialName} value={credentialName}>
                            {credentialName}
                        </SelectOption>
                    )
                })}
            </AcmSelect>
            {discoveryConfig.metadata!.namespace ? (
                <Fragment>
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
                        {lastActiveArray.map((e) => (
                            <SelectOption key={e.day} value={e.value}>
                                {e.stringDay}
                            </SelectOption>
                        ))}
                    </AcmSelect>
                    <AcmMultiSelect
                        id="discoveryVersions"
                        label={t('discoveryConfig.discoveryVersions.label')}
                        labelHelp={t('discoveryConfig.discoveryVersions.labelHelp')}
                        value={discoveryConfig?.spec?.filters?.openShiftVersions}
                        placeholder={t('discoveryConfig.discoveryVersions.placeholder')}
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
                        isDisabled={discoveryConfig.metadata!.namespace === ''}
                    >
                        {t('discoveryConfig.delete')}
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
