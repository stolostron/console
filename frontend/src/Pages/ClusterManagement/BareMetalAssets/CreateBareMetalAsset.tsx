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

export function CreateBareMetalAssetPage() {
    const { t } = useTranslation(['bma'])
    return (
        <Page>
            <AcmPageHeader title={t('createBareMetalAsset.title')} />
            <CreateBareMetalAssetPageData />
        </Page>
    )
}

export function CreateBareMetalAssetPageData() {
    const projectsQuery = Projects()

    if (projectsQuery.loading) {
        return <AcmLoadingPage />
    } else if (projectsQuery.error) {
        return <ErrorPage error={projectsQuery.error} />
    } else if (!projectsQuery.data?.items || projectsQuery.data.items.length === 0) {
        return (
            <AcmPageCard>
                <AcmEmptyState title="No namespaces found." message="No namespaces found." />
            </AcmPageCard>
        )
    }

    return (
        <CreateBareMetalAssetPageContent
            projects={projectsQuery.data.items}
            createBareMetalAsset={(bareMetalAsset: BareMetalAsset) =>
                bareMetalAssets.create(bareMetalAsset)
            }
        />
    )
}

export function CreateBareMetalAssetPageContent(props: {
    projects: Project[]
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
                credentialsName: '',
            },
            bootMac: '',
        }
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
                            secretName = name+'-bmc-secret-'+MakeId(5)
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
                >
                </AcmTextInput>
                <AcmSelect
                    id="namespaceName"
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
                    id="baseDomainResourceGroupName"
                    label={t('createBareMetalAsset.address.label')}
                    placeholder={t('createBareMetalAsset.address.placeholder')}
                    value={bareMetalAsset.spec?.bmc.address}
                    onChange={(address) => {
                        updateBareMetalAsset((bareMetalAsset) => {
                            bareMetalAsset.spec!.bmc.address = address
                        })
                    }}
                    isRequired
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
                />

                <ActionGroup>
                    <AcmSubmit
                        id="submit"
                        variant="primary"
                        onClick={() => {

                            if (bmaSecret.data?.username) {
                                bmaSecret.data.username = Buffer.from(bmaSecret.data.username, 'ascii').toString('base64')
                            }
                            if (bmaSecret.data?.password) {
                                bmaSecret.data.password = Buffer.from(bmaSecret.data.password, 'ascii').toString('base64')
                            }
                            
                            bmaSecrets.create(bmaSecret as BMASecret)
                            props.createBareMetalAsset(bareMetalAsset as BareMetalAsset).then(() => {
                                history.push(NavigationPath.baremetalAssets)
                            })
                        }
                    }
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
