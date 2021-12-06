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
                    {t('common:learn.more')}
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
        submitText: t('common:install'),
        submittingText: t('common:installing'),
        reviewTitle: t('common:wizard.review.title'),
        reviewDescription: t('common:wizard.review.description'),
        cancelLabel: t('common:cancel'),
        nextLabel: t('common:next'),
        backLabel: t('common:back'),
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
                                title={t('common:important')}
                                message={
                                    <>
                                        <Trans
                                            i18nKey="cluster:managed.clusterSets.submariner.addons.config.notSupported"
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
                                                    <ListItem>
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
                                        cluster.provider !== Provider.aws || providerSecretMap[clusterName] !== null,
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
                                        cluster.provider !== Provider.aws || providerSecretMap[clusterName] !== null,
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
                                    id: 'aws-instance-type',
                                    type: 'Text',
                                    label: t('submariner.install.form.instancetype'),
                                    placeholder: t('submariner.install.form.instancetype.placeholder'),
                                    labelHelp: t('submariner.install.form.instancetype.labelHelp'),
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
