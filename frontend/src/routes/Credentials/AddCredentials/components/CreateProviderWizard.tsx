/* Copyright Contributors to the Open Cluster Management project */
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { makeStyles } from '@material-ui/styles'
import {
    Button,
    Form,
    Grid,
    GridItem,
    PageSection,
    SelectOption,
    Title,
    Wizard,
    WizardStep,
} from '@patternfly/react-core'
import {
    AcmForm,
    AcmInlineProvider,
    AcmLabelsInput,
    AcmSelect,
    AcmTextInput,
    AcmTile,
    AcmIcon,
    AcmIconVariant,
    Provider,
    AcmButton,
} from '@open-cluster-management/ui-components'
import { Link } from 'react-router-dom'
import { NavigationPath } from '../../../../NavigationPath'
import {
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
} from '../../../../resources/provider-connection'
import { ProviderID, providers } from '../../../../lib/providers'
import { FeatureGate } from '../../../../resources/feature-gate'
import { validateKubernetesDnsName } from '../../../../lib/validation'
import { useRecoilState } from 'recoil'
import { featureGatesState, namespacesState, multiClusterHubState } from '../../../atoms'
import { Namespace } from '../../../../resources/namespace'
import { IRequestResult } from '../../../../lib/resource-request'
import {
    AnsibleTowerSecret,
    AnsibleTowerSecretApiVersion,
    AnsibleTowerSecretKind,
    createAnsibleTowerSecret,
} from '../../../../resources/ansible-tower-secret'
import { RouteComponentProps, useHistory } from 'react-router-dom'

export function CreateProviderWizard(props: {
    providerConnection: ProviderConnection
    projects: string[]
    discoveryFeatureGate: FeatureGate | undefined
    setProviderConnection: Function
}) {
    //const { t } = useTranslation(['connection', 'cluster', 'common', 'create'])
    const [currentStep, setCurrentStep] = useState(1)
    const [nextButtonName, setNextButtonName] = useState('Next')
    const [selectedCred, setSelectedCred] = useState('ans')
    const [secretName, setSecretName] = useState('')
    const [secretNamespace, setSecretNamespace] = useState('')

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

    useEffect(() => {
        console.log('secret update: ', ansibleSecret)
    }, [ansibleSecret])

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
        },
    })

    const [informationStep, setInformationStep] = useState<JSX.Element>(
        <AnsibleTowerInformationStep
            providerConnection={props.providerConnection}
            projects={props.projects}
            ansibleSecret={ansibleSecret}
            setAnsibleSecret={setAnsibleSecret}
        />
    )

    function updateAnsibleSecret(update: (ansibleSecret: AnsibleTowerSecret) => void) {
        const copy = { ...ansibleSecret }
        update(copy)
        setAnsibleSecret(copy)
    }

    function updateProviderConnection(update: (providerConnection: ProviderConnection) => void) {
        const copy = { ...providerConnection }
        update(copy)
        setProviderConnection(copy)
    }

    const [steps, setSteps] = useState<WizardStep[]>([
        {
            name: 'Basic Information',
            component: (
                <CredentialTypeStep
                    projects={props.projects}
                    providerConnection={props.providerConnection}
                    ansibleSecret={ansibleSecret}
                    setAnsibleSecret={setAnsibleSecret}
                />
            ),
        },
        {
            name: 'Details',
            component: informationStep,
        },
    ])

    const history = useHistory()

    function onNext() {
        const step = currentStep + 1
        console.log('step: ', step)
        setCurrentStep(step)
        // alter next step if provider connection is selected
        if (steps.length === step) {
            setNextButtonName('Save')
        }

        // console.log('printing selected cred', selectedCred)
    }

    function onBack() {
        const step = currentStep - 1
        setCurrentStep(step)
        console.log('checking back ansibleSecret: ', ansibleSecret)
        // alter next step if provider connection is selected
        if (step === 2) {
            setNextButtonName('Save')
        } else {
            setNextButtonName('Next')
        }
    }

    function onSave() {
        console.log('trying to create secret')
        //logic for secret creation and page redirect
        createAnsibleCredential(ansibleSecret)
            .then(() => {
                //history.push(NavigationPath.credentials)
            })
            .catch((err) => {
                /* istanbul ignore else */
                if (err instanceof Error) {
                    console.log(err)
                    // alertContext.addAlert({
                    //     type: 'danger',
                    //     title: t('common:request.failed'),
                    //     message: err.message,
                    // })
                }
            })
    }

    return (
        <PageSection variant="light" type="wizard" isFilled>
            <Wizard
                nextButtonText={nextButtonName}
                steps={steps}
                height={'1000'}
                onNext={onNext}
                onBack={onBack}
                onSave={onSave}
            />
        </PageSection>
    )
}

