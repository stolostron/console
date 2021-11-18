/* Copyright Contributors to the Open Cluster Management project */

import {
    BareMetalAsset,
    BareMetalAssetApiVersion,
    BareMetalAssetDefinition,
    BareMetalAssetKind,
    BMASecret,
    createResource,
    getBareMetalAsset,
    getSecret,
    patchResource,
    Secret,
    SecretApiVersion,
    SecretKind,
    unpackSecret,
} from '../../../resources'
import {
    AcmAlertContext,
    AcmAlertGroup,
    AcmButton,
    AcmEmptyState,
    AcmForm,
    AcmLoadingPage,
    AcmPage,
    AcmPageContent,
    AcmPageHeader,
    AcmSelect,
    AcmSubmit,
    AcmTextInput,
} from '@open-cluster-management/ui-components'
import { ActionGroup, Button, PageSection, SelectOption } from '@patternfly/react-core'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory, useParams } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { namespacesState } from '../../../atoms'
import { ErrorPage } from '../../../components/ErrorPage'
import { LoadingPage } from '../../../components/LoadingPage'
import { DOC_LINKS } from '../../../lib/doc-util'
import { getAuthorizedNamespaces, rbacCreate } from '../../../lib/rbac-util'
import { NavigationPath } from '../../../NavigationPath'

