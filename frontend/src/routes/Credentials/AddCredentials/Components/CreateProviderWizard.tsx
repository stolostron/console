/* Copyright Contributors to the Open Cluster Management project */

import { AcmForm, AcmSelect, AcmTextInput } from '@open-cluster-management/ui-components'
import {
    Card,
    CardBody,
    CardHeader,
    FormGroup,
    Gallery,
    GalleryItem,
    SelectOption,
    Title,
    Wizard,
    WizardStep,
} from '@patternfly/react-core'
import { CloudIcon, RedhatIcon } from '@patternfly/react-icons'
import { Dispatch, SetStateAction, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { ProviderID } from '../../../../lib/providers'
import { NavigationPath } from '../../../../NavigationPath'
import {
    AnsibleTowerSecret,
    AnsibleTowerSecretApiVersion,
    AnsibleTowerSecretKind,
    createAnsibleTowerSecret,
} from '../../../../resources/ansible-tower-secret'
import { FeatureGate } from '../../../../resources/feature-gate'
import { MultiClusterHub } from '../../../../resources/multi-cluster-hub'
import {
    createProviderConnection,
    getProviderConnectionProviderID,
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
    setProviderConnectionProviderID,
} from '../../../../resources/provider-connection'
import AnsibleTowerSecretForm from './AnsibleTowerSecretForm'
import CloudConnectionForm, { CloudConnectionIntegrationForm } from './CloudConnectionForm'

/*
TODO:
-  Wizard Validation/Alerts
*/

enum CredentialType {
    cloudProvider = 'prov',
    ansible = 'ans',
}

export function CreateProviderWizard(props: {
    projects: string[]
    discoveryFeatureGate: FeatureGate | undefined
    multiClusterHubs: MultiClusterHub[]
    ansibleSecrets: AnsibleTowerSecret[]
}) {
    const [currentStep, setCurrentStep] = useState(1)
    const [nextButtonName, setNextButtonName] = useState('Next')
    const [currentCredentialType, setCurrentCredentialType] = useState(CredentialType.ansible)
    const [initialSecretMeta, setInitialSecretMeta] = useState({ name: '', namespace: '' })

    const [ansibleSecret, setAnsibleSecret] = useState<AnsibleTowerSecret>({
        apiVersion: AnsibleTowerSecretApiVersion,
        kind: AnsibleTowerSecretKind,
        metadata: {
            name: '',
            namespace: '',
        },
        spec: {
            host: '',
            token: '',
        },
    })

    const [providerConnection, setProviderConnection] = useState<ProviderConnection>({
        apiVersion: ProviderConnectionApiVersion,
        kind: ProviderConnectionKind,
        metadata: {
            name: '',
            namespace: '',
        },
        spec: {
            awsAccessKeyID: '',
            awsSecretAccessKeyID: '',

            baseDomainResourceGroupName: '',
            clientId: '',
            clientSecret: '',
            subscriptionId: '',
            tenantId: '',

            gcProjectID: '',
            gcServiceAccountKey: '',

            username: '',
            password: '',
            vcenter: '',
            cacertificate: '',
            vmClusterName: '',
            datacenter: '',
            datastore: '',

            libvirtURI: '',
            sshKnownHosts: [''],
            imageMirror: '',
            bootstrapOSImage: '',
            clusterOSImage: '',
            additionalTrustBundle: '',

            baseDomain: '',
            pullSecret: '',
            sshPrivatekey: '',
            sshPublickey: '',

            ocmAPIToken: '',

            anisibleSecretName: '',
            anisibleCuratorTemplateName: '',
        },
    })

    const [credentialInputstep, setCredentialInputstep] = useState<JSX.Element>(
        <AnsibleTowerSecretForm projects={props.projects} ansibleSecret={ansibleSecret} isEditing={false} />
    )

    const steps = useMemo<WizardStep[]>(
        () => [
            {
                name: 'Basic Information',
                component: (
                    <CredentialTypeStep
                        projects={props.projects}
                        providerConnection={providerConnection}
                        ansibleSecret={ansibleSecret}
                        setAnsibleSecret={setAnsibleSecret}
                        setProviderConnection={setProviderConnection}
                        setCredentialInputstep={setCredentialInputstep}
                        currentCredentialType={currentCredentialType}
                        setCurrentCredentialType={setCurrentCredentialType}
                        initialSecretMeta={initialSecretMeta}
                        setInitialSecretMeta={setInitialSecretMeta}
                        multiClusterHubs={props.multiClusterHubs}
                        discoveryFeatureGate={props.discoveryFeatureGate}
                    />
                ),
            },
            {
                name: 'Details',
                component: credentialInputstep,
            },
        ],
        [
            currentCredentialType,
            ansibleSecret,
            credentialInputstep,
            initialSecretMeta,
            props.discoveryFeatureGate,
            props.multiClusterHubs,
            props.projects,
            providerConnection,
        ]
    )

    function onNext() {
        const step = currentStep + 1
        if (currentCredentialType === CredentialType.cloudProvider && step === 2) {
            steps.push({
                name: 'Integration (Optional)',
                component: (
                    <CloudConnectionIntegrationForm
                        ansibleSecrets={props.ansibleSecrets}
                        providerConnection={providerConnection}
                    />
                ),
            })
        }
        setCurrentStep(step)
        if (steps.length === step) {
            setNextButtonName('Save')
        }
    }

    function onBack() {
        const step = currentStep - 1
        if (currentCredentialType === CredentialType.cloudProvider && currentStep === 2) steps.pop()

        setCurrentStep(step)
        if (nextButtonName !== 'Next') {
            setNextButtonName('Next')
        }
    }
    const history = useHistory()

    function onSave() {
        //logic for secret creation and page redirect
        switch (currentCredentialType) {
            case CredentialType.ansible:
                // code block
                createAnsibleCredential(ansibleSecret)
                    .then(() => {
                        history.push(NavigationPath.credentials)
                    })
                    .catch((err) => {
                        /* istanbul ignore else */
                        // Wizard must manage alert context
                        if (err instanceof Error) {
                            console.log(err)
                        }
                    })
                break
            case CredentialType.cloudProvider:
                // code block
                submitProviderConnection(providerConnection)
                    .then(() => {
                        history.push(NavigationPath.credentials)
                    })
                    .catch((err) => {
                        /* istanbul ignore else */
                        // Wizard must manage alert context
                        if (err instanceof Error) {
                            console.log(err)
                        }
                    })
                break
            default:
        }
    }

    return (
        <Wizard
            nextButtonText={nextButtonName}
            steps={steps}
            onNext={onNext}
            onBack={onBack}
            onSave={onSave}
            onClose={() => history.push(NavigationPath.credentials)}
        />
    )
}

function CredentialTypeStep(props: {
    projects: string[]
    providerConnection: ProviderConnection
    ansibleSecret: AnsibleTowerSecret
    setAnsibleSecret: Function
    setProviderConnection: Function
    setCredentialInputstep: Function
    currentCredentialType: CredentialType
    setCurrentCredentialType: Dispatch<SetStateAction<CredentialType>>
    initialSecretMeta: {}
    setInitialSecretMeta: Function
    multiClusterHubs: MultiClusterHub[]
    discoveryFeatureGate: FeatureGate | undefined
}) {
    const { t } = useTranslation(['connection', 'cluster', 'common', 'create'])

    const [ansibleSecret, setAnsibleSecret] = useState<AnsibleTowerSecret>(props.ansibleSecret)
    const [providerConnection, setProviderConnection] = useState<ProviderConnection>(props.providerConnection)

    const { currentCredentialType, setCurrentCredentialType } = props
    const [currentCredentialInputMetadata, setCurrentCredentialInputMetadata] = useState(() => {
        switch (currentCredentialType) {
            case CredentialType.ansible:
                return ansibleSecret.metadata
                break
            case CredentialType.cloudProvider:
                return providerConnection.metadata
                break
        }
    })

    function updateAnsibleSecret(update: (ansibleSecret: AnsibleTowerSecret) => void) {
        const copy = { ...ansibleSecret }
        update(copy)
        setAnsibleSecret(copy)
        props.setAnsibleSecret(copy)
    }

    function updateProviderConnection(update: (providerConnection: ProviderConnection) => void) {
        const copy = { ...providerConnection }
        update(copy)
        setProviderConnection(copy)
        props.setProviderConnection(copy)
    }

    function onClickCredentialCard(credentialType: CredentialType, setCredentialInputstep: Function) {
        setCurrentCredentialType(credentialType)

        switch (credentialType) {
            case CredentialType.ansible:
                setCredentialInputstep(
                    <AnsibleTowerSecretForm projects={props.projects} ansibleSecret={ansibleSecret} isEditing={false} />
                )
                setCurrentCredentialInputMetadata(ansibleSecret.metadata)
                break
            case CredentialType.cloudProvider:
                setCredentialInputstep(
                    <CloudConnectionForm
                        providerConnection={providerConnection}
                        projects={props.projects}
                        discoveryFeatureGate={props.discoveryFeatureGate}
                        multiClusterHubs={props.multiClusterHubs}
                        isEditing={false}
                    />
                )
                setCurrentCredentialInputMetadata(providerConnection.metadata)
                break
            default:
        }
    }

    return (
        // TODO: replace RedhatIcon, & CloudIcon with correct icon varient
        <AcmForm>
            <Title headingLevel="h4" size="xl">
                {t('addConnection.wizard.title')}
            </Title>
            <FormGroup fieldId={'credential-card-form'} label={t('addConnection.wizard.credentialtype')}>
                <Gallery hasGutter>
                    <GalleryItem>
                        <Card
                            id="ansible.card"
                            isSelectable
                            isSelected={currentCredentialType === CredentialType.ansible}
                            onClick={() => {
                                onClickCredentialCard(CredentialType.ansible, props.setCredentialInputstep)
                            }}
                        >
                            <CardHeader>
                                <RedhatIcon size="xl" />
                            </CardHeader>
                            <CardBody>Ansible Tower</CardBody>
                        </Card>
                    </GalleryItem>
                    <GalleryItem>
                        <Card
                            id="provider.card"
                            isSelectable
                            isSelected={currentCredentialType === CredentialType.cloudProvider}
                            onClick={() => {
                                onClickCredentialCard(CredentialType.cloudProvider, props.setCredentialInputstep)
                            }}
                        >
                            <CardHeader>
                                <CloudIcon size="xl" />
                            </CardHeader>
                            <CardBody>Infrastructure Provider</CardBody>
                        </Card>
                    </GalleryItem>
                </Gallery>
            </FormGroup>
            <AcmTextInput
                id="connectionName"
                label={t('addConnection.connectionName.label')}
                placeholder={t('addConnection.connectionName.placeholder')}
                labelHelp={t('addConnection.connectionName.labelHelp')}
                value={currentCredentialInputMetadata.name}
                onChange={(name) => {
                    switch (currentCredentialType) {
                        case CredentialType.ansible:
                            updateAnsibleSecret((ansibleSecret) => {
                                ansibleSecret.metadata.name = name
                            })
                            break
                        case CredentialType.cloudProvider:
                            updateProviderConnection((providerConnection) => {
                                providerConnection.metadata.name = name
                            })
                            break
                    }
                }}
            />
            <AcmSelect
                id="namespaceName"
                label={t('addConnection.namespaceName.label')}
                placeholder={t('addConnection.namespaceName.placeholder')}
                labelHelp={t('addConnection.namespaceName.labelHelp')}
                value={currentCredentialInputMetadata.namespace}
                onChange={(namespace) => {
                    switch (currentCredentialType) {
                        case CredentialType.ansible:
                            updateAnsibleSecret((ansibleSecret) => {
                                ansibleSecret.metadata.namespace = namespace
                            })
                            break
                        case CredentialType.cloudProvider:
                            updateProviderConnection((providerConnection) => {
                                providerConnection.metadata.namespace = namespace
                            })
                            break
                    }
                }}
            >
                {props.projects.map((project) => (
                    <SelectOption key={project} value={project}>
                        {project}
                    </SelectOption>
                ))}
            </AcmSelect>
        </AcmForm>
    )
}

function createAnsibleCredential(ansibleSecret: AnsibleTowerSecret) {
    const result = createAnsibleTowerSecret(ansibleSecret)
    return result.promise
}

function submitProviderConnection(providerConnection: ProviderConnection) {
    const data = JSON.parse(JSON.stringify(providerConnection))
    const providerID = getProviderConnectionProviderID(data)
    setProviderConnectionProviderID(providerConnection, providerID as ProviderID)
    if (providerID !== ProviderID.AWS) {
        delete data.spec!.awsAccessKeyID
        delete data.spec!.awsSecretAccessKeyID
    }
    if (providerID !== ProviderID.AZR) {
        delete data.spec!.baseDomainResourceGroupName
        delete data.spec!.clientId
        delete data.spec!.clientSecret
        delete data.spec!.subscriptionId
        delete data.spec!.tenantId
    }
    if (providerID !== ProviderID.BMC) {
        delete data.spec!.libvirtURI
        delete data.spec!.sshKnownHosts
        delete data.spec!.imageMirror
        delete data.spec!.bootstrapOSImage
        delete data.spec!.clusterOSImage
        delete data.spec!.additionalTrustBundle
    }
    if (providerID !== ProviderID.GCP) {
        delete data.spec!.gcProjectID
        delete data.spec!.gcServiceAccountKey
    }
    if (providerID !== ProviderID.VMW) {
        delete data.spec!.username
        delete data.spec!.password
        delete data.spec!.vcenter
        delete data.spec!.cacertificate
        delete data.spec!.vmClusterName
        delete data.spec!.datacenter
        delete data.spec!.datastore
    }
    if (providerID !== ProviderID.RHOCM) {
        delete data.spec!.ocmAPIToken
    }
    delete data.data

    return createProviderConnection(data).promise
}
