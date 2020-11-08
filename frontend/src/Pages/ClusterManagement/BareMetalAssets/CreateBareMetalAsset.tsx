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
import { ErrorPage } from '../../../components/ErrorPage'
import { BareMetalAsset, bareMetalAssets, BMASecret, bmaSecrets, MakeId } from '../../../lib/BareMetalAsset'
import { Project, Projects } from '../../../lib/Project'
import { NavigationPath } from '../ClusterManagement'

const VALID_BOOT_MAC_REGEXP = /^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$/
const VALID_BMC_ADDR_REGEXP = new RegExp(
    '^((ipmi|idrac|idrac\\+http|idrac-virtualmedia|irmc|redfish|redfish\\+http|redfish-virtualmedia|ilo5-virtualmedia|https?|ftp):\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3})|' + // OR ip (v4) address
        '(([0-9a-f]{1,4}:){7,7}[0-9a-f]{1,4}|([0-9a-f]{1,4}:){1,7}:|([0-9a-f]{1,4}:){1,6}:[0-9a-f]{1,4}|([0-9a-f]{1,4}:){1,5}(:[0-9a-f]{1,4}){1,2}|([0-9a-f]{1,4}:){1,4}(:[0-9a-f]{1,4}){1,3}|([0-9a-f]{1,4}:){1,3}(:[0-9a-f]{1,4}){1,4}|([0-9a-f]{1,4}:){1,2}(:[0-9a-f]{1,4}){1,5}|[0-9a-f]{1,4}:((:[0-9a-f]{1,4}){1,6})|:((:[0-9a-f]{1,4}){1,7}|:)|fe80:(:[0-9a-f]{0,4}){0,4}%[0-9a-z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]).){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]).){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])))' + // OR ip (v6) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$',
    'i')

const addDefaultProtocol = (addr: string) => {
    if (addr && addr.length && !addr.includes('://')) {
        addr = 'ipmi://' + addr
    }
    return addr
}

function validateField(value: string, field: string) {
    switch (field) {
        case 'address':
            if (!VALID_BMC_ADDR_REGEXP.test(addDefaultProtocol(value))) {
                return 'Invalid format of BMC address'
            }
            break
        case 'bootMac':
            if (!VALID_BOOT_MAC_REGEXP.test(value)) {
                return 'Invalid format of MAC address'
            }
            break
    }
}

export function CreateBareMetalAssetPage(props: {
    bmaSecretID?: string
}) {
    const { t } = useTranslation(['bma'])
    return (
        <Page>
            <AcmPageHeader title={t('createBareMetalAsset.title')} />
            <CreateBareMetalAssetPageData bmaSecretID={props.bmaSecretID}/>
        </Page>
    )
}

export function CreateBareMetalAssetPageData(props: {
    bmaSecretID?: string
}) {

    const testProject:Project = {
        apiVersion:'project.openshift.io/v1',
        kind:'Project',
        metadata:{
            name:'test'
        }
    }

    const projectsQuery = Projects()

    if (projectsQuery.loading) {
        return <AcmLoadingPage />
    } else if (projectsQuery.error) {
        return <ErrorPage error={projectsQuery.error} />
    } else if (!projectsQuery.data?.items || projectsQuery.data.items.length === 0) {
        return (
           <CreateBareMetalAssetPageContent
            projects={[testProject]}
            createBareMetalAsset={(bareMetalAsset: BareMetalAsset) => bareMetalAssets.create(bareMetalAsset)}
            bmaSecretID={props.bmaSecretID}
            />
        )
    }

    return (
        <CreateBareMetalAssetPageContent
            projects={projectsQuery.data.items}
            createBareMetalAsset={(bareMetalAsset: BareMetalAsset) => bareMetalAssets.create(bareMetalAsset)}
            bmaSecretID={props.bmaSecretID}
        />
    )
}

