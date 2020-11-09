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
import { AcmTextArea } from '@open-cluster-management/ui-components/lib/AcmTextArea/AcmTextArea'
import { ActionGroup, Button, Page, SelectOption } from '@patternfly/react-core'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { ErrorPage } from '../../../components/ErrorPage'
import { ProviderID, providers } from '../../../lib/providers'
import { useProjects } from '../../../lib/useProject'
import { Project } from '../../../library/resources/project'
import {
    getProviderConnectionProviderID,
    ProviderConnection,
    providerConnectionMethods,
    setProviderConnectionProviderID,
} from '../../../library/resources/provider-connection'
import { NavigationPath } from '../ClusterManagement'

const lowercaseAlphaNumberCharacters = 'abcdefghijklmnopqrstuvwxyz-1234567890'
function validateKubernetesDnsName(value: string, name: string) {
    if (value) {
        if (value.length > 63) return `${name} can contain at most 63 characters.`
        for (const char of value) {
            if (!lowercaseAlphaNumberCharacters.includes(char))
                return `${name} can only contain lowercase alphanumeric characters or '-'`
        }
        if (!'abcdefghijklmnopqrstuvwxyz0123456789'.includes(value[0]))
            return `${name} must start with an alphanumeric character`
        if (!'abcdefghijklmnopqrstuvwxyz0123456789'.includes(value[value.length - 1]))
            return `${name} must end with an alphanumeric character`
    }
    return undefined
}

function validatePublicSshKey(value: string) {
    if (value) {
        const regExp = new RegExp('^ssh-.*')
        if (!regExp.test(value.split('\n').join('').split('\r').join('').trim()))
            return 'Must be a valid public ssh key.'
    }
    return undefined
}

function validatePrivateSshKey(value: string) {
    if (value) {
        const regExp = new RegExp('^-----BEGIN.*KEY-----$')
        if (!regExp.test(value.split('\n').join('').split('\r').join('').trim()))
            return 'Must be a valid private ssh key.'
    }

    return undefined
}

export function AddConnectionPage() {
    const { t } = useTranslation(['connection'])
    return (
        <Page>
            <AcmPageHeader title={t('addConnection.title')} />
            <AddConnectionPageData />
        </Page>
    )
}

export function AddConnectionPageData() {
    const projectsQuery = useProjects()

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
        <AddConnectionPageContent
            projects={projectsQuery.data.items}
            createProviderConnection={(providerConnection: ProviderConnection) =>
                providerConnectionMethods.create(providerConnection)
            }
        />
    )
}

