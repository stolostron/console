/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import _, { get, noop } from 'lodash'
import set from 'lodash/set'
import { Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { generatePath, useMatch, useNavigate, useParams } from 'react-router-dom-v5-compat'
import YAML from 'yaml'
import { AcmDataFormPage } from '../../components/AcmDataForm'
import { FormData, Input } from '../../components/AcmFormData'
import { ErrorPage } from '../../components/ErrorPage'
import { LoadingPage } from '../../components/LoadingPage'
import { LostChangesContext } from '../../components/LostChanges'
import { useLocalHubName } from '../../hooks/use-local-hub'
import { useProjects } from '../../hooks/useProjects'
import { useTranslation } from '../../lib/acm-i18next'
import { DOC_LINKS } from '../../lib/doc-util'
import {
  validateAnsibleHost,
  validateAwsRegion,
  validateBaseDomain,
  validateCertificate,
  validateCloudsYaml,
  validateGCProjectID,
  validateHttpProxy,
  validateHttpsProxy,
  validateImageContentSources,
  validateJSON,
  validateKubeconfig,
  validateKubernetesDnsName,
  validateNoProxyList,
  validatePrivateSshKey,
  validatePublicSshKey,
  validateVCenterServer,
  validateVcenterUsername,
} from '../../lib/validation'
import { NavigationPath, useBackCancelNavigation } from '../../NavigationPath'
import {
  getSecret,
  IResource,
  ProviderConnection,
  ProviderConnectionStringData,
  Secret,
  unpackProviderConnection,
} from '../../resources'
import { createResource, isRequestAbortedError, patchResource } from '../../resources/utils'
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
import { awsRegions } from '../Infrastructure/Clusters/ManagedClusters/CreateCluster/controlData/ControlDataAWS'
import { CredentialsType } from './CredentialsType'
import schema from './schema.json'

type ProviderConnectionOrCredentialsType =
  | { providerConnection: ProviderConnection; credentialsType?: never }
  | { providerConnection?: never; credentialsType: CredentialsType }

export function CreateCredentialsFormPage(props: { credentialsType: CredentialsType }) {
  const { t } = useTranslation()
  const { credentialsType } = props

  const { projects, error, loading } = useProjects()

  if (error) return <ErrorPage error={error} />

  if (loading) return <LoadingPage />
  if (projects.length === 0) {
    return (
      <AcmPage
        header={
          <AcmPageHeader
            title={t('Add credential')}
            breadcrumb={[{ text: t('Credentials'), to: NavigationPath.credentials }, { text: t('Add credential') }]}
          />
        }
      >
        <PageSection hasBodyWrapper={false} isFilled>
          <AcmEmptyState title={t('Unauthorized')} message={t('rbac.unauthorized.namespace')} showSearchIcon={true} />
        </PageSection>
      </AcmPage>
    )
  }
  return <CredentialsForm namespaces={projects} isEditing={false} isViewing={false} credentialsType={credentialsType} />
}

export function ViewEditCredentialsFormPage() {
  const params = useParams()
  const { name = '', namespace = '' } = params
  const isEditing = !!useMatch(NavigationPath.editCredentials)
  const isViewing = !isEditing
  const [error, setError] = useState<Error>()

  const [providerConnection, setProviderConnection] = useState<ProviderConnection | undefined>()
  useEffect(() => {
    const result = getSecret({ name, namespace })
    result.promise
      .then((secret) => {
        setError(undefined)
        setProviderConnection(unpackProviderConnection(secret as ProviderConnection))
      })
      .catch((error) => {
        if (!isRequestAbortedError(error)) {
          setError(error)
        }
      })
    return result.abort
  }, [name, namespace])
  if (error) return <ErrorPage error={error} />

  if (!providerConnection) return <LoadingPage />
  return (
    <CredentialsForm
      namespaces={[providerConnection.metadata.namespace!]}
      providerConnection={providerConnection}
      isEditing={isEditing}
      isViewing={isViewing}
    />
  )
}

export function CredentialsForm(
  props: {
    namespaces: string[]
    isEditing: boolean
    isViewing: boolean
    handleModalToggle?: () => void
    hideYaml?: boolean
    newCredentialCallback?: (resource: Secret) => void
    isHosted?: boolean
  } & ProviderConnectionOrCredentialsType
) {
  const { t } = useTranslation()
  const { namespaces, providerConnection, isEditing, isViewing, handleModalToggle, hideYaml, newCredentialCallback } =
    props
  const credentialsType =
    props.credentialsType || providerConnection?.metadata.labels?.['cluster.open-cluster-management.io/type'] || ''

  const toastContext = useContext(AcmToastContext)
  const navigate = useNavigate()
  const { back, cancel } = useBackCancelNavigation()

  // Red Hat Cloud
  enum OCMAuthMethod {
    API_TOKEN = 'offline-token',
    SERVICE_ACCOUNT = 'service-account',
  }
  const localHubName = useLocalHubName()

  const handleAuthMethodChange = (value: OCMAuthMethod) => {
    setAuthMethod(value)
  }

  const [authMethod, setAuthMethod] = useState<OCMAuthMethod>(
    (providerConnection?.stringData?.auth_method as OCMAuthMethod) ?? OCMAuthMethod.API_TOKEN
  )

  const [ocmAPIToken, setOcmAPIToken] = useState(() => providerConnection?.stringData?.ocmAPIToken ?? '')
  const [serviceAccClientId, setServiceAccClientId] = useState(() => providerConnection?.stringData?.client_id ?? '')
  const [serviceAccClientSecret, setServiceAccClientSecret] = useState(
    () => providerConnection?.stringData?.client_secret ?? ''
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
  const [additionalTrustBundle, setAdditionalTrustBundle] = useState(
    () => providerConnection?.stringData?.additionalTrustBundle ?? ''
  )

  // External Infrastructure
  const [isExternalInfra, setIsExternalInfra] = useState(
    () => !!(providerConnection?.stringData?.kubeconfig ?? providerConnection?.stringData?.externalInfraNamespace)
  )
  const [kubeconfig, setKubeconfig] = useState(() => providerConnection?.stringData?.kubeconfig ?? '')
  const [externalInfraNamespace, setExternalInfraNamespace] = useState(
    () => providerConnection?.stringData?.externalInfraNamespace ?? ''
  )

  const hasExternalInfraData = () => {
    return !!(kubeconfig || externalInfraNamespace)
  }

  // Amazon Web Services State
  const [aws_access_key_id, setAwsAccessKeyID] = useState(() => providerConnection?.stringData?.aws_access_key_id ?? '')
  const [aws_secret_access_key, setAwsSecretAccessKeyID] = useState(
    () => providerConnection?.stringData?.aws_secret_access_key ?? ''
  )

  const [bucket_name, setBucketName] = useState(() => providerConnection?.stringData?.bucket ?? '')
  const [aws_s3_region, setAwsS3Region] = useState(() => providerConnection?.stringData?.region ?? '')

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

  const { submitForm } = useContext(LostChangesContext)

  function getDisconnectedDocLink(credentialsType: Provider) {
    switch (credentialsType) {
      case Provider.vmware:
        return DOC_LINKS.CONFIG_DISCONNECTED_INSTALL_VMWARE
      case Provider.openstack:
        return DOC_LINKS.CONFIG_DISCONNECTED_INSTALL_OPENSTACK
      default:
        return DOC_LINKS.CONFIG_DISCONNECTED_INSTALL
    }
  }

  function getProxyDocLink(credentialsType: Provider) {
    switch (credentialsType) {
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
  const [vsphereFolder, setVsphereFolder] = useState(() => providerConnection?.stringData?.vsphereFolder ?? '')
  const [vsphereResourcePool, setVsphereResourcePool] = useState(
    () => providerConnection?.stringData?.vsphereResourcePool ?? ''
  )
  const [vsphereDiskType, setVsphereDiskType] = useState(() => providerConnection?.stringData?.vsphereDiskType ?? '')

  // OpenStack
  const [cloudsYaml, setOpenstackCloudsYaml] = useState(() => providerConnection?.stringData?.['clouds.yaml'] ?? '')
  const [cloud, setOpenstackCloud] = useState(() => providerConnection?.stringData?.cloud ?? '')
  const [osCABundle, setOSCABundle] = useState(() => providerConnection?.stringData?.os_ca_bundle ?? '')
  // user changes yaml, update cloud to first cloud in yaml
  useEffect(() => {
    try {
      const yamlData = YAML.parse(cloudsYaml) as {
        clouds: {
          [cloud: string]: {
            cacert?: string
          }
        }
      }
      const clouds = Object.keys(yamlData?.clouds)
      if (clouds.length) {
        setOpenstackCloud(clouds[0])
        if (osCABundle && !yamlData?.clouds[clouds[0]]?.cacert) {
          set(yamlData, `clouds[${clouds[0]}].cacert`, '/etc/openstack-ca/ca.crt')
          setOpenstackCloudsYaml(YAML.stringify(yamlData))
        }
      }
    } catch {}
  }, [cloudsYaml, osCABundle])

  // Disconnected
  const [clusterOSImage, setClusterOSImage] = useState(() => providerConnection?.stringData?.clusterOSImage ?? '')
  const [disconnectedAdditionalTrustBundle, setDisconnectedAdditionalTrustBundle] = useState(
    () => providerConnection?.stringData?.disconnectedAdditionalTrustBundle ?? ''
  )
  const [imageContentSources, setImageContentSources] = useState(
    () => providerConnection?.stringData?.imageContentSources ?? ''
  )

  // Ansible
  const [ansibleHost, setAnsibleHost] = useState(() => providerConnection?.stringData?.host ?? '')
  const [ansibleToken, setAnsibleToken] = useState(() => providerConnection?.stringData?.token ?? '')

  // AWS S3 bucket
  const s3values = useMemo(
    () => ({ name: 'hypershift-operator-oidc-provider-s3-credentials', namespace: localHubName }),
    [localHubName]
  )

  const { cancelForm } = useContext(LostChangesContext)
  const guardedHandleModalToggle = useCallback(() => cancelForm(handleModalToggle), [cancelForm, handleModalToggle])

  const isHostedControlPlane = credentialsType === Provider.awss3

  function stateToData() {
    const stringData: ProviderConnectionStringData = {}
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
      stringData,
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
        stringData.aws_access_key_id = aws_access_key_id
        stringData.aws_secret_access_key = aws_secret_access_key
        stringData.baseDomain = baseDomain
        stringData.pullSecret = pullSecret
        stringData['ssh-privatekey'] = sshPrivatekey
        stringData['ssh-publickey'] = sshPublickey
        stringData.httpProxy = httpProxy
        stringData.httpsProxy = httpsProxy
        stringData.noProxy = noProxy
        stringData.additionalTrustBundle = additionalTrustBundle
        break
      case Provider.awss3:
        stringData.bucket = bucket_name
        stringData.credentials = `[default]\naws_access_key_id=${aws_access_key_id}\naws_secret_access_key=${aws_secret_access_key}`
        stringData.region = aws_s3_region
        break
      case Provider.azure:
        stringData.baseDomainResourceGroupName = baseDomainResourceGroupName
        stringData.cloudName = cloudName
        stringData['osServicePrincipal.json'] = JSON.stringify({
          clientId,
          clientSecret,
          tenantId,
          subscriptionId,
        })
        stringData.baseDomain = baseDomain
        stringData.pullSecret = pullSecret
        stringData['ssh-privatekey'] = sshPrivatekey
        stringData['ssh-publickey'] = sshPublickey
        stringData.httpProxy = httpProxy
        stringData.httpsProxy = httpsProxy
        stringData.noProxy = noProxy
        stringData.additionalTrustBundle = additionalTrustBundle
        break
      case Provider.gcp:
        stringData.projectID = projectID
        stringData['osServiceAccount.json'] = osServiceAccountJson
        stringData.baseDomain = baseDomain
        stringData.pullSecret = pullSecret
        stringData['ssh-privatekey'] = sshPrivatekey
        stringData['ssh-publickey'] = sshPublickey
        stringData.httpProxy = httpProxy
        stringData.httpsProxy = httpsProxy
        stringData.noProxy = noProxy
        stringData.additionalTrustBundle = additionalTrustBundle
        break
      case Provider.vmware:
        stringData.vCenter = vCenter
        stringData.username = username
        stringData.password = password
        stringData.cacertificate = cacertificate
        stringData.cluster = cluster
        stringData.datacenter = datacenter
        stringData.defaultDatastore = defaultDatastore
        stringData.vsphereFolder = vsphereFolder
        stringData.vsphereResourcePool = vsphereResourcePool
        stringData.vsphereDiskType = vsphereDiskType
        stringData.baseDomain = baseDomain
        stringData.pullSecret = pullSecret
        stringData['ssh-privatekey'] = sshPrivatekey
        stringData['ssh-publickey'] = sshPublickey
        stringData.clusterOSImage = clusterOSImage
        stringData.imageContentSources = imageContentSources
        stringData.disconnectedAdditionalTrustBundle = disconnectedAdditionalTrustBundle
        stringData.httpProxy = httpProxy
        stringData.httpsProxy = httpsProxy
        stringData.noProxy = noProxy
        stringData.additionalTrustBundle = additionalTrustBundle
        break
      case Provider.openstack:
        stringData['clouds.yaml'] = cloudsYaml
        stringData.cloud = cloud
        stringData.os_ca_bundle = osCABundle
        stringData.baseDomain = baseDomain
        stringData.pullSecret = pullSecret
        stringData['ssh-privatekey'] = sshPrivatekey
        stringData['ssh-publickey'] = sshPublickey
        stringData.clusterOSImage = clusterOSImage
        stringData.imageContentSources = imageContentSources
        stringData.disconnectedAdditionalTrustBundle = disconnectedAdditionalTrustBundle
        stringData.httpProxy = httpProxy
        stringData.httpsProxy = httpsProxy
        stringData.noProxy = noProxy
        stringData.additionalTrustBundle = additionalTrustBundle
        break
      case Provider.ansible:
        stringData.host = _.trimEnd(ansibleHost, '/')
        stringData.token = ansibleToken
        break
      case Provider.redhatcloud:
        stringData.auth_method = authMethod
        if (authMethod === OCMAuthMethod.API_TOKEN) {
          stringData.ocmAPIToken = ocmAPIToken
        } else if (authMethod === OCMAuthMethod.SERVICE_ACCOUNT) {
          stringData.client_id = serviceAccClientId
          stringData.client_secret = serviceAccClientSecret
        }
        break
      case Provider.hostinventory:
      case Provider.hybrid:
      case Provider.nutanix:
        stringData.baseDomain = baseDomain
        stringData.pullSecret = pullSecret
        stringData['ssh-publickey'] = sshPublickey
        break
      case Provider.kubevirt:
        stringData.pullSecret = pullSecret
        stringData['ssh-publickey'] = sshPublickey
        if (isExternalInfra) {
          stringData.kubeconfig = kubeconfig
          stringData.externalInfraNamespace = externalInfraNamespace
        }
        break
    }

    if (stringData?.pullSecret && !stringData.pullSecret.endsWith('\n')) {
      stringData.pullSecret += '\n'
    }
    if (stringData?.['ssh-privatekey'] && !stringData['ssh-privatekey'].endsWith('\n')) {
      stringData['ssh-privatekey'] += '\n'
    }
    if (
      stringData?.['ssh-publickey'] &&
      !stringData['ssh-publickey'].endsWith('\n') &&
      ![Provider.hostinventory, Provider.nutanix, Provider.kubevirt].includes(credentialsType as Provider)
    ) {
      stringData['ssh-publickey'] += '\n'
    }
    return secret
  }
  function getValue(path: string, template: any) {
    const credentials = get(template, 'Secret[0].stringData.credentials', '') as string
    if (credentials) {
      const value = credentials.split('\n').find((v) => v.startsWith(`${path}=`))
      return value ? value.replace(`${path}=`, '') : ''
    } else {
      return get(template, `Secret[0].stringData.${path}`, '')
    }
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
      { path: 'Secret[0].stringData.bucket', setState: setBucketName },
      { path: 'Secret[0].stringData.region', setState: setAwsS3Region },
      { getter: getValue.bind(null, 'aws_access_key_id'), setState: setAwsAccessKeyID },
      { getter: getValue.bind(null, 'aws_secret_access_key'), setState: setAwsSecretAccessKeyID },
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
      { path: 'Secret[0].stringData.vsphereDiskType', setState: setVsphereDiskType },
      { path: 'Secret[0].stringData.vsphereFolder', setState: setVsphereFolder },
      { path: 'Secret[0].stringData.vsphereResourcePool', setState: setVsphereResourcePool },
      { path: ['Secret', '0', 'stringData', 'clouds.yaml'], setState: setOpenstackCloudsYaml },
      { path: 'Secret[0].stringData.cloud', setState: setOpenstackCloud },
      { path: 'Secret[0].stringData.os_ca_bundle', setState: setOSCABundle },
      { path: 'Secret[0].stringData.clusterOSImage', setState: setClusterOSImage },
      { path: 'Secret[0].stringData.additionalTrustBundle', setState: setAdditionalTrustBundle },
      {
        path: 'Secret[0].stringData.disconnectedAdditionalTrustBundle',
        setState: setDisconnectedAdditionalTrustBundle,
      },
      { path: 'Secret[0].stringData.imageContentSources', setState: setImageContentSources },
      { path: 'Secret[0].stringData.host', setState: setAnsibleHost },
      { path: 'Secret[0].stringData.token', setState: setAnsibleToken },
      { path: 'Secret[0].stringData.auth_method', setState: setAuthMethod },
      { path: 'Secret[0].stringData.ocmAPIToken', setState: setOcmAPIToken },
      { path: 'Secret[0].stringData.client_id', setState: setServiceAccClientId },
      { path: 'Secret[0].stringData.client_secret', setState: setServiceAccClientSecret },
      { path: 'Secret[0].stringData.kubeconfig', setState: setKubeconfig },
      { path: 'Secret[0].stringData.externalInfraNamespace', setState: setExternalInfraNamespace },
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

  useEffect(() => {
    if (isHostedControlPlane) {
      setName(providerConnection?.metadata.name || s3values.name)
      setNamespace(providerConnection?.metadata.namespace || s3values.namespace)
    }
  }, [isHostedControlPlane, s3values, providerConnection?.metadata.name, providerConnection?.metadata.namespace])

  let breadcrumbs
  if (isViewing || isEditing) {
    breadcrumbs = [{ text: t('Credentials'), to: NavigationPath.credentials }, { text: title }]
  } else {
    if (credentialsType === Provider.aws || credentialsType === Provider.awss3) {
      breadcrumbs = [
        { text: t('Credentials'), to: NavigationPath.credentials },
        { text: t('Credential type'), to: NavigationPath.addCredentials },
        {
          text: t('Amazon Web Services credential'),
          to: NavigationPath.addAWSType,
        },
        { text: title },
      ]
    } else {
      breadcrumbs = [
        { text: t('Credentials'), to: NavigationPath.credentials },
        { text: t('Credential type'), to: NavigationPath.addCredentials },
        { text: title },
      ]
    }
  }

  const formData: FormData = {
    title,
    description: t('A credential stores the access credentials and configuration information for creating clusters.'),
    titleTooltip,
    breadcrumb: breadcrumbs,
    sections: [
      {
        type: 'Section',
        title: credentialsType ? t('Basic information') : t('Credential type'),
        wizardTitle: t('Enter the basic credentials information'),
        inputs: [
          {
            id: 'credentialsType',
            type: 'Select',
            label: t('Credential type'),
            value: credentialsType,
            onChange: noop,
            options: [
              {
                id: credentialsType,
                value: credentialsType,
                icon: credentialsType ? <AcmIcon icon={ProviderIconMap[credentialsType as Provider]} /> : '',
                text: credentialsType ? ProviderLongTextMap[credentialsType as Provider] : '',
              },
            ],
            isRequired: false, // always pre-filled
            isDisabled: true, // always pre-filled
          },
          {
            id: 'disable-alert',
            type: 'Alert',
            label: '',
            labelHelpTitle: t('Credential name and namespace are predefined as below for HyperShift add-on'),
            variant: 'info',
            reactNode: (
              <Fragment>
                <a href={DOC_LINKS.HYPERSHIFT_OIDC} target="_blank" rel="noreferrer">
                  {t('Learn more')}
                </a>
              </Fragment>
            ),
            value: '',
            onChange: () => {},
            isHidden: !isHostedControlPlane,
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
            isDisabled: isEditing || isHostedControlPlane,
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
            isDisabled: isEditing || isHostedControlPlane,
            isHidden: !credentialsType,
          },
          {
            id: 'baseDomain',
            isHidden: ![
              Provider.aws,
              Provider.azure,
              Provider.gcp,
              Provider.openstack,
              Provider.vmware,
              Provider.hybrid,
              Provider.hostinventory,
              Provider.nutanix,
            ].includes(credentialsType as Provider),
            type: 'Text',
            label: t('Base DNS domain'),
            placeholder: t('Enter the base DNS domain'),
            labelHelp: [Provider.hybrid].includes(credentialsType as Provider)
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
            isHidden: credentialsType !== Provider.azure,
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
        title: t('Bucket'),
        wizardTitle: t('Enter bucket information'),
        description: (
          <a href={DOC_LINKS.CREATE_CONNECTION_AWS} target="_blank" rel="noreferrer">
            {t('How do I get S3 Bucket OIDC secret credentials?')}
          </a>
        ),
        inputs: [
          {
            id: 'bucketName',
            type: 'Text',
            label: t('Bucket name'),
            placeholder: t('Enter your bucket name'),
            isHidden: credentialsType !== Provider.awss3,
            value: bucket_name,
            onChange: setBucketName,
            isRequired: true,
          },
          {
            id: 'aws_access_key_id',
            isHidden: credentialsType !== Provider.awss3,
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
            isHidden: credentialsType !== Provider.awss3,
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
          {
            id: 'region',
            isHidden: credentialsType !== Provider.awss3,
            type: 'Select',
            label: t('Region'),
            options: _.keys(awsRegions).map((region) => ({
              id: region,
              value: region,
            })),
            value: aws_s3_region,
            onChange: setAwsS3Region,
            placeholder: t('Select region'),
            isRequired: true,
            validation: (value) => validateAwsRegion(value, t),
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
              'Azure Resource Groups are logical collections of virtual machines, storage accounts, virtual networks, web apps, databases, and/or database servers. You can group together related resources for an application and divide them into groups for production and non-production.'
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
              "Your client ID. This value is generated as the 'appId' property when you create a service principal with the command: 'az ad sp create-for-rbac --role Contributor --name <service_principal> --scopes <list_of_scopes>'."
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
              "Your client password. This value is generated as the 'password' property when you create a service principal with the command: 'az ad sp create-for-rbac --role Contributor --name <service_principal> --scopes <list_of_scopes>'."
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
            validation: (value) => validateVCenterServer(value, t),
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
            validation: (value) => validateVcenterUsername(value, t),
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
            id: 'cluster',
            isHidden: credentialsType !== Provider.vmware,
            type: 'Text',
            label: t('vSphere cluster name'),
            placeholder: t('credentialsForm.cluster.placeholder'),
            labelHelp: t('credentialsForm.cluster.labelHelp'),
            value: cluster,
            onChange: setVmClusterName,
            isRequired: true,
          },
          {
            id: 'defaultDatastore',
            isHidden: credentialsType !== Provider.vmware,
            type: 'Text',
            label: t('vSphere default datastore'),
            placeholder: t('credentialsForm.defaultDatastore.placeholder'),
            labelHelp: t('credentialsForm.defaultDatastore.labelHelp'),
            value: defaultDatastore,
            onChange: setDatastore,
            isRequired: true,
          },
          {
            id: 'vsphereDiskType',
            isHidden: credentialsType !== Provider.vmware,
            type: 'Select',
            label: t('vSphere disk type'),
            placeholder: t('credentialsForm.vsphereDiskType.placeholder'),
            labelHelp: t('credentialsForm.vsphereDiskType.labelHelp'),
            value: vsphereDiskType,
            options: ['thin', 'thick', 'eagerZeroedThick'].map((diskType) => ({
              id: diskType,
              value: diskType,
            })),
            onChange: setVsphereDiskType,
          },
          {
            id: 'vsphereFolder',
            isHidden: credentialsType !== Provider.vmware,
            type: 'Text',
            label: t('vSphere folder'),
            placeholder: t('credentialsForm.vsphereFolder.placeholder'),
            labelHelp: t('credentialsForm.vsphereFolder.labelHelp'),
            value: vsphereFolder,
            onChange: setVsphereFolder,
            isRequired: false,
          },
          {
            id: 'vsphereResourcePool',
            isHidden: credentialsType !== Provider.vmware,
            type: 'Text',
            label: t('vSphere resource pool'),
            placeholder: t('credentialsForm.vsphereResourcePool.placeholder'),
            labelHelp: t('credentialsForm.vsphereResourcePool.labelHelp'),
            value: vsphereResourcePool,
            onChange: setVsphereResourcePool,
            isRequired: false,
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
            labelHelp: t('The OpenStack clouds.yaml file, including the password, to connect to the OpenStack server.'),
            value: cloudsYaml,
            onChange: setOpenstackCloudsYaml,
            isRequired: true,
            isSecret: true,
            validation: (value) => validateCloudsYaml(value, cloud, osCABundle, t),
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
          {
            id: 'os_ca_bundle',
            isHidden: credentialsType !== Provider.openstack,
            type: 'TextArea',
            label: t('credentialsForm.os_ca_bundle.label'),
            placeholder: t('credentialsForm.os_ca_bundle.placeholder'),
            labelHelp: t('credentialsForm.os_ca_bundle.labelHelp'),
            value: osCABundle,
            onChange: setOSCABundle,
            isRequired: false,
            isSecret: true,
            validation: (value) => (value !== '' ? validateCertificate(value, t) : undefined),
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
            id: 'clusterOSImage',
            isHidden: ![Provider.openstack, Provider.vmware].includes(credentialsType as Provider),
            type: 'Text',
            label: t('Cluster OS image'),
            placeholder: t('Enter your cluster OS image.'),
            labelHelp: t(
              'This value contains an HTTP or HTTPS URL to the image to use for Red Hat OpenShift Container Platform cluster machines. Optionally the URL can include a SHA-256 checksum. The value can also be the name of an existing Glance image.'
            ),
            value: clusterOSImage,
            onChange: setClusterOSImage,
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
            id: 'disconnectedAdditionalTrustBundle',
            isHidden: ![Provider.openstack, Provider.vmware].includes(credentialsType as Provider),
            type: 'TextArea',
            label: t('Additional trust bundle'),
            placeholder: t('Enter your additional trust bundle'),
            labelHelp: t(
              'This value provides the contents of the certificate file that is required to access the mirror registry.'
            ),
            value: disconnectedAdditionalTrustBundle,
            onChange: setDisconnectedAdditionalTrustBundle,
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
            isHidden: ![Provider.aws, Provider.azure, Provider.gcp, Provider.openstack, Provider.vmware].includes(
              credentialsType as Provider
            ),
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
            isHidden: ![Provider.aws, Provider.azure, Provider.gcp, Provider.openstack, Provider.vmware].includes(
              credentialsType as Provider
            ),
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
            isHidden: ![Provider.aws, Provider.azure, Provider.gcp, Provider.openstack, Provider.vmware].includes(
              credentialsType as Provider
            ),
            type: 'Text',
            label: t('No proxy'),
            placeholder: t('Enter the comma delimited list of URLs that do not require a proxy'),
            labelHelp: t(
              "A comma-separated list of destination domain names, IP addresses, or other network CIDRs to exclude from proxying. Preface a domain with '.' to include all subdomains of that domain. Use '*' to bypass proxy for all destinations. Note that if you scale up workers not included in networking.machineCIDR from the installation configuration, you must add them to this list to prevent connection issues."
            ),
            value: noProxy,
            onChange: setNoProxy,
            validation: (value) => validateNoProxyList(value, t),
          },
          {
            id: 'additionalTrustBundle',
            isHidden: ![Provider.aws, Provider.azure, Provider.gcp, Provider.openstack, Provider.vmware].includes(
              credentialsType as Provider
            ),
            type: 'TextArea',
            label: t('Additional trust bundle'),
            placeholder: t('Enter your additional trust bundle'),
            labelHelp: t(
              'This value provides one or more additional CA certificates that are required for proxying HTTPS connections.'
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
            label: t('Ansible Automation controller host'),
            placeholder: t('Enter the Ansible Automation controller host URL'),
            labelHelp: t('credentialsForm.ansibleHost.labelHelp'),
            value: ansibleHost,
            onChange: setAnsibleHost,
            isRequired: true,
            validation: (host) => validateAnsibleHost(host, t, ['https']),
          },
          {
            id: 'ansibleToken',
            isHidden: credentialsType !== Provider.ansible,
            type: 'Text',
            label: t('Ansible Automation controller token'),
            placeholder: t('Enter the Ansible Automation controller token'),
            // labelHelp: /*t*/('credentialsForm.ansibleToken.labelHelp'), // TODO
            value: ansibleToken,
            onChange: setAnsibleToken,
            isRequired: true,
            isSecret: true,
          },
        ],
      },
      ...(!isViewing || hasExternalInfraData()
        ? [
            {
              type: 'Section' as const,
              title: t('External infrastructure'),
              wizardTitle: t('Configure external infrastructure for OpenShift Virtualization'),
              description: t(
                'Optionally use an OpenShift Virtualization installation on an external infrastructure cluster.'
              ),
              inputs: [
                {
                  id: 'isExternalInfra',
                  type: 'Checkbox',
                  title: t('External infrastructure'),
                  label: t('Enable external infrastructure'),
                  labelHelp: t(
                    'Enable external infrastructure to place virtual machines on an external infrastructure cluster. The Hosted Control Plane components will still be created on the hub cluster.'
                  ),
                  isHidden: credentialsType !== Provider.kubevirt,
                  value: isExternalInfra,
                  onChange: () => setIsExternalInfra((enabled) => !enabled),
                },
                {
                  id: 'kubeconfig',
                  type: 'TextArea',
                  label: t('Kubeconfig'),
                  labelHelp: t(
                    'Provide a kubeconfig that grants access to an external infrastructure cluster running OpenShift Virtualization.'
                  ),
                  placeholder: t('Copy and paste your kubeconfig content'),
                  value: kubeconfig,
                  isHidden: credentialsType !== Provider.kubevirt || !isExternalInfra,
                  onChange: setKubeconfig,
                  isRequired: true,
                  isSecret: true,
                  validation: (value) => validateKubeconfig(value, t),
                },
                {
                  id: 'externalInfraNamespace',
                  type: 'Text',
                  label: t('Namespace'),
                  labelHelp: t(
                    'Enter the namespace where virtual machines will be created on the external infrastructure cluster. This namespace must already exist and the kubeconfig must allow access to manage the required resources in this namespace.'
                  ),
                  placeholder: t('Enter the namespace'),
                  isHidden: credentialsType !== Provider.kubevirt || !isExternalInfra,
                  value: externalInfraNamespace,
                  onChange: setExternalInfraNamespace,
                  isRequired: true,
                  validation: (value) => validateKubernetesDnsName(value, t),
                },
              ] as Input[],
            },
          ]
        : []),
      {
        type: 'Section',
        title: t('OpenShift Cluster Manager'),
        wizardTitle: t('Enter the OpenShift Cluster Manager credentials'),
        description: (
          <a href={DOC_LINKS.CREATE_CONNECTION_REDHATCLOUD} target="_blank" rel="noreferrer">
            {t('How do I get OpenShift Cluster Manager credentials?')}
          </a>
        ),
        inputs: [
          {
            id: 'ocmAuthMethod',
            label: t('Authentication method'),
            isHidden: credentialsType !== Provider.redhatcloud,
            labelHelp: t('The authentication method to use to connect to OpenShift Cluster Manager.'),
            type: 'Select',
            placeholder: t('Select an authentication method'),
            value: authMethod,
            onChange: handleAuthMethodChange,
            options: [
              { id: OCMAuthMethod.API_TOKEN, value: OCMAuthMethod.API_TOKEN, text: t('API token') },
              { id: OCMAuthMethod.SERVICE_ACCOUNT, value: OCMAuthMethod.SERVICE_ACCOUNT, text: t('Service account') },
            ],
            isRequired: true,
          },
          (authMethod === OCMAuthMethod.API_TOKEN || isViewing) && {
            id: 'ocmAPIToken',
            type: 'Text',
            isHidden: credentialsType !== Provider.redhatcloud,
            label: t('API token'),
            value: ocmAPIToken,
            onChange: setOcmAPIToken,
            isRequired: true,
            isSecret: true,
          },
          (authMethod === OCMAuthMethod.SERVICE_ACCOUNT || isViewing) && {
            id: 'client_id',
            isHidden: credentialsType !== Provider.redhatcloud,
            type: 'Text',
            label: t('Client ID'),
            value: serviceAccClientId,
            onChange: setServiceAccClientId,
            isRequired: true,
          },
          (authMethod === OCMAuthMethod.SERVICE_ACCOUNT || isViewing) && {
            id: 'client_secret',
            type: 'Text',
            isHidden: credentialsType !== Provider.redhatcloud,
            label: t('Client secret'),
            value: serviceAccClientSecret,
            onChange: setServiceAccClientSecret,
            isRequired: true,
            isSecret: true,
          },
        ].filter(Boolean) as Input[],
      },
      {
        type: 'Section',
        title: t('Pull secret and SSH'),
        wizardTitle: t('Enter the pull secret and SSH keys'),
        description: (
          <a href={'https://console.redhat.com/openshift/install/pull-secret'} target="_blank" rel="noreferrer">
            {t('How do I get the Red Hat OpenShift Container Platform pull secret?')}
          </a>
        ),
        inputs: [
          {
            id: 'pullSecret',
            isHidden: ![
              Provider.aws,
              Provider.azure,
              Provider.gcp,
              Provider.openstack,
              Provider.vmware,
              Provider.hybrid,
              Provider.hostinventory,
              Provider.kubevirt,
              Provider.nutanix,
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
            isHidden: ![Provider.aws, Provider.azure, Provider.gcp, Provider.openstack, Provider.vmware].includes(
              credentialsType as Provider
            ),
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
              Provider.gcp,
              Provider.openstack,
              Provider.vmware,
              Provider.hybrid,
              Provider.hostinventory,
              Provider.kubevirt,
              Provider.nutanix,
            ].includes(credentialsType as Provider),
            type: 'TextArea',
            label: t('SSH public key'),
            placeholder: t('Enter your SSH public key'),
            labelHelp: t('The public SSH key to use to access your cluster machines.'),
            value: sshPublickey,
            onChange: setSshPublickey,
            validation: (value) =>
              validatePublicSshKey(
                value,
                t,
                ![Provider.hybrid, Provider.hostinventory, Provider.nutanix, Provider.kubevirt].includes(
                  credentialsType as Provider
                )
              ),
            isRequired: ![Provider.hybrid, Provider.hostinventory, Provider.nutanix, Provider.kubevirt].includes(
              credentialsType as Provider
            ),
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
        const data: Secret['data'] = {}
        Object.keys(secret.stringData ?? {}).forEach((key) => {
          if (secret.stringData?.[key]) {
            data[key] = Buffer.from(secret.stringData[key], 'ascii').toString('base64')
          }
        })
        patch.push({ op: 'replace', path: `/data`, value: data })
        patchResource(secret, patch)
          .promise.then(() => {
            toastContext.addAlert({
              title: t('Credentials updated'),
              /*
                            t('name')
                        */
              message: t('credentialsForm.updated.message', { name }),
              type: 'success',
              autoClose: true,
            })
            submitForm()
            navigate(NavigationPath.credentials)
          })
          .catch((err) => {
            toastContext.addAlert({
              title: t('Failed to update Credentials'),
              message: t('Reason: {{reason}}. Error: {{error}}.', {
                reason: err.reason,
                error: err.message,
              }),
              type: 'danger',
              autoClose: true,
            })
          })
      } else {
        createResource(credentialData as IResource)
          .promise.then((resource) => {
            toastContext.addAlert({
              title: t('Credentials created'),
              message: t('credentialsForm.created.message', { name }),
              type: 'success',
              autoClose: true,
            })
            submitForm()

            if (newCredentialCallback) {
              newCredentialCallback(resource as Secret)
            }

            if (handleModalToggle) {
              handleModalToggle()
            } else {
              navigate(NavigationPath.credentials)
            }
          })
          .catch((err) => {
            toastContext.addAlert({
              title: t('Failed to create Credentials'),
              message: t('Reason: {{reason}}. Error: {{error}}.', {
                reason: err.reason,
                error: err.message,
              }),
              type: 'danger',
              autoClose: true,
            })
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
    back: handleModalToggle ? guardedHandleModalToggle : back(NavigationPath.addCredentials),
    cancel: handleModalToggle ? guardedHandleModalToggle : cancel(NavigationPath.credentials),
    stateToSyncs,
    stateToData,
  }

  return (
    <AcmDataFormPage
      formData={formData}
      editorTitle={t('Credentials YAML')}
      schema={schema}
      mode={isViewing ? 'details' : isEditing ? 'form' : 'wizard'}
      hideYaml={hideYaml}
      secrets={[
        '*.stringData.credentials',
        '*.stringData.pullSecret',
        '*.stringData.aws_secret_access_key',
        '*.stringData.ssh-privatekey',
        '*.stringData.ssh-publickey',
        '*.stringData.password',
        '*.stringData.token',
        '*.stringData.ocmAPIToken',
        '*.stringData.client_secret',
        '*.stringData.additionalTrustBundle',
        '*.stringData.disconnectedAdditionalTrustBundle',
        '*.stringData.ovirt_ca_bundle',
        '*.stringData.os_ca_bundle',
        '*.stringData.ovirt_password',
        '*.stringData.ovirt-config.yaml',
        '*.stringData.osServicePrincipal.json',
        '*.stringData.osServiceAccount.json',
        '*.stringData.clouds.yaml',
        '*.stringData.kubeconfig',
      ]}
      immutables={
        isHostedControlPlane
          ? ['Secret.0.metadata.name', 'Secret.0.metadata.namespace']
          : isEditing
            ? ['*.metadata.name', '*.metadata.namespace']
            : []
      }
      edit={() => {
        if (providerConnection) {
          navigate(
            generatePath(NavigationPath.editCredentials, {
              namespace: providerConnection.metadata.namespace!,
              name: providerConnection.metadata.name!,
            })
          )
        }
      }}
      isModalWizard={!!handleModalToggle}
    />
  )
}
