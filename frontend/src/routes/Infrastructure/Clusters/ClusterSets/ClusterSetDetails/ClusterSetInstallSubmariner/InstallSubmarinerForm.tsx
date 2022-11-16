/* Copyright Contributors to the Open Cluster Management project */

import { List, ListItem, PageSection } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { useContext, useEffect, useState } from 'react'
import { useHistory } from 'react-router'
import { Link } from 'react-router-dom'
import { AcmDataFormPage } from '../../../../../../components/AcmDataForm'
import { FormData, Section } from '../../../../../../components/AcmFormData'
import { RbacButton } from '../../../../../../components/Rbac'
import { Trans, useTranslation } from '../../../../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../../../../lib/doc-util'
import { rbacCreate } from '../../../../../../lib/rbac-util'
import { validateJSON, validateCloudsYaml } from '../../../../../../lib/validation'
import { NavigationPath } from '../../../../../../NavigationPath'
import {
    Broker,
    BrokerApiVersion,
    BrokerKind,
    CableDriver,
    Cluster,
    createResource,
    defaultBrokerName,
    getBroker,
    IResource,
    listNamespaceSecrets,
    ManagedClusterAddOnApiVersion,
    ManagedClusterAddOnKind,
    ManagedClusterSetDefinition,
    resultsSettled,
    Secret,
    SecretApiVersion,
    SecretKind,
    submarinerBrokerNamespaceAnnotation,
    SubmarinerConfig,
    SubmarinerConfigApiVersion,
    submarinerConfigDefault,
    SubmarinerConfigKind,
} from '../../../../../../resources'
import {
    AcmAlert,
    AcmButton,
    AcmEmptyState,
    AcmExpandableSection,
    AcmPage,
    AcmPageHeader,
    Provider,
    ProviderLongTextMap,
} from '../../../../../../ui-components'
import { ClusterSetContext } from '../ClusterSetDetails'
import schema from './schema.json'

const installNamespace = 'submariner-operator'
export function InstallSubmarinerFormPage() {
    const { t } = useTranslation()
    const history = useHistory()
    const { clusterSet, clusters, submarinerAddons } = useContext(ClusterSetContext)
    const [availableClusters] = useState<Cluster[]>(
        clusters!.filter(
            (cluster) =>
                !submarinerAddons!.find((addon) => addon.metadata.namespace === cluster.namespace) &&
                cluster.distribution?.ocp?.version // OpenShift clusters only
        )
    )
    if (availableClusters.length === 0) {
        return (
            <AcmPage
                header={
                    <AcmPageHeader
                        title={t('managed.clusterSets.submariner.addons.install')}
                        titleTooltip={
                            <>
                                {t('page.header.install-submariner.tooltip')}
                                <a
                                    href={DOC_LINKS.SUBMARINER}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ display: 'block', marginTop: '4px' }}
                                >
                                    {t('learn.more')}
                                </a>
                            </>
                        }
                        breadcrumb={[
                            {
                                text: t('clusterSets'),
                                to: NavigationPath.clusterSets,
                            },
                            {
                                text: clusterSet!.metadata.name!,
                                to: NavigationPath.clusterSetSubmariner.replace(':id', clusterSet!.metadata.name!),
                            },
                            {
                                text: t('managed.clusterSets.submariner.addons.install'),
                            },
                        ]}
                    />
                }
            >
                <PageSection variant="light" isFilled>
                    <AcmEmptyState
                        title={t('submariner.clusters.empty.title')}
                        message={
                            <Trans
                                i18nKey={'submariner.clusters.empty.message'}
                                components={{ bold: <strong />, p: <p /> }}
                            />
                        }
                        action={
                            <>
                                <RbacButton
                                    component={Link}
                                    to={NavigationPath.clusterSetManage.replace(':id', clusterSet!.metadata.name!)}
                                    variant="primary"
                                    rbac={[
                                        rbacCreate(
                                            ManagedClusterSetDefinition,
                                            undefined,
                                            clusterSet!.metadata.name,
                                            'join'
                                        ),
                                    ]}
                                >
                                    {t('managed.clusterSets.clusters.emptyStateButton')}
                                </RbacButton>
                                <AcmButton
                                    style={{ marginLeft: '16px' }}
                                    variant="secondary"
                                    onClick={() =>
                                        history.push(
                                            NavigationPath.clusterSetSubmariner.replace(
                                                ':id',
                                                clusterSet?.metadata.name!
                                            )
                                        )
                                    }
                                >
                                    {t('submariner.clusters.back', { name: clusterSet?.metadata.name! })}
                                </AcmButton>
                            </>
                        }
                    />
                </PageSection>
            </AcmPage>
        )
    }

    return <InstallSubmarinerForm availableClusters={availableClusters} />
}

// supported providers for creating a SubmarinerConfig resource
const submarinerConfigProviders = [Provider.aws, Provider.gcp, Provider.vmware, Provider.azure, Provider.openstack]

