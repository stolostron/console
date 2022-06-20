/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import {
    AcmEmptyState,
    AcmIcon,
    AcmPage,
    AcmPageHeader,
    AcmToastContext,
    Provider,
    ProviderIconMap,
    ProviderLongTextMap,
} from '../../ui-components'
import _ from 'lodash'
import { Fragment, useContext, useEffect, useState } from 'react'
import { useHistory, useLocation, useParams } from 'react-router'
import { useRecoilCallback } from 'recoil'
import { namespacesState } from '../../atoms'
import { AcmDataFormPage } from '../../components/AcmDataForm'
import { FormData } from '../../components/AcmFormData'
import { ErrorPage } from '../../components/ErrorPage'
import { LoadingPage } from '../../components/LoadingPage'
import { useTranslation } from '../../lib/acm-i18next'
import { DOC_LINKS } from '../../lib/doc-util'
import { getAuthorizedNamespaces, rbacCreate } from '../../lib/rbac-util'
import {
    validateBareMetalOSImageURL,
    validateBaseDomain,
    validateCertificate,
    validateCloudsYaml,
    validateGCProjectID,
    validateHttpProxy,
    validateHttpsProxy,
    validateImageContentSources,
    validateImageMirror,
    validateJSON,
    validateKubernetesDnsName,
    validateLibvirtURI,
    validateNoProxy,
    validatePrivateSshKey,
    validatePublicSshKey,
    validateWebURL,
} from '../../lib/validation'
import { NavigationPath } from '../../NavigationPath'
import {
    createResource,
    getSecret,
    IResource,
    patchResource,
    ProviderConnection,
    Secret,
    SecretDefinition,
    unpackProviderConnection,
} from '../../resources'
import schema from './schema.json'

const credentialProviders: Provider[] = [
    Provider.openstack,
    Provider.redhatvirtualization,
    Provider.ansible,
    Provider.redhatcloud,
    Provider.aws,
    Provider.azure,
    Provider.gcp,
    Provider.vmware,
    Provider.hybrid,
    Provider.hypershift,
]

enum ProviderGroup {
    Automation = 'Automation & other credentials',
    Datacenter = 'Datacenter credentials',
    CloudProvider = 'Cloud provider credentials',
}

const providerGroup: Record<string, string> = {
    [Provider.redhatcloud]: ProviderGroup.Automation,
    [Provider.ansible]: ProviderGroup.Automation,
    [Provider.aws]: ProviderGroup.CloudProvider,
    [Provider.gcp]: ProviderGroup.CloudProvider,
    [Provider.azure]: ProviderGroup.CloudProvider,
    [Provider.ibm]: ProviderGroup.CloudProvider,
    [Provider.openstack]: ProviderGroup.Datacenter,
    [Provider.redhatvirtualization]: ProviderGroup.Datacenter,
    [Provider.baremetal]: ProviderGroup.Datacenter,
    [Provider.vmware]: ProviderGroup.Datacenter,
    [Provider.hybrid]: ProviderGroup.Datacenter,
    [Provider.hypershift]: ProviderGroup.Datacenter,
}

export default function CredentialsFormPage() {
    const params = useParams<{ namespace: string; name: string }>()
    const location = useLocation()
    const { name, namespace } = params
    const { t } = useTranslation()

    let isEditing = false
    let isViewing = false
    if (name !== undefined) {
        isEditing = location.pathname.startsWith('/multicloud/credentials/edit')
        isViewing = !isEditing
    }

    const [error, setError] = useState<Error>()

    // any recoil resources that constantly update because of a time stamp
    const getNamespaces = useRecoilCallback(
        ({ snapshot }) =>
            () =>
                snapshot.getPromise(namespacesState),
        []
    )

    const [projects, setProjects] = useState<string[]>()
    useEffect(() => {
        if (!isEditing && !isViewing) {
            getNamespaces()
                .then((namespaces) => {
                    getAuthorizedNamespaces([rbacCreate(SecretDefinition)], namespaces)
                        .then((namespaces: string[]) => setProjects(namespaces.sort()))
                        .catch(setError)
                })
                .catch(setError)
        }
        return undefined
    }, [getNamespaces, isEditing, isViewing])

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
        if (projects.length === 0) {
            return (
                <AcmPage
                    header={
                        <AcmPageHeader
                            title={t('Add credential')}
                            breadcrumb={[
                                { text: t('Credentials'), to: NavigationPath.credentials },
                                { text: t('Add credential') },
                            ]}
                        />
                    }
                >
                    <PageSection variant="light" isFilled>
                        <AcmEmptyState
                            title={t('Unauthorized')}
                            message={t('rbac.unauthorized.namespace')}
                            showIcon={false}
                        />
                    </PageSection>
                </AcmPage>
            )
        }
        return <CredentialsForm namespaces={projects} isEditing={false} isViewing={false} />
    }
}