export function CreateBareMetalAssetPageContent(props: {
    projects: Project[]
    bmaSecretID?: string
    createBareMetalAsset: (input: BareMetalAsset) => Promise<unknown>
}) {
    const { t } = useTranslation(['bma'])
    const history = useHistory()

    const [bareMetalAsset, setBareMetalAsset] = useState<Partial<BareMetalAsset>>({
        kind: 'BareMetalAsset',
        apiVersion: 'inventory.open-cluster-management.io/v1alpha1',
        metadata: {
            name: '',
            namespace: ''
        },
        spec: {
            bmc: {
                address: '',
                credentialsName: ''
            },
            bootMac: ''
        },
    })
    function updateBareMetalAsset(update: (bareMetalAsset: Partial<BareMetalAsset>) => void) {
        const copy = { ...bareMetalAsset }
        update(copy)
        setBareMetalAsset(copy)
    }

    const [bmaSecret, setBMASecret] = useState<Partial<BMASecret>>({
        metadata: {},
        data: {
            password: '',
            username: ''
        }
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
                            secretName = name + '-bmc-secret-'+MakeId(props.bmaSecretID)
                            bmaSecrets.metadata!.name = secretName
                            return bareMetalAsset
                        })
                        updateBareMetalAsset((bareMetalAsset) => {
                            bareMetalAsset.metadata!.name = name
                            bareMetalAsset.spec!.bmc.credentialsName = secretName
                            return bareMetalAsset
                        })
                    }}
                    isRequired
                    validation={(value) => validateField(value, 'name')}
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
                            return bareMetalAsset
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
                    validation={(value) => validateField(value, 'address')}
                />
                <AcmTextInput
                    id="username"
                    label={t('createBareMetalAsset.username.label')}
                    placeholder={t('createBareMetalAsset.username.placeholder')}
                    value={bmaSecret.data!.username}
                    onChange={(username) => {
                        updateBMASecret((bmaSecret) => {
                            bmaSecret.data!.username = username
                        })
                    }}
                    isRequired
                />
                <AcmTextInput
                    id="password"
                    label={t('createBareMetalAsset.password.label')}
                    placeholder={t('createBareMetalAsset.password.placeholder')}
                    value={bmaSecret.data!.password}
                    onChange={(password) => {
                        updateBMASecret((bmaSecret) => {
                            bmaSecret.data!.password = password
                            //bareMetalAsset.password = password
                        })
                    }}
                    isRequired
                    type='password'
                />
                <AcmTextInput
                    id="bootMac"
                    label={t('createBareMetalAsset.bootMac.label')}
                    placeholder={t('createBareMetalAsset.bootMac.placeholder')}
                    value={bareMetalAsset.spec?.bootMac}
                    onChange={(bootMac) => {
                        updateBareMetalAsset((bareMetalAsset) => {
                            bareMetalAsset.spec!.bootMac = bootMac
                        })
                    }}
                    isRequired
                    validation={(value) => validateField(value, 'bootMac')}
                />

                <ActionGroup>
                    <AcmSubmit
                        id="submit"
                        variant="primary"
                        onClick={() => {
                            if (bmaSecret.data?.username) {
                                bmaSecret.data.username = Buffer.from(bmaSecret.data.username, 'ascii').toString(
                                    'base64'
                                )
                            }
                            if (bmaSecret.data?.password) {
                                bmaSecret.data.password = Buffer.from(bmaSecret.data.password, 'ascii').toString(
                                    'base64'
                                )
                            }

                            bmaSecrets.create(bmaSecret as BMASecret)
                            props.createBareMetalAsset(bareMetalAsset as BareMetalAsset).then(() => {
                                history.push(NavigationPath.baremetalAssets)
                            })
                        }}
                    >
                        Add connection
                    </AcmSubmit>
                    <Button
                        variant="link"
                        onClick={() => {
                            history.push(NavigationPath.baremetalAssets)
                        }}
                    >
                        Cancel
                    </Button>
                </ActionGroup>
            </AcmForm>
        </AcmPageCard>
    )
}
