import {
    AcmEmptyPage,
    AcmLoadingPage,
    AcmPageCard,
    AcmPageHeader,
    AcmSelect,
    AcmTextInput,
} from '@open-cluster-management/ui-components'
import { ActionGroup, Button, Form, Page } from '@patternfly/react-core'
import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { ErrorPage } from '../../../components/ErrorPage'
import { client } from '../../../lib/apollo-client'
import { ProviderID, providers } from '../../../lib/providers'
import {
    Namespace,
    ProviderConnectionDataInput,
    ProviderConnectionInput,
    useCreateProviderConnectionMutation,
    useNamespacesQuery,
} from '../../../sdk'
import { NavigationPath } from '../ClusterManagement'

export function AddConnectionPage() {
    return (
        <Page>
            <AcmPageHeader title="Add Provider Connection" />
            <AddConnectionPageData />
        </Page>
    )
}

export function AddConnectionPageData() {
    const namespacesQuery = useNamespacesQuery({ client, pollInterval: 30 * 1000 })
    const [createProviderConnectionMutation] = useCreateProviderConnectionMutation({ client })
    // const [createProviderConnectionMutation, { data, loading, error }] = useCreateProviderConnectionMutation({ client })

    if (namespacesQuery.loading) {
        return <AcmLoadingPage />
    } else if (namespacesQuery.error) {
        return <ErrorPage error={namespacesQuery.error} />
    } else if (!namespacesQuery.data?.namespaces || namespacesQuery.data.namespaces.length === 0) {
        return <AcmEmptyPage title="No namespaces found." message="No namespaces found." />
    }

    return (
        <AddConnectionPageContent
            namespaces={namespacesQuery.data.namespaces as Namespace[]}
            createProviderConnection={(input: ProviderConnectionInput) =>
                createProviderConnectionMutation({ variables: { input } })
            }
        />
    )
}