export function CredentialsForm(props: {
    namespaces: string[]
    providerConnection?: ProviderConnection
    isEditing: boolean
    isViewing: boolean
}) {
    const { t } = useTranslation()
    const { namespaces, providerConnection, isEditing, isViewing } = props
    const toastContext = useContext(AcmToastContext)

    const history = useHistory()

    const [credentialsType, setCredentialsType] = useState(
        () => providerConnection?.metadata.labels?.['cluster.open-cluster-management.io/type'] ?? ''
    )

    // Details
    const [name, setName] = useState(() => providerConnection?.metadata.name ?? '')
    const [namespace, setNamespace] = useState(() => providerConnection?.metadata.namespace ?? '')

    // Base Domain
    const [baseDomain, setBaseDomain] = useState(() => providerConnection?.stringData?.baseDomain ?? '')

    // Pull Secret
    const [pullSecret, setPullSecret] = useState(() => providerConnection?.stringData?.pullSecret ?? '')

    // SSH Key
    const [sshPublickey, setSshPublickey] = useState(() => providerConnection?.stringData?.['ssh-publickey'] ?? '')
    const [sshPrivatekey, setSshPrivatekey] = useState(() => providerConnection?.stringData?.['ssh-privatekey'] ?? '')

    // Proxy
    const [httpProxy, setHttpProxy] = useState(() => providerConnection?.stringData?.httpProxy ?? '')
    const [httpsProxy, setHttpsProxy] = useState(() => providerConnection?.stringData?.httpsProxy ?? '')
    const [noProxy, setNoProxy] = useState(() => providerConnection?.stringData?.noProxy ?? '')

    // Amazon Web Services State
    const [aws_access_key_id, setAwsAccessKeyID] = useState(
        () => providerConnection?.stringData?.aws_access_key_id ?? ''
    )
    const [aws_secret_access_key, setAwsSecretAccessKeyID] = useState(
        () => providerConnection?.stringData?.aws_secret_access_key ?? ''
    )

    // Azure Cloud State
    const [baseDomainResourceGroupName, setBaseDomainResourceGroupName] = useState(
        () => providerConnection?.stringData?.baseDomainResourceGroupName ?? ''
    )
    enum CloudNames {
        AzurePublicCloud = 'AzurePublicCloud',
        AzureUSGovernmentCloud = 'AzureUSGovernmentCloud',
    }

    const [cloudName, setCloudName] = useState<CloudNames | string>(
        providerConnection?.stringData?.cloudName ?? CloudNames.AzurePublicCloud
    )

    function getDisconnectedDocLink(credentialType: Provider) {
        switch (credentialType) {
            case Provider.vmware:
                return DOC_LINKS.CONFIG_DISCONNECTED_INSTALL_VMWARE
            case Provider.openstack:
                return DOC_LINKS.CONFIG_DISCONNECTED_INSTALL_OPENSTACK
            default:
                return DOC_LINKS.CONFIG_DISCONNECTED_INSTALL
        }
    }

    function getProxyDocLink(credentialType: Provider) {
        switch (credentialType) {
            case Provider.redhatvirtualization:
                return DOC_LINKS.CREATE_CONNECTION_PROXY_VIRTUALIZATION
            case Provider.aws:
                return DOC_LINKS.CREATE_CONNECTION_PROXY_AWS
            case Provider.gcp:
                return DOC_LINKS.CREATE_CONNECTION_PROXY_GCP
            case Provider.azure:
                return DOC_LINKS.CREATE_CONNECTION_PROXY_AZURE
            case Provider.vmware:
                return DOC_LINKS.CREATE_CONNECTION_PROXY_VMWARE
            case Provider.openstack:
                return DOC_LINKS.CREATE_CONNECTION_PROXY_OPENSTACK
            default:
                return DOC_LINKS.CREATE_CONNECTION_PROXY
        }
    }

    let osServicePrincipalJson:
        | {
              clientId: string
              clientSecret: string
              tenantId: string
              subscriptionId: string
          }
        | undefined = undefined

    if (providerConnection?.stringData?.['osServicePrincipal.json']) {
        try {
            osServicePrincipalJson = JSON.parse(providerConnection?.stringData?.['osServicePrincipal.json'])
        } catch {
            // Do Nothing
        }
    }

    const [clientId, setClientId] = useState(() => osServicePrincipalJson?.clientId ?? '')
    const [clientSecret, setClientSecret] = useState(() => osServicePrincipalJson?.clientSecret ?? '')
    const [tenantId, setTenantId] = useState(() => osServicePrincipalJson?.tenantId ?? '')
    const [subscriptionId, setSubscriptionId] = useState(() => osServicePrincipalJson?.subscriptionId ?? '')

    // Google
    const [projectID, setGcProjectID] = useState(() => providerConnection?.stringData?.projectID ?? '')
    const [osServiceAccountJson, setGcServiceAccountKey] = useState(
        () => providerConnection?.stringData?.['osServiceAccount.json'] ?? ''
    )

    // VMware
    const [vCenter, setVcenter] = useState(() => providerConnection?.stringData?.vCenter ?? '')
    const [username, setUsername] = useState(() => providerConnection?.stringData?.username ?? '')
    const [password, setPassword] = useState(() => providerConnection?.stringData?.password ?? '')
    const [cacertificate, setCacertificate] = useState(() => providerConnection?.stringData?.cacertificate ?? '')
    const [cluster, setVmClusterName] = useState(() => providerConnection?.stringData?.cluster ?? '')
    const [datacenter, setDatacenter] = useState(() => providerConnection?.stringData?.datacenter ?? '')
    const [defaultDatastore, setDatastore] = useState(() => providerConnection?.stringData?.defaultDatastore ?? '')

    // OpenStack
    const [cloudsYaml, setOpenstackCloudsYaml] = useState(() => providerConnection?.stringData?.['clouds.yaml'] ?? '')
    const [cloud, setOpenstackCloud] = useState(() => providerConnection?.stringData?.cloud ?? '')

    // Red Hat Virtualization
    const [ovirtUrl, setOvirtUrl] = useState(() => providerConnection?.stringData?.ovirt_url ?? '')
    const [ovirtFqdn, setOvirtFqdn] = useState(() => providerConnection?.stringData?.ovirt_fqdn ?? '')
    const [ovirtUsername, setOvirtUsername] = useState(() => providerConnection?.stringData?.ovirt_username ?? '')
    const [ovirtPassword, setOvirtPassword] = useState(() => providerConnection?.stringData?.ovirt_password ?? '')
    const [ovirtCABundle, setOvirtCABundle] = useState(() => providerConnection?.stringData?.ovirt_ca_bundle ?? '')

    // BareMetal
    const [libvirtURI, setLibvirtURI] = useState(() => providerConnection?.stringData?.libvirtURI ?? '')
    const [sshKnownHosts, setSshKnownHosts] = useState(() => providerConnection?.stringData?.sshKnownHosts ?? '')
    const [bootstrapOSImage, setBootstrapOSImage] = useState(
        () => providerConnection?.stringData?.bootstrapOSImage ?? ''
    )
    const [imageMirror, setImageMirror] = useState(() => providerConnection?.stringData?.imageMirror ?? '')

    // Disconnected or Proxy
    const [clusterOSImage, setClusterOSImage] = useState(() => providerConnection?.stringData?.clusterOSImage ?? '')
    const [additionalTrustBundle, setAdditionalTrustBundle] = useState(
        () => providerConnection?.stringData?.additionalTrustBundle ?? ''
    )
    const [imageContentSources, setImageContentSources] = useState(
        () => providerConnection?.stringData?.imageContentSources ?? ''
    )

    // Ansible
    const [ansibleHost, setAnsibleHost] = useState(() => providerConnection?.stringData?.host ?? '')
    const [ansibleToken, setAnsibleToken] = useState(() => providerConnection?.stringData?.token ?? '')

    // Red Hat Cloud
    const [ocmAPIToken, setOcmAPIToken] = useState(() => providerConnection?.stringData?.ocmAPIToken ?? '')

    function stateToData() {
        const secret: ProviderConnection = {
            apiVersion: 'v1',
            kind: 'Secret',
            type: 'Opaque',
            metadata: {
                name,
                namespace,
                labels: {
                    ...(providerConnection ? providerConnection.metadata.labels : {}),
                    ...{
                        'cluster.open-cluster-management.io/type': credentialsType,
                        'cluster.open-cluster-management.io/credentials': '',
                    },
                },
            },
            stringData: {},
        }
        let annotations = providerConnection ? providerConnection?.metadata.annotations : undefined
        if (annotations) {
            delete annotations['kubectl.kubernetes.io/last-applied-configuration']
            if (Object.keys(annotations).length === 0) annotations = undefined
        }
        if (annotations) {
            secret.metadata.annotations = annotations
        }

        switch (credentialsType) {
            case Provider.aws:
                secret.stringData!.aws_access_key_id = aws_access_key_id
                secret.stringData!.aws_secret_access_key = aws_secret_access_key
                secret.stringData!.baseDomain = baseDomain
                secret.stringData!.pullSecret = pullSecret
                secret.stringData!['ssh-privatekey'] = sshPrivatekey
                secret.stringData!['ssh-publickey'] = sshPublickey
                secret.stringData!.httpProxy = httpProxy
                secret.stringData!.httpsProxy = httpsProxy
                secret.stringData!.noProxy = noProxy
                secret.stringData!.additionalTrustBundle = additionalTrustBundle
                break
            case Provider.azure:
                secret.stringData!.baseDomainResourceGroupName = baseDomainResourceGroupName
                secret.stringData!.cloudName = cloudName
                secret.stringData!['osServicePrincipal.json'] = JSON.stringify({
                    clientId,
                    clientSecret,
                    tenantId,
                    subscriptionId,
                })
                secret.stringData!.baseDomain = baseDomain
                secret.stringData!.pullSecret = pullSecret
                secret.stringData!['ssh-privatekey'] = sshPrivatekey
                secret.stringData!['ssh-publickey'] = sshPublickey
                secret.stringData!.httpProxy = httpProxy
                secret.stringData!.httpsProxy = httpsProxy
                secret.stringData!.noProxy = noProxy
                secret.stringData!.additionalTrustBundle = additionalTrustBundle
                break
            case Provider.gcp:
                secret.stringData!.projectID = projectID
                secret.stringData!['osServiceAccount.json'] = osServiceAccountJson
                secret.stringData!.baseDomain = baseDomain
                secret.stringData!.pullSecret = pullSecret
                secret.stringData!['ssh-privatekey'] = sshPrivatekey
                secret.stringData!['ssh-publickey'] = sshPublickey
                secret.stringData!.httpProxy = httpProxy
                secret.stringData!.httpsProxy = httpsProxy
                secret.stringData!.noProxy = noProxy
                secret.stringData!.additionalTrustBundle = additionalTrustBundle
                break
            case Provider.vmware:
                secret.stringData!.vCenter = vCenter
                secret.stringData!.username = username
                secret.stringData!.password = password
                secret.stringData!.cacertificate = cacertificate
                secret.stringData!.cluster = cluster
                secret.stringData!.datacenter = datacenter
                secret.stringData!.defaultDatastore = defaultDatastore
                secret.stringData!.baseDomain = baseDomain
                secret.stringData!.pullSecret = pullSecret
                secret.stringData!['ssh-privatekey'] = sshPrivatekey
                secret.stringData!['ssh-publickey'] = sshPublickey
                secret.stringData!.imageContentSources = imageContentSources
                secret.stringData!.httpProxy = httpProxy
                secret.stringData!.httpsProxy = httpsProxy
                secret.stringData!.noProxy = noProxy
                secret.stringData!.additionalTrustBundle = additionalTrustBundle
                break
            case Provider.openstack:
                secret.stringData!['clouds.yaml'] = cloudsYaml
                secret.stringData!.cloud = cloud
                secret.stringData!.baseDomain = baseDomain
                secret.stringData!.pullSecret = pullSecret
                secret.stringData!['ssh-privatekey'] = sshPrivatekey
                secret.stringData!['ssh-publickey'] = sshPublickey
                secret.stringData!.clusterOSImage = clusterOSImage
                secret.stringData!.imageContentSources = imageContentSources
                secret.stringData!.httpProxy = httpProxy
                secret.stringData!.httpsProxy = httpsProxy
                secret.stringData!.noProxy = noProxy
                secret.stringData!.additionalTrustBundle = additionalTrustBundle
                break
            case Provider.baremetal:
                secret.stringData!.libvirtURI = libvirtURI
                secret.stringData!.sshKnownHosts = sshKnownHosts
                secret.stringData!.imageMirror = imageMirror
                secret.stringData!.bootstrapOSImage = bootstrapOSImage
                secret.stringData!.clusterOSImage = clusterOSImage
                secret.stringData!.baseDomain = baseDomain
                secret.stringData!.pullSecret = pullSecret
                secret.stringData!['ssh-privatekey'] = sshPrivatekey
                secret.stringData!['ssh-publickey'] = sshPublickey
                secret.stringData!.httpProxy = httpProxy
                secret.stringData!.httpsProxy = httpsProxy
                secret.stringData!.noProxy = noProxy
                secret.stringData!.additionalTrustBundle = additionalTrustBundle
                break
            case Provider.redhatvirtualization:
                secret.stringData!.ovirt_url = ovirtUrl
                secret.stringData!.ovirt_fqdn = ovirtFqdn
                secret.stringData!.ovirt_username = ovirtUsername
                secret.stringData!.ovirt_password = ovirtPassword
                secret.stringData!.ovirt_ca_bundle = ovirtCABundle
                secret.stringData!.baseDomain = baseDomain
                secret.stringData!.pullSecret = pullSecret
                secret.stringData!['ssh-privatekey'] = sshPrivatekey
                secret.stringData!['ssh-publickey'] = sshPublickey
                secret.stringData!.httpProxy = httpProxy
                secret.stringData!.httpsProxy = httpsProxy
                secret.stringData!.noProxy = noProxy
                secret.stringData!.additionalTrustBundle = additionalTrustBundle
                break
            case Provider.ansible:
                secret.stringData!.host = _.trimEnd(ansibleHost, '/')
                secret.stringData!.token = ansibleToken
                break
            case Provider.redhatcloud:
                secret.stringData!.ocmAPIToken = ocmAPIToken
                break
            case Provider.hybrid:
                secret.stringData!.baseDomain = baseDomain
                secret.stringData!.pullSecret = pullSecret
                break
            case Provider.hypershift:
                secret.stringData!.baseDomain = baseDomain
                secret.stringData!.pullSecret = pullSecret
                secret.stringData!['ssh-publickey'] = sshPublickey
                break
        }
        if (secret.stringData?.pullSecret && !secret.stringData.pullSecret.endsWith('\n')) {
            secret.stringData.pullSecret += '\n'
        }
        if (secret.stringData?.['ssh-privatekey'] && !secret.stringData['ssh-privatekey'].endsWith('\n')) {
            secret.stringData['ssh-privatekey'] += '\n'
        }
        if (secret.stringData?.['ssh-publickey'] && !secret.stringData['ssh-publickey'].endsWith('\n')) {
            secret.stringData['ssh-publickey'] += '\n'
        }
        return secret
        // return packProviderConnection(secret)
    }
    function stateToSyncs() {
        const syncs = [
            { path: 'Secret[0].metadata.name', setState: setName },
            { path: 'Secret[0].metadata.namespace', setState: setNamespace },
            { path: 'Secret[0].stringData.baseDomain', setState: setBaseDomain },
            { path: 'Secret[0].stringData.pullSecret', setState: setPullSecret },
            { path: 'Secret[0].stringData.ssh-publickey', setState: setSshPublickey },
            { path: 'Secret[0].stringData.ssh-privatekey', setState: setSshPrivatekey },
            { path: 'Secret[0].stringData.httpProxy', setState: setHttpProxy },
            { path: 'Secret[0].stringData.httpsProxy', setState: setHttpsProxy },
            { path: 'Secret[0].stringData.noProxy', setState: setNoProxy },
            { path: 'Secret[0].stringData.aws_access_key_id', setState: setAwsAccessKeyID },
            { path: 'Secret[0].stringData.aws_secret_access_key', setState: setAwsSecretAccessKeyID },
            { path: 'Secret[0].stringData.baseDomainResourceGroupName', setState: setBaseDomainResourceGroupName },
            { path: 'Secret[0].stringData.cloudName', setState: setCloudName },
            { path: 'Secret[0].stringData.projectID', setState: setGcProjectID },
            { path: 'Secret[0].stringData.vCenter', setState: setVcenter },
            { path: 'Secret[0].stringData.username', setState: setUsername },
            { path: 'Secret[0].stringData.password', setState: setPassword },
            { path: 'Secret[0].stringData.cacertificate', setState: setCacertificate },
            { path: 'Secret[0].stringData.cluster', setState: setVmClusterName },
            { path: 'Secret[0].stringData.datacenter', setState: setDatacenter },
            { path: 'Secret[0].stringData.defaultDatastore', setState: setDatastore },
            { path: ['Secret', '0', 'stringData', 'clouds.yaml'], setState: setOpenstackCloudsYaml },
            { path: 'Secret[0].stringData.cloud', setState: setOpenstackCloud },
            { path: 'Secret[0].stringData.ovirt_url', setState: setOvirtUrl },
            { path: 'Secret[0].stringData.ovirt_fqdn', setState: setOvirtFqdn },
            { path: 'Secret[0].stringData.ovirt_username', setState: setOvirtUsername },
            { path: 'Secret[0].stringData.ovirt_password', setState: setOvirtPassword },
            { path: 'Secret[0].stringData.ovirt_ca_bundle', setState: setOvirtCABundle },
            { path: 'Secret[0].stringData.libvirtURI', setState: setLibvirtURI },
            { path: 'Secret[0].stringData.sshKnownHosts', setState: setSshKnownHosts },
            { path: 'Secret[0].stringData.bootstrapOSImage', setState: setBootstrapOSImage },
            { path: 'Secret[0].stringData.imageMirror', setState: setImageMirror },
            { path: 'Secret[0].stringData.clusterOSImage', setState: setClusterOSImage },
            { path: 'Secret[0].stringData.additionalTrustBundle', setState: setAdditionalTrustBundle },
            { path: 'Secret[0].stringData.imageContentSources', setState: setImageContentSources },
            { path: 'Secret[0].stringData.host', setState: setAnsibleHost },
            { path: 'Secret[0].stringData.token', setState: setAnsibleToken },
            { path: 'Secret[0].stringData.ocmAPIToken', setState: setOcmAPIToken },
        ]
        return syncs
    }
    const title = isViewing ? name : isEditing ? t('Edit credential') : t('Add credential')
    const titleTooltip = (
        <Fragment>
            {t('A credential stores the access credentials and configuration information for creating clusters.')}
            <a
                href={DOC_LINKS.CREATE_CONNECTION}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'block', marginTop: '4px' }}
            >
                {t('Learn more')}
            </a>
        </Fragment>
    )

    const formData: FormData = {
        title,
        titleTooltip,
        breadcrumb: [{ text: t('Credentials'), to: NavigationPath.credentials }, { text: title }],
        sections: [
            {
                type: 'Section',
                title: credentialsType ? t('Basic information') : t('Credential type'),
                wizardTitle: credentialsType
                    ? t('Enter the basic credentials information')
                    : t('Select the credentials type'),
                description: !credentialsType && (
                    <a href={DOC_LINKS.CREATE_CONNECTION} target="_blank" rel="noreferrer">
                        {t('What are the different credentials types?')}
                    </a>
                ),
                inputs: [
                    {
                        id: 'credentialsType',
                        type: isEditing || credentialsType ? 'GroupedSelect' : 'GroupedTiles',
                        label: t('Credential type'),
                        placeholder: t('Select the credentials type'),
                        value: credentialsType,
                        onChange: setCredentialsType,
                        isRequired: true,
                        groups: [
                            {
                                group: ProviderGroup.CloudProvider,
                                options: credentialProviders
                                    .filter((provider) => providerGroup[provider] === ProviderGroup.CloudProvider)
                                    .map((provider) => {
                                        return {
                                            id: provider,
                                            value: provider,
                                            icon: <AcmIcon icon={ProviderIconMap[provider]} />,
                                            text: ProviderLongTextMap[provider],
                                        }
                                    }),
                            },
                            {
                                group: ProviderGroup.Datacenter,
                                options: credentialProviders
                                    .filter((provider) => providerGroup[provider] === ProviderGroup.Datacenter)
                                    .map((provider) => {
                                        return {
                                            id: provider,
                                            value: provider,
                                            icon: <AcmIcon icon={ProviderIconMap[provider]} />,
                                            text: ProviderLongTextMap[provider],
                                        }
                                    }),
                            },
                            {
                                group: ProviderGroup.Automation,
                                options: credentialProviders
                                    .filter((provider) => providerGroup[provider] === ProviderGroup.Automation)
                                    .map((provider) => {
                                        return {
                                            id: provider,
                                            value: provider,
                                            icon: <AcmIcon icon={ProviderIconMap[provider]} />,
                                            text: ProviderLongTextMap[provider],
                                        }
                                    }),
                            },
                        ],
                        isDisabled: isEditing,
                    },
                    {
                        id: 'credentialsName',
                        type: 'Text',
                        label: t('Credential name'),
                        placeholder: t('Enter the name for the credential'),
                        labelHelp: t('The name for the credential.'),
                        value: name,
                        onChange: setName,
                        validation: (value) => validateKubernetesDnsName(value, t),
                        isRequired: true,
                        isDisabled: isEditing,
                        isHidden: !credentialsType,
                    },
                    {
                        id: 'namespaceName',
                        type: 'Select',
                        label: t('Namespace'),
                        placeholder: t('Select a namespace for the credential'),
                        labelHelp: t('The existing namespace where the credential secret will be stored.'),
                        value: namespace,
                        onChange: setNamespace,
                        isRequired: true,
                        options: namespaces.map((namespace) => ({
                            id: namespace,
                            value: namespace,
                        })),
                        isDisabled: isEditing,
                        isHidden: !credentialsType,
                    },
                    {
                        id: 'baseDomain',
                        isHidden: ![
                            Provider.aws,
                            Provider.azure,
                            Provider.baremetal,
                            Provider.gcp,
                            Provider.openstack,
                            Provider.vmware,
                            Provider.redhatvirtualization,
                            Provider.hybrid,
                            Provider.hypershift,
                        ].includes(credentialsType as Provider),
                        type: 'Text',
                        label: t('Base DNS domain'),
                        placeholder: t('Enter the base DNS domain'),
                        labelHelp: [Provider.baremetal, Provider.hybrid].includes(credentialsType as Provider)
                            ? t(
                                  'Optional: The base domain of your network, which is used to create routes to your OpenShift Container Platform cluster components. It must contain the cluster name that you plan to create, and is configured in the DNS of your network as a Start Of Authority (SOA) record. You can also add this when you create the cluster.'
                              )
                            : t(
                                  "Optional: The base domain of your provider, which is used to create routes to your OpenShift Container Platform cluster components. It is configured in your cloud provider's DNS as a Start Of Authority (SOA) record."
                              ),
                        value: baseDomain,
                        onChange: setBaseDomain,
                        validation: (v) => validateBaseDomain(v, t),
                    },
                    {
                        id: 'azureCloudName',
                        type: 'Select',
                        label: t('Cloud name'),
                        labelHelp: t('Select an active cloud name for the credential.'),
                        value: cloudName,
                        onChange: setCloudName,
                        isRequired: true,
                        options: [
                            { id: CloudNames.AzurePublicCloud, value: CloudNames.AzurePublicCloud },
                            { id: CloudNames.AzureUSGovernmentCloud, value: CloudNames.AzureUSGovernmentCloud },
                        ],
                        isHidden: credentialsType != Provider.azure,
                    },
                ],
            },
            {
                type: 'Section',
                title: t('Amazon Web Services'),
                wizardTitle: t('Enter the Amazon Web Services credentials'),
                description: (
                    <a href={DOC_LINKS.CREATE_CONNECTION_AWS} target="_blank" rel="noreferrer">
                        {t('How do I get Amazon Web Service credentials?')}
                    </a>
                ),
                inputs: [
                    {
                        id: 'aws_access_key_id',
                        isHidden: credentialsType !== Provider.aws,
                        type: 'Text',
                        label: t('Access key ID'),
                        placeholder: t('Enter your AWS access key ID'),
                        labelHelp: t(
                            'You use access keys to sign programmatic requests that you make to AWS. The access key is equivalent to a username in a username/password combination.'
                        ),
                        value: aws_access_key_id,
                        onChange: setAwsAccessKeyID,
                        isRequired: true,
                    },
                    {
                        id: 'aws_secret_access_key',
                        isHidden: credentialsType !== Provider.aws,
                        type: 'Text',
                        label: t('Secret access key'),
                        placeholder: t('Enter your AWS secret access key'),
                        labelHelp: t(
                            'You use access keys to sign programmatic requests that you make to AWS. The secret access key is equivalent to a password in a username/password combination.'
                        ),
                        value: aws_secret_access_key,
                        onChange: setAwsSecretAccessKeyID,
                        isRequired: true,
                        isSecret: true,
                    },
                ],
            },
            {
                type: 'Section',
                title: t('Google Cloud Platform'),
                wizardTitle: t('Enter the Google Cloud Platform credentials'),
                description: (
                    <a href={DOC_LINKS.CREATE_CONNECTION_GCP} target="_blank" rel="noreferrer">
                        {t('How do I get Google Cloud Platform credentials?')}
                    </a>
                ),
                inputs: [
                    {
                        id: 'projectID',
                        isHidden: credentialsType !== Provider.gcp,
                        type: 'Text',
                        label: t('Project ID'),
                        placeholder: t('Enter your Google Cloud Platform project ID'),
                        labelHelp: t(
                            'A project organizes all of your Google Cloud resources. A project consists of a set of users; a set of APIs; and billing, authentication, and monitoring settings for those APIs. So, for example, all of your Cloud Storage buckets and objects, along with user permissions for accessing them, reside in a project.'
                        ),
                        value: projectID,
                        onChange: setGcProjectID,
                        validation: (value) => validateGCProjectID(value, t),
                        isRequired: true,
                    },
                    {
                        id: 'osServiceAccount.json',
                        isHidden: credentialsType !== Provider.gcp,
                        type: 'TextArea',
                        label: t('Service account JSON key'),
                        placeholder: t('Enter your Google Cloud Platform service account JSON key'),
                        labelHelp: t(
                            'Creating a service account is similar to adding a member to your project, but the service account belongs to your applications rather than an individual end user.'
                        ),
                        value: osServiceAccountJson,
                        onChange: setGcServiceAccountKey,
                        validation: (value) => validateJSON(value, t),
                        isRequired: true,
                        isSecret: true,
                    },
                ],
            },
            {
                type: 'Section',
                title: t('Microsoft Azure'),
                wizardTitle: t('Enter the Microsoft Azure credentials'),
                description: (
                    <a href={DOC_LINKS.CREATE_CONNECTION_AZURE} target="_blank" rel="noreferrer">
                        {t('How do I get Microsoft Azure credentials?')}
                    </a>
                ),
                inputs: [
                    {
                        id: 'baseDomainResourceGroupName',
                        isHidden: credentialsType !== Provider.azure,
                        type: 'Text',
                        label: t('Base domain resource group name'),
                        placeholder: t('Enter your base domain resource group name'),
                        labelHelp: t(
                            'Azure Resources Groups are logical collections of virtual machines, storage accounts, virtual networks, web apps, databases, and/or database servers. Typically, users group related resources for an application, divided into groups for production and non-production.'
                        ),
                        value: baseDomainResourceGroupName,
                        onChange: setBaseDomainResourceGroupName,
                        isRequired: true,
                    },
                    {
                        id: 'clientId',
                        isHidden: credentialsType !== Provider.azure,
                        type: 'Text',
                        label: t('Client ID'),
                        placeholder: t('Enter your client ID'),
                        labelHelp: t(
                            "Your client ID. This value is generated as the 'appId' property when you create a service principal with the command: 'az ad sp create-for-rbac --role Contributor --name <service_principal>'."
                        ),
                        value: clientId,
                        onChange: setClientId,
                        isRequired: true,
                    },
                    {
                        id: 'clientSecret',
                        isHidden: credentialsType !== Provider.azure,
                        type: 'Text',
                        label: t('Client secret'),
                        placeholder: t('Enter your client secret'),
                        labelHelp: t(
                            "Your client password. This value is generated as the 'password' property when you create a service principal with the command: 'az ad sp create-for-rbac --role Contributor --name <service_principal>'."
                        ),
                        isRequired: true,
                        value: clientSecret,
                        onChange: setClientSecret,
                        isSecret: true,
                    },
                    {
                        id: 'subscriptionId',
                        isHidden: credentialsType !== Provider.azure,
                        type: 'Text',
                        label: t('Subscription ID'),
                        placeholder: t('Enter your subscription ID'),
                        labelHelp: t(
                            "Your subscription ID. This is the value of the 'id' property in the output of the command: 'az account show'"
                        ),
                        value: subscriptionId,
                        onChange: setSubscriptionId,
                        isRequired: true,
                    },
                    {
                        id: 'tenantId',
                        isHidden: credentialsType !== Provider.azure,
                        type: 'Text',
                        label: t('Tenant ID'),
                        placeholder: t('Enter your tenant ID'),
                        labelHelp: t(
                            "Your tenant ID. This is the value of the 'tenantId' property in the output of the command: 'az account show'"
                        ),
                        value: tenantId,
                        onChange: setTenantId,
                        isRequired: true,
                    },
                ],
            },
            {
                type: 'Section',
                title: t('VMware'),
                wizardTitle: t('Enter the VMware credentials'),
                description: (
                    <a href={DOC_LINKS.CREATE_CONNECTION_VMWARE} target="_blank" rel="noreferrer">
                        {t('How do I get VMware credentials?')}
                    </a>
                ),
                inputs: [
                    {
                        id: 'vCenter',
                        isHidden: credentialsType !== Provider.vmware,
                        type: 'Text',
                        label: t('vCenter server'),
                        placeholder: t('Enter your vCenter server'),
                        labelHelp: t(
                            'The fully-qualified host name or IP address of the vCenter server. The value must be defined in the vCenter server root CA certificate.'
                        ),
                        value: vCenter,
                        onChange: setVcenter,
                        isRequired: true,
                    },
                    {
                        id: 'username',
                        isHidden: credentialsType !== Provider.vmware,
                        type: 'Text',
                        label: t('vCenter username'),
                        placeholder: t('Enter your vCenter username'),
                        labelHelp: t(
                            'The name of the user that is required to access the vCenter server. This user must have at least the roles and privileges that are required for static or dynamic persistent volume provisioning in vSphere.'
                        ),
                        value: username,
                        onChange: setUsername,
                        isRequired: true,
                    },
                    {
                        id: 'password',
                        isHidden: credentialsType !== Provider.vmware,
                        type: 'Text',
                        label: t('vCenter password'),
                        placeholder: t('Enter your vCenter password'),
                        labelHelp: t('The password associated with the vCenter username.'),
                        value: password,
                        onChange: setPassword,
                        isRequired: true,
                        isSecret: true,
                    },
                    {
                        id: 'cacertificate',
                        isHidden: credentialsType !== Provider.vmware,
                        type: 'TextArea',
                        label: t('vCenter root CA certificate'),
                        placeholder: t('Enter your vCenter root CA certificate'),
                        labelHelp: t(
                            'A vCenter server root CA certificate that, when added, reduces the number of web browser certificate warnings.'
                        ),
                        value: cacertificate,
                        onChange: setCacertificate,
                        validation: (value) => validateCertificate(value, t),
                        isRequired: true,
                    },
                    {
                        id: 'cluster',
                        isHidden: credentialsType !== Provider.vmware,
                        type: 'Text',
                        label: t('vSphere cluster name'),
                        placeholder: t('Enter your vSphere cluster name'),
                        labelHelp: t('The name of the vSphere cluster to use.'),
                        value: cluster,
                        onChange: setVmClusterName,
                        isRequired: true,
                    },
                    {
                        id: 'datacenter',
                        isHidden: credentialsType !== Provider.vmware,
                        type: 'Text',
                        label: t('vSphere datacenter'),
                        placeholder: t('Enter your vSphere datacenter'),
                        labelHelp: t('The name of the vSphere datacenter to use.'),
                        value: datacenter,
                        onChange: setDatacenter,
                        isRequired: true,
                    },
                    {
                        id: 'defaultDatastore',
                        isHidden: credentialsType !== Provider.vmware,
                        type: 'Text',
                        label: t('vSphere default defaultDatastore'),
                        placeholder: t('Enter your vSphere default defaultDatastore'),
                        labelHelp: t('The name of the default vSphere defaultDatastore to use.'),
                        value: defaultDatastore,
                        onChange: setDatastore,
                        isRequired: true,
                    },
                ],
            },
            {
                type: 'Section',
                title: t('Red Hat OpenStack Platform'),
                wizardTitle: t('Enter the OpenStack credentials'),
                description: (
                    <a href={DOC_LINKS.CREATE_CONNECTION_OPENSTACK} target="_blank" rel="noreferrer">
                        {t('How do I get OpenStack credentials?')}
                    </a>
                ),
                inputs: [
                    {
                        id: 'clouds.yaml',
                        isHidden: credentialsType !== Provider.openstack,
                        type: 'TextArea',
                        label: t('OpenStack clouds.yaml'),
                        placeholder: t('Enter the contents of the OpenStack clouds.yaml'),
                        labelHelp: t(
                            'The OpenStack clouds.yaml file, including the password, to connect to the OpenStack server.'
                        ),
                        value: cloudsYaml,
                        onChange: setOpenstackCloudsYaml,
                        isRequired: true,
                        isSecret: true,
                        validation: (value) => validateCloudsYaml(value, cloud, t),
                    },
                    {
                        id: 'cloud',
                        isHidden: credentialsType !== Provider.openstack,
                        type: 'Text',
                        label: t('Cloud name'),
                        placeholder: t('Enter the OpenStack cloud name to reference in the clouds.yaml'),
                        labelHelp: t(
                            'The name of the cloud section of the clouds.yaml to use for establishing communication to the OpenStack server.'
                        ),
                        value: cloud,
                        onChange: setOpenstackCloud,
                        isRequired: true,
                    },
                ],
            },
            {
                type: 'Section',
                title: t('credentialsForm.rhvCredentials.title'),
                wizardTitle: t('credentialsForm.rhvCredentials.wizardTitle'),
                description: (
                    <a href={DOC_LINKS.CREATE_CONNECTION_VIRTUALIZATION} target="_blank" rel="noreferrer">
                        {t('credentialsForm.rhvCredentials.wizardDescription')}
                    </a>
                ),
                inputs: [
                    {
                        id: 'ovirt_url',
                        isHidden: credentialsType !== Provider.redhatvirtualization,
                        type: 'Text',
                        label: t('credentialsForm.ovirt_url.label'),
                        placeholder: t('credentialsForm.ovirt_url.placeholder'),
                        labelHelp: t('credentialsForm.ovirt_url.labelHelp'),
                        value: ovirtUrl,
                        onChange: setOvirtUrl,
                        isRequired: true,
                        isSecret: false,
                        // validation: (value) => validateCloudsYaml(value, cloud, t),
                    },
                    {
                        id: 'ovirt_fqdn',
                        isHidden: credentialsType !== Provider.redhatvirtualization,
                        type: 'Text',
                        label: t('credentialsForm.ovirt_fqdn.label'),
                        placeholder: t('credentialsForm.ovirt_fqdn.placeholder'),
                        labelHelp: t('credentialsForm.ovirt_fqdn.labelHelp'),
                        value: ovirtFqdn,
                        onChange: setOvirtFqdn,
                        isRequired: true,
                        isSecret: false,
                        // validation: (value) => validateCloudsYaml(value, cloud, t),
                    },
                    {
                        id: 'ovirt_username',
                        isHidden: credentialsType !== Provider.redhatvirtualization,
                        type: 'Text',
                        label: t('credentialsForm.ovirt_username.label'),
                        placeholder: t('credentialsForm.ovirt_username.placeholder'),
                        labelHelp: t('credentialsForm.ovirt_username.labelHelp'),
                        value: ovirtUsername,
                        onChange: setOvirtUsername,
                        isRequired: true,
                        isSecret: false,
                        // validation: (value) => validateCloudsYaml(value, cloud, t),
                    },
                    {
                        id: 'ovirt_password',
                        isHidden: credentialsType !== Provider.redhatvirtualization,
                        type: 'Text',
                        label: t('credentialsForm.ovirt_password.label'),
                        placeholder: t('credentialsForm.ovirt_password.placeholder'),
                        labelHelp: t('credentialsForm.ovirt_password.labelHelp'),
                        value: ovirtPassword,
                        onChange: setOvirtPassword,
                        isRequired: true,
                        isSecret: true,
                        // validation: (value) => validateCloudsYaml(value, cloud, t),
                    },
                    {
                        id: 'ovirt_ca_bundle',
                        isHidden: credentialsType !== Provider.redhatvirtualization,
                        type: 'TextArea',
                        label: t('credentialsForm.ovirt_ca_bundle.label'),
                        placeholder: t('credentialsForm.ovirt_ca_bundle.placeholder'),
                        labelHelp: t('credentialsForm.ovirt_ca_bundle.labelHelp'),
                        value: ovirtCABundle,
                        onChange: setOvirtCABundle,
                        isRequired: true,
                        validation: (value) => validateCertificate(value, t),
                    },
                ],
            },
            {
                type: 'Section',
                title: t('Bare metal credentials'),
                wizardTitle: t('Enter the bare metal credentials'),
                description: (
                    <a href={DOC_LINKS.CREATE_CONNECTION_BAREMETAL} target="_blank" rel="noreferrer">
                        {t('How do I get bare metal credentials?')}
                    </a>
                ),
                inputs: [
                    {
                        id: 'libvirtURI',
                        isHidden: credentialsType !== Provider.baremetal,
                        type: 'Text',
                        label: t('libvirt URI'),
                        placeholder: t('Enter your libvirt URI'),
                        labelHelp: t(
                            'The URI of the libvirt which is an open-source API, daemon and management tool for managing platform virtualization. It can be used to manage KVM, Xen, VMware ESXi, QEMU and other virtualization technologies. These APIs are widely used in the orchestration layer of hypervisors in the development of a cloud-based solution.'
                        ),
                        value: libvirtURI,
                        onChange: setLibvirtURI,
                        validation: (value) => validateLibvirtURI(value, t),
                        isRequired: true,
                    },
                    {
                        id: 'sshKnownHosts',
                        isHidden: credentialsType !== Provider.baremetal,
                        type: 'TextArea',
                        label: t('List of SSH known hosts'),
                        placeholder: t('Enter your list of SSH known hosts'),
                        labelHelp: t(
                            'SSH clients store host keys for hosts to which they have previously connected. These stored host keys are called known host keys, and the collection is often called known hosts.'
                        ),
                        value: sshKnownHosts,
                        onChange: setSshKnownHosts,
                        isRequired: true,
                    },
                ],
            },
            {
                type: 'Section',
                title: t('Configuration for disconnected installation'),
                wizardTitle: t('Enter the configuration for disconnected installation'),
                description: (
                    <a href={getDisconnectedDocLink(credentialsType as Provider)} target="_blank" rel="noreferrer">
                        {t('How do I configure for disconnected installation?')}
                    </a>
                ),
                inputs: [
                    {
                        id: 'imageMirror',
                        isHidden: credentialsType !== Provider.baremetal,
                        type: 'Text',
                        label: t('Image registry mirror'),
                        placeholder: t('Enter your image registry mirror'),
                        labelHelp: t(
                            'Optional: Disconnected registry path, defined as hostname, port and repository path. It must contain all the installation images, and is used in disconnected installations. Example: repository.com:5000/openshift/ocp-release.'
                        ),
                        value: imageMirror,
                        onChange: setImageMirror,
                        validation: (value) => validateImageMirror(value, t),
                    },
                    {
                        id: 'bootstrapOSImage',
                        isHidden: credentialsType !== Provider.baremetal,
                        type: 'Text',
                        label: t('Bootstrap OS image'),
                        placeholder: t(
                            'Enter your bootstrap OS image.  The value must also contain the SHA-256 hash of the image.'
                        ),
                        labelHelp: t(
                            'This value contains the URL to the image to use for the bootstrap machine. The value must also contain the SHA-256 hash of the image.'
                        ),
                        value: bootstrapOSImage,
                        onChange: setBootstrapOSImage,
                        validation: (value) => validateBareMetalOSImageURL(value, t),
                    },
                    {
                        id: 'clusterOSImage',
                        isHidden: ![Provider.baremetal, Provider.openstack].includes(credentialsType as Provider),
                        type: 'Text',
                        label: t('Cluster OS image'),
                        placeholder: t(
                            'Enter your cluster OS image.  The value must also contain the SHA-256 hash of the image.'
                        ),
                        labelHelp: t(
                            'This value contains the URL to the image to use for Red Hat OpenShift Container Platform cluster machines.  The value must also contain the SHA-256 hash of the image.'
                        ),
                        value: clusterOSImage,
                        onChange: setClusterOSImage,
                        validation: (value) => validateBareMetalOSImageURL(value, t),
                    },
                    {
                        id: 'imageContentSources',
                        isHidden: ![Provider.openstack, Provider.vmware].includes(credentialsType as Provider),
                        type: 'TextArea',
                        label: t('Image Content Sources'),
                        placeholder:
                            '- mirrors:\n        - <mirror_host_name>:5000/<repo_name>/release\n        source: quay.example.com/openshift-release-dev/ocp-release',
                        labelHelp: t(
                            'To complete these values, use the imageContentSources that you recorded during mirror registry creation.'
                        ),
                        value: imageContentSources,
                        onChange: setImageContentSources,
                        validation: (value) => validateImageContentSources(value, t),
                    },
                    {
                        id: 'additionalTrustBundle',
                        isHidden: ![Provider.baremetal, Provider.openstack, Provider.vmware].includes(
                            credentialsType as Provider
                        ),
                        type: 'TextArea',
                        label: t('Additional trust bundle'),
                        placeholder: t('Enter your additional trust bundle'),
                        labelHelp: t(
                            'This value provides the contents of the certificate file that is required to access the mirror registry.'
                        ),
                        value: additionalTrustBundle,
                        onChange: setAdditionalTrustBundle,
                    },
                ],
            },
            {
                type: 'Section',
                title: t('Proxy'),
                wizardTitle: t('Proxy'),
                description: (
                    <a href={getProxyDocLink(credentialsType as Provider)} target="_blank" rel="noreferrer">
                        {t('How do I configure a proxy?')}
                    </a>
                ),
                inputs: [
                    {
                        id: 'httpProxy',
                        isHidden: ![
                            Provider.aws,
                            Provider.azure,
                            Provider.baremetal,
                            Provider.gcp,
                            Provider.openstack,
                            Provider.vmware,
                            Provider.redhatvirtualization,
                        ].includes(credentialsType as Provider),
                        type: 'Text',
                        label: t('HTTP proxy'),
                        placeholder: t('Enter the HTTP proxy URL'),
                        labelHelp: t(
                            'A proxy URL to use for creating HTTP connections outside the cluster. The URL scheme must be HTTP.'
                        ),
                        value: httpProxy,
                        onChange: setHttpProxy,
                        validation: (value) => validateHttpProxy(value, t),
                    },
                    {
                        id: 'httpsProxy',
                        isHidden: ![
                            Provider.aws,
                            Provider.azure,
                            Provider.baremetal,
                            Provider.gcp,
                            Provider.openstack,
                            Provider.vmware,
                            Provider.redhatvirtualization,
                        ].includes(credentialsType as Provider),
                        type: 'Text',
                        label: t('HTTPS proxy'),
                        placeholder: t('Enter the HTTPS proxy URL'),
                        labelHelp: t(
                            'A proxy URL to use for creating HTTPS connections outside the cluster. If this is not specified, then httpProxy is used for both HTTP and HTTPS connections.'
                        ),
                        value: httpsProxy,
                        onChange: setHttpsProxy,
                        validation: (value) => validateHttpsProxy(value, t),
                    },
                    {
                        id: 'noProxy',
                        isHidden: ![
                            Provider.aws,
                            Provider.azure,
                            Provider.baremetal,
                            Provider.gcp,
                            Provider.openstack,
                            Provider.vmware,
                            Provider.redhatvirtualization,
                        ].includes(credentialsType as Provider),
                        type: 'Text',
                        label: t('No proxy'),
                        placeholder: t('Enter the comma delimited list of URLs that do not require a proxy'),
                        labelHelp: t(
                            'A comma-separated list of destination domain names, domains, IP addresses or other network CIDRs to exclude proxying. Preface a domain with . to include all subdomains of that domain. Use * to bypass proxy for all destinations. Note that if you scale up workers not included in networking.machineCIDR from the installation configuration, you must add them to this list to prevent connection issues.'
                        ),
                        value: noProxy,
                        onChange: setNoProxy,
                        validation: (value) => validateNoProxy(value, t),
                    },
                    {
                        id: 'additionalTrustBundle',
                        isHidden: ![
                            Provider.aws,
                            Provider.azure,
                            Provider.baremetal,
                            Provider.gcp,
                            Provider.openstack,
                            Provider.vmware,
                            Provider.redhatvirtualization,
                        ].includes(credentialsType as Provider),
                        type: 'TextArea',
                        label: t('Additional trust bundle'),
                        placeholder: t('Enter your additional trust bundle'),
                        labelHelp: t(
                            'This value provides the contents of the certificate file that is required to access the mirror registry.'
                        ),
                        value: additionalTrustBundle,
                        onChange: setAdditionalTrustBundle,
                    },
                ],
            },
            {
                type: 'Section',
                title: t('Ansible Automation Platform'),
                wizardTitle: t('Enter the Ansible Automation Platform credentials'),
                description: (
                    <a href={DOC_LINKS.CREATE_CONNECTION_ANSIBLE} target="_blank" rel="noreferrer">
                        {t('How do I get Ansible Automation Platform credentials?')}
                    </a>
                ),
                inputs: [
                    {
                        id: 'ansibleHost',
                        isHidden: credentialsType !== Provider.ansible,
                        type: 'Text',
                        label: t('Ansible Tower host'),
                        placeholder: t('Enter the Ansible Tower host URL'),
                        labelHelp: t('credentialsForm.ansibleHost.labelHelp'),
                        value: ansibleHost,
                        onChange: setAnsibleHost,
                        isRequired: true,
                        validation: (host) => validateWebURL(host, t, ['https']),
                    },
                    {
                        id: 'ansibleToken',
                        isHidden: credentialsType !== Provider.ansible,
                        type: 'Text',
                        label: t('Ansible Tower token'),
                        placeholder: t('Enter the Ansible Tower token'),
                        // labelHelp: t('credentialsForm.ansibleToken.labelHelp'), // TODO
                        value: ansibleToken,
                        onChange: setAnsibleToken,
                        isRequired: true,
                        isSecret: true,
                    },
                ],
            },
            {
                type: 'Section',
                title: t('OpenShift Cluster Manager'),
                wizardTitle: t('Enter the OpenShift Cluster Manager API token'),
                description: (
                    <a href={DOC_LINKS.CREATE_CONNECTION_REDHATCLOUD} target="_blank" rel="noreferrer">
                        {t('How do I get the OpenShift Cluster Manager API Token?')}
                    </a>
                ),
                inputs: [
                    {
                        id: 'ocmAPIToken',
                        isHidden: credentialsType !== Provider.redhatcloud,
                        type: 'Text',
                        label: t('OpenShift Cluster Manager API token'),
                        placeholder: t('Enter the OpenShift Cluster Manager API token'),
                        value: ocmAPIToken,
                        onChange: setOcmAPIToken,
                        isRequired: true,
                        isSecret: true,
                    },
                ],
            },
            {
                type: 'Section',
                title: t('Pull secret and SSH'),
                wizardTitle: t('Enter the pull secret and SSH keys'),
                description: (
                    <a
                        href={'https://console.redhat.com/openshift/install/pull-secret'}
                        target="_blank"
                        rel="noreferrer"
                    >
                        {t('How do I get the Red Hat OpenShift Container Platform pull secret?')}
                    </a>
                ),
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
                            Provider.redhatvirtualization,
                            Provider.hybrid,
                            Provider.hypershift,
                        ].includes(credentialsType as Provider),
                        type: 'TextArea',
                        label: t('Pull secret'),
                        placeholder: t('Enter Red Hat OpenShift Container Platform pull secret'),
                        labelHelp: t(
                            'The pull secret that you obtained from the pull secret page on the Red Hat OpenShift Cluster Manager site. Use this pull secret to authenticate with the services that are provided by the included authorities, including Quay.io, which serves the container images for OpenShift Container Platform components.'
                        ),
                        value: pullSecret,
                        onChange: setPullSecret,
                        validation: (value) => validateJSON(value, t),
                        isRequired: true,
                        isSecret: true,
                    },
                    {
                        id: 'ssh-privatekey',
                        isHidden: ![
                            Provider.aws,
                            Provider.azure,
                            Provider.baremetal,
                            Provider.gcp,
                            Provider.openstack,
                            Provider.redhatvirtualization,
                            Provider.vmware,
                        ].includes(credentialsType as Provider),
                        type: 'TextArea',
                        label: t('SSH private key'),
                        placeholder: t('Enter your SSH private key'),
                        labelHelp: t('The private SSH key to use to access your cluster machines.'),
                        value: sshPrivatekey,
                        onChange: setSshPrivatekey,
                        validation: (value) => validatePrivateSshKey(value, t, false),
                        isRequired: true,
                        isSecret: true,
                    },
                    {
                        id: 'ssh-publickey',
                        isHidden: ![
                            Provider.aws,
                            Provider.azure,
                            Provider.baremetal,
                            Provider.gcp,
                            Provider.openstack,
                            Provider.redhatvirtualization,
                            Provider.vmware,
                            Provider.hypershift,
                        ].includes(credentialsType as Provider),
                        type: 'TextArea',
                        label: t('SSH public key'),
                        placeholder: t('Enter your SSH public key'),
                        labelHelp: t('The public SSH key to use to access your cluster machines.'),
                        value: sshPublickey,
                        onChange: setSshPublickey,
                        validation: (value) => validatePublicSshKey(value, t),
                        isRequired: true,
                        isSecret: true,
                    },
                ],
            },
        ],
        submit: () => {
            let credentialData = formData?.customData ?? stateToData()
            if (Array.isArray(credentialData)) {
                credentialData = credentialData[0]
            }
            if (isEditing) {
                const secret = credentialData as Secret
                const patch: { op: 'replace'; path: string; value: unknown }[] = []
                if (secret.stringData) {
                    patch.push({ op: 'replace', path: `/stringData`, value: secret.stringData })
                }
                return patchResource(secret, patch).promise.then(() => {
                    toastContext.addAlert({
                        title: t('Credentials updated'),
                        /*
                            t('name')
                        */
                        message: t('credentialsForm.updated.message', { name }),
                        type: 'success',
                        autoClose: true,
                    })
                    history.push(NavigationPath.credentials)
                })
            } else {
                return createResource(credentialData as IResource).promise.then(() => {
                    toastContext.addAlert({
                        title: t('Credentials created'),
                        message: t('credentialsForm.created.message', { name }),
                        type: 'success',
                        autoClose: true,
                    })
                    history.push(NavigationPath.credentials)
                })
            }
        },
        submitText: isEditing ? t('Save') : t('Add'),
        submittingText: isEditing ? t('Saving') : t('Adding'),
        reviewTitle: t('Review your selections'),
        reviewDescription: t('Return to a step to make changes'),
        cancelLabel: t('Cancel'),
        nextLabel: t('Next'),
        backLabel: t('Back'),
        cancel: () => history.push(NavigationPath.credentials),
        stateToSyncs,
        stateToData,
    }
    return (
        <AcmDataFormPage
            formData={formData}
            editorTitle={t('Credentials YAML')}
            schema={schema}
            mode={isViewing ? 'details' : isEditing ? 'form' : 'wizard'}
            secrets={[
                '*.stringData.pullSecret',
                '*.stringData.aws_secret_access_key',
                '*.stringData.ssh-privatekey',
                '*.stringData.ssh-publickey',
                '*.stringData.password',
                '*.stringData.token',
                '*.stringData.ocmAPIToken',
                '*.stringData.additionalTrustBundle',
                '*.stringData.ovirt_ca_bundle',
                '*.stringData.ovirt_password',
                '*.stringData.ovirt-config.yaml',
                '*.stringData.osServicePrincipal.json',
                '*.stringData.osServiceAccount.json',
                '*.stringData.clouds.yaml',
            ]}
            immutables={isEditing ? ['*.metadata.name', '*.metadata.namespace'] : []}
            edit={() => {
                if (providerConnection) {
                    history.push(
                        NavigationPath.editCredentials
                            .replace(':namespace', providerConnection.metadata.namespace!)
                            .replace(':name', providerConnection.metadata.name!)
                    )
                }
            }}
        />
    )
}