export function AddConnectionPageContent(props: {
    projects: Project[]
    createProviderConnection: (input: ProviderConnection) => Promise<unknown>
}) {
    const { t } = useTranslation(['connection'])
    const history = useHistory()

    const [providerConnection, setProviderConnection] = useState<Partial<ProviderConnection>>({
        metadata: {},
        spec: {
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

    return (
        <AcmPageCard>
            <AcmForm>
                <AcmSelect
                    id="providerName"
                    label={t('addConnection.providerName.label')}
                    placeholder={t('addConnection.providerName.placeholder')}
                    value={getProviderConnectionProviderID(providerConnection)}
                    onChange={(providerID) => {
                        updateProviderConnection((providerConnection) => {
                            setProviderConnectionProviderID(providerConnection, providerID as ProviderID)
                        })
                    }}
                    isRequired
                >
                    {providers.map((provider) => (
                        <SelectOption key={provider.key} value={provider.key}>
                            {provider.name}
                        </SelectOption>
                    ))}
                </AcmSelect>

                <AcmTextInput
                    id="connectionName"
                    label={t('addConnection.connectionName.label')}
                    placeholder={t('addConnection.connectionName.placeholder')}
                    value={providerConnection.metadata?.name}
                    onChange={(name) => {
                        updateProviderConnection((providerConnection) => {
                            providerConnection.metadata!.name = name
                            return providerConnection
                        })
                    }}
                    validation={(value) => validateKubernetesDnsName(value, 'Connection name')}
                    isRequired
                    hidden={!getProviderConnectionProviderID(providerConnection)}
                />
                <AcmSelect
                    id="namespaceName"
                    label={t('addConnection.namespaceName.label')}
                    placeholder={t('addConnection.namespaceName.placeholder')}
                    value={providerConnection.metadata?.namespace}
                    onChange={(namespace) => {
                        updateProviderConnection((providerConnection) => {
                            providerConnection.metadata!.namespace = namespace
                        })
                    }}
                    isRequired
                    hidden={!getProviderConnectionProviderID(providerConnection)}
                >
                    {props.projects.map((project) => (
                        <SelectOption key={project.metadata.name} value={project.metadata.name}>
                            {project.metadata.name}
                        </SelectOption>
                    ))}
                </AcmSelect>
                <AcmTextInput
                    id="awsAccessKeyID"
                    label={t('addConnection.awsAccessKeyID.label')}
                    placeholder={t('addConnection.awsAccessKeyID.placeholder')}
                    value={providerConnection.spec?.awsAccessKeyID}
                    onChange={(awsAccessKeyID) => {
                        updateProviderConnection((providerConnection) => {
                            providerConnection.spec!.awsAccessKeyID = awsAccessKeyID
                        })
                    }}
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.AWS}
                    isRequired
                />
                <AcmTextInput
                    id="awsSecretAccessKeyID"
                    label={t('addConnection.awsSecretAccessKeyID.label')}
                    placeholder={t('addConnection.awsSecretAccessKeyID.placeholder')}
                    value={providerConnection.spec?.awsSecretAccessKeyID}
                    onChange={(awsSecretAccessKeyID) => {
                        updateProviderConnection((providerConnection) => {
                            providerConnection.spec!.awsSecretAccessKeyID = awsSecretAccessKeyID
                        })
                    }}
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.AWS}
                    isRequired
                />
                <AcmTextInput
                    id="baseDomainResourceGroupName"
                    label={t('addConnection.baseDomainResourceGroupName.label')}
                    placeholder={t('addConnection.baseDomainResourceGroupName.placeholder')}
                    value={providerConnection.spec?.baseDomainResourceGroupName}
                    onChange={(baseDomainResourceGroupName) => {
                        updateProviderConnection((providerConnection) => {
                            providerConnection.spec!.baseDomainResourceGroupName = baseDomainResourceGroupName
                        })
                    }}
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.AZR}
                    isRequired
                />
                <AcmTextInput
                    id="clientId"
                    label={t('addConnection.clientId.label')}
                    placeholder={t('addConnection.clientId.placeholder')}
                    value={providerConnection.spec?.clientId}
                    onChange={(clientId) => {
                        updateProviderConnection((providerConnection) => {
                            providerConnection.spec!.clientId = clientId
                        })
                    }}
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.AZR}
                    isRequired
                />
                <AcmTextInput
                    id="clientsecret"
                    label={t('addConnection.clientsecret.label')}
                    placeholder={t('addConnection.clientsecret.placeholder')}
                    value={providerConnection.spec?.clientsecret}
                    onChange={(clientsecret) => {
                        updateProviderConnection((providerConnection) => {
                            providerConnection.spec!.clientsecret = clientsecret
                        })
                    }}
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.AZR}
                    isRequired
                />
                <AcmTextInput
                    id="subscriptionid"
                    label={t('addConnection.subscriptionid.label')}
                    placeholder={t('addConnection.subscriptionid.placeholder')}
                    value={providerConnection.spec?.subscriptionid}
                    onChange={(subscriptionid) => {
                        updateProviderConnection((providerConnection) => {
                            providerConnection.spec!.subscriptionid = subscriptionid
                        })
                    }}
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.AZR}
                    isRequired
                />
                <AcmTextInput
                    id="tenantid"
                    label={t('addConnection.tenantid.label')}
                    placeholder={t('addConnection.tenantid.placeholder')}
                    value={providerConnection.spec?.tenantid}
                    onChange={(tenantid) => {
                        updateProviderConnection((providerConnection) => {
                            providerConnection.spec!.tenantid = tenantid
                        })
                    }}
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.AZR}
                    isRequired
                />
                <AcmTextInput
                    id="gcProjectID"
                    label={t('addConnection.gcProjectID.label')}
                    placeholder={t('addConnection.gcProjectID.placeholder')}
                    value={providerConnection.spec?.gcProjectID}
                    onChange={(gcProjectID) => {
                        updateProviderConnection((providerConnection) => {
                            providerConnection.spec!.gcProjectID = gcProjectID
                        })
                    }}
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.GCP}
                    isRequired
                />
                <AcmTextArea
                    id="gcServiceAccountKey"
                    label={t('addConnection.gcServiceAccountKey.label')}
                    placeholder={t('addConnection.gcServiceAccountKey.placeholder')}
                    value={providerConnection.spec?.gcServiceAccountKey}
                    onChange={(gcServiceAccountKey) => {
                        updateProviderConnection((providerConnection) => {
                            providerConnection.spec!.gcServiceAccountKey = gcServiceAccountKey
                        })
                    }}
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.GCP}
                    isRequired
                />
                <AcmTextInput
                    id="vcenter"
                    label={t('addConnection.vcenter.label')}
                    placeholder={t('addConnection.vcenter.placeholder')}
                    value={providerConnection.spec?.vcenter}
                    onChange={(vcenter) => {
                        updateProviderConnection((providerConnection) => {
                            providerConnection.spec!.vcenter = vcenter
                        })
                    }}
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.VMW}
                    isRequired
                />
                <AcmTextInput
                    id="username"
                    label={t('addConnection.username.label')}
                    placeholder={t('addConnection.username.placeholder')}
                    value={providerConnection.spec?.username}
                    onChange={(username) => {
                        updateProviderConnection((providerConnection) => {
                            providerConnection.spec!.username = username
                        })
                    }}
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.VMW}
                    isRequired
                />
                <AcmTextInput
                    id="password"
                    label={t('addConnection.password.label')}
                    placeholder={t('addConnection.password.placeholder')}
                    value={providerConnection.spec?.password}
                    onChange={(password) => {
                        updateProviderConnection((providerConnection) => {
                            providerConnection.spec!.password = password
                        })
                    }}
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.VMW}
                    isRequired
                />
                <AcmTextArea
                    id="cacertificate"
                    label={t('addConnection.cacertificate.label')}
                    placeholder={t('addConnection.cacertificate.placeholder')}
                    value={providerConnection.spec?.cacertificate}
                    onChange={(cacertificate) => {
                        updateProviderConnection((providerConnection) => {
                            providerConnection.spec!.cacertificate = cacertificate
                        })
                    }}
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.VMW}
                    isRequired
                />
                <AcmTextInput
                    id="vmClusterName"
                    label={t('addConnection.vmClusterName.label')}
                    placeholder={t('addConnection.vmClusterName.placeholder')}
                    value={providerConnection.spec?.vmClusterName}
                    onChange={(vmClusterName) => {
                        updateProviderConnection((providerConnection) => {
                            providerConnection.spec!.vmClusterName = vmClusterName
                        })
                    }}
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.VMW}
                    isRequired
                />
                <AcmTextInput
                    id="datacenter"
                    label={t('addConnection.datacenter.label')}
                    placeholder={t('addConnection.datacenter.placeholder')}
                    value={providerConnection.spec?.datacenter}
                    onChange={(datacenter) => {
                        updateProviderConnection((providerConnection) => {
                            providerConnection.spec!.datacenter = datacenter
                        })
                    }}
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.VMW}
                    isRequired
                />
                <AcmTextInput
                    id="datastore"
                    label={t('addConnection.datastore.label')}
                    placeholder={t('addConnection.datastore.placeholder')}
                    value={providerConnection.spec?.datastore}
                    onChange={(datastore) => {
                        updateProviderConnection((providerConnection) => {
                            providerConnection.spec!.datastore = datastore
                        })
                    }}
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.VMW}
                    isRequired
                />
                <AcmTextInput
                    id="libvirtURI"
                    label={t('addConnection.libvirtURI.label')}
                    placeholder={t('addConnection.libvirtURI.placeholder')}
                    value={providerConnection.spec?.libvirtURI}
                    onChange={(libvirtURI) => {
                        updateProviderConnection((providerConnection) => {
                            providerConnection.spec!.libvirtURI = libvirtURI
                        })
                    }}
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.BMC}
                    isRequired
                />
                <AcmTextArea
                    id="sshKnownHosts"
                    label={t('addConnection.sshKnownHosts.label')}
                    placeholder={t('addConnection.sshKnownHosts.placeholder')}
                    value={providerConnection.spec?.sshKnownHosts}
                    onChange={(sshKnownHosts) => {
                        updateProviderConnection((providerConnection) => {
                            providerConnection.spec!.sshKnownHosts = sshKnownHosts
                        })
                    }}
                    hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.BMC}
                    isRequired
                />
                <AcmTextInput
                    id="baseDomain"
                    label={t('addConnection.baseDomain.label')}
                    placeholder={t('addConnection.baseDomain.placeholder')}
                    value={providerConnection.spec?.baseDomain}
                    onChange={(baseDomain) => {
                        updateProviderConnection((providerConnection) => {
                            providerConnection.spec!.baseDomain = baseDomain as string
                        })
                    }}
                    hidden={!getProviderConnectionProviderID(providerConnection)}
                    isRequired
                />
                <AcmTextArea
                    id="pullSecret"
                    label={t('addConnection.pullSecret.label')}
                    placeholder={t('addConnection.pullSecret.placeholder')}
                    value={providerConnection.spec?.pullSecret}
                    onChange={(pullSecret) => {
                        updateProviderConnection((providerConnection) => {
                            providerConnection.spec!.pullSecret = pullSecret as string
                        })
                    }}
                    hidden={!getProviderConnectionProviderID(providerConnection)}
                    isRequired
                />
                <AcmTextArea
                    id="sshPrivateKey"
                    label={t('addConnection.sshPrivateKey.label')}
                    placeholder={t('addConnection.sshPrivateKey.placeholder')}
                    resizeOrientation="vertical"
                    value={providerConnection.spec?.sshPrivatekey}
                    onChange={(sshPrivatekey) => {
                        updateProviderConnection((providerConnection) => {
                            providerConnection.spec!.sshPrivatekey = sshPrivatekey as string
                        })
                    }}
                    hidden={!getProviderConnectionProviderID(providerConnection)}
                    validation={validatePrivateSshKey}
                    isRequired
                />
                <AcmTextArea
                    id="sshPublicKey"
                    label={t('addConnection.sshPublicKey.label')}
                    placeholder={t('addConnection.sshPublicKey.placeholder')}
                    resizeOrientation="vertical"
                    value={providerConnection.spec?.sshPublickey}
                    onChange={(sshPublickey) => {
                        updateProviderConnection((providerConnection) => {
                            providerConnection.spec!.sshPublickey = sshPublickey as string
                        })
                    }}
                    hidden={!getProviderConnectionProviderID(providerConnection)}
                    validation={validatePublicSshKey}
                    isRequired
                />
                <ActionGroup>
                    <AcmSubmit
                        id="submit"
                        variant="primary"
                        onClick={() => {
                            const providerID = getProviderConnectionProviderID(providerConnection)
                            if (providerID !== ProviderID.AWS) {
                                delete providerConnection.spec!.awsAccessKeyID
                                delete providerConnection.spec!.awsSecretAccessKeyID
                            }
                            if (providerID !== ProviderID.AZR) {
                                delete providerConnection.spec!.baseDomainResourceGroupName
                                delete providerConnection.spec!.clientId
                                delete providerConnection.spec!.clientsecret
                                delete providerConnection.spec!.subscriptionid
                                delete providerConnection.spec!.tenantid
                            }
                            if (providerID !== ProviderID.BMC) {
                                delete providerConnection.spec!.libvirtURI
                                delete providerConnection.spec!.sshKnownHosts
                            }
                            if (providerID !== ProviderID.GCP) {
                                delete providerConnection.spec!.gcProjectID
                                delete providerConnection.spec!.gcServiceAccountKey
                            }
                            if (providerID !== ProviderID.VMW) {
                                delete providerConnection.spec!.username
                                delete providerConnection.spec!.password
                                delete providerConnection.spec!.vcenter
                                delete providerConnection.spec!.cacertificate
                                delete providerConnection.spec!.vmClusterName
                                delete providerConnection.spec!.datacenter
                                delete providerConnection.spec!.datastore
                            }
                            delete providerConnection.data
                            props.createProviderConnection(providerConnection as ProviderConnection).then(() => {
                                history.push(NavigationPath.providerConnections)
                            })
                        }}
                    >
                        Add connection
                    </AcmSubmit>
                    <Button
                        variant="link"
                        onClick={() => {
                            history.push(NavigationPath.providerConnections)
                        }}
                    >
                        Cancel
                    </Button>
                </ActionGroup>
            </AcmForm>
        </AcmPageCard>
    )
}
