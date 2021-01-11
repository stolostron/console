import {
    AcmAlertContext,
    AcmAlertGroup,
    AcmAlertProvider,
    AcmEmptyState,
    AcmForm,
    AcmLoadingPage,
    AcmPageCard,
    AcmPageHeader,
    AcmSelect,
    AcmSubmit,
    AcmTextInput,
} from '@open-cluster-management/ui-components'
import { ActionGroup, Button, Page, SelectOption } from '@patternfly/react-core'
import React, { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory, useParams } from 'react-router-dom'
import {
    createResource,
    getResource,
    IRequestResult,
    listClusterResources,
    patchResource,
} from '../../../src/lib/resource-request'
import { BareMetalAsset, BMASecret, MakeId, unpackBareMetalAsset } from '../../../src/resources/bare-metal-asset'
import { ErrorPage } from '../../components/ErrorPage'
import { useQuery } from '../../lib/useQuery'
import { DOC_LINKS } from '../../lib/doc-util'
import { NavigationPath } from '../../NavigationPath'
import { listProjects, Project } from '../../resources/project'
import { Secret, unpackSecret } from '../../resources/secret'

const VALID_BOOT_MAC_REGEXP = /^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$/
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

const addDefaultProtocol = (addr: string) => {
    if (addr && addr.length && !addr.includes('://')) {
        addr = 'ipmi://' + addr
    }
    return addr
}

function ValidateField(value: string, field: string, t: Function) {
    switch (field) {
        case 'address':
            if (!VALID_BMC_ADDR_REGEXP.test(addDefaultProtocol(value))) {
                return t('createBareMetalAsset.form.invalidBmcAddress')
            }
            break
        case 'bootMACAddress':
            if (!VALID_BOOT_MAC_REGEXP.test(value)) {
                return t('createBareMetalAsset.form.invalidMacAddress')
            }
            break
    }
}

async function getBareMetalAsset(metadata: Object) {
    return getResource<BareMetalAsset>({
        kind: 'BareMetalAsset',
        apiVersion: 'inventory.open-cluster-management.io/v1alpha1',
        metadata,
    }).promise
}

function getBMASecret(metadata: Object) {
    return getResource<Secret>({ kind: 'Secret', apiVersion: 'v1', metadata: metadata }).promise
}

export default function CreateBareMetalAssetPage(props: { bmaSecretID?: string }) {
    const { t } = useTranslation(['bma, common'])
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
                    <EditBareMetalAssetPageData
                        bmaSecretID={props.bmaSecretID}
                        editAssetName={params.name}
                        editAssetNamespace={params.namespace}
                    />
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
                <CreateBareMetalAssetPageData bmaSecretID={props.bmaSecretID} />
            </AcmAlertProvider>
        </Page>
    )
}

export function EditBareMetalAssetPageData(props: {
    bmaSecretID?: string
    editAssetName: string
    editAssetNamespace: string
}) {
    const { t } = useTranslation(['bma'])

    type EditData = {
        projects: Array<Project>
        bareMetalAsset: BareMetalAsset
        secret: Secret
    }

    const [resourceError, setError] = useState<Error>()
    const [BMAObjects, setObjects] = useState<EditData>()

    useEffect(() => {
        let projects: Array<Project>
        let bma: BareMetalAsset
        let secret: Secret
        let resultSecret: Promise<Secret>

        const resultProjects = listClusterResources<Project>({ kind: 'Project', apiVersion: 'project.openshift.io/v1' })
        resultProjects.promise
            .then((r) => {
                projects = r
            })
            .catch((e) => {
                setError(e)
            })
        const resultBMA = getBareMetalAsset({ name: props.editAssetName, namespace: props.editAssetNamespace })
        resultBMA
            .then((r) => {
                bma = r
                resultSecret = getBMASecret({
                    name: bma!.spec?.bmc.credentialsName,
                    namespace: props.editAssetNamespace,
                })
                resultSecret!
                    .then(async (r) => {
                        await resultProjects.promise
                        secret = r
                        setObjects({ projects: projects, bareMetalAsset: bma, secret: secret })
                    })
                    .catch((e) => setError(e))
            })
            .catch((e) => setError(e)) //catch error, add to error object and output it
    }, [props.editAssetName, props.editAssetNamespace])

    if (resourceError) {
        return <ErrorPage error={resourceError} />
    } else if (!BMAObjects || !BMAObjects.projects) {
        return <AcmLoadingPage />
    } else if (BMAObjects.projects.length === 0) {
        return (
            <AcmPageCard>
                <AcmEmptyState
                    title={t('createBareMetalAsset.emptyState.Namespaces.title')}
                    message={t('createBareMetalAsset.emptyState.Namespaces.title')}
                />
            </AcmPageCard>
        )
    }

    return (
        <CreateBareMetalAssetPageContent
            projects={BMAObjects.projects}
            createBareMetalAsset={(bareMetalAsset: BareMetalAsset) => createResource(bareMetalAsset)}
            bmaSecretID={props.bmaSecretID}
            editBareMetalAsset={BMAObjects.bareMetalAsset}
            editSecret={BMAObjects.secret}
        />
    )
}