export default function CreateBareMetalAssetPage() {
    const { t } = useTranslation()
    const params: { namespace?: string; name?: string } = useParams()

    if (params.namespace && params.name) {
        return (
            <AcmPage
                header={
                    <AcmPageHeader
                        title={t('Edit bare metal asset')}
                        titleTooltip={
                            <>
                                {t(
                                    'Bare metal assets are virtual or physical servers that are configured to run your cloud operations.'
                                )}
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
                        breadcrumb={[
                            { text: t('Bare metal assets'), to: NavigationPath.bareMetalAssets },
                            { text: t('Edit bare metal asset'), to: '' },
                        ]}
                    />
                }
            >
                <AcmPageContent id="edit-bare-metal-asset">
                    <PageSection variant="light" isFilled={true}>
                        <EditBareMetalAssetPageData name={params.name} namespace={params.namespace} />
                    </PageSection>
                </AcmPageContent>
            </AcmPage>
        )
    }
    return (
        <AcmPage
            header={
                <AcmPageHeader
                    title={t('Create bare metal asset')}
                    titleTooltip={
                        <>
                            {t(
                                'Bare metal assets are virtual or physical servers that are configured to run your cloud operations.'
                            )}
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
                    breadcrumb={[
                        { text: t('Bare metal assets'), to: NavigationPath.bareMetalAssets },
                        { text: t('Create bare metal asset'), to: '' },
                    ]}
                />
            }
        >
            <AcmPageContent id="create-bare-metal-asset">
                <PageSection variant="light" isFilled>
                    <CreateBareMetalAssetPageData />
                </PageSection>
            </AcmPageContent>
        </AcmPage>
    )
}

export function EditBareMetalAssetPageData(props: { name: string; namespace: string }) {
    const [resourceError, setError] = useState<Error>()
    const [editBareMetalAsset, setEditBareMetalAsset] = useState<BareMetalAsset | undefined>()
    const [editSecret, setEditSecret] = useState<Partial<Secret> | undefined>()
    const [isLoading, setIsLoading] = useState<boolean>(true)

    useEffect(() => {
        const resultBMA = getBareMetalAsset({ name: props.name, namespace: props.namespace })
        resultBMA.promise
            .then((result) => {
                setEditBareMetalAsset(result)
                const bmaSecret = getSecret({
                    name: result!.spec?.bmc.credentialsName ?? '',
                    namespace: props.namespace,
                })
                bmaSecret.promise
                    .then((result) => {
                        setEditSecret(unpackSecret(result))
                    })
                    .catch((e) => setError(e))
            })
            .catch((e) => setError(e))
            .finally(() => setIsLoading(false))
    }, [props.name, props.namespace])

    if (resourceError) {
        return <ErrorPage error={resourceError} />
    } else if (isLoading) {
        return <LoadingPage />
    }

    return (
        <CreateBareMetalAssetPageContent
            projects={[props.namespace]}
            editBareMetalAsset={editBareMetalAsset}
            editSecret={editSecret}
        />
    )
}

export function CreateBareMetalAssetPageData() {
    const { t } = useTranslation()
    const [namespaces] = useRecoilState(namespacesState)
    const [projects, setProjects] = useState<string[]>([])
    const [error, setError] = useState<Error>()
    const [retry, setRetry] = useState(0)
    const [isLoading, setIsLoading] = useState<boolean>(true)

    useEffect(() => {
        setError(undefined)
        setProjects([])
        setIsLoading(true)
    }, [retry])

    useEffect(() => {
        getAuthorizedNamespaces([rbacCreate(BareMetalAssetDefinition)], namespaces)
            .then((namespaces: string[]) => setProjects(namespaces))
            .catch(setError)
            .finally(() => setIsLoading(false))
    }, [namespaces])

    if (error) {
        return (
            <ErrorPage
                error={error}
                actions={<AcmButton onClick={() => setRetry(retry + 1)}>{t('Retry')}</AcmButton>}
            />
        )
    }

    if (isLoading) {
        return <AcmLoadingPage />
    }

    if (projects.length === 0) {
        // returns empty state when user cannot create secret in any namespace
        return (
            <AcmEmptyState
                title={t('Unauthorized')}
                message={t(
                    'You are not authorized to complete this action. There is currently no namespace that allows you to create this resource. See your cluster administrator for role-based access control information.'
                )}
                showIcon={false}
            />
        )
    }

    return <CreateBareMetalAssetPageContent projects={projects!} />
}

export function CreateBareMetalAssetPageContent(props: {
    projects: string[]
    editBareMetalAsset?: BareMetalAsset
    editSecret?: Partial<Secret>
}) {
    const { t } = useTranslation()
    const history = useHistory()
    const alertContext = useContext(AcmAlertContext)

    const isEdit = !!props.editBareMetalAsset

    const [bareMetalAsset, setBareMetalAsset] = useState<Partial<BareMetalAsset>>({
        kind: BareMetalAssetKind,
        apiVersion: BareMetalAssetApiVersion,
        metadata: {
            name: '',
            namespace: '',
        },
        spec: {
            bmc: {
                address: '',
                credentialsName: '',
            },
            bootMACAddress: '',
        },
    })

    const [bmaSecret, setBMASecret] = useState<Partial<Secret>>({
        kind: SecretKind,
        apiVersion: SecretApiVersion,
        metadata: {
            name: '',
            namespace: '',
        },
        stringData: {
            password: '',
            username: '',
        },
    })

    function updateBareMetalAsset(update: (bareMetalAsset: Partial<BareMetalAsset>) => void) {
        const copy = { ...bareMetalAsset }
        update(copy)
        setBareMetalAsset(copy)
    }
    function updateBMASecret(update: (bmaSecret: Partial<Secret>) => void) {
        const copy = { ...bmaSecret }
        update(copy)
        setBMASecret(copy)
    }

    useEffect(() => {
        if (props.editBareMetalAsset && props.editSecret) {
            setBareMetalAsset(props.editBareMetalAsset)
            setBMASecret(props.editSecret)
        }
    }, [props.editBareMetalAsset, props.editSecret])

    return (
        <AcmForm>
            <AcmTextInput
                id="bareMetalAssetName"
                label={t('Bare metal asset name')}
                placeholder={t('Enter the name for the bare metal asset')}
                value={bareMetalAsset.metadata?.name}
                onChange={(name) => {
                    updateBMASecret((bmaSecrets) => {
                        bmaSecrets.metadata!.name = name + '-bmc-secret'
                    })
                    updateBareMetalAsset((bareMetalAsset) => {
                        bareMetalAsset.metadata!.name = name
                    })
                }}
                isRequired
                isDisabled={isEdit}
            />
            <AcmSelect
                id="namespaceName"
                toggleId="namespaceName-button"
                label={t('Namespace')}
                placeholder={t('Select a namespace to store the bare metal asset in the cluster')}
                value={bareMetalAsset.metadata?.namespace}
                onChange={(namespace) => {
                    updateBareMetalAsset((bareMetalAsset) => {
                        bareMetalAsset.metadata!.namespace = namespace
                    })
                    updateBMASecret((bmaSecrets) => {
                        bmaSecrets.metadata!.namespace = namespace
                    })
                }}
                isRequired
                isDisabled={isEdit}
                variant="typeahead"
            >
                {props.projects.map((project) => (
                    <SelectOption key={project} value={project}>
                        {project}
                    </SelectOption>
                ))}
            </AcmSelect>
            <AcmTextInput
                id="baseboardManagementControllerAddress"
                label={t('Baseboard Management Controller address')}
                placeholder={t('Enter an address')}
                labelHelp={t(
                    'The address to communicate with the hosted BMC controller. IPMI, iDRAC, iRMC, and Redfish protocols are supported. For example: ipmi://, idrac://, irmc://, redfish://.'
                )}
                value={bareMetalAsset.spec!.bmc.address}
                onChange={(address) => {
                    updateBareMetalAsset((bareMetalAsset) => {
                        bareMetalAsset.spec!.bmc.address = address
                    })
                }}
                isRequired
                validation={(value) => {
                    const VALID_BMC_ADDR_REGEXP = new RegExp(
                        '^((ipmi|idrac|idrac\\+http|idrac-virtualmedia|irmc|redfish|redfish\\+http|redfish-virtualmedia|ilo5-virtualmedia|https?|ftp):\\/\\/)?' + // protocol
                            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
                            '((\\d{1,3}\\.){3}\\d{1,3})|' + // OR ip (v4) address
                            '\\[?(([0-9a-f]{1,4}:){7,7}[0-9a-f]{1,4}|([0-9a-f]{1,4}:){1,7}:|([0-9a-f]{1,4}:){1,6}:[0-9a-f]{1,4}|([0-9a-f]{1,4}:){1,5}(:[0-9a-f]{1,4}){1,2}|([0-9a-f]{1,4}:){1,4}(:[0-9a-f]{1,4}){1,3}|([0-9a-f]{1,4}:){1,3}(:[0-9a-f]{1,4}){1,4}|([0-9a-f]{1,4}:){1,2}(:[0-9a-f]{1,4}){1,5}|[0-9a-f]{1,4}:((:[0-9a-f]{1,4}){1,6})|:((:[0-9a-f]{1,4}){1,7}|:)|fe80:(:[0-9a-f]{0,4}){0,4}%[0-9a-z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]).){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]).){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])]))\\]?' + // OR ip (v6) address
                            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
                            '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
                            '(\\#[-a-z\\d_]*)?$',
                        'i'
                    )

                    if (value && value.length && !value.includes('://')) {
                        value = 'ipmi://' + value
                    }
                    if (!VALID_BMC_ADDR_REGEXP.test(value)) {
                        return t('createBareMetalAsset.form.invalidBmcAddress')
                    }
                }}
            />
            <AcmTextInput
                id="username"
                label={t('Username')}
                placeholder={t('Enter a username')}
                value={bmaSecret.stringData!.username}
                onChange={(username) => {
                    updateBMASecret((bmaSecret) => {
                        bmaSecret.stringData!.username = username
                    })
                }}
                isRequired
            />
            <AcmTextInput
                id="password"
                label={t('Password')}
                placeholder={t('Enter a password')}
                value={bmaSecret.stringData!.password}
                onChange={(password) => {
                    updateBMASecret((bmaSecret) => {
                        bmaSecret.stringData!.password = password
                    })
                }}
                isRequired
                type="password"
            />
            <AcmTextInput
                id="bootMACAddress"
                label={t('Boot NIC MAC Address')}
                placeholder={t('Enter an address')}
                labelHelp={t("The MAC address of the host's network-connected NIC that is used to provision the host.")}
                value={bareMetalAsset.spec?.bootMACAddress}
                onChange={(bootMACAddress) => {
                    updateBareMetalAsset((bareMetalAsset) => {
                        bareMetalAsset.spec!.bootMACAddress = bootMACAddress
                    })
                }}
                isRequired
                validation={(value) => {
                    const VALID_BOOT_MAC_REGEXP = /^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$/
                    if (!VALID_BOOT_MAC_REGEXP.test(value)) {
                        return t('Invalid format of MAC address')
                    }
                }}
            />
            <AcmAlertGroup isInline canClose />
            <ActionGroup>
                <AcmSubmit
                    id="submit"
                    variant="primary"
                    onClick={() => {
                        alertContext.clearAlerts()
                        if (isEdit) {
                            return patchResource(bareMetalAsset as BareMetalAsset, [
                                {
                                    op: 'replace',
                                    path: `/spec/bmc`,
                                    value: bareMetalAsset.spec?.bmc,
                                },
                                {
                                    op: 'replace',
                                    path: `/spec/bootMACAddress`,
                                    value: bareMetalAsset.spec?.bootMACAddress!,
                                },
                            ])
                                .promise.then(() => {
                                    return patchResource(bmaSecret as BMASecret, [
                                        {
                                            op: 'replace',
                                            path: `/stringData`,
                                            value: bmaSecret.stringData,
                                        },
                                    ])
                                        .promise.then(() => {
                                            history.push(NavigationPath.bareMetalAssets)
                                        })
                                        .catch((e) => {
                                            /* istanbul ignore else */
                                            if (e instanceof Error) {
                                                alertContext.addAlert({
                                                    type: 'danger',
                                                    title: t('Request failed'),
                                                    message: e.message,
                                                })
                                            }
                                        })
                                })
                                .catch((e) => {
                                    /* istanbul ignore else */
                                    if (e instanceof Error) {
                                        alertContext.addAlert({
                                            type: 'danger',
                                            title: t('Request failed'),
                                            message: e.message,
                                        })
                                    }
                                })
                        } else {
                            return createResource(bmaSecret as BMASecret)
                                .promise.then((result) => {
                                    if (bareMetalAsset.spec) {
                                        bareMetalAsset.spec.bmc.credentialsName = result.metadata.name ?? ''
                                    }
                                    return createResource(bareMetalAsset as BareMetalAsset)
                                        .promise.then(() => {
                                            history.push(NavigationPath.bareMetalAssets)
                                        })
                                        .catch((e) => {
                                            /* istanbul ignore else */
                                            if (e instanceof Error) {
                                                alertContext.addAlert({
                                                    type: 'danger',
                                                    title: t('Request failed'),
                                                    message: e.message,
                                                })
                                            }
                                        })
                                })
                                .catch((e) => {
                                    /* istanbul ignore else */
                                    if (e instanceof Error) {
                                        alertContext.addAlert({
                                            type: 'danger',
                                            title: t('Request failed'),
                                            message: e.message,
                                        })
                                    }
                                })
                        }
                    }}
                >
                    {isEdit ? t('Apply') : t('Create')}
                </AcmSubmit>
                <Button
                    variant="link"
                    onClick={() => {
                        history.push(NavigationPath.bareMetalAssets)
                    }}
                >
                    {t('Cancel')}
                </Button>
            </ActionGroup>
        </AcmForm>
    )
}
