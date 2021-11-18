/* Copyright Contributors to the Open Cluster Management project */

import {
    CableDriver,
    Cluster,
    createResource,
    listNamespaceSecrets,
    ManagedClusterAddOn,
    ManagedClusterAddOnApiVersion,
    ManagedClusterAddOnKind,
    ManagedClusterSetDefinition,
    resultsSettled,
    Secret,
    SecretApiVersion,
    SecretKind,
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
} from '@open-cluster-management/ui-components'
import { List, ListItem, PageSection } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { useContext, useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useHistory } from 'react-router'
import { Link } from 'react-router-dom'
import { AcmDataFormPage } from '../../../../../../components/AcmDataForm'
import { FormData, Section } from '../../../../../../components/AcmFormData'
import { RbacButton } from '../../../../../../components/Rbac'
import { DOC_LINKS } from '../../../../../../lib/doc-util'
import { rbacCreate } from '../../../../../../lib/rbac-util'
import { validateJSON } from '../../../../../../lib/validation'
import { NavigationPath } from '../../../../../../NavigationPath'
import { ClusterSetContext } from '../ClusterSetDetails'

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
                        title={t('Install Submariner add-ons')}
                        titleTooltip={
                            <>
                                {t(
                                    'Install the Submariner add-on to managed clusters to create a multi-cluster network.'
                                )}
                                <a
                                    href={DOC_LINKS.SUBMARINER}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ display: 'block', marginTop: '4px' }}
                                >
                                    {t('Learn more')}
                                </a>
                            </>
                        }
                        breadcrumb={[
                            {
                                text: t('Cluster sets'),
                                to: NavigationPath.clusterSets,
                            },
                            {
                                text: clusterSet!.metadata.name!,
                                to: NavigationPath.clusterSetSubmariner.replace(':id', clusterSet!.metadata.name!),
                            },
                            {
                                text: t('Install Submariner add-ons'),
                            },
                        ]}
                    />
                }
            >
                <PageSection variant="light" isFilled>
                    <AcmEmptyState
                        title={t('No available clusters found')}
                        message={
                            <Trans
                                i18nKey={
                                    'All clusters in the cluster set already have the Submariner add-on installed. Select the <bold>Manage resource assignments</bold> button to add more clusters.'
                                }
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
                                    {t('Manage resource assignments')}
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
                                    {t('Back to Submariner add-ons', { name: clusterSet?.metadata.name! })}
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
const submarinerConfigProviders = [Provider.aws, Provider.gcp, Provider.vmware]

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

    const [awsAccessKeyIDs, setAwsAccessKeyIDs] = useState<Record<string, string | undefined>>({})
    const [awsSecretAccessKeyIDs, setAwsSecretAccessKeyIDs] = useState<Record<string, string | undefined>>({})

    const [gcServiceAccountKeys, setGcServiceAccountKeys] = useState<Record<string, any>>({})

    const [nattPorts, setNattPorts] = useState<Record<string, number>>({})
    const [nattEnables, setNattEnables] = useState<Record<string, boolean>>({})
    const [cableDrivers, setCableDrivers] = useState<Record<string, CableDriver>>({})
    const [gateways, setGateways] = useState<Record<string, number>>({})
    const [awsInstanceTypes, setAwsInstanceTypes] = useState<Record<string, string>>({})

    const { availableClusters } = props

    useEffect(() => {
        if (fetchSecrets) {
            setFetchSecrets(false)
            const calls = resultsSettled(
                availableClusters
                    .filter((c) => submarinerConfigProviders.includes(c!.provider!))
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

    function stateToData() {
        return {}
    }

    const formData: FormData = {
        title: t('Install Submariner add-ons'),
        titleTooltip: (
            <>
                {t(
                    'Submariner enables direct networking between Pods and Services in different Kubernetes clusters, either on-premises or in the cloud.'
                )}
                <AcmButton
                    style={{ display: 'block', marginTop: '8px' }}
                    onClick={() => window.open(DOC_LINKS.SUBMARINER, '_blank')}
                    icon={<ExternalLinkAltIcon />}
                    iconPosition="right"
                    variant="link"
                    isInline
                >
                    {t('Learn more')}
                </AcmButton>
            </>
        ),
        breadcrumb: [
            {
                text: t('Cluster sets'),
                to: NavigationPath.clusterSets,
            },
            {
                text: clusterSet!.metadata.name!,
                to: NavigationPath.clusterSetSubmariner.replace(':id', clusterSet!.metadata.name!),
            },
            {
                text: t('Install Submariner add-ons'),
            },
        ],
        submitText: t('Install'),
        submittingText: t('Installing'),
        reviewTitle: t('Review your selections'),
        reviewDescription: t('Return to a step to make changes'),
        cancelLabel: t('Cancel'),
        nextLabel: t('Next'),
        backLabel: t('Back'),
        cancel: () => history.push(NavigationPath.clusterSetSubmariner.replace(':id', clusterSet!.metadata.name!)),
        stateToData,
        sections: [
            {
                title: t('Select clusters'),
                wizardTitle: t('Select clusters for add-on installation'),
                type: 'Section',
                alerts: (
                    <>
                        {withoutSubmarinerConfigClusters.length > 0 && (
                            <AcmAlert
                                variant="info"
                                isInline
                                noClose
                                title={t('Important')}
                                message={
                                    <>
                                        <Trans
                                            i18nKey="One or more of the selected clusters are deployed on a provider that does not support configuration by a <bold>SubmarinerConfig</bold> resource. The Submariner add-on can still be installed, but you may need to follow a few manual configuration steps, view the <button>Submariner documentation</button> for more information."
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
                                            // TODO - Handle interpolation
                                            label={t('View unsupported clusters ({{number}})', {
                                                number: withoutSubmarinerConfigClusters.length,
                                            })}
                                        >
                                            <List>
                                                {withoutSubmarinerConfigClusters.map((cluster) => (
                                                    <ListItem>
                                                        {t(
                                                            // TODO - Handle interpolation
                                                            '{{clusterName}} (Provider not supported)',
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
                        label: t('Target clusters'),
                        placeholder: t('Select clusters'),
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
                ],
            },
            {
                type: 'SectionGroup',
                title: t('Configure clusters'),
                sections: selectedClusters
                    .filter((selected) => !withoutSubmarinerConfigClusters.find((c) => c.displayName === selected))
                    .map((c) => {
                        const cluster = availableClusters.find((ac) => ac.displayName === c)!
                        const clusterName = cluster.displayName!
                        return {
                            title: clusterName,
                            // TODO - Handle interpolation
                            wizardTitle: t('Enter the configuration for {{clusterName}} on {{provider}}', {
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
                                    {t('How do I configure Submariner?')}
                                </AcmButton>
                            ),
                            inputs: [
                                {
                                    id: 'credential-secret',
                                    type: 'Text',
                                    label: t('Provider credential secret'),
                                    placeholder: '',
                                    labelHelp: t(
                                        'The reference to the Secret in the cluster namespace that contains the provider credentials. The credentials will be used to prepare the Submariner environment on the provider.'
                                    ),
                                    value: providerSecretMap[clusterName],
                                    isHidden:
                                        providerSecretMap[clusterName] === null || cluster.provider === Provider.vmware,
                                    isRequired:
                                        [Provider.aws, Provider.gcp].includes(cluster.provider!) &&
                                        providerSecretMap[clusterName] !== null,
                                    isDisabled: providerSecretMap[clusterName] !== null,
                                    onChange: () => {},
                                },
                                {
                                    id: 'awsAccessKeyID',
                                    type: 'Text',
                                    label: t('Access key ID'),
                                    placeholder: t('Enter your AWS access key ID'),
                                    labelHelp: t(
                                        'You use access keys to sign programmatic requests that you make to AWS. The access key is equivalent to a username in a username/password combination.'
                                    ),
                                    value: awsAccessKeyIDs[clusterName] ?? '', // without the ?? '' the UI repeats the values across sub-pages
                                    onChange: (value: string) => {
                                        const copy = { ...awsAccessKeyIDs }
                                        copy[clusterName] = value
                                        setAwsAccessKeyIDs(copy)
                                    },
                                    isHidden:
                                        cluster.provider !== Provider.aws || providerSecretMap[clusterName] !== null,
                                    isRequired:
                                        cluster.provider === Provider.aws && providerSecretMap[clusterName] === null,
                                },
                                {
                                    id: 'awsSecretAccessKeyID',
                                    type: 'Text',
                                    label: t('Secret access key'),
                                    placeholder: t('Enter your AWS secret access key'),
                                    labelHelp: t(
                                        'You use access keys to sign programmatic requests that you make to AWS. The secret access key is equivalent to a password in a username/password combination.'
                                    ),
                                    value: awsSecretAccessKeyIDs[clusterName] ?? '',
                                    onChange: (value: string) => {
                                        const copy = { ...awsSecretAccessKeyIDs }
                                        copy[clusterName] = value
                                        setAwsSecretAccessKeyIDs(copy)
                                    },
                                    isHidden:
                                        cluster.provider !== Provider.aws || providerSecretMap[clusterName] !== null,
                                    isRequired:
                                        cluster.provider === Provider.aws && providerSecretMap[clusterName] === null,
                                    isSecret: true,
                                },
                                {
                                    id: 'gcServiceAccountKey',
                                    type: 'TextArea',
                                    label: t('Service account JSON key'),
                                    placeholder: t('Enter your Google Cloud Platform service account JSON key'),
                                    labelHelp: t(
                                        'Creating a service account is similar to adding a member to your project, but the service account belongs to your applications rather than an individual end user.'
                                    ),
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
                                    id: 'aws-instance-type',
                                    type: 'Text',
                                    label: t('Instance type'),
                                    placeholder: t('Select instance type'),
                                    labelHelp: t(
                                        'The Amazon Web Services EC2 instance type of the gateway node that will be created on the managed cluster. (default c5d.large)'
                                    ),
                                    value: awsInstanceTypes[clusterName] ?? submarinerConfigDefault.awsInstanceType,
                                    isHidden: cluster.provider !== Provider.aws,
                                    onChange: (value) => {
                                        const copy = { ...awsInstanceTypes }
                                        copy[clusterName] = value
                                        setAwsInstanceTypes(copy)
                                    },
                                },
                                {
                                    id: 'natt-port',
                                    type: 'TextNumber',
                                    label: t('IPSec NAT-T port'),
                                    placeholder: t('Enter port number'),
                                    labelHelp: t(
                                        'The Submariner creates the IPsec tunnel between the clusters.  This port is used for IPsec NAT traversal. (default 4500)'
                                    ),
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
                                    label: t('Enable NAT-T'),
                                    // placeholder: t('Select NAT-T enabled'),
                                    // labelHelp: t('Submariner can use NAT Traversal for IPsec tunnels between clusters. Set this to true to enable NAT Traversal and false otherwise (default true)'),
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
                                    label: t('Gateway count'),
                                    placeholder: t('Enter gateway count'),
                                    labelHelp: t(
                                        'The number of worker nodes  that will be used to deploy the Submariner gateway component on the managed cluster. If the value is greater than 1, the Submariner gateway HA will be enabled automatically. (default 1)'
                                    ),
                                    value: gateways[clusterName] ?? submarinerConfigDefault.gateways,
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
                                    label: t('Cable driver'),
                                    placeholder: t('Select cable driver'),
                                    labelHelp: t(
                                        'The Submariner gateway cable driver, Available options are: libreswan (default), wireguard, and vxlan.'
                                    ),
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
                const calls: any[] = []
                selectedClusters?.forEach((selected) => {
                    const cluster: Cluster = availableClusters.find((c) => c.displayName === selected)!
                    // ManagedClusterAddOn resource
                    calls.push(
                        createResource<ManagedClusterAddOn>({
                            apiVersion: ManagedClusterAddOnApiVersion,
                            kind: ManagedClusterAddOnKind,
                            metadata: {
                                name: 'submariner',
                                namespace: cluster?.namespace!,
                            },
                            spec: {
                                installNamespace: 'submariner-operator',
                            },
                        })
                    )

                    if (submarinerConfigProviders.includes(cluster.provider!)) {
                        if (
                            cluster.provider !== Provider.vmware &&
                            providerSecretMap[cluster.displayName!] === undefined
                        ) {
                            return
                        }

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
                                secret.stringData!['aws_access_key_id'] = awsAccessKeyIDs[cluster.displayName!]!
                                secret.stringData!['aws_secret_access_key'] =
                                    awsSecretAccessKeyIDs[cluster.displayName!]!
                            } else if (cluster.provider === Provider.gcp) {
                                secret.stringData!['osServiceAccount.json'] =
                                    gcServiceAccountKeys[cluster.displayName!]!
                            }

                            calls.push(createResource<Secret>(secret))
                        }

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
                        }

                        calls.push(createResource<SubmarinerConfig>(submarinerConfig))
                    }
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

    return <AcmDataFormPage formData={formData} mode="wizard" />
}
