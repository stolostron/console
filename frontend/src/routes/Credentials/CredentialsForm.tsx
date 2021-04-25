/* Copyright Contributors to the Open Cluster Management project */
import { AcmIcon, Provider, ProviderIconMap, ProviderLongTextMap } from '@open-cluster-management/ui-components'
import { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteComponentProps, useHistory } from 'react-router'
import { useRecoilState } from 'recoil'
import { namespacesState } from '../../atoms'
import { AcmDataFormPage } from '../../components/AcmDataForm'
import { FormData } from '../../components/AcmFormData'
import { AcmSvgIcon } from '../../components/AcmSvgIcon'
import { ErrorPage } from '../../components/ErrorPage'
import { LoadingPage } from '../../components/LoadingPage'
import { DOC_LINKS } from '../../lib/doc-util'
import { getAuthorizedNamespaces, rbacCreate } from '../../lib/rbac-util'
import { createResource, replaceResource } from '../../lib/resource-request'
import {
    validateBaseDomain,
    validateCertificate,
    validateGCProjectID,
    validateImageMirror,
    validateJSON,
    validateKubernetesDnsName,
    validateLibvirtURI,
    validatePrivateSshKey,
    validatePublicSshKey,
} from '../../lib/validation'
import { NavigationPath } from '../../NavigationPath'
import {
    packProviderConnection,
    ProviderConnection,
    unpackProviderConnection,
} from '../../resources/provider-connection'
import { IResource } from '../../resources/resource'
import { getSecret, SecretDefinition } from '../../resources/secret'

const credentialProviders: Provider[] = [
    Provider.openstack,
    Provider.ansible,
    Provider.redhatcloud,
    Provider.aws,
    Provider.azure,
    Provider.gcp,
    Provider.vmware,
    Provider.baremetal,
]

export default function CredentialsFormPage({ match }: RouteComponentProps<{ namespace: string; name: string }>) {
    const { name, namespace } = match.params

    let isEditing = false
    let isViewing = false
    if (name !== undefined) {
        isEditing = match.path.endsWith(NavigationPath.editCredentials)
        isViewing = !isEditing
    }

    const [error, setError] = useState<Error>()

    const [namespaces] = useRecoilState(namespacesState)
    const [projects, setProjects] = useState<string[]>()
    useEffect(() => {
        if (!isEditing && !isViewing)
            getAuthorizedNamespaces([rbacCreate(SecretDefinition)], namespaces)
                .then((namespaces: string[]) => setProjects(namespaces.sort()))
                .catch(setError)
        return undefined
    }, [namespaces, isEditing, isViewing])

    const [providerConnection, setProviderConnection] = useState<ProviderConnection | undefined>()
    useEffect(() => {
        if (isEditing || isViewing) {
            const result = getSecret({ name, namespace })
            result.promise
                .then((secret) => setProviderConnection(unpackProviderConnection(secret as ProviderConnection)))
                .catch(setError)
            return result.abort
        }
        return undefined
    }, [isEditing, isViewing, name, namespace])

    if (error) return <ErrorPage error={error} />

    if (isEditing || isViewing) {
        if (!providerConnection) return <LoadingPage />
        return (
            <CredentialsForm
                namespaces={[providerConnection.metadata.namespace!]}
                providerConnection={providerConnection}
                isEditing={isEditing}
                isViewing={isViewing}
            />
        )
    } else {
        if (!projects) return <LoadingPage />
        return <CredentialsForm namespaces={projects} isEditing={false} isViewing={false} />
    }
}

