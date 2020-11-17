import {
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
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { ErrorPage } from '../../components/ErrorPage'
import { BareMetalAsset, BMASecret, MakeId } from '../../../src/resources/bare-metal-asset'
import { createResource, IRequestResult } from '../../../src/lib/resource-request'
import { Project, listProjects } from '../../resources/project'
import { NavigationPath } from '../../NavigationPath'
import { useQuery } from '../../lib/useQuery'

const VALID_BOOT_MAC_REGEXP = /^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$/
const VALID_BMC_ADDR_REGEXP = new RegExp(
    '^((ipmi|idrac|idrac\\+http|idrac-virtualmedia|irmc|redfish|redfish\\+http|redfish-virtualmedia|ilo5-virtualmedia|https?|ftp):\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3})|' + // OR ip (v4) address
        '(([0-9a-f]{1,4}:){7,7}[0-9a-f]{1,4}|([0-9a-f]{1,4}:){1,7}:|([0-9a-f]{1,4}:){1,6}:[0-9a-f]{1,4}|([0-9a-f]{1,4}:){1,5}(:[0-9a-f]{1,4}){1,2}|([0-9a-f]{1,4}:){1,4}(:[0-9a-f]{1,4}){1,3}|([0-9a-f]{1,4}:){1,3}(:[0-9a-f]{1,4}){1,4}|([0-9a-f]{1,4}:){1,2}(:[0-9a-f]{1,4}){1,5}|[0-9a-f]{1,4}:((:[0-9a-f]{1,4}){1,6})|:((:[0-9a-f]{1,4}){1,7}|:)|fe80:(:[0-9a-f]{0,4}){0,4}%[0-9a-z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]).){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]).){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])))' + // OR ip (v6) address
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

function ValidateField(value: string, field: string, t:Function) {
    switch (field) {
        case 'address':
            if (!VALID_BMC_ADDR_REGEXP.test(addDefaultProtocol(value))) {
                return t("createBareMetalAsset.form.invalidBmcAddress")
            }
            break
        case 'bootMac':
            if (!VALID_BOOT_MAC_REGEXP.test(value)) {
                return t("createBareMetalAsset.form.invalidMacAddress")
            }
            break
    }
}

export default function CreateBareMetalAssetPage(props: { bmaSecretID?: string }) {
    const { t } = useTranslation(['bma'])
    return (
        <Page>
            <AcmPageHeader title={t('createBareMetalAsset.title')} />
            <CreateBareMetalAssetPageData bmaSecretID={props.bmaSecretID} />
        </Page>
    )
}

export function CreateBareMetalAssetPageData(props: { bmaSecretID?: string }) {
    const projectsQuery = useQuery(listProjects)
    const { t } = useTranslation(['bma'])
    if (projectsQuery.loading) {
        return <AcmLoadingPage />
    } else if (projectsQuery.error) {
        return <ErrorPage error={projectsQuery.error} />
    } else if (!projectsQuery.data|| projectsQuery.data.length === 0) {
        return (
            <AcmPageCard>
                <AcmEmptyState title={t("createBareMetalAsset.emptyState.Namespaces.title")} message={t("createBareMetalAsset.emptyState.Namespaces.title")} />
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
}) {
    const { t } = useTranslation(['bma'])
    const history = useHistory()

    const [bareMetalAsset, setBareMetalAsset] = useState<Partial<BareMetalAsset>>({
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
            bootMac: '',
        },
    })
    function updateBareMetalAsset(update: (bareMetalAsset: Partial<BareMetalAsset>) => void) {
        const copy = { ...bareMetalAsset }
        update(copy)
        setBareMetalAsset(copy)
    }

    const [bmaSecret, setBMASecret] = useState<Partial<BMASecret>>({
        metadata: {},
        stringData: {
            password: '',
            username: '',
        },
    })
    function updateBMASecret(update: (bmaSecret: Partial<BMASecret>) => void) {
        const copy = { ...bmaSecret }
        update(copy)
        setBMASecret(copy)
    }
    let secretName = ''
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
                    type='password'
                />
                <AcmTextInput
                    id='bootMac'
                    label={t('createBareMetalAsset.bootMac.label')}
                    placeholder={t('createBareMetalAsset.bootMac.placeholder')}
                    value={bareMetalAsset.spec?.bootMac}
                    onChange={(bootMac) => {
                        updateBareMetalAsset((bareMetalAsset) => {
                            bareMetalAsset.spec!.bootMac = bootMac
                        })
                    }}
                    isRequired
                    validation={(value) => ValidateField(value, 'bootMac', t)}
                />

                <ActionGroup>
                    <AcmSubmit
                        id='submit'
                        variant='primary'
                        onClick={() => {
                            createResource(bmaSecret as BMASecret).promise.then(() => {
                                props.createBareMetalAsset(bareMetalAsset as BareMetalAsset).promise.then(() => {
                                    history.push(NavigationPath.bareMetalAssets)
                                })
                            })
                        }}
                    >
                        {t('createBareMetalAsset.button.create')}
                    </AcmSubmit>
                    <Button
                        variant='link'
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
