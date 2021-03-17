/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmAlertContext,
    AcmAlertGroup,
    AcmAlertProvider,
    AcmButton,
    AcmEmptyState,
    AcmErrorBoundary,
    AcmForm,
    AcmLoadingPage,
    AcmPageHeader,
    AcmSelect,
    AcmSubmit,
    AcmTextInput,
} from '@open-cluster-management/ui-components'
import { ActionGroup, Button, Divider, Page, PageSection, SelectOption } from '@patternfly/react-core'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory, useParams } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { createResource, patchResource } from '../../../src/lib/resource-request'
import {
    BareMetalAsset,
    BareMetalAssetApiVersion,
    BareMetalAssetDefinition,
    BareMetalAssetKind,
    BMASecret,
    getBareMetalAsset,
} from '../../../src/resources/bare-metal-asset'
import { ErrorPage } from '../../components/ErrorPage'
import { LoadingPage } from '../../components/LoadingPage'
import { DOC_LINKS } from '../../lib/doc-util'
import { getAuthorizedNamespaces, rbacCreate } from '../../lib/rbac-util'
import { NavigationPath } from '../../NavigationPath'
import { getSecret, Secret, SecretApiVersion, SecretKind, unpackSecret } from '../../resources/secret'
import { namespacesState } from '../../atoms'

export default function CreateBareMetalAssetPage() {
    const { t } = useTranslation(['bma', 'common'])
    const params: { namespace?: string; name?: string } = useParams()

    if (params.namespace && params.name) {
        return (
            <Page>
                <AcmAlertProvider>
                    <AcmPageHeader
                        title={t('bma:editBareMetalAsset.title')}
                        titleTooltip={
                            <>
                                {t('bma:createBareMetalAsset.title.tooltip')}
                                <a
                                    href={DOC_LINKS.BARE_METAL_ASSETS}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ display: 'block', marginTop: '4px' }}
                                >
                                    {t('common:learn.more')}
                                </a>
                            </>
                        }
                        breadcrumb={[
                            { text: t('bma:bmas'), to: NavigationPath.bareMetalAssets },
                            { text: t('bma:editBareMetalAsset.title'), to: '' },
                        ]}
                    />
                    <AcmErrorBoundary>
                        <Divider />
                        <PageSection variant="light" isFilled={true}>
                            <EditBareMetalAssetPageData name={params.name} namespace={params.namespace} />
                        </PageSection>
                    </AcmErrorBoundary>
                </AcmAlertProvider>
            </Page>
        )
    }
    return (
        <Page>
            <AcmAlertProvider>
                <AcmPageHeader
                    title={t('bma:createBareMetalAsset.title')}
                    titleTooltip={
                        <>
                            {t('bma:createBareMetalAsset.title.tooltip')}
                            <a
                                href={DOC_LINKS.BARE_METAL_ASSETS}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'block', marginTop: '4px' }}
                            >
                                {t('common:learn.more')}
                            </a>
                        </>
                    }
                    breadcrumb={[
                        { text: t('bma:bmas'), to: NavigationPath.bareMetalAssets },
                        { text: t('bma:createBareMetalAsset.title'), to: '' },
                    ]}
                />
                <AcmErrorBoundary>
                    <Divider />
                    <PageSection variant="light" isFilled={true}>
                        <CreateBareMetalAssetPageData />
                    </PageSection>
                </AcmErrorBoundary>
            </AcmAlertProvider>
        </Page>
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
    const { t } = useTranslation(['bma', 'common'])
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
                actions={<AcmButton onClick={() => setRetry(retry + 1)}>{t('common:retry')}</AcmButton>}
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
                title={t('common:rbac.title.unauthorized')}
                message={t('common:rbac.namespaces.unauthorized')}
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
    const { t } = useTranslation(['bma'])
    const history = useHistory()
    const alertContext = useContext(AcmAlertContext)

    const isEdit = !!props.editBareMetalAsset

    let [bareMetalAsset, setBareMetalAsset] = useState<Partial<BareMetalAsset>>({
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

    let [bmaSecret, setBMASecret] = useState<Partial<Secret>>({
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
                label={t('createBareMetalAsset.assetName.label')}
                placeholder={t('createBareMetalAsset.assetName.placeholder')}
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
                label={t('createBareMetalAsset.namespaceName.label')}
                placeholder={t('createBareMetalAsset.namespaceName.placeholder')}
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
                label={t('createBareMetalAsset.address.label')}
                placeholder={t('createBareMetalAsset.address.placeholder')}
                labelHelp={t('createBareMetalAsset.address.labelHelp')}
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
                label={t('createBareMetalAsset.username.label')}
                placeholder={t('createBareMetalAsset.username.placeholder')}
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
                label={t('createBareMetalAsset.password.label')}
                placeholder={t('createBareMetalAsset.password.placeholder')}
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
                label={t('createBareMetalAsset.bootMACAddress.label')}
                placeholder={t('createBareMetalAsset.bootMACAddress.placeholder')}
                labelHelp={t('createBareMetalAsset.bootMACAddress.labelHelp')}
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
                        return t('createBareMetalAsset.form.invalidMacAddress')
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
                                                    title: t('common:request.failed'),
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
                                            title: t('common:request.failed'),
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
                                                    title: t('common:request.failed'),
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
                                            title: t('common:request.failed'),
                                            message: e.message,
                                        })
                                    }
                                })
                        }
                    }}
                >
                    {isEdit ? t('editBareMetalAsset.button.submit') : t('createBareMetalAsset.button.create')}
                </AcmSubmit>
                <Button
                    variant="link"
                    onClick={() => {
                        history.push(NavigationPath.bareMetalAssets)
                    }}
                >
                    {t('createBareMetalAsset.button.cancel')}
                </Button>
            </ActionGroup>
        </AcmForm>
    )
}