export function AddConnectionPageContent(props: {
    namespaces: Namespace[]
    createProviderConnection: (input: ProviderConnectionInput) => void
}) {
    const history = useHistory()

    const [providerConnection, setProviderConnectionInput] = useState<Partial<ProviderConnectionInput>>({})
    function updateProviderConnection(state: Partial<ProviderConnectionInput>) {
        setProviderConnectionInput({ ...providerConnection, ...state })
    }
    function updateProviderConnectionData(state: Partial<ProviderConnectionDataInput>) {
        updateProviderConnection({ data: { ...providerConnection.data, ...state } } as any)
    }

    function providerConfigured() {
        switch (providerConnection.providerID) {
            case ProviderID.AWS:
                return providerConnection.data?.awsAccessKeyID && providerConnection.data?.awsSecretAccessKeyID
            case ProviderID.AZR:
                return (
                    providerConnection.data?.baseDomainResourceGroupName &&
                    providerConnection.data?.clientId &&
                    providerConnection.data?.clientsecret &&
                    providerConnection.data?.subscriptionid &&
                    providerConnection.data?.tenantid
                )
            case ProviderID.GCP:
                return providerConnection.data?.gcProjectID && providerConnection.data?.gcServiceAccountKey
            case ProviderID.VMW:
                return (
                    providerConnection.data?.username &&
                    providerConnection.data?.password &&
                    providerConnection.data?.vcenter &&
                    providerConnection.data?.cacertificate &&
                    providerConnection.data?.vmClusterName &&
                    providerConnection.data?.datacenter &&
                    providerConnection.data?.datastore
                )
            case ProviderID.BMC:
                return providerConnection.data?.libvirtURI
            case undefined:
                return false
        }
        return true
    }

    return (
        <AcmPageCard>
            <Form>
                <AcmTextInput
                    id="connectionName"
                    label="Connection Name"
                    value={providerConnection.name}
                    onChange={(name) => updateProviderConnection({ name })}
                    placeholder={'Enter the name for the provider connection'}
                    required
                />

                <AcmSelect
                    id="namespaceName"
                    label="Namespace"
                    value={providerConnection.namespace}
                    onChange={(namespace) => updateProviderConnection({ namespace })}
                    options={props.namespaces.map((namespace) => namespace.metadata.name)}
                    placeholder="Select a namespace where to store the provider connection in the cluster"
                    required
                />

                <AcmSelect
                    id="providerName"
                    label="Provider"
                    value={providerConnection.providerID}
                    onChange={(providerID) => updateProviderConnection({ providerID })}
                    options={providers.map((provider) => {
                        return { title: provider.name, value: provider.key }
                    })}
                    placeholder="Select a provider where you want to provision clusters"
                    required
                />

                <AcmTextInput
                    id="awsAccessKeyID"
                    label="AWS Access Key ID"
                    value={providerConnection.data?.awsAccessKeyID}
                    onChange={(awsAccessKeyID) => updateProviderConnectionData({ awsAccessKeyID })}
                    placeholder="Enter your AWS Access Key ID"
                    hidden={providerConnection.providerID !== ProviderID.AWS}
                    required
                />

                <AcmTextInput
                    id="awsSecretAccessKeyID"
                    label="AWS Secret Access Key ID"
                    value={providerConnection.data?.awsSecretAccessKeyID}
                    onChange={(awsSecretAccessKeyID) => updateProviderConnectionData({ awsSecretAccessKeyID })}
                    placeholder="Enter your AWS Secret Access Key ID"
                    hidden={providerConnection.providerID !== ProviderID.AWS}
                    required
                />

                <AcmTextInput
                    id="baseDomainResourceGroupName"
                    label="Base Domain Resource Group Name "
                    value={providerConnection.data?.baseDomainResourceGroupName}
                    onChange={(baseDomainResourceGroupName) =>
                        updateProviderConnectionData({ baseDomainResourceGroupName })
                    }
                    placeholder="Enter your Base Domain Resource Group Name "
                    hidden={providerConnection.providerID !== ProviderID.AZR}
                    required
                />

                <AcmTextInput
                    id="clientId"
                    label="Client ID"
                    value={providerConnection.data?.clientId}
                    onChange={(clientId) => updateProviderConnectionData({ clientId })}
                    placeholder="Enter your Client ID"
                    hidden={providerConnection.providerID !== ProviderID.AZR}
                    required
                />

                <AcmTextInput
                    id="clientsecret"
                    label="Client Secret"
                    value={providerConnection.data?.clientsecret}
                    onChange={(clientsecret) => updateProviderConnectionData({ clientsecret })}
                    placeholder="Enter your Client Secret"
                    hidden={providerConnection.providerID !== ProviderID.AZR}
                    required
                />

                <AcmTextInput
                    id="subscriptionid"
                    label="Subscription ID"
                    value={providerConnection.data?.subscriptionid}
                    onChange={(subscriptionid) => updateProviderConnectionData({ subscriptionid })}
                    placeholder="Enter your Subscription ID"
                    hidden={providerConnection.providerID !== ProviderID.AZR}
                    required
                />

                <AcmTextInput
                    id="tenantid"
                    label="Tenant ID"
                    value={providerConnection.data?.tenantid}
                    onChange={(tenantid) => updateProviderConnectionData({ tenantid })}
                    placeholder="Enter your Tenant ID"
                    hidden={providerConnection.providerID !== ProviderID.AZR}
                    required
                />

                <AcmTextInput
                    id="gcProjectID"
                    label="Google Cloud Platform project ID"
                    value={providerConnection.data?.gcProjectID}
                    onChange={(gcProjectID) => updateProviderConnectionData({ gcProjectID })}
                    placeholder="Enter your Google Cloud Platform project ID"
                    hidden={providerConnection.providerID !== ProviderID.GCP}
                    required
                />

                <AcmTextInput
                    id="gcServiceAccountKey"
                    label="Google Cloud Platform service account JSON key"
                    value={providerConnection.data?.gcServiceAccountKey}
                    onChange={(gcServiceAccountKey) => updateProviderConnectionData({ gcServiceAccountKey })}
                    placeholder="Enter your Google Cloud Platform service account JSON key"
                    required
                    hidden={providerConnection.providerID !== ProviderID.GCP}
                    secret
                />

                <AcmTextInput
                    id="vcenter"
                    label="vCenter server"
                    value={providerConnection.data?.vcenter}
                    onChange={(vcenter) => updateProviderConnectionData({ vcenter })}
                    placeholder="Enter your vCenter server"
                    hidden={providerConnection.providerID !== ProviderID.VMW}
                    required
                />

                <AcmTextInput
                    id="username"
                    label="vCenter username"
                    value={providerConnection.data?.username}
                    onChange={(username) => updateProviderConnectionData({ username })}
                    placeholder="Enter your vCenter username"
                    hidden={providerConnection.providerID !== ProviderID.VMW}
                    required
                />

                <AcmTextInput
                    id="password"
                    label="vCenter password"
                    value={providerConnection.data?.password}
                    onChange={(password) => updateProviderConnectionData({ password })}
                    placeholder="Enter your vCenter password"
                    hidden={providerConnection.providerID !== ProviderID.VMW}
                    required
                />

                <AcmTextInput
                    id="cacertificate"
                    label="vCenter root CA certificate"
                    value={providerConnection.data?.cacertificate}
                    onChange={(cacertificate) => updateProviderConnectionData({ cacertificate })}
                    placeholder="Enter your vCenter root CA certificate"
                    hidden={providerConnection.providerID !== ProviderID.VMW}
                    required
                    secret
                />

                <AcmTextInput
                    id="vmClusterName"
                    label="vSphere cluster name"
                    value={providerConnection.data?.vmClusterName}
                    onChange={(vmClusterName) => updateProviderConnectionData({ vmClusterName })}
                    placeholder="Enter your vSphere cluster name"
                    hidden={providerConnection.providerID !== ProviderID.VMW}
                    required
                />

                <AcmTextInput
                    id="datacenter"
                    label="vSphere datacenter"
                    value={providerConnection.data?.datacenter}
                    onChange={(datacenter) => updateProviderConnectionData({ datacenter })}
                    placeholder="Enter your vSphere datacenter"
                    hidden={providerConnection.providerID !== ProviderID.VMW}
                    required
                />

                <AcmTextInput
                    id="datastore"
                    label="vSphere default datastore"
                    value={providerConnection.data?.datastore}
                    onChange={(datastore) => updateProviderConnectionData({ datastore })}
                    placeholder="Enter your vSphere default datastore"
                    hidden={providerConnection.providerID !== ProviderID.VMW}
                    required
                />

                <AcmTextInput
                    id="libvirtURI"
                    label="libvirt URI"
                    value={providerConnection.data?.libvirtURI}
                    onChange={(libvirtURI) => updateProviderConnectionData({ libvirtURI })}
                    placeholder="Enter your libvirt URI"
                    hidden={providerConnection.providerID !== ProviderID.BMC}
                    required
                />

                <AcmTextInput
                    id="baseDomain"
                    label="Base DNS domain"
                    value={providerConnection.data?.baseDomain}
                    onChange={(baseDomain) => updateProviderConnectionData({ baseDomain })}
                    placeholder={'Enter the base DNS domain'}
                    hidden={!providerConfigured()}
                    required
                />

                <AcmTextInput
                    id="pullSecret"
                    label="Red Hat Openshift Pull Secret"
                    value={providerConnection.data?.pullSecret}
                    onChange={(pullSecret) => updateProviderConnectionData({ pullSecret })}
                    placeholder={'Enter Red Hat Openshift Pull Secret'}
                    hidden={!providerConnection.data?.baseDomain}
                    required
                    secret
                />

                <AcmTextInput
                    id="sshPrivateKey"
                    label="SSH Private Key"
                    value={providerConnection.data?.sshPrivatekey}
                    onChange={(sshPrivatekey) => updateProviderConnectionData({ sshPrivatekey })}
                    placeholder={'Enter SSH Private Key'}
                    hidden={!providerConnection.data?.pullSecret}
                    required
                    secret
                />

                <AcmTextInput
                    id="sshPublicKey"
                    label="SSH Public Key"
                    value={providerConnection.data?.sshPublickey}
                    onChange={(sshPublickey) => updateProviderConnectionData({ sshPublickey })}
                    placeholder={'Enter SSH Public Key'}
                    hidden={!providerConnection.data?.sshPrivatekey}
                    required
                    secret
                />

                <ActionGroup>
                    <Button
                        variant="primary"
                        isDisabled={
                            !providerConnection.name ||
                            !providerConnection.namespace ||
                            !providerConnection.providerID ||
                            !providerConfigured() ||
                            !providerConnection.data?.baseDomain ||
                            !providerConnection.data?.pullSecret ||
                            !providerConnection.data?.sshPrivatekey ||
                            !providerConnection.data?.sshPublickey
                        }
                        onClick={() => {
                            props.createProviderConnection(providerConnection as ProviderConnectionInput)
                        }}
                    >
                        Add connection
                    </Button>
                    <Button
                        variant="link"
                        onClick={() => {
                            history.push(NavigationPath.providerConnections)
                        }}
                    >
                        Cancel
                    </Button>
                </ActionGroup>
            </Form>
        </AcmPageCard>
    )
}