export function CredentialsForm(props: {
    namespaces: string[]
    providerConnection?: ProviderConnection
    isEditing: boolean
    isViewing: boolean
}) {
    const { t } = useTranslation(['connection'])
    const { namespaces, providerConnection, isEditing, isViewing } = props

    const history = useHistory()

    const [credentialsType, setCredentialsType] = useState(
        providerConnection?.metadata.labels?.['cluster.open-cluster-management.io/provider'] ?? ''
    )

    // Details
    const [name, setName] = useState(providerConnection?.metadata.name ?? '')
    const [namespace, setNamespace] = useState(providerConnection?.metadata.namespace ?? '')

    // Base Domain
    const [baseDomain, setBaseDomain] = useState(providerConnection?.spec?.baseDomain ?? '')

    // Pull Secret
    const [pullSecret, setPullSecret] = useState(providerConnection?.spec?.pullSecret ?? '')

    // SSH Key
    const [sshPublickey, setSshPublickey] = useState(providerConnection?.spec?.sshPublickey ?? '')
    const [sshPrivatekey, setSshPrivatekey] = useState(providerConnection?.spec?.sshPrivatekey ?? '')

    // Amazon Web Services State
    const [awsAccessKeyID, setAwsAccessKeyID] = useState(providerConnection?.spec?.awsAccessKeyID ?? '')
    const [awsSecretAccessKeyID, setAwsSecretAccessKeyID] = useState(
        providerConnection?.spec?.awsSecretAccessKeyID ?? ''
    )

    // Azure Cloud State
    const [baseDomainResourceGroupName, setBaseDomainResourceGroupName] = useState(
        providerConnection?.spec?.baseDomainResourceGroupName ?? ''
    )
    const [clientId, setClientId] = useState(providerConnection?.spec?.clientId ?? '')
    const [clientSecret, setClientSecret] = useState(providerConnection?.spec?.clientSecret ?? '')
    const [tenantId, setTenantId] = useState(providerConnection?.spec?.tenantId ?? '')
    const [subscriptionId, setSubscriptionId] = useState(providerConnection?.spec?.subscriptionId ?? '')

    // Google
    const [gcProjectID, setGcProjectID] = useState(providerConnection?.spec?.gcProjectID ?? '')
    const [gcServiceAccountKey, setGcServiceAccountKey] = useState(providerConnection?.spec?.gcServiceAccountKey ?? '')

    // VMWare
    const [vcenter, setVcenter] = useState(providerConnection?.spec?.vcenter ?? '')
    const [username, setUsername] = useState(providerConnection?.spec?.username ?? '')
    const [password, setPassword] = useState(providerConnection?.spec?.password ?? '')
    const [cacertificate, setCacertificate] = useState(providerConnection?.spec?.cacertificate ?? '')
    const [vmClusterName, setVmClusterName] = useState(providerConnection?.spec?.vmClusterName ?? '')
    const [datacenter, setDatacenter] = useState(providerConnection?.spec?.datacenter ?? '')
    const [datastore, setDatastore] = useState(providerConnection?.spec?.datastore ?? '')

    // OpenStack
    const [openstackCloudsYaml, setOpenstackCloudsYaml] = useState(providerConnection?.spec?.openstackCloudsYaml ?? '')
    const [openstackCloud, setOpenstackCloud] = useState(providerConnection?.spec?.openstackCloud ?? '')

    // BareMetal
    const [libvirtURI, setLibvirtURI] = useState(providerConnection?.spec?.libvirtURI ?? '')
    const [sshKnownHosts, setSshKnownHosts] = useState(providerConnection?.spec?.sshKnownHosts?.join(',') ?? '')
    const [imageMirror, setImageMirror] = useState(providerConnection?.spec?.imageMirror ?? '')
    const [bootstrapOSImage, setBootstrapOSImage] = useState(providerConnection?.spec?.bootstrapOSImage ?? '')
    const [clusterOSImage, setClusterOSImage] = useState(providerConnection?.spec?.clusterOSImage ?? '')
    const [additionalTrustBundle, setAdditionalTrustBundle] = useState(
        providerConnection?.spec?.additionalTrustBundle ?? ''
    )

    // Ansible
    const [ansibleHost, setAnsibleHost] = useState(providerConnection?.spec?.ansibleHost ?? '')
    const [ansibleToken, setAnsibleToken] = useState(providerConnection?.spec?.ansibleToken ?? '')

    // Red Hat Cloud State
    const [ocmAPIToken, setOcmAPIToken] = useState(providerConnection?.spec?.ocmAPIToken ?? '')

    function stateToData() {
        const data: ProviderConnection = {
            apiVersion: 'v1',
            kind: 'Secret',
            type: 'Opaque',
            metadata: {
                name,
                namespace,
                labels: {
                    'cluster.open-cluster-management.io/provider': credentialsType,
                    'cluster.open-cluster-management.io/cloudconnection': '',
                },
            },
            spec: {},
        }
        switch (credentialsType) {
            case Provider.aws:
                data.spec!.awsAccessKeyID = awsAccessKeyID
                data.spec!.awsSecretAccessKeyID = awsSecretAccessKeyID
                data.spec!.baseDomain = baseDomain
                data.spec!.pullSecret = pullSecret
                data.spec!.sshPrivatekey = sshPrivatekey
                data.spec!.sshPublickey = sshPublickey
                break
            case Provider.azure:
                data.spec!.baseDomainResourceGroupName = baseDomainResourceGroupName
                data.spec!.clientId = clientId
                data.spec!.clientSecret = clientSecret
                data.spec!.tenantId = tenantId
                data.spec!.subscriptionId = subscriptionId
                data.spec!.baseDomain = baseDomain
                data.spec!.pullSecret = pullSecret
                data.spec!.sshPrivatekey = sshPrivatekey
                data.spec!.sshPublickey = sshPublickey
                break
            case Provider.gcp:
                data.spec!.gcProjectID = gcProjectID
                data.spec!.gcServiceAccountKey = gcServiceAccountKey
                data.spec!.baseDomain = baseDomain
                data.spec!.pullSecret = pullSecret
                data.spec!.sshPrivatekey = sshPrivatekey
                data.spec!.sshPublickey = sshPublickey
                break
            case Provider.vmware:
                data.spec!.vcenter = vcenter
                data.spec!.username = username
                data.spec!.password = password
                data.spec!.cacertificate = cacertificate
                data.spec!.vmClusterName = vmClusterName
                data.spec!.datacenter = datacenter
                data.spec!.datastore = datastore
                data.spec!.baseDomain = baseDomain
                data.spec!.pullSecret = pullSecret
                data.spec!.sshPrivatekey = sshPrivatekey
                data.spec!.sshPublickey = sshPublickey
                break
            case Provider.openstack:
                data.spec!.openstackCloudsYaml = openstackCloudsYaml
                data.spec!.openstackCloud = openstackCloud
                data.spec!.baseDomain = baseDomain
                data.spec!.pullSecret = pullSecret
                data.spec!.sshPrivatekey = sshPrivatekey
                data.spec!.sshPublickey = sshPublickey
                break
            case Provider.baremetal:
                data.spec!.libvirtURI = libvirtURI
                data.spec!.sshKnownHosts = sshKnownHosts
                    .trim()
                    .split(/[\r\n]+/g)
                    .map((ssh) => {
                        ssh = ssh.trim()
                        if (ssh.startsWith('-')) ssh = ssh.substr(1).trim()
                        if (ssh.startsWith('"')) ssh = ssh.substr(1)
                        if (ssh.endsWith('"')) ssh = ssh.slice(0, -1)
                        return ssh
                    })
                data.spec!.imageMirror = imageMirror
                data.spec!.bootstrapOSImage = bootstrapOSImage
                data.spec!.clusterOSImage = clusterOSImage
                data.spec!.additionalTrustBundle = additionalTrustBundle
                data.spec!.baseDomain = baseDomain
                data.spec!.pullSecret = pullSecret
                data.spec!.sshPrivatekey = sshPrivatekey
                data.spec!.sshPublickey = sshPublickey
                break
            case Provider.ansible:
                data.spec!.ansibleHost = ansibleHost
                data.spec!.ansibleToken = ansibleToken
                break

            case Provider.redhatcloud:
                data.spec!.ocmAPIToken = ocmAPIToken
                break
        }
        return packProviderConnection(data)
    }
    const title = isViewing ? name : isEditing ? t('editConnection.title') : t('addConnection.title')
    const titleTooltip = (
        <Fragment>
            {t('addConnection.title.tooltip')}
            <a
                href={DOC_LINKS.CREATE_CONNECTION}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'block', marginTop: '4px' }}
            >
                {t('common:learn.more')}
            </a>
        </Fragment>
    )

    const formData: FormData = {
        title,
        titleTooltip,
        breadcrumb: [{ text: 'Credentials', to: NavigationPath.credentials }, { text: title }],
        sections: [
            {
                name: 'Credentials type',
                inputs: [
                    {
                        id: 'credentialsType',
                        type: 'Select',
                        label: 'Type',
                        value: credentialsType,
                        onChange: setCredentialsType,
                        isRequired: true,
                        placeholder: 'Select the type for the credentials',
                        options: () =>
                            credentialProviders.map((provider) => {
                                return {
                                    id: provider,
                                    value: provider,
                                    icon: (
                                        <AcmSvgIcon>
                                            <AcmIcon icon={ProviderIconMap[provider]} />
                                        </AcmSvgIcon>
                                    ),
                                    text: ProviderLongTextMap[provider],
                                }
                            }),
                        mode: isEditing ? 'default' : 'tiles',
                        isDisplayLarge: true,
                        isDisabled: isEditing,
                    },
                ],
            },
            {
                name: 'Details',
                inputs: [
                    {
                        id: 'credentialsName',
                        type: 'Text',
                        label: t('addConnection.connectionName.label'),
                        placeholder: t('addConnection.connectionName.placeholder'),
                        labelHelp: t('addConnection.connectionName.labelHelp'),
                        value: name,
                        onChange: setName,
                        validation: (value) => validateKubernetesDnsName(value, 'Connection name', t),
                        isRequired: true,
                        isDisabled: isEditing,
                    },
                    {
                        id: 'namespaceName',
                        type: 'Select',
                        label: t('addConnection.namespaceName.label'),
                        placeholder: t('addConnection.namespaceName.placeholder'),
                        labelHelp: t('addConnection.namespaceName.labelHelp'),
                        value: namespace,
                        onChange: setNamespace,
                        isRequired: true,
                        options: () =>
                            namespaces.map((namespace) => ({
                                id: namespace,
                                value: namespace,
                            })),
                        isDisabled: isEditing,
                    },
                ],
            },
            {
                name: 'AWS credentials',
                inputs: [
                    {
                        id: 'awsAccessKeyID',
                        isHidden: credentialsType !== Provider.aws,
                        type: 'Text',
                        label: t('addConnection.awsAccessKeyID.label'),
                        placeholder: t('addConnection.awsAccessKeyID.placeholder'),
                        labelHelp: t('addConnection.awsAccessKeyID.labelHelp'),
                        value: awsAccessKeyID,
                        onChange: setAwsAccessKeyID,
                        isRequired: true,
                    },
                    {
                        id: 'awsSecretAccessKeyID',
                        isHidden: credentialsType !== Provider.aws,
                        type: 'TextArea',
                        label: t('addConnection.awsSecretAccessKeyID.label'),
                        placeholder: t('addConnection.awsSecretAccessKeyID.placeholder'),
                        labelHelp: t('addConnection.awsSecretAccessKeyID.labelHelp'),
                        value: awsSecretAccessKeyID,
                        onChange: setAwsSecretAccessKeyID,
                        isRequired: true,
                        isSecret: true,
                    },
                ],
                columns: 1,
            },
            {
                name: 'Google cloud credentials',
                inputs: [
                    {
                        id: 'gcProjectID',
                        isHidden: credentialsType !== Provider.gcp,
                        type: 'Text',
                        label: t('addConnection.gcProjectID.label'),
                        placeholder: t('addConnection.gcProjectID.placeholder'),
                        labelHelp: t('addConnection.gcProjectID.labelHelp'),
                        value: gcProjectID,
                        onChange: setGcProjectID,
                        validation: (value) => validateGCProjectID(value, t),
                        isRequired: true,
                    },
                    {
                        id: 'gcServiceAccountKey',
                        isHidden: credentialsType !== Provider.gcp,
                        type: 'TextArea',
                        label: t('addConnection.gcServiceAccountKey.label'),
                        placeholder: t('addConnection.gcServiceAccountKey.placeholder'),
                        labelHelp: t('addConnection.gcServiceAccountKey.labelHelp'),
                        value: gcServiceAccountKey,
                        onChange: setGcServiceAccountKey,
                        validation: (value) => validateJSON(value, t),
                        isRequired: true,
                        isSecret: true,
                    },
                ],
                columns: 1,
            },
            {
                name: 'Azure credentials',
                inputs: [
                    {
                        id: 'baseDomainResourceGroupName',
                        isHidden: credentialsType !== Provider.azure,
                        type: 'Text',
                        label: t('addConnection.baseDomainResourceGroupName.label'),
                        placeholder: t('addConnection.baseDomainResourceGroupName.placeholder'),
                        labelHelp: t('addConnection.baseDomainResourceGroupName.labelHelp'),
                        value: baseDomainResourceGroupName,
                        onChange: setBaseDomainResourceGroupName,
                        isRequired: true,
                    },
                    {
                        id: 'clientId',
                        isHidden: credentialsType !== Provider.azure,
                        type: 'Text',
                        label: t('addConnection.clientId.label'),
                        placeholder: t('addConnection.clientId.placeholder'),
                        labelHelp: t('addConnection.clientId.labelHelp'),
                        value: clientId,
                        onChange: setClientId,
                        isRequired: true,
                    },
                    {
                        id: 'clientSecret',
                        isHidden: credentialsType !== Provider.azure,
                        type: 'Text',
                        label: t('addConnection.clientSecret.label'),
                        placeholder: t('addConnection.clientSecret.placeholder'),
                        labelHelp: t('addConnection.clientSecret.labelHelp'),
                        isRequired: true,
                        value: clientSecret,
                        onChange: setClientSecret,
                    },
                    {
                        id: 'subscriptionId',
                        isHidden: credentialsType !== Provider.azure,
                        type: 'Text',
                        label: t('addConnection.subscriptionId.label'),
                        placeholder: t('addConnection.subscriptionId.placeholder'),
                        labelHelp: t('addConnection.subscriptionId.labelHelp'),
                        value: subscriptionId,
                        onChange: setSubscriptionId,
                        isRequired: true,
                    },
                    {
                        id: 'tenantId',
                        isHidden: credentialsType !== Provider.azure,
                        type: 'Text',
                        label: t('addConnection.tenantId.label'),
                        placeholder: t('addConnection.tenantId.placeholder'),
                        labelHelp: t('addConnection.tenantId.labelHelp'),
                        value: tenantId,
                        onChange: setTenantId,
                        isRequired: true,
                    },
                ],
            },
            {
                name: 'VMWare vCenter',
                inputs: [
                    {
                        id: 'vcenter',
                        isHidden: credentialsType !== Provider.vmware,
                        type: 'Text',
                        label: t('addConnection.vcenter.label'),
                        placeholder: t('addConnection.vcenter.placeholder'),
                        labelHelp: t('addConnection.vcenter.labelHelp'),
                        value: vcenter,
                        onChange: setVcenter,
                        isRequired: true,
                    },
                    {
                        id: 'username',
                        isHidden: credentialsType !== Provider.vmware,
                        type: 'Text',
                        label: t('addConnection.username.label'),
                        placeholder: t('addConnection.username.placeholder'),
                        labelHelp: t('addConnection.username.labelHelp'),
                        value: username,
                        onChange: setUsername,
                        isRequired: true,
                    },
                    {
                        id: 'password',
                        isHidden: credentialsType !== Provider.vmware,
                        type: 'Text',
                        label: t('addConnection.password.label'),
                        placeholder: t('addConnection.password.placeholder'),
                        labelHelp: t('addConnection.password.labelHelp'),
                        value: password,
                        onChange: setPassword,
                        isRequired: true,
                        isSecret: true,
                    },
                    {
                        id: 'cacertificate',
                        isHidden: credentialsType !== Provider.vmware,
                        type: 'TextArea',
                        label: t('addConnection.cacertificate.label'),
                        placeholder: t('addConnection.cacertificate.placeholder'),
                        labelHelp: t('addConnection.cacertificate.labelHelp'),
                        value: cacertificate,
                        onChange: setCacertificate,
                        validation: (value) => validateCertificate(value, t),
                        isRequired: true,
                    },
                ],
                columns: 1,
            },
            {
                name: 'VMWare vSphere',
                inputs: [
                    {
                        id: 'vmClusterName',
                        isHidden: credentialsType !== Provider.vmware,
                        type: 'Text',
                        label: t('addConnection.vmClusterName.label'),
                        placeholder: t('addConnection.vmClusterName.placeholder'),
                        labelHelp: t('addConnection.vmClusterName.labelHelp'),
                        value: vmClusterName,
                        onChange: setVmClusterName,
                        isRequired: true,
                    },
                    {
                        id: 'datacenter',
                        isHidden: credentialsType !== Provider.vmware,
                        type: 'Text',
                        label: t('addConnection.datacenter.label'),
                        placeholder: t('addConnection.datacenter.placeholder'),
                        labelHelp: t('addConnection.datacenter.labelHelp'),
                        value: datacenter,
                        onChange: setDatacenter,
                        isRequired: true,
                    },
                    {
                        id: 'datastore',
                        isHidden: credentialsType !== Provider.vmware,
                        type: 'Text',
                        label: t('addConnection.datastore.label'),
                        placeholder: t('addConnection.datastore.placeholder'),
                        labelHelp: t('addConnection.datastore.labelHelp'),
                        value: datastore,
                        onChange: setDatastore,
                        isRequired: true,
                    },
                ],
            },
            {
                name: 'Openstack',
                inputs: [
                    {
                        id: 'openstackCloudsYaml',
                        isHidden: credentialsType !== Provider.openstack,
                        type: 'TextArea',
                        label: t('addConnection.openstackCloudsYaml.label'),
                        placeholder: t('addConnection.openstackCloudsYaml.placeholder'),
                        labelHelp: t('addConnection.openstackCloudsYaml.labelHelp'),
                        value: openstackCloudsYaml,
                        onChange: setOpenstackCloudsYaml,
                        isRequired: true,
                        // TODO YAML VALIDATION
                    },
                    {
                        id: 'openstackCloud',
                        isHidden: credentialsType !== Provider.openstack,
                        type: 'Text',
                        label: t('addConnection.openstackCloud.label'),
                        placeholder: t('addConnection.openstackCloud.placeholder'),
                        labelHelp: t('addConnection.openstackCloud.labelHelp'),
                        value: openstackCloud,
                        onChange: setOpenstackCloud,
                        isRequired: true,
                    },
                ],
                columns: 1,
            },
            {
                name: 'Baremetal',
                inputs: [
                    {
                        id: 'libvirtURI',
                        isHidden: credentialsType !== Provider.baremetal,
                        type: 'Text',
                        label: t('addConnection.libvirtURI.label'),
                        placeholder: t('addConnection.libvirtURI.placeholder'),
                        labelHelp: t('addConnection.libvirtURI.labelHelp'),
                        value: libvirtURI,
                        onChange: setLibvirtURI,
                        validation: (value) => validateLibvirtURI(value, t),
                        isRequired: true,
                    },
                    {
                        id: 'sshKnownHosts',
                        isHidden: credentialsType !== Provider.baremetal,
                        type: 'TextArea',
                        label: t('addConnection.sshKnownHosts.label'),
                        placeholder: t('addConnection.sshKnownHosts.placeholder'),
                        labelHelp: t('addConnection.sshKnownHosts.labelHelp'),
                        value: sshKnownHosts,
                        onChange: setSshKnownHosts,
                        isRequired: true,
                    },
                ],
            },
            {
                name: t('addConnection.configureDisconnectedInstall.label'),
                inputs: [
                    {
                        id: 'imageMirror',
                        isHidden: credentialsType !== Provider.baremetal,
                        type: 'Text',
                        label: t('addConnection.imageMirror.label'),
                        placeholder: t('addConnection.imageMirror.placeholder'),
                        labelHelp: t('addConnection.imageMirror.labelHelp'),
                        value: imageMirror,
                        onChange: setImageMirror,
                        validation: (value) => validateImageMirror(value, t),
                    },
                    {
                        id: 'bootstrapOSImage',
                        isHidden: credentialsType !== Provider.baremetal,
                        type: 'Text',
                        label: t('addConnection.bootstrapOSImage.label'),
                        placeholder: t('addConnection.bootstrapOSImage.placeholder'),
                        labelHelp: t('addConnection.bootstrapOSImage.labelHelp'),
                        value: bootstrapOSImage,
                        onChange: setBootstrapOSImage,
                    },
                    {
                        id: 'clusterOSImage',
                        isHidden: credentialsType !== Provider.baremetal,
                        type: 'Text',
                        label: t('addConnection.clusterOSImage.label'),
                        placeholder: t('addConnection.clusterOSImage.placeholder'),
                        labelHelp: t('addConnection.clusterOSImage.labelHelp'),
                        value: clusterOSImage,
                        onChange: setClusterOSImage,
                    },
                    {
                        id: 'additionalTrustBundle',
                        isHidden: credentialsType !== Provider.baremetal,
                        type: 'TextArea',
                        label: t('addConnection.additionalTrustBundle.label'),
                        placeholder: t('addConnection.additionalTrustBundle.placeholder'),
                        labelHelp: t('addConnection.additionalTrustBundle.labelHelp'),
                        value: additionalTrustBundle,
                        onChange: setAdditionalTrustBundle,
                    },
                ],
                columns: 1,
            },
            {
                name: 'Ansible credentials',
                inputs: [
                    {
                        id: 'ansibleHost',
                        isHidden: credentialsType !== Provider.ansible,
                        type: 'Text',
                        label: t('addConnection.ansible.host.label'),
                        placeholder: t('addConnection.ansible.host.placeholder'),
                        value: ansibleHost,
                        onChange: setAnsibleHost,
                        isRequired: true,
                    },
                    {
                        id: 'ansibleToken',
                        isHidden: credentialsType !== Provider.ansible,
                        type: 'Text',
                        label: t('addConnection.ansible.token.label'),
                        placeholder: t('addConnection.ansible.token.placeholder'),
                        value: ansibleToken,
                        onChange: setAnsibleToken,
                        isRequired: true,
                    },
                ],
            },
            {
                name: 'Openshift cluster manager credentials',
                inputs: [
                    {
                        id: 'ocmAPIToken',
                        isHidden: credentialsType !== Provider.redhatcloud,
                        type: 'Text',
                        label: t('addConnection.ocmapitoken.label'),
                        placeholder: t('addConnection.ocmapitoken.placeholder'),
                        labelHelp: t('addConnection.ocmapitoken.labelHelp'),
                        value: ocmAPIToken,
                        onChange: setOcmAPIToken,
                        isRequired: true,
                        isSecret: true,
                    },
                ],
                columns: 1,
            },
            {
                name: 'Base domain',
                inputs: [
                    {
                        id: 'baseDomain',
                        isHidden: ![
                            Provider.aws,
                            Provider.azure,
                            Provider.baremetal,
                            Provider.gcp,
                            Provider.openstack,
                            Provider.vmware,
                        ].includes(credentialsType as Provider),
                        type: 'Text',
                        label: t('addConnection.baseDomain.label'),
                        placeholder: t('addConnection.baseDomain.placeholder'),
                        labelHelp: t('addConnection.baseDomain.labelHelp'),
                        value: baseDomain,
                        onChange: setBaseDomain,
                        validation: (v) => validateBaseDomain(v, t),
                    },
                ],
                columns: 1,
            },
            {
                name: 'Pull secret',
                inputs: [
                    {
                        id: 'pullSecret',
                        isHidden: ![
                            Provider.aws,
                            Provider.azure,
                            Provider.baremetal,
                            Provider.gcp,
                            Provider.openstack,
                            Provider.vmware,
                        ].includes(credentialsType as Provider),
                        type: 'TextArea',
                        label: t('addConnection.pullSecret.label'),
                        placeholder: t('addConnection.pullSecret.placeholder'),
                        labelHelp: t('addConnection.pullSecret.labelHelp'),
                        value: pullSecret,
                        onChange: setPullSecret,
                        validation: (value) => validateJSON(value, t),
                        isRequired: true,
                        isSecret: true,
                    },
                ],
                columns: 1,
            },
            {
                name: 'SSH key',
                inputs: [
                    {
                        id: 'sshPrivatekey',
                        isHidden: ![
                            Provider.aws,
                            Provider.azure,
                            Provider.baremetal,
                            Provider.gcp,
                            Provider.openstack,
                            Provider.vmware,
                        ].includes(credentialsType as Provider),
                        type: 'TextArea',
                        label: t('addConnection.sshPrivateKey.label'),
                        placeholder: t('addConnection.sshPrivateKey.placeholder'),
                        labelHelp: t('addConnection.sshPrivateKey.labelHelp'),
                        value: sshPrivatekey,
                        onChange: setSshPrivatekey,
                        validation: (value) => validatePrivateSshKey(value, t),
                        isRequired: true,
                        isSecret: true,
                    },
                    {
                        id: 'sshPublickey',
                        isHidden: ![
                            Provider.aws,
                            Provider.azure,
                            Provider.baremetal,
                            Provider.gcp,
                            Provider.openstack,
                            Provider.vmware,
                        ].includes(credentialsType as Provider),
                        type: 'TextArea',
                        label: t('addConnection.sshPublicKey.label'),
                        placeholder: t('addConnection.sshPublicKey.placeholder'),
                        labelHelp: t('addConnection.sshPublicKey.labelHelp'),
                        value: sshPublickey,
                        onChange: setSshPublickey,
                        validation: (value) => validatePublicSshKey(value, t),
                        isRequired: true,
                        isSecret: true,
                    },
                ],
                columns: 1,
            },
        ],
        submit: () => {
            if (isEditing) {
                return replaceResource(stateToData() as IResource).promise.then(async () => {
                    if (process.env.NODE_ENV === 'development')
                        await new Promise((resolve) => setTimeout(resolve, 1000))
                    history.push(NavigationPath.credentials)
                })
            } else {
                return createResource(stateToData() as IResource).promise.then(async () => {
                    if (process.env.NODE_ENV === 'development')
                        await new Promise((resolve) => setTimeout(resolve, 1000))
                    history.push(NavigationPath.credentials)
                })
            }
        },
        submitText: isEditing ? 'Save' : 'Add',
        submittingText: isEditing ? 'Saving' : 'Adding',
        cancel: () => history.push(NavigationPath.credentials),
    }
    return <AcmDataFormPage formData={formData} mode={isViewing ? 'details' : isEditing ? 'form' : 'wizard'} />
}
