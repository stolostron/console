import {
    AcmEmptyState,
    AcmExpandableSection,
    AcmForm,
    AcmLabelsInput,
    AcmLoadingPage,
    AcmPage,
    AcmPageCard,
    AcmPageHeader,
    AcmSelect,
    AcmTextInput,
} from '@open-cluster-management/ui-components'
import { ActionGroup, Button, Form, FormGroup, TextInput } from '@patternfly/react-core'
import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { ErrorPage } from '../../../components/ErrorPage'
import { client } from '../../../lib/apollo-client'
import { providers } from '../../../lib/providers'
import {
    ClusterDeploymentInput,
    ClusterImageSet,
    ProviderConnection,
    useClusterImageSetsQuery,
    useCreateClusterDeploymentMutation,
    useProviderConnectionsQuery,
} from '../../../sdk'
import { NavigationPath } from '../ClusterManagement'

export function CreateClusterPage() {
    return (
        <AcmPage>
            <AcmPageHeader title="Create Cluster" />
            <CreateClusterPageData />
        </AcmPage>
    )
}

export function CreateClusterPageData() {
    const providerConnectionsQuery = useProviderConnectionsQuery({ client })
    const clusterImageSetsQuery = useClusterImageSetsQuery({ client })
    const [createClusterDeployment] = useCreateClusterDeploymentMutation({ client })

    if (providerConnectionsQuery.loading || clusterImageSetsQuery.loading) {
        return <AcmLoadingPage />
    } else if (providerConnectionsQuery.error) {
        return <ErrorPage error={providerConnectionsQuery.error} />
    } else if (clusterImageSetsQuery.error) {
        return <ErrorPage error={clusterImageSetsQuery.error} />
    } else if (
        !providerConnectionsQuery.data?.providerConnections ||
        providerConnectionsQuery.data?.providerConnections.length === 0
    ) {
        return (
            <AcmEmptyState
                title="No provider connections found."
                message="No provider connections found."
                action="Create connection"
            />
        )
    } else if (
        !clusterImageSetsQuery.data?.clusterImageSets ||
        clusterImageSetsQuery.data?.clusterImageSets.length === 0
    ) {
        return <AcmPageCard><AcmEmptyState title="No image sets found." message="No image sets clusters found." /></AcmPageCard>
    }

    return (
        <CreateClusterPageContent
            clusterImageSets={clusterImageSetsQuery.data?.clusterImageSets as ClusterImageSet[]}
            providerConnections={providerConnectionsQuery.data?.providerConnections as ProviderConnection[]}
            createClusterDeployment={async (input: ClusterDeploymentInput) => {
                await createClusterDeployment({ variables: { input } })
                return true
            }}
        ></CreateClusterPageContent>
    )
}

