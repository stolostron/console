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
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory, useLocation, RouteComponentProps, } from 'react-router-dom'
import { ErrorPage } from '../../components/ErrorPage'
import { BareMetalAsset, BMASecret, MakeId } from '../../../src/resources/bare-metal-asset'
import { createResource, patchResource, getResource, IRequestResult, listClusterResources } from '../../../src/lib/resource-request'
import { Project, listProjects } from '../../resources/project'
import { Secret } from '../../resources/secret'
import { NavigationPath } from '../../NavigationPath'
import { useQuery } from '../../lib/useQuery'

const VALID_BOOT_MAC_REGEXP = /^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$/
const VALID_BMC_ADDR_REGEXP = new RegExp(
    '^((ipmi|idrac|idrac\\+http|idrac-virtualmedia|irmc|redfish|redfish\\+http|redfish-virtualmedia|ilo5-virtualmedia|https?|ftp):\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3})|' + // OR ip (v4) address
        '\\[?(([0-9a-f]{1,4}:){7,7}[0-9a-f]{1,4}|([0-9a-f]{1,4}:){1,7}:|([0-9a-f]{1,4}:){1,6}:[0-9a-f]{1,4}|([0-9a-f]{1,4}:){1,5}(:[0-9a-f]{1,4}){1,2}|([0-9a-f]{1,4}:){1,4}(:[0-9a-f]{1,4}){1,3}|([0-9a-f]{1,4}:){1,3}(:[0-9a-f]{1,4}){1,4}|([0-9a-f]{1,4}:){1,2}(:[0-9a-f]{1,4}){1,5}|[0-9a-f]{1,4}:((:[0-9a-f]{1,4}){1,6})|:((:[0-9a-f]{1,4}){1,7}|:)|fe80:(:[0-9a-f]{0,4}){0,4}%[0-9a-z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])]))\\]?' + // OR ip (v6) address
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
        case 'bootMACAddress':
            if (!VALID_BOOT_MAC_REGEXP.test(value)) {
                return t("createBareMetalAsset.form.invalidMacAddress")
            }
            break
    }
}

async function getBareMetalAsset(name:string, namespace: string){
    let bareMetalAsset: BareMetalAsset = {
        kind: 'BareMetalAsset',
        apiVersion: 'inventory.open-cluster-management.io/v1alpha1',
        metadata: {
            name: name,
            namespace: namespace,
        },
        spec: {
            bmc: {
                address: '',
                credentialsName: '',
            },
            bootMACAddress: '',
        },
    }
    const metadata = {
        name: name,
        namespace: namespace,
    }

    return getResource<BareMetalAsset>({kind: 'BareMetalAsset', apiVersion: 'inventory.open-cluster-management.io/v1alpha1', metadata}).promise
}

function getBMASecret(name:string, namespace: string){
    const metadata = {
        name: name,
        namespace: namespace,
    }
    return getResource<Secret>({kind: 'Secret', apiVersion: 'v1', metadata:metadata}).promise
}

export default function CreateBareMetalAssetPage({ match }: RouteComponentProps<{ id: string }>, props: { bmaSecretID?: string }) {
    const { t } = useTranslation(['bma'])
    let path: Array<string>  
    let editAssetName:string = ''
    let editAssetNamespace: string = ''

    path = useLocation().pathname.split('/').reverse()
    console.log('check path: ', path)
    if(path[0] === 'edit'){
        editAssetName = path[1]
        editAssetNamespace = path[2]

        return(
            <Page>
                <AcmPageHeader title={t('createBareMetalAsset.title')} />
                <EditBareMetalAssetPageData bmaSecretID={props.bmaSecretID} editAssetName={editAssetName} editAssetNamespace={editAssetNamespace}/>
            </Page>
        )
    } 
        return (
            <Page>
                <AcmPageHeader title={t('createBareMetalAsset.title')} />
                <CreateBareMetalAssetPageData bmaSecretID={props.bmaSecretID} />
            </Page>
        )
}