// used to try to auto-detect the provider secret in the cluster namespace
const providerAutoDetectSecret: Record<string, (secrets: Secret[]) => Secret | undefined> = {
    [Provider.aws]: (secrets: Secret[]) => secrets.find((s) => s.data?.['aws_access_key_id']),
    [Provider.gcp]: (secrets: Secret[]) => secrets.find((s) => s.data?.['osServiceAccount.json']),
    [Provider.azure]: (secrets: Secret[]) => secrets.find((s) => s.data?.['osServicePrincipal.json']),
    [Provider.vmware]: (secrets: Secret[]) =>
        secrets.find(
            (s) =>
                s.data?.['username'] &&
                s.data?.['password'] &&
                s.metadata.labels?.['hive.openshift.io/secret-type'] !== 'kubeadmincreds'
        ),
    [Provider.openstack]: (secrets: Secret[]) => secrets.find((s) => s.data?.['clouds.yaml']),
}

export function InstallSubmarinerForm(props: { availableClusters: Cluster[] }) {
    const { t } = useTranslation()
    const { clusterSet } = useContext(ClusterSetContext)
    const history = useHistory()

    const [selectedClusters, setSelectedClusters] = useState<string[]>([])
    const [providerSecretMap, setProviderSecretMap] = useState<Record<string, string | null>>({})
    const [withoutSubmarinerConfigClusters, setWithoutSubmarinerConfigClusters] = useState<Cluster[]>([])
    const [fetchSecrets, setFetchSecrets] = useState<boolean>(true)

    const [globalnetEnabled, setGlobalnetEnabled] = useState<boolean>(false)
    const [isGlobalnetAlreadyConfigured, setIsGlobalnetAlreadyConfigured] = useState<boolean>(true)

    const [awsAccessKeyIDs, setAwsAccessKeyIDs] = useState<Record<string, string | undefined>>({})
    const [awsSecretAccessKeyIDs, setAwsSecretAccessKeyIDs] = useState<Record<string, string | undefined>>({})

    const [gcServiceAccountKeys, setGcServiceAccountKeys] = useState<Record<string, any>>({})

    const [baseDomainResourceGroupNames, setBaseDomainResourceGroupNames] = useState<
        Record<string, string | undefined>
    >({})
    const [clientIds, setClientIds] = useState<Record<string, string | undefined>>({})
    const [clientSecrets, setClientSecrets] = useState<Record<string, string | undefined>>({})
    const [subscriptionIds, setSubscriptionIds] = useState<Record<string, string | undefined>>({})
    const [tenantIds, setTenantIds] = useState<Record<string, string | undefined>>({})

    const [cloudsYamls, setOpenstackCloudsYamls] = useState<Record<string, string | undefined>>({})
    const [clouds, setOpenstackClouds] = useState<Record<string, string | undefined>>({})

    const [nattPorts, setNattPorts] = useState<Record<string, number>>({})
    const [nattEnables, setNattEnables] = useState<Record<string, boolean>>({})
    const [cableDrivers, setCableDrivers] = useState<Record<string, CableDriver>>({})
    const [gateways, setGateways] = useState<Record<string, number>>({})
    const [awsInstanceTypes, setAwsInstanceTypes] = useState<Record<string, string>>({})
    const [azInstanceTypes, setAzInstanceTypes] = useState<Record<string, string>>({})
    const [openStackInstanceTypes, setOpenStackInstanceTypes] = useState<Record<string, string>>({})

    const { availableClusters } = props

    useEffect(() => {
        if (fetchSecrets) {
            setFetchSecrets(false)
            const calls = resultsSettled(
                availableClusters
                    .filter(
                        (c) => submarinerConfigProviders.includes(c!.provider!) && !c.distribution?.isManagedOpenShift
                    )
                    .map((c) => listNamespaceSecrets(c.namespace!))
            )
            const map: Record<string, string | null> = {}
            calls.promise
                .then((results) => {
                    results.forEach((res) => {
                        if (res.status === 'fulfilled') {
                            const secrets: Secret[] = res.value
                            const matchedCluster: Cluster | undefined = availableClusters.find(
                                (c) => c.namespace === secrets?.[0]?.metadata.namespace
                            )
                            if (matchedCluster) {
                                const providerSecret = providerAutoDetectSecret[matchedCluster!.provider!](secrets)
                                map[matchedCluster.displayName!] = providerSecret?.metadata.name ?? null // null means secret not found
                            }
                        }
                    })
                })
                .finally(() => {
                    const hasSecretClusters = Object.keys(map)
                    const missingClusters = availableClusters.filter(
                        (cluster) => !hasSecretClusters.includes(cluster.displayName!)
                    )
                    missingClusters.forEach((c) => (map[c.displayName!] = null))
                    setProviderSecretMap(map)
                })
        }
    }, [availableClusters, providerSecretMap, fetchSecrets])

    useEffect(() => {
        const name = defaultBrokerName
        const namespace = clusterSet?.metadata?.annotations?.[submarinerBrokerNamespaceAnnotation]
        if (namespace) {
            getBroker({ name, namespace })
                .promise.then((broker) => {
                    setGlobalnetEnabled(broker?.spec?.globalnetEnabled ?? false)
                    setIsGlobalnetAlreadyConfigured(true)
                })
                .catch(() => {
                    setIsGlobalnetAlreadyConfigured(false)
                })
        }
    }, [clusterSet])

    function stateToData() {
        const resources: any = []
        let anyUnsupported = false
        selectedClusters?.forEach((selected) => {
            const cluster: Cluster = availableClusters.find((c) => c.displayName === selected)!

            const isSupported =
                submarinerConfigProviders.includes(cluster.provider!) &&
                (cluster.provider === Provider.vmware || providerSecretMap[cluster.displayName!] !== undefined)
            anyUnsupported ||= !isSupported

            if (isSupported) {
                // ManagedClusterAddOn resource
                resources.push({
                    apiVersion: ManagedClusterAddOnApiVersion,
                    kind: ManagedClusterAddOnKind,
                    metadata: {
                        name: 'submariner',
                        namespace: cluster?.namespace!,
                    },
                    spec: {
                        installNamespace,
                    },
                })

                const submarinerConfig: SubmarinerConfig = {
                    apiVersion: SubmarinerConfigApiVersion,
                    kind: SubmarinerConfigKind,
                    metadata: {
                        name: 'submariner',
                        namespace: cluster?.namespace!,
                    },
                    spec: {
                        gatewayConfig: {
                            gateways: gateways[cluster.displayName!] || submarinerConfigDefault.gateways,
                        },
                        IPSecNATTPort: nattPorts[cluster.displayName!] ?? submarinerConfigDefault.nattPort,
                        NATTEnable: nattEnables[cluster.displayName!] ?? submarinerConfigDefault.nattEnable,
                        cableDriver: cableDrivers[cluster.displayName!] ?? submarinerConfigDefault.cableDriver,
                    },
                }

                if (!cluster.distribution?.isManagedOpenShift) {
                    // Create credential secret if one doesn't exist
                    const secret: Secret = {
                        apiVersion: SecretApiVersion,
                        kind: SecretKind,
                        metadata: {
                            name: `${cluster.name}-${cluster.provider}-creds`,
                            namespace: cluster.namespace,
                        },
                        stringData: {},
                        type: 'Opaque',
                    }

                    // configure secret if one doesn't exist
                    if (cluster.provider !== Provider.vmware && providerSecretMap[cluster.displayName!] === null) {
                        if (cluster.provider === Provider.aws) {
                            secret.stringData!['aws_access_key_id'] = awsAccessKeyIDs[cluster.displayName!]! || ''
                            secret.stringData!['aws_secret_access_key'] =
                                awsSecretAccessKeyIDs[cluster.displayName!]! || ''
                        } else if (cluster.provider === Provider.gcp) {
                            secret.stringData!['osServiceAccount.json'] =
                                gcServiceAccountKeys[cluster.displayName!]! || ''
                        } else if (cluster.provider === Provider.azure) {
                            const clientid = clientIds[cluster.displayName!]! || ''
                            const clientSecret = clientSecrets[cluster.displayName!]! || ''
                            const tenantid = tenantIds[cluster.displayName!]! || ''
                            const subscriptionid = subscriptionIds[cluster.displayName!]! || ''
                            secret.stringData!['osServicePrincipal.json'] = JSON.stringify({
                                clientid,
                                clientSecret,
                                tenantid,
                                subscriptionid,
                            })
                            secret.stringData!['baseDomainResourceGroupName'] =
                                baseDomainResourceGroupNames[cluster.displayName!]! || ''
                        } else if (cluster.provider === Provider.openstack) {
                            secret.stringData!['cloud'] = clouds[cluster.displayName!] || ''
                            secret.stringData!['clouds.yaml'] = cloudsYamls[cluster.displayName!] || ''
                        }

                        resources.push(secret)
                    }

                    if (cluster.provider !== Provider.vmware) {
                        // use existing secret name
                        if (providerSecretMap[cluster.displayName!]) {
                            submarinerConfig.spec.credentialsSecret = {
                                name: providerSecretMap[cluster.displayName!]!,
                            }
                        } else {
                            // use secret name that will be created
                            submarinerConfig.spec.credentialsSecret = {
                                name: secret.metadata.name!,
                            }
                        }
                    }

                    // configure instance type if AWS
                    if (cluster.provider === Provider.aws) {
                        submarinerConfig.spec.gatewayConfig!.aws = {
                            instanceType:
                                awsInstanceTypes[cluster.displayName!] ?? submarinerConfigDefault.awsInstanceType,
                        }
                    } else if (cluster.provider === Provider.azure) {
                        submarinerConfig.spec.gatewayConfig!.azure = {
                            instanceType:
                                azInstanceTypes[cluster.displayName!] ?? submarinerConfigDefault.azureInstanceType,
                        }
                    } else if (cluster.provider === Provider.openstack) {
                        submarinerConfig.spec.gatewayConfig!.rhos = {
                            instanceType:
                                openStackInstanceTypes[cluster.displayName!] ??
                                submarinerConfigDefault.openStackInstanceType,
                        }
                    }
                } else {
                    submarinerConfig.spec.gatewayConfig = {}
                    submarinerConfig.spec.loadBalancerEnable = true
                }
                resources.push(submarinerConfig)
            } else {
                resources.push({
                    apiVersion: ManagedClusterAddOnApiVersion,
                    kind: ManagedClusterAddOnKind,
                    metadata: {
                        name: 'submariner',
                        namespace: cluster?.namespace!,
                    },
                    spec: {
                        installNamespace,
                    },
                })
            }
        })

        if (!selectedClusters || !selectedClusters.length) {
            // empty ManagedClusterAddOn resource
            resources.push({
                apiVersion: ManagedClusterAddOnApiVersion,
                kind: ManagedClusterAddOnKind,
                metadata: {
                    name: 'submariner',
                    namespace: '',
                },
                spec: {
                    installNamespace,
                },
            })
            resources.push({
                apiVersion: SubmarinerConfigApiVersion,
                kind: SubmarinerConfigKind,
                metadata: {
                    name: 'submariner',
                    namespace: '',
                },
                spec: {
                    gatewayConfig: {
                        gateways: 0,
                        aws: {
                            instanceType: '',
                        },
                        gcp: {
                            instanceType: '',
                        },
                        azure: {
                            instanceType: '',
                        },
                        rhos: {
                            instanceType: '',
                        },
                    },
                    IPSecNATTPort: 0,
                    NATTEnable: false,
                    cableDriver: '',
                    credentialsSecret: {
                        name: '',
                    },
                },
            })
        }

        if (anyUnsupported && !isGlobalnetAlreadyConfigured) {
            const broker: Broker = {
                apiVersion: BrokerApiVersion,
                kind: BrokerKind,
                metadata: {
                    name: defaultBrokerName,
                    namespace: clusterSet?.metadata?.annotations?.[submarinerBrokerNamespaceAnnotation],
                },
                spec: {
                    globalnetEnabled: false,
                },
            }
            resources.push(broker)
        } else if (!isGlobalnetAlreadyConfigured || !selectedClusters || !selectedClusters.length) {
            const broker: Broker = {
                apiVersion: BrokerApiVersion,
                kind: BrokerKind,
                metadata: {
                    name: defaultBrokerName,
                    namespace: clusterSet?.metadata?.annotations?.[submarinerBrokerNamespaceAnnotation],
                },
                spec: {
                    globalnetEnabled,
                },
            }
            resources.push(broker)
        }

        return resources
    }

    const formData: FormData = {
        title: t('managed.clusterSets.submariner.addons.install'),
        titleTooltip: (
            <>
                {t('submariner.title.tooltip')}
                <AcmButton
                    style={{ display: 'block', marginTop: '8px' }}
                    onClick={() => window.open(DOC_LINKS.SUBMARINER, '_blank')}
                    icon={<ExternalLinkAltIcon />}
                    iconPosition="right"
                    variant="link"
                    isInline
                >
                    {t('learn.more')}
                </AcmButton>
            </>
        ),
        breadcrumb: [
            {
                text: t('clusterSets'),
                to: NavigationPath.clusterSets,
            },
            {
                text: clusterSet!.metadata.name!,
                to: NavigationPath.clusterSetSubmariner.replace(':id', clusterSet!.metadata.name!),
            },
            {
                text: t('managed.clusterSets.submariner.addons.install'),
            },
        ],
        submitText: t('install'),
        submittingText: t('installing'),
        reviewTitle: t('wizard.review.title'),
        reviewDescription: t('wizard.review.description'),
        cancelLabel: t('cancel'),
        nextLabel: t('next'),
        backLabel: t('back'),
        cancel: () => history.push(NavigationPath.clusterSetSubmariner.replace(':id', clusterSet!.metadata.name!)),
        stateToData,
        sections: [
            {
                title: t('submariner.install.step.clusters.title'),
                wizardTitle: t('submariner.install.step.clusters.wizardTitle'),
                type: 'Section',
                alerts: (
                    <>
                        {withoutSubmarinerConfigClusters.length > 0 && (
                            <AcmAlert
                                variant="info"
                                isInline
                                noClose
                                title={t('important')}
                                message={
                                    <>
                                        <Trans
                                            i18nKey="managed.clusterSets.submariner.addons.config.notSupported"
                                            components={{
                                                bold: <strong />,
                                                button: (
                                                    <AcmButton
                                                        onClick={() => window.open(DOC_LINKS.SUBMARINER, '_blank')}
                                                        variant="link"
                                                        role="link"
                                                        isInline
                                                        icon={<ExternalLinkAltIcon />}
                                                        iconPosition="right"
                                                    />
                                                ),
                                            }}
                                        />
                                        <AcmExpandableSection
                                            label={t('managed.clusterSets.submariner.addons.config.notSupported.view', {
                                                number: withoutSubmarinerConfigClusters.length,
                                            })}
                                        >
                                            <List>
                                                {withoutSubmarinerConfigClusters.map((cluster) => (
                                                    <ListItem key={cluster.displayName}>
                                                        {t(
                                                            'managed.clusterSets.submariner.addons.config.notSupported.provider',
                                                            { clusterName: cluster.displayName! }
                                                        )}
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </AcmExpandableSection>
                                    </>
                                }
                            />
                        )}
                    </>
                ),
                inputs: [
                    {
                        id: 'available-clusters',
                        type: 'Multiselect',
                        label: t('submariner.install.form.clusters'),
                        placeholder: t('submariner.install.form.clusters.placeholder'),
                        value: selectedClusters,
                        onChange: (clusters) => {
                            setSelectedClusters(clusters)

                            const withoutSubmarinerConfigList = clusters
                                ?.filter((cluster: string) => {
                                    const matchedCluster: Cluster = availableClusters.find(
                                        (c) => c.displayName === cluster
                                    )!
                                    if (matchedCluster.provider === Provider.vmware) {
                                        return false
                                    }
                                    return !submarinerConfigProviders.includes(matchedCluster!.provider!)
                                })
                                .map((name) => availableClusters.find((c) => c.name === name)!)

                            setWithoutSubmarinerConfigClusters(withoutSubmarinerConfigList ?? [])
                        },
                        isRequired: true,
                        options: [...availableClusters.map((c) => ({ id: c.displayName!, value: c.displayName! }))],
                    },
                    {
                        id: 'globalist-enable',
                        type: 'Checkbox',
                        title: t('Globalnet settings'),
                        label: t('Enable Globalnet'),
                        value: globalnetEnabled,
                        isDisabled: isGlobalnetAlreadyConfigured,
                        labelHelp: t('globalnet.description'),
                        helperText: isGlobalnetAlreadyConfigured
                            ? globalnetEnabled
                                ? t('globalnet.enabled')
                                : t('globalnet.disabled')
                            : '',
                        onChange: (value: boolean) => {
                            setGlobalnetEnabled(value)
                        },
                    },
                ],
            },
            {
                type: 'SectionGroup',
                title: t('submariner.install.step.configure.title'),
                sections: selectedClusters
                    .filter((selected) => !withoutSubmarinerConfigClusters.find((c) => c.displayName === selected))
                    .map((c) => {
                        const cluster = availableClusters.find((ac) => ac.displayName === c)!
                        const clusterName = cluster.displayName!
                        return {
                            title: clusterName,
                            wizardTitle: t('submariner.install.form.config.title', {
                                clusterName,
                                provider: ProviderLongTextMap[cluster.provider!],
                            }),
                            type: 'Section',
                            description: (
                                <AcmButton
                                    onClick={() => window.open(DOC_LINKS.SUBMARINER, '_blank')}
                                    icon={<ExternalLinkAltIcon />}
                                    iconPosition="right"
                                    variant="link"
                                    isInline
                                >
                                    {t('submariner.install.form.config.doc')}
                                </AcmButton>
                            ),
                            inputs: [
                                {
                                    id: 'credential-secret',
                                    type: 'Text',
                                    label: t('submariner.install.form.credential.secret'),
                                    placeholder: '',
                                    labelHelp: t('submariner.install.form.credential.secret.labelHelp'),
                                    value: providerSecretMap[clusterName],
                                    isHidden:
                                        providerSecretMap[clusterName] === null ||
                                        cluster.provider === Provider.vmware ||
                                        cluster.distribution?.isManagedOpenShift,
                                    isRequired:
                                        [Provider.aws, Provider.gcp, Provider.azure].includes(cluster.provider!) &&
                                        providerSecretMap[clusterName] !== null,
                                    isDisabled: providerSecretMap[clusterName] !== null,
                                    onChange: () => {},
                                },
                                {
                                    id: 'awsAccessKeyID',
                                    type: 'Text',
                                    label: t('credentialsForm.aws_access_key_id.label'),
                                    placeholder: t('credentialsForm.aws_access_key_id.placeholder'),
                                    labelHelp: t('credentialsForm.aws_access_key_id.labelHelp'),
                                    value: awsAccessKeyIDs[clusterName] ?? '', // without the ?? '' the UI repeats the values across sub-pages
                                    onChange: (value: string) => {
                                        const copy = { ...awsAccessKeyIDs }
                                        copy[clusterName] = value
                                        setAwsAccessKeyIDs(copy)
                                    },
                                    isHidden:
                                        cluster.provider !== Provider.aws ||
                                        providerSecretMap[clusterName] !== null ||
                                        cluster.distribution?.isManagedOpenShift,
                                    isRequired:
                                        cluster.provider === Provider.aws && providerSecretMap[clusterName] === null,
                                },
                                {
                                    id: 'awsSecretAccessKeyID',
                                    type: 'Text',
                                    label: t('credentialsForm.aws_secret_access_key.label'),
                                    placeholder: t('credentialsForm.aws_secret_access_key.placeholder'),
                                    labelHelp: t('credentialsForm.aws_secret_access_key.labelHelp'),
                                    value: awsSecretAccessKeyIDs[clusterName] ?? '',
                                    onChange: (value: string) => {
                                        const copy = { ...awsSecretAccessKeyIDs }
                                        copy[clusterName] = value
                                        setAwsSecretAccessKeyIDs(copy)
                                    },
                                    isHidden:
                                        cluster.provider !== Provider.aws ||
                                        providerSecretMap[clusterName] !== null ||
                                        cluster.distribution?.isManagedOpenShift,
                                    isRequired:
                                        cluster.provider === Provider.aws && providerSecretMap[clusterName] === null,
                                    isSecret: true,
                                },
                                {
                                    id: 'gcServiceAccountKey',
                                    type: 'TextArea',
                                    label: t('credentialsForm.osServiceAccount.json.label'),
                                    placeholder: t('credentialsForm.osServiceAccount.json.placeholder'),
                                    labelHelp: t('credentialsForm.osServiceAccount.json.labelHelp'),
                                    value: gcServiceAccountKeys[clusterName] ?? '',
                                    onChange: (value) => {
                                        const copy = { ...gcServiceAccountKeys }
                                        copy[clusterName] = value
                                        setGcServiceAccountKeys(copy)
                                    },
                                    validation: (value) => validateJSON(value, t),
                                    isHidden:
                                        cluster.provider !== Provider.gcp || providerSecretMap[clusterName] !== null,
                                    isRequired:
                                        cluster.provider === Provider.gcp && providerSecretMap[clusterName] === null,
                                    isSecret: true,
                                },
                                {
                                    id: 'baseDomainResourceGroupName',
                                    type: 'Text',
                                    label: t('Base domain resource group name'),
                                    placeholder: t('Enter your base domain resource group name'),
                                    labelHelp: t(
                                        'Azure Resource Groups are logical collections of virtual machines, storage accounts, virtual networks, web apps, databases, and/or database servers. You can group together related resources for an application and divide them into groups for production and non-production.'
                                    ),
                                    value: baseDomainResourceGroupNames[clusterName] ?? '',
                                    onChange: (value: string) => {
                                        const copy = { ...baseDomainResourceGroupNames }
                                        copy[clusterName] = value
                                        setBaseDomainResourceGroupNames(copy)
                                    },
                                    isHidden:
                                        cluster.provider !== Provider.azure ||
                                        providerSecretMap[clusterName] !== null ||
                                        cluster.distribution?.isManagedOpenShift,
                                    isRequired:
                                        cluster.provider === Provider.azure && providerSecretMap[clusterName] === null,
                                },
                                {
                                    id: 'clientId',
                                    type: 'Text',
                                    label: t('Client ID'),
                                    placeholder: t('Enter your client ID'),
                                    labelHelp: t(
                                        "Your client ID. This value is generated as the 'appId' property when you create a service principal with the following command: 'az ad sp create-for-rbac --role Contributor --name <service_principal> --scopes <list_of_scopes>'."
                                    ),
                                    value: clientIds[clusterName] ?? '',
                                    onChange: (value: string) => {
                                        const copy = { ...clientIds }
                                        copy[clusterName] = value
                                        setClientIds(copy)
                                    },
                                    isHidden:
                                        cluster.provider !== Provider.azure ||
                                        providerSecretMap[clusterName] !== null ||
                                        cluster.distribution?.isManagedOpenShift,
                                    isRequired:
                                        cluster.provider === Provider.azure && providerSecretMap[clusterName] === null,
                                },
                                {
                                    id: 'clientSecret',
                                    type: 'Text',
                                    label: t('Client secret'),
                                    placeholder: t('Enter your client secret'),
                                    labelHelp: t(
                                        "Your client password. This value is generated as the 'password' property when you create a service principal with the following command: 'az ad sp create-for-rbac --role Contributor --name <service_principal> --scopes <list_of_scopes>'."
                                    ),
                                    value: clientSecrets[clusterName] ?? '',
                                    onChange: (value: string) => {
                                        const copy = { ...clientSecrets }
                                        copy[clusterName] = value
                                        setClientSecrets(copy)
                                    },
                                    isHidden:
                                        cluster.provider !== Provider.azure ||
                                        providerSecretMap[clusterName] !== null ||
                                        cluster.distribution?.isManagedOpenShift,
                                    isRequired:
                                        cluster.provider === Provider.azure && providerSecretMap[clusterName] === null,
                                    isSecret: true,
                                },
                                {
                                    id: 'subscriptionId',
                                    type: 'Text',
                                    label: t('Subscription ID'),
                                    placeholder: t('Enter your subscription ID'),
                                    labelHelp: t(
                                        "Your subscription ID. This is the value of the 'id' property in the output of the following command: 'az account show'"
                                    ),
                                    value: subscriptionIds[clusterName] ?? '',
                                    onChange: (value: string) => {
                                        const copy = { ...subscriptionIds }
                                        copy[clusterName] = value
                                        setSubscriptionIds(copy)
                                    },
                                    isHidden:
                                        cluster.provider !== Provider.azure ||
                                        providerSecretMap[clusterName] !== null ||
                                        cluster.distribution?.isManagedOpenShift,
                                    isRequired:
                                        cluster.provider === Provider.azure && providerSecretMap[clusterName] === null,
                                },
                                {
                                    id: 'tenantId',
                                    type: 'Text',
                                    label: t('Tenant ID'),
                                    placeholder: t('Enter your tenant ID'),
                                    labelHelp: t(
                                        "Your tenant ID. This is the value of the 'tenantId' property in the output of the following command: 'az account show'"
                                    ),
                                    value: tenantIds[clusterName] ?? '',
                                    onChange: (value: string) => {
                                        const copy = { ...tenantIds }
                                        copy[clusterName] = value
                                        setTenantIds(copy)
                                    },
                                    isHidden:
                                        cluster.provider !== Provider.azure ||
                                        providerSecretMap[clusterName] !== null ||
                                        cluster.distribution?.isManagedOpenShift,
                                    isRequired:
                                        cluster.provider === Provider.azure && providerSecretMap[clusterName] === null,
                                },
                                {
                                    id: 'clouds.yaml',
                                    type: 'TextArea',
                                    label: t('OpenStack clouds.yaml'),
                                    placeholder: t('Enter the contents of the OpenStack clouds.yaml'),
                                    labelHelp: t(
                                        'The OpenStack clouds.yaml file, including the password, to connect to the OpenStack server.'
                                    ),
                                    value: cloudsYamls[clusterName] ?? '',
                                    isHidden:
                                        cluster.provider !== Provider.openstack ||
                                        providerSecretMap[clusterName] !== null,
                                    isRequired:
                                        cluster.provider === Provider.openstack &&
                                        providerSecretMap[clusterName] === null,
                                    onChange: (value: string) => {
                                        const copy = { ...cloudsYamls }
                                        copy[clusterName] = value
                                        setOpenstackCloudsYamls(copy)
                                    },
                                    isSecret: true,
                                    validation: (value) => validateCloudsYaml(value, clouds[clusterName] as string, t),
                                },
                                {
                                    id: 'cloud',
                                    type: 'Text',
                                    label: t('Cloud name'),
                                    placeholder: t('Enter the OpenStack cloud name to reference in the clouds.yaml'),
                                    labelHelp: t(
                                        'The name of the cloud section of the clouds.yaml to use for establishing communication to the OpenStack server.'
                                    ),
                                    value: clouds[clusterName] ?? '',
                                    onChange: (value: string) => {
                                        const copy = { ...clouds }
                                        copy[clusterName] = value
                                        setOpenstackClouds(copy)
                                    },
                                    isHidden:
                                        cluster.provider !== Provider.openstack ||
                                        providerSecretMap[clusterName] !== null,
                                    isRequired:
                                        cluster.provider === Provider.openstack &&
                                        providerSecretMap[clusterName] === null,
                                },
                                {
                                    id: 'aws-instance-type',
                                    type: 'Text',
                                    label: t('submariner.install.form.instancetype'),
                                    placeholder: t('submariner.install.form.instancetype.placeholder'),
                                    labelHelp: t('submariner.install.form.instancetype.labelHelp.aws'),
                                    value: awsInstanceTypes[clusterName] ?? submarinerConfigDefault.awsInstanceType,
                                    isHidden:
                                        cluster.provider !== Provider.aws || cluster.distribution?.isManagedOpenShift,
                                    onChange: (value) => {
                                        const copy = { ...awsInstanceTypes }
                                        copy[clusterName] = value
                                        setAwsInstanceTypes(copy)
                                    },
                                },
                                {
                                    id: 'az-instance-type',
                                    type: 'Text',
                                    label: t('submariner.install.form.instancetype'),
                                    placeholder: t('submariner.install.form.instancetype.placeholder'),
                                    labelHelp: t('submariner.install.form.instancetype.labelHelp.azure'),
                                    value: azInstanceTypes[clusterName] ?? submarinerConfigDefault.azureInstanceType,
                                    isHidden:
                                        cluster.provider !== Provider.azure || cluster.distribution?.isManagedOpenShift,
                                    onChange: (value) => {
                                        const copy = { ...azInstanceTypes }
                                        copy[clusterName] = value
                                        setAzInstanceTypes(copy)
                                    },
                                },
                                {
                                    id: 'openstack-instance-type',
                                    type: 'Text',
                                    label: t('submariner.install.form.instancetype'),
                                    placeholder: t('submariner.install.form.instancetype.placeholder'),
                                    labelHelp: t(
                                        'The OpenStack instance type of the gateway node that will be created on the managed cluster (default PnTAE.CPU_4_Memory_8192_Disk_50).'
                                    ),
                                    value:
                                        openStackInstanceTypes[clusterName] ??
                                        submarinerConfigDefault.openStackInstanceType,
                                    isHidden: cluster.provider !== Provider.openstack,
                                    onChange: (value) => {
                                        const copy = { ...openStackInstanceTypes }
                                        copy[clusterName] = value
                                        setOpenStackInstanceTypes(copy)
                                    },
                                },
                                {
                                    id: 'natt-port',
                                    type: 'TextNumber',
                                    label: t('submariner.install.form.nattport'),
                                    placeholder: t('submariner.install.form.port.placeholder'),
                                    labelHelp: t('submariner.install.form.nattport.labelHelp'),
                                    value: nattPorts[clusterName] ?? submarinerConfigDefault.nattPort.toString(),
                                    onChange: (value: number) => {
                                        const copy = { ...nattPorts }
                                        copy[clusterName] = value
                                        setNattPorts(copy)
                                    },
                                },
                                {
                                    id: 'natt-enable',
                                    type: 'Checkbox',
                                    label: t('submariner.install.form.nattenable'),
                                    // placeholder: t('submariner.install.form.nattenable.placeholder'),
                                    // labelHelp: t('submariner.install.form.nattenable.labelHelp'),
                                    value:
                                        nattEnables[clusterName] !== undefined
                                            ? nattEnables[clusterName]
                                            : submarinerConfigDefault.nattEnable,
                                    onChange: (value: boolean) => {
                                        const copy = { ...nattEnables }
                                        copy[clusterName] = value
                                        setNattEnables(copy)
                                    },
                                },
                                {
                                    id: 'gateways',
                                    type: 'Number',
                                    label: t('submariner.install.form.gateways'),
                                    placeholder: t('submariner.install.form.gateways.placeholder'),
                                    labelHelp: t('submariner.install.form.gateways.labelHelp'),
                                    value: gateways[clusterName] ?? submarinerConfigDefault.gateways,
                                    isHidden: cluster.distribution?.isManagedOpenShift,
                                    onChange: (value: number) => {
                                        const copy = { ...gateways }
                                        copy[clusterName] = value
                                        setGateways(copy)
                                    },
                                    min: 1,
                                    step: 1,
                                },
                                {
                                    id: 'cable-driver',
                                    type: 'Select',
                                    label: t('submariner.install.form.cabledriver'),
                                    placeholder: t('submariner.install.form.cabledriver.placeholder'),
                                    labelHelp: t('submariner.install.form.cabledriver.labelHelp'),
                                    value: cableDrivers[clusterName] ?? submarinerConfigDefault.cableDriver,
                                    onChange: (value) => {
                                        const copy = { ...cableDrivers }
                                        copy[clusterName] = value as CableDriver
                                        setCableDrivers(copy)
                                    },
                                    options: Object.values(CableDriver).map((cb) => ({ id: cb, value: cb })),
                                },
                            ],
                        } as Section
                    }),
            },
        ],
        submit: () => {
            return new Promise(async (resolve, reject) => {
                const resources = formData?.customData ?? stateToData()
                const calls: any[] = resources.map((resource: IResource) => {
                    return createResource(resource)
                })
                const requests = resultsSettled(calls)
                const results = await requests.promise
                const errors: string[] = []
                results.forEach((res) => {
                    if (res.status === 'rejected') {
                        errors.push(res.reason)
                    }
                })
                if (errors.length > 0) {
                    reject(errors[0])
                } else {
                    resolve(
                        history.push(NavigationPath.clusterSetSubmariner.replace(':id', clusterSet!.metadata.name!))
                    )
                }
            })
        },
    }

    return (
        <AcmDataFormPage
            formData={formData}
            mode="wizard"
            editorTitle={t('Submariner YAML')}
            schema={schema}
            secrets={['*.stringData.aws_secret_access_key', '*.stringData.osServiceAccount.json']}
            immutables={['*.metadata.name', '*.metadata.namespace']}
        />
    )
}