export function CreateClusterPageContent(props: {
    providerConnections: ProviderConnection[]
    clusterImageSets: ClusterImageSet[]
    createClusterDeployment: (input: ClusterDeploymentInput) => Promise<boolean>
}) {
    const history = useHistory()

    const [clusterDeploymentInput, setClusterDeploymentInput] = useState<Partial<ClusterDeploymentInput>>({})
    function updateClusterDeploymentInput(state: Partial<ClusterDeploymentInput>) {
        setClusterDeploymentInput({ ...clusterDeploymentInput, ...state })
    }

    // useEffect(() => {
    //     if (!providerConnectionName && props.secrets.length === 1) {
    //         if (providerConnectionName !== props.secrets[0].metadata.name) {
    //             setProviderConnectionName(props.secrets[0].metadata.name)
    //         }
    //     }
    // }, [providerConnectionName, props.secrets])

    // const [clusterImageSets, setClusterImageSets] = useState<ClusterImageSet[] | undefined>()
    // useEffect(() => {
    //     if (!providerName) {
    //         setClusterImageSets(undefined)
    //         return
    //     }

    //     const filtered = props.clusterImageSets
    //     const sorted = filtered // .sort()
    //     setClusterImageSets(sorted)
    // }, [providerName, props.clusterImageSets])

    // const [clusterImageIsOpen, setClusterImageIsOpen] = useState(false)
    // useEffect(() => {
    //     if (!clusterImageSets) {
    //         setClusterImageSetName(undefined)
    //         return
    //     }
    //     if (clusterImageSetName) {
    //         if (!clusterImageSets.find((clusterImageSet) => clusterImageSet.metadata.name === clusterImageSetName)) {
    //             setClusterImageSetName(undefined)
    //         }
    //     }
    //     if (!clusterImageSetName && clusterImageSets.length > 0) {
    //         setClusterImageSetName(clusterImageSets[clusterImageSets.length - 1].metadata.name)
    //     }
    // }, [clusterImageSetName, clusterImageSets])

    return (
        <AcmPageCard>
            <AcmForm>
                <AcmSelect
                    id="providerName"
                    label="Provider"
                    value={clusterDeploymentInput.providerName}
                    onChange={(providerName) => updateClusterDeploymentInput({ providerName })}
                    options={providers.map((provider) => provider.name)}
                    placeholder="Select a provider on which to provision the cluster"
                    required
                />

                <AcmSelect
                    id="providerConnectionName"
                    label="Provider Connection"
                    value={clusterDeploymentInput.providerConnectionName}
                    onChange={(providerConnectionName) => updateClusterDeploymentInput({ providerConnectionName })}
                    options={props.providerConnections.map((secret) => secret.metadata.name)}
                    placeholder="Select a provider connection"
                    hidden={!clusterDeploymentInput.providerName}
                    required
                />

                <AcmSelect
                    id="clusterImageSetName"
                    label="Release"
                    value={clusterDeploymentInput.clusterImageSetName}
                    onChange={(clusterImageSetName) => updateClusterDeploymentInput({ clusterImageSetName })}
                    options={props.clusterImageSets.map((clusterImageSet) => clusterImageSet.metadata.name)}
                    placeholder="Select a release"
                    required
                    hidden={!clusterDeploymentInput.providerConnectionName}
                />

                <AcmTextInput
                    label="Cluster Name"
                    id="clusterName"
                    value={clusterDeploymentInput.clusterName}
                    onChange={(clusterName) => updateClusterDeploymentInput({ clusterName })}
                    placeholder={'Enter a name for the cluster'}
                    required
                    hidden={!clusterDeploymentInput.clusterImageSetName}
                />

                <AcmTextInput
                    id="baseDomain"
                    label="Base DNS domain"
                    value={clusterDeploymentInput.baseDomain}
                    onChange={(baseDomain) => updateClusterDeploymentInput({ baseDomain })}
                    placeholder={'Enter the base domain for the cluster'}
                    hidden={!clusterDeploymentInput.clusterName}
                    required
                />

                <AcmExpandableSection
                    label="Node Pools"
                    hidden={
                        !clusterDeploymentInput.baseDomain ||
                        ['Bare Metal'].includes(clusterDeploymentInput.providerName as string)
                    }
                    summary="master pool, worker pool in us-east"
                >
                    <FormGroup label="Region" isRequired fieldId="simple-form-name">
                        <TextInput isRequired id="simple-form-name" name="simple-form-name" />
                    </FormGroup>
                </AcmExpandableSection>

                <AcmExpandableSection label="Networking" hidden={!clusterDeploymentInput.baseDomain}>
                    <Form>
                        <FormGroup label="Network type" isRequired fieldId="simple-form-name">
                            <TextInput isRequired id="simple-form-name" name="simple-form-name" />
                        </FormGroup>
                        <FormGroup label="Cluster network CIDR" isRequired fieldId="simple-form-name">
                            <TextInput type="text" id="simple-form-name" name="simple-form-name" />
                        </FormGroup>
                        <FormGroup label="Network host prefix" isRequired fieldId="simple-form-name">
                            <TextInput type="text" id="simple-form-name" name="simple-form-name" />
                        </FormGroup>
                        <FormGroup label="Service network CIDR" isRequired fieldId="simple-form-name">
                            <TextInput type="text" id="simple-form-name" name="simple-form-name" />
                        </FormGroup>
                        <FormGroup label="Machine CIDR" isRequired fieldId="simple-form-name">
                            <TextInput type="text" id="simple-form-name" name="simple-form-name" />
                        </FormGroup>
                        <FormGroup label="Provisioning network CIDR" isRequired fieldId="simple-form-name">
                            <TextInput type="text" id="simple-form-name" name="simple-form-name" />
                        </FormGroup>
                        <FormGroup label="Provisioning network interface" isRequired fieldId="simple-form-name">
                            <TextInput type="text" id="simple-form-name" name="simple-form-name" />
                        </FormGroup>
                        <FormGroup label="Provisioning network bridge" isRequired fieldId="simple-form-name">
                            <TextInput type="text" id="simple-form-name" name="simple-form-name" />
                        </FormGroup>
                        <FormGroup label="External network bridge" isRequired fieldId="simple-form-name">
                            <TextInput type="text" id="simple-form-name" name="simple-form-name" />
                        </FormGroup>
                        <FormGroup label="API VIP" isRequired fieldId="simple-form-name">
                            <TextInput type="text" id="simple-form-name" name="simple-form-name" />
                        </FormGroup>
                        <FormGroup label="Ingress VIP" isRequired fieldId="simple-form-name">
                            <TextInput type="text" id="simple-form-name" name="simple-form-name" />
                        </FormGroup>
                    </Form>
                </AcmExpandableSection>

                <AcmExpandableSection label="Labels" hidden={!clusterDeploymentInput.baseDomain}>
                    <Form>
                        {/* <AcmTextInput id="environmentLabelInput" label="Environment Label" /> */}

                        <AcmLabelsInput
                            id="additionalLabels"
                            label="Additional Labels"
                            buttonLabel="Add label"
                            value={clusterDeploymentInput.labels}
                            onChange={(labels) => {
                                setClusterDeploymentInput({ ...clusterDeploymentInput, ...{ labels } })
                            }}
                        />
                    </Form>
                </AcmExpandableSection>

                <ActionGroup>
                    <Button
                        variant="primary"
                        isDisabled={!clusterDeploymentInput.baseDomain}
                        onClick={() => {
                            props.createClusterDeployment(clusterDeploymentInput as ClusterDeploymentInput)
                        }}
                    >
                        Create cluster
                    </Button>
                    <Button
                        variant="link"
                        onClick={() => {
                            history.push(NavigationPath.clusters)
                        }}
                    >
                        Cancel
                    </Button>
                </ActionGroup>
            </AcmForm>
        </AcmPageCard>
    )
}