export function CreateBareMetalAssetPageData(props: { bmaSecretID?: string }) {
    const projectsQuery = useQuery(listProjects)
    const { t } = useTranslation(['bma'])
    if (projectsQuery.loading) {
        return <AcmLoadingPage />
    } else if (projectsQuery.error) {
        return <ErrorPage error={projectsQuery.error} />
    } else if (!projectsQuery.data || projectsQuery.data.length === 0) {
        return (
            <AcmPageCard>
                <AcmEmptyState
                    title={t('createBareMetalAsset.emptyState.Namespaces.title')}
                    message={t('createBareMetalAsset.emptyState.Namespaces.title')}
                />
            </AcmPageCard>
        )
    }

    return (
        <CreateBareMetalAssetPageContent
            projects={projectsQuery.data}
            createBareMetalAsset={(bareMetalAsset: BareMetalAsset) => createResource(bareMetalAsset)}
            bmaSecretID={props.bmaSecretID}
        />
    )
}

export function CreateBareMetalAssetPageContent(props: {
    projects: Project[]
    bmaSecretID?: string
    createBareMetalAsset: (input: BareMetalAsset) => IRequestResult
    editBareMetalAsset?: BareMetalAsset
    editSecret?: Secret
}) {
    const { t } = useTranslation(['bma'])
    const history = useHistory()
    const alertContext = useContext(AcmAlertContext)

    let isEdit = props.editBareMetalAsset ? true : false
    let secretName = ''

    let [bareMetalAsset, setBareMetalAsset] = useState<Partial<BareMetalAsset>>({
        kind: 'BareMetalAsset',
        apiVersion: 'inventory.open-cluster-management.io/v1alpha1',
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
        kind: 'Secret',
        apiVersion: 'v1',
        metadata: {
            name: '',
            namespace: '',
        },
        stringData: {
            password: '',
            username: '',
        },
        data: {
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
        if (props.editBareMetalAsset) {
            const unpackedSecret: Partial<Secret> = unpackSecret(props.editSecret!)
            const unpackedBMA: Partial<BareMetalAsset> = unpackBareMetalAsset(props.editBareMetalAsset)
            setBareMetalAsset(unpackedBMA)
            setBMASecret(unpackedSecret)
        }
    }, [props.editBareMetalAsset, props.editSecret])

    return (
        <AcmPageCard>
            <AcmForm>
                <AcmTextInput
                    id="bareMetalAssetName"
                    label={t('createBareMetalAsset.assetName.label')}
                    placeholder={t('createBareMetalAsset.assetName.placeholder')}
                    value={bareMetalAsset.metadata?.name}
                    onChange={(name) => {
                        updateBMASecret((bmaSecrets) => {
                            secretName = name + '-bmc-secret-' + MakeId(props.bmaSecretID)
                            bmaSecrets.metadata!.name = secretName
                            bmaSecrets.kind = 'Secret'
                            bmaSecrets.apiVersion = 'v1'
                        })
                        updateBareMetalAsset((bareMetalAsset) => {
                            bareMetalAsset.metadata!.name = name
                            bareMetalAsset.spec!.bmc.credentialsName = secretName
                        })
                    }}
                    isRequired
                    isDisabled={isEdit}
                    validation={(value) => ValidateField(value, 'name', t)}
                ></AcmTextInput>
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
                >
                    {props.projects.map((project) => (
                        <SelectOption key={project.metadata.name} value={project.metadata.name}>
                            {project.metadata.name}
                        </SelectOption>
                    ))}
                </AcmSelect>
                <AcmTextInput
                    id="baseboardManagementControllerAddress"
                    label={t('createBareMetalAsset.address.label')}
                    placeholder={t('createBareMetalAsset.address.placeholder')}
                    value={bareMetalAsset.spec!.bmc.address}
                    onChange={(address) => {
                        updateBareMetalAsset((bareMetalAsset) => {
                            bareMetalAsset.spec!.bmc.address = address
                        })
                    }}
                    isRequired
                    validation={(value) => ValidateField(value, 'address', t)}
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
                    value={bareMetalAsset.spec?.bootMACAddress}
                    onChange={(bootMACAddress) => {
                        updateBareMetalAsset((bareMetalAsset) => {
                            bareMetalAsset.spec!.bootMACAddress = bootMACAddress
                        })
                    }}
                    isRequired
                    validation={(value) => ValidateField(value, 'bootMACAddress', t)}
                />
                <AcmAlertGroup isInline canClose />
                <ActionGroup>
                    <AcmSubmit
                        id="submit"
                        variant="primary"
                        onClick={() => {
                            alertContext.clearAlerts()
                            if (isEdit) {
                                return patchResource(bmaSecret as BMASecret, bmaSecret)
                                    .promise.then(() => {
                                        return patchResource(bareMetalAsset as BareMetalAsset, bareMetalAsset)
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
                                return createResource(bmaSecret as BMASecret).promise.then(() => {
                                    return props
                                        .createBareMetalAsset(bareMetalAsset as BareMetalAsset)
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
        </AcmPageCard>
    )
}
