import {
    AcmEmptyState,
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
import { Project, Projects } from '../../../lib/Project'
import {
    getProviderConnectionProviderID,
    ProviderConnection,
    providerConnections,
    setProviderConnectionProviderID,
} from '../../../lib/ProviderConnection'
import { ProviderID, providers } from '../../../lib/providers'
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
    const projectsQuery = Projects()

    if (projectsQuery.loading) {
        return <AcmLoadingPage />
    } else if (projectsQuery.error) {
        return <ErrorPage error={projectsQuery.error} />
    } else if (!projectsQuery.data?.items || projectsQuery.data.items.length === 0) {
        return <AcmPageCard><AcmEmptyState title="No namespaces found." message="No namespaces found." /></AcmPageCard>
    }

    return (
        <AddConnectionPageContent
            projects={projectsQuery.data.items}
            createProviderConnection={(providerConnection: ProviderConnection) =>
                providerConnections.create(providerConnection)
            }
        />
    )
}

export function AddConnectionPageContent(props: {
    projects: Project[]
    createProviderConnection: (input: ProviderConnection) => void
}) {
    const history = useHistory()

    const [providerConnection, setProviderConnection] = useState<Partial<ProviderConnection>>({
        metadata: {},
        stringData: {
            awsAccessKeyID: undefined,
            awsSecretAccessKeyID: undefined,
            baseDomainResourceGroupName: undefined,
            clientId: undefined,
            clientsecret: undefined,
            subscriptionid: undefined,
            tenantid: undefined,
            gcProjectID: undefined,
            gcServiceAccountKey: undefined,
            username: undefined,
            password: undefined,
            vcenter: undefined,
            cacertificate: undefined,
            vmClusterName: undefined,
            datacenter: undefined,
            datastore: undefined,
            libvirtURI: undefined,
            baseDomain: '',
            pullSecret: '',
            sshPrivatekey: '',
            sshPublickey: '',
            isOcp: undefined,
        },
    })
    function updateProviderConnection(update: (providerConnection: Partial<ProviderConnection>) => void) {
        const copy = { ...providerConnection }
        update(copy)
        setProviderConnection(copy)
    }

    function providerConfigured() {
        switch (getProviderConnectionProviderID(providerConnection)) {
            case ProviderID.AWS:
                return (
                    providerConnection.stringData?.awsAccessKeyID && providerConnection.stringData?.awsSecretAccessKeyID
                )
            case ProviderID.AZR:
                return (
                    providerConnection.stringData?.baseDomainResourceGroupName &&
                    providerConnection.stringData?.clientId &&
                    providerConnection.stringData?.clientsecret &&
                    providerConnection.stringData?.subscriptionid &&
                    providerConnection.stringData?.tenantid
                )
            case ProviderID.GCP:
                return providerConnection.stringData?.gcProjectID && providerConnection.stringData?.gcServiceAccountKey
            case ProviderID.VMW:
                return (
                    providerConnection.stringData?.username &&
                    providerConnection.stringData?.password &&
                    providerConnection.stringData?.vcenter &&
                    providerConnection.stringData?.cacertificate &&
                    providerConnection.stringData?.vmClusterName &&
                    providerConnection.stringData?.datacenter &&
                    providerConnection.stringData?.datastore
                )
            case ProviderID.BMC:
                return providerConnection.stringData?.libvirtURI
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
                    value={providerConnection.metadata?.name}
                    onChange={(name) => {
                        updateProviderConnection((providerConnection) => {
                            if (providerConnection.metadata) providerConnection.metadata.name = name
                            return providerConnection
                        })
                    }}
                    placeholder={'Enter the name for the provider connection'}
                    required
                />

                <AcmSelect
                    id="namespaceName"
                    label="Namespace"
                    value={providerConnection.metadata?.namespace}
                    onChange={(namespace) => {
                        updateProviderConnection((providerConnection) => {
                            if (providerConnection.metadata) providerConnection.metadata.namespace = namespace
                        })
                    }}
                    options={props.projects.map((project) => project.metadata.name as string)}
                    placeholder="Select a namespace where to store the provider connection in the cluster"
                    required
                />

                <AcmSelect
                    id="providerName"
                    label="Provider"
                    value={getProviderConnectionProviderID(providerConnection)}
                    onChange={(providerID) => {
                        updateProviderConnection((providerConnection) => {
                            setProviderConnectionProviderID(providerConnection, providerID as ProviderID)
                        })
                    }}
                    options={providers.map((provider) => {
                        return { title: provider.name, value: provider.key }
                    })}
                    placeholder="Select a provider where you want to provision clusters"
                    required
                />

                <AcmTextInput
                    id="awsAccessKeyID"
                    label="AWS Access Key ID"
                    value={providerConnection.stringData?.awsAccessKeyID}
                    onChange={(awsAccessKeyID) => {
                        updateProviderConnection((providerConnection) => {
                            if (providerConnection.stringData)
                                providerConnection.stringData.awsAccessKeyID = awsAccessKeyID
                        })
                    }}
                    placeholder="Enter your AWS Access Key ID"
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.AWS}
                    required
                />

                <AcmTextInput
                    id="awsSecretAccessKeyID"
                    label="AWS Secret Access Key ID"
                    type="password"
                    value={providerConnection.stringData?.awsSecretAccessKeyID}
                    onChange={(awsSecretAccessKeyID) => {
                        updateProviderConnection((providerConnection) => {
                            if (providerConnection.stringData)
                                providerConnection.stringData.awsSecretAccessKeyID = awsSecretAccessKeyID
                        })
                    }}
                    placeholder="Enter your AWS Secret Access Key ID"
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.AWS}
                    required
                />

                <AcmTextInput
                    id="baseDomainResourceGroupName"
                    label="Base Domain Resource Group Name "
                    value={providerConnection.stringData?.baseDomainResourceGroupName}
                    onChange={(baseDomainResourceGroupName) => {
                        updateProviderConnection((providerConnection) => {
                            if (providerConnection.stringData)
                                providerConnection.stringData.baseDomainResourceGroupName = baseDomainResourceGroupName
                        })
                    }}
                    placeholder="Enter your Base Domain Resource Group Name "
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.AZR}
                    required
                />

                <AcmTextInput
                    id="clientId"
                    label="Client ID"
                    value={providerConnection.stringData?.clientId}
                    onChange={(clientId) => {
                        updateProviderConnection((providerConnection) => {
                            if (providerConnection.stringData) providerConnection.stringData.clientId = clientId
                        })
                    }}
                    placeholder="Enter your Client ID"
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.AZR}
                    required
                />

                <AcmTextInput
                    id="clientsecret"
                    label="Client Secret"
                    value={providerConnection.stringData?.clientsecret}
                    onChange={(clientsecret) => {
                        updateProviderConnection((providerConnection) => {
                            if (providerConnection.stringData) providerConnection.stringData.clientsecret = clientsecret
                        })
                    }}
                    placeholder="Enter your Client Secret"
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.AZR}
                    required
                />

                <AcmTextInput
                    id="subscriptionid"
                    label="Subscription ID"
                    value={providerConnection.stringData?.subscriptionid}
                    onChange={(subscriptionid) => {
                        updateProviderConnection((providerConnection) => {
                            if (providerConnection.stringData)
                                providerConnection.stringData.subscriptionid = subscriptionid
                        })
                    }}
                    placeholder="Enter your Subscription ID"
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.AZR}
                    required
                />

                <AcmTextInput
                    id="tenantid"
                    label="Tenant ID"
                    value={providerConnection.stringData?.tenantid}
                    onChange={(tenantid) => {
                        updateProviderConnection((providerConnection) => {
                            if (providerConnection.stringData) providerConnection.stringData.tenantid = tenantid
                        })
                    }}
                    placeholder="Enter your Tenant ID"
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.AZR}
                    required
                />

                <AcmTextInput
                    id="gcProjectID"
                    label="Google Cloud Platform project ID"
                    value={providerConnection.stringData?.gcProjectID}
                    onChange={(gcProjectID) => {
                        updateProviderConnection((providerConnection) => {
                            if (providerConnection.stringData) providerConnection.stringData.gcProjectID = gcProjectID
                        })
                    }}
                    placeholder="Enter your Google Cloud Platform project ID"
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.GCP}
                    required
                />

                <AcmTextInput
                    id="gcServiceAccountKey"
                    label="Google Cloud Platform service account JSON key"
                    type="password"
                    value={providerConnection.stringData?.gcServiceAccountKey}
                    onChange={(gcServiceAccountKey) => {
                        updateProviderConnection((providerConnection) => {
                            if (providerConnection.stringData)
                                providerConnection.stringData.gcServiceAccountKey = gcServiceAccountKey
                        })
                    }}
                    placeholder="Enter your Google Cloud Platform service account JSON key"
                    required
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.GCP}
                />

                <AcmTextInput
                    id="vcenter"
                    label="vCenter server"
                    value={providerConnection.stringData?.vcenter}
                    onChange={(vcenter) => {
                        updateProviderConnection((providerConnection) => {
                            if (providerConnection.stringData) providerConnection.stringData.vcenter = vcenter
                        })
                    }}
                    placeholder="Enter your vCenter server"
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.VMW}
                    required
                />

                <AcmTextInput
                    id="username"
                    label="vCenter username"
                    value={providerConnection.stringData?.username}
                    onChange={(username) => {
                        updateProviderConnection((providerConnection) => {
                            if (providerConnection.stringData) providerConnection.stringData.username = username
                        })
                    }}
                    placeholder="Enter your vCenter username"
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.VMW}
                    required
                />

                <AcmTextInput
                    id="password"
                    label="vCenter password"
                    value={providerConnection.stringData?.password}
                    onChange={(password) => {
                        updateProviderConnection((providerConnection) => {
                            if (providerConnection.stringData) providerConnection.stringData.password = password
                        })
                    }}
                    placeholder="Enter your vCenter password"
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.VMW}
                    required
                />

                <AcmTextInput
                    id="cacertificate"
                    label="vCenter root CA certificate"
                    type="password"
                    value={providerConnection.stringData?.cacertificate}
                    onChange={(cacertificate) => {
                        updateProviderConnection((providerConnection) => {
                            if (providerConnection.stringData)
                                providerConnection.stringData.cacertificate = cacertificate
                        })
                    }}
                    placeholder="Enter your vCenter root CA certificate"
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.VMW}
                    required
                />

                <AcmTextInput
                    id="vmClusterName"
                    label="vSphere cluster name"
                    value={providerConnection.stringData?.vmClusterName}
                    onChange={(vmClusterName) => {
                        updateProviderConnection((providerConnection) => {
                            if (providerConnection.stringData)
                                providerConnection.stringData.vmClusterName = vmClusterName
                        })
                    }}
                    placeholder="Enter your vSphere cluster name"
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.VMW}
                    required
                />

                <AcmTextInput
                    id="datacenter"
                    label="vSphere datacenter"
                    value={providerConnection.stringData?.datacenter}
                    onChange={(datacenter) => {
                        updateProviderConnection((providerConnection) => {
                            if (providerConnection.stringData) providerConnection.stringData.datacenter = datacenter
                        })
                    }}
                    placeholder="Enter your vSphere datacenter"
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.VMW}
                    required
                />

                <AcmTextInput
                    id="datastore"
                    label="vSphere default datastore"
                    value={providerConnection.stringData?.datastore}
                    onChange={(datastore) => {
                        updateProviderConnection((providerConnection) => {
                            if (providerConnection.stringData) providerConnection.stringData.datastore = datastore
                        })
                    }}
                    placeholder="Enter your vSphere default datastore"
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.VMW}
                    required
                />

                <AcmTextInput
                    id="libvirtURI"
                    label="libvirt URI"
                    value={providerConnection.stringData?.libvirtURI}
                    onChange={(libvirtURI) => {
                        updateProviderConnection((providerConnection) => {
                            if (providerConnection.stringData) providerConnection.stringData.libvirtURI = libvirtURI
                        })
                    }}
                    placeholder="Enter your libvirt URI"
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.BMC}
                    required
                />

                <AcmTextInput
                    id="baseDomain"
                    label="Base DNS domain"
                    value={providerConnection.stringData?.baseDomain}
                    onChange={(baseDomain) => {
                        updateProviderConnection((providerConnection) => {
                            if (providerConnection.stringData)
                                providerConnection.stringData.baseDomain = baseDomain as string
                        })
                    }}
                    placeholder={'Enter the base DNS domain'}
                    required
                />

                <AcmTextInput
                    id="pullSecret"
                    label="Red Hat Openshift Pull Secret"
                    type="password"
                    value={providerConnection.stringData?.pullSecret}
                    onChange={(pullSecret) => {
                        updateProviderConnection((pullSecret) => {
                            if (providerConnection.stringData)
                                providerConnection.stringData.pullSecret = pullSecret as string
                        })
                    }}
                    placeholder={'Enter Red Hat Openshift Pull Secret'}
                    required
                />

                <AcmTextInput
                    id="sshPrivateKey"
                    label="SSH Private Key"
                    type="password"
                    value={providerConnection.stringData?.sshPrivatekey}
                    onChange={(sshPrivatekey) => {
                        updateProviderConnection((sshPrivatekey) => {
                            if (providerConnection.stringData)
                                providerConnection.stringData.sshPrivatekey = sshPrivatekey as string
                        })
                    }}
                    placeholder={'Enter SSH Private Key'}
                    required
                />

                <AcmTextInput
                    id="sshPublicKey"
                    label="SSH Public Key"
                    type="password"
                    value={providerConnection.stringData?.sshPublickey}
                    onChange={(sshPublickey) => {
                        updateProviderConnection((sshPublickey) => {
                            if (providerConnection.stringData)
                                providerConnection.stringData.sshPublickey = sshPublickey as string
                        })
                    }}
                    placeholder={'Enter SSH Public Key'}
                    required
                />

                <ActionGroup>
                    <Button
                        variant="primary"
                        isDisabled={
                            !providerConnection.metadata?.name ||
                            !providerConnection.metadata?.namespace ||
                            !providerConfigured() ||
                            !providerConnection.stringData?.baseDomain ||
                            !providerConnection.stringData?.pullSecret ||
                            !providerConnection.stringData?.sshPrivatekey ||
                            !providerConnection.stringData?.sshPublickey
                        }
                        onClick={() => {
                            props.createProviderConnection(providerConnection as ProviderConnection)
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