function CredentialTypeStep(props: {
    projects: string[]
    providerConnection: ProviderConnection
    ansibleSecret: AnsibleTowerSecret
    setAnsibleSecret: Function
}) {
    const { t } = useTranslation(['connection', 'cluster', 'common', 'create'])

    const [ansibleSecret, setAnsibleSecret] = useState<AnsibleTowerSecret>(props.ansibleSecret)

    function updateAnsibleSecret(update: (ansibleSecret: AnsibleTowerSecret) => void) {
        const copy = { ...ansibleSecret }
        update(copy)
        setAnsibleSecret(copy)
        props.setAnsibleSecret(copy)
    }

    return (
        <AcmForm>
            <Title headingLevel="h4" size="xl">
                Select the credential type and enter basic information
            </Title>
            <Title headingLevel="h6" size="md">
                Credential types*
            </Title>
            <Grid span={1} md={2} hasGutter={true}>
                <GridItem md={2}>
                    <AcmTile
                        title="Ansible Tower"
                        isStacked={true}
                        // onClick={() => {
                        //     setSelectedCred('ans')
                        //     console.log('testing  conditional: ', selectedCred === 'ans')
                        // }}
                        // isSelected={selectedCred === 'ans'}
                    >
                        {/* <div>
                            <AcmIcon icon={AcmIconVariant.cloud}></AcmIcon>
                        </div> */}
                    </AcmTile>
                </GridItem>
                <GridItem>
                    <AcmTile
                        title="Infrastructure Provider"
                        isStacked={true}
                        // onClick={() => {
                        //     setSelectedCred('prov')
                        //     console.log('testing  conditional: ', selectedCred === 'prov')
                        // }}
                        // isSelected={selectedCred === 'prov'}
                    >
                        {/* <div>
                            <AcmIcon icon={AcmIconVariant.cloud}></AcmIcon>
                        </div> */}
                    </AcmTile>
                </GridItem>
            </Grid>
            <AcmTextInput
                id="connectionName"
                label={t('addConnection.connectionName.label')}
                placeholder={t('addConnection.connectionName.placeholder')}
                labelHelp={t('addConnection.connectionName.labelHelp')}
                value={ansibleSecret.metadata.name}
                onChange={(name) => {
                    updateAnsibleSecret((ansibleSecret) => {
                        ansibleSecret.metadata.name = name
                    })
                    console.log('checking name: ', name)
                }}
            />
            <AcmSelect
                id="namespaceName"
                label={t('addConnection.namespaceName.label')}
                placeholder={t('addConnection.namespaceName.placeholder')}
                labelHelp={t('addConnection.namespaceName.labelHelp')}
                value={ansibleSecret.metadata.namespace}
                onChange={(namespace) => {
                    updateAnsibleSecret((ansibleSecret) => {
                        ansibleSecret.metadata.namespace = namespace
                    })
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

function AnsibleTowerInformationStep(props: {
    providerConnection: ProviderConnection
    projects: string[]
    ansibleSecret: AnsibleTowerSecret
    setAnsibleSecret: Function
}) {
    const [ansibleSecret, setAnsibleSecret] = useState<AnsibleTowerSecret>(props.ansibleSecret)
    function updateAnsibleSecret(update: (ansibleSecret: AnsibleTowerSecret) => void) {
        const copy = { ...ansibleSecret }
        update(copy)
        setAnsibleSecret(copy)
        props.setAnsibleSecret(copy)
    }

    const { t } = useTranslation(['connection', 'cluster', 'common', 'create'])
    return (
        <AcmForm>
            <Title headingLevel="h4" size="xl">
                Enter Credential Information
            </Title>
            <AcmTextInput
                id="ansibleSecretName"
                label={t('addConnection.ansible.secretname.label')}
                placeholder={t('addConnection.ansible.secretname.placeholder')}
                labelHelp={t('')}
                value={props.ansibleSecret.metadata.name}
                onChange={(name) => {
                    updateAnsibleSecret((ansibleSecret) => {
                        ansibleSecret.metadata.name = name
                    })
                }}
                // validation={(value) => validateKubernetesDnsName(value, 'Connection name', t)}
                // isRequired
                // isDisabled={isEditing()}
            />
            <AcmTextInput
                id="ansibleHostName"
                label={t('addConnection.ansible.host.label')}
                placeholder={t('addConnection.ansible.host.placeholder')}
                labelHelp={t('')}
                value={props.ansibleSecret.spec!.host}
                onChange={(host) => {
                    updateAnsibleSecret((ansibleSecret) => {
                        ansibleSecret.spec!.host = host
                    })
                }}
                // validation={(value) => validateKubernetesDnsName(value, 'Connection name', t)}
                // isRequired
            />
            <AcmTextInput
                id="ansibleToken"
                label={t('addConnection.ansible.token.label')}
                placeholder={t('addConnection.ansible.token.placeholder')}
                labelHelp={t('')}
                value={props.ansibleSecret.spec!.token}
                onChange={(token) => {
                    updateAnsibleSecret((ansibleSecret) => {
                        ansibleSecret.spec!.token = token
                    })
                }}
                validation={(value) => validateKubernetesDnsName(value, 'Connection name', t)}
                isRequired
            />
        </AcmForm>
    )
}

function createAnsibleCredential(ansibleSecret: AnsibleTowerSecret) {
    const result = createAnsibleTowerSecret(ansibleSecret)
    return result.promise
}