export function EditBareMetalAssetPageData(props: { bmaSecretID?: string, editAssetName:string,  editAssetNamespace: string }) {
    const assetMetadata = {
        name: props.editAssetName,
        namespace: props.editAssetNamespace,
    }
    let secretMetadata
    type EditData = {
        projects: Array<Project>
        bareMetalAsset: BareMetalAsset
        secret: Secret
    }
    
    const [projects, setProjects] = useState<Array<Project>>()
    const [bareMetalAsset, setBareMetalAsset] = useState<BareMetalAsset>()
    const [secret, setSecret] = useState<Secret>()
    const [resourceError, setError] = useState<Error>()
    
    const [BMAObjects, setObjects] = useState<EditData>()

    useEffect(() => {
        let proj: Array<Project>
        let bma: BareMetalAsset
        let sec: Secret
        let resultSecret: Promise<Secret>
        console.log('returning secret')
        const resultProjects = listClusterResources<Project>({kind:'Project', apiVersion:'project.openshift.io/v1'})
        resultProjects.promise.then(r=>{
            //setProjects(r)
            proj = r
            console.log('checking projects: ', proj)
        }).catch(e=>{
            setError(e)
        })
        
        //const resultBMA = getResource<BareMetalAsset>({kind: 'BareMetalAsset', apiVersion: 'inventory.open-cluster-management.io/v1alpha1', metadata:assetMetadata}) //
        const resultBMA = getBareMetalAsset(assetMetadata.name, assetMetadata.namespace)
        resultBMA.then(r=>{
            //setBareMetalAsset(r)
            bma = r
            console.log('checking bma: ', bma)

            secretMetadata = {
                name: bma!.spec?.bmc.credentialsName,
                namespace: props.editAssetNamespace,
            }
            resultSecret = getBMASecret(secretMetadata.name!, secretMetadata.namespace)
            resultSecret!.then(r=>{
                //setSecret(r)
                sec = r
                console.log('checking sec: ', sec)
                
                setObjects({projects:proj, bareMetalAsset:bma, secret:sec})
            }).catch(e => setError(e))
           
        }).catch(e => setError(e)) //catch error, add to error object and output it

        
        //const resultSecret = getResource<Secret>({kind: 'Secret', apiVersion: 'v1', metadata:{name:bareMetalAsset?.spec?.bmc.credentialsName, namespace:bareMetalAsset?.metadata.namespace}})
    }, [])
    const { t } = useTranslation(['bma'])
    
    if (secret?.metadata.name){
        setError(undefined)
    }
    console.log('checking secret name, outside of useEffect: ', BMAObjects?.secret.metadata.name)

    if (resourceError) {
        return <ErrorPage error={resourceError} />
    } else if (!BMAObjects) {
        return <AcmLoadingPage />
    } else if (BMAObjects.projects.length === 0) {
        return (
            <AcmPageCard>
                <AcmEmptyState title={t("createBareMetalAsset.emptyState.Namespaces.title")} message={t("createBareMetalAsset.emptyState.Namespaces.title")} />
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
    editBareMetalAsset?: BareMetalAsset
    editSecret?: Secret
}) {
    console.log('entering page content func')
    const { t } = useTranslation(['bma'])
    const history = useHistory()
    let isEdit = false

    // ToDo: Prefill this when editing BMA
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

    let [bmaSecret, setBMASecret] = useState<Partial<BMASecret>>({
        kind: 'Secret',
        apiVersion: 'v1',
        metadata: {},
        stringData: {
            password: '',
            username: '',
        },
        data:{
            password:'',
            username:'',
        },
    })

    let [bmaEditSecret, setEditBMASecret] = useState<Partial<BMASecret>>({
        kind: 'Secret',
        apiVersion: 'v1',
        data:{
            password:'',
            username:'',
        },
    })


    function updateBareMetalAsset(update: (bareMetalAsset: Partial<BareMetalAsset>) => void) {
        const copy = { ...bareMetalAsset }
        update(copy)
        setBareMetalAsset(copy)
    }
    function updateBMASecret(update: (bmaSecret: Partial<BMASecret>) => void) {
        const copy = { ...bmaSecret }
        update(copy)
        setBMASecret(copy)
    }
    function updateEditBMASecret(update: (bmaSecret: Partial<BMASecret>) => void) {
        const copy = { ...bmaSecret }
        update(copy)
        setEditBMASecret(copy)
    }
    if(props.editBareMetalAsset) isEdit = true

    // console.log('checking secret data',Object.values(props.editSecret!.data!))
    // console.log('checking secret data ',atob(props.editSecret!.data!['password']))
    //const password = atob(bmaSecret.data)
    useEffect(()=> {
        console.log('testing out')
        if(props.editBareMetalAsset){
            console.log('testing out II')
            isEdit = true
            
            updateBareMetalAsset(bareMetalAsset => {
                bareMetalAsset.metadata!.namespace = props.editBareMetalAsset?.metadata.namespace
                bareMetalAsset.metadata!.name = props.editBareMetalAsset?.metadata.name
                bareMetalAsset.spec!.bootMACAddress = props.editBareMetalAsset?.spec?.bootMACAddress!
                bareMetalAsset.spec!.bmc.address = props.editBareMetalAsset?.spec?.bmc.address!
            })

            updateBMASecret(bmaSecret => {
                bmaSecret.metadata!.name = props.editSecret?.metadata.name
                bmaSecret.metadata!.namespace = props.editSecret?.metadata.namespace
                bmaSecret.stringData!.password = atob(props.editSecret!.data!['password'])
                bmaSecret.stringData!.username = atob(props.editSecret!.data!['username'])
            })

            updateEditBMASecret(bmaEditSecret => {
                bmaEditSecret.data!.password = btoa(props.editSecret!.data!['password'])
                bmaEditSecret.data!.username = btoa(props.editSecret!.data!['username'])

            })
        }
    }, [])
    console.log('edit struc user: ', bmaEditSecret.data!.username)

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
                        if(isEdit){
                            updateEditBMASecret((bmaEditSecret) => {
                                bmaEditSecret.data!.username = btoa(username)
                            })
                        }
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
                        if(isEdit){
                            updateEditBMASecret((bmaEditSecret) => {
                                bmaEditSecret.data!.password = btoa(password)
                            })
                        }
                        updateBMASecret((bmaSecret) => {
                            bmaSecret.stringData!.password = password
                        })
                    }}
                    isRequired
                    type='password'
                />
                <AcmTextInput
                    id='bootMACAddress'
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

                <ActionGroup>
                    <AcmSubmit
                        id='submit'
                        variant='primary'
                        onClick={() => {
                            if(isEdit){
                                console.log('is edit true: ', isEdit)
                                console.log('checking new secret contents: ', bmaEditSecret)

                                const  bodyFormData = JSON.stringify([{'data': bmaEditSecret.data}])
                                patchResource(bmaEditSecret as Secret, bodyFormData).promise.then(() => {
                                    patchResource(bareMetalAsset as BareMetalAsset, bareMetalAsset).promise.then(() => {
                                    })
                                })
                            }
                            else{
                                createResource(bmaSecret as BMASecret).promise.then(() => {
                                    props.createBareMetalAsset(bareMetalAsset as BareMetalAsset).promise.then(() => {
                                        history.push(NavigationPath.bareMetalAssets)
                                    })
                                })
                            }
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
