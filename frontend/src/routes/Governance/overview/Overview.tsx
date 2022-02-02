/* Copyright Contributors to the Open Cluster Management project */
import {
    Card,
    CardBody,
    PageSection,
    Select,
    SelectOption,
    Split,
    SplitItem,
    Stack,
    Text,
    TextContent,
    TextVariants,
} from '@patternfly/react-core'
import {
    AcmButton,
    AcmEmptyState,
    AcmInlineProvider,
    AcmInlineStatusGroup,
    AcmLabels,
    AcmTable,
    IAcmTableColumn,
} from '@stolostron/ui-components'
import { Fragment, useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { clusterCuratorsState } from '../../../atoms'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { Cluster } from '../../../resources'
import { DistributionField } from '../../Infrastructure/Clusters/ManagedClusters/components/DistributionField'
import { StatusField } from '../../Infrastructure/Clusters/ManagedClusters/components/StatusField'
import { useAllClusters } from '../../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import { ClusterPolicyViolationCard, ClusterPolicyViolationIcons } from '../components/ClusterPolicyViolations'
import { PolicyViolationIcons, PolicyViolationsCard } from '../components/PolicyViolations'
import { IGovernanceData, IPolicyGrouping, risksHasValues } from '../useGovernanceData'

export default function GovernanceOverview(props: { governanceData: IGovernanceData }) {
    const { governanceData } = props
    const hasRisks = risksHasValues(props.governanceData.policyRisks)
    const [group, setGroup] = useState<'standards' | 'categories' | 'controls'>('categories')
    const [groupOpen, setGroupOpen] = useState(false)
    const { t } = useTranslation()
    const [clusterCurators] = useRecoilState(clusterCuratorsState)

    let clusters = useAllClusters()
    clusters = clusters.filter((cluster) => {
        // don't show clusters in cluster pools in table
        if (cluster.hive.clusterPool) {
            return cluster.hive.clusterClaimName !== undefined
        } else {
            return true
        }
    })
    const mckeyFn = useCallback(function mckeyFn(cluster: Cluster) {
        return cluster.name!
    }, [])
    const columns = useMemo<IAcmTableColumn<Cluster>[]>(
        () => [
            {
                header: t('table.name'),
                tooltip: t('table.name.helperText.noBold'),
                sort: 'displayName',
                search: (cluster) => [cluster.displayName as string, cluster.hive.clusterClaimName as string],
                cell: (cluster) => (
                    <>
                        <span style={{ whiteSpace: 'nowrap' }}>
                            <Link to={NavigationPath.clusterDetails.replace(':id', cluster.name as string)}>
                                {cluster.displayName}
                            </Link>
                        </span>
                        {cluster.hive.clusterClaimName && (
                            <TextContent>
                                <Text component={TextVariants.small}>{cluster.hive.clusterClaimName}</Text>
                            </TextContent>
                        )}
                    </>
                ),
            },
            {
                header: t('Policy violations'),
                // sort: 'status',
                // search: 'status',
                cell: (cluster) => (
                    <span style={{ whiteSpace: 'nowrap' }}>
                        {governanceData.clusterMap[cluster.name ?? ''] && (
                            <ClusterPolicyViolationIcons risks={governanceData.clusterMap[cluster.name ?? '']} />
                        )}
                    </span>
                ),
            },
            {
                header: t('table.status'),
                sort: 'status',
                search: 'status',
                cell: (cluster) => (
                    <span style={{ whiteSpace: 'nowrap' }}>
                        <StatusField cluster={cluster} />
                    </span>
                ),
            },
            {
                header: t('table.provider'),
                sort: 'provider',
                search: 'provider',
                cell: (cluster) => (cluster?.provider ? <AcmInlineProvider provider={cluster?.provider} /> : '-'),
            },
            {
                header: t('table.distribution'),
                sort: 'distribution.displayVersion',
                search: 'distribution.displayVersion',
                cell: (cluster) => (
                    <DistributionField
                        cluster={cluster}
                        clusterCurator={clusterCurators.find((curator) => curator.metadata.name === cluster.name)}
                    />
                ),
            },
            {
                header: t('table.labels'),
                search: (cluster) =>
                    cluster.labels ? Object.keys(cluster.labels).map((key) => `${key}=${cluster.labels![key]}`) : '',
                cell: (cluster) => {
                    if (cluster.labels) {
                        const labelKeys = Object.keys(cluster.labels)
                        const collapse =
                            [
                                'cloud',
                                'clusterID',
                                'installer.name',
                                'installer.namespace',
                                'name',
                                'vendor',
                                'managed-by',
                                'local-cluster',
                                'openshiftVersion',
                            ].filter((label) => {
                                return labelKeys.includes(label)
                            }) ?? []
                        labelKeys.forEach((label) => {
                            if (label.includes('open-cluster-management.io')) {
                                collapse.push(label)
                            }
                        })
                        return (
                            <AcmLabels
                                labels={cluster.labels}
                                expandedText={t('show.less')}
                                collapsedText={t('show.more', { number: collapse.length })}
                                allCollapsedText={t('count.labels', { number: collapse.length })}
                                collapse={collapse}
                            />
                        )
                    } else {
                        return '-'
                    }
                },
            },
            {
                header: t('table.nodes'),
                cell: (cluster) => {
                    return cluster.nodes!.nodeList!.length > 0 ? (
                        <AcmInlineStatusGroup
                            healthy={cluster.nodes!.ready}
                            danger={cluster.nodes!.unhealthy}
                            unknown={cluster.nodes!.unknown}
                        />
                    ) : (
                        '-'
                    )
                },
            },
        ],
        []
    )

    if (!hasRisks) {
        return (
            <PageSection isWidthLimited>
                <AcmEmptyState
                    title={'You don’t have any policies applied to clusters'}
                    action={
                        <AcmButton component={Link} variant="primary" to={NavigationPath.policies}>
                            {'Go to policies'}
                        </AcmButton>
                    }
                />
            </PageSection>
        )
    }
    return (
        <PageSection isWidthLimited>
            <Stack hasGutter>
                <Split hasGutter>
                    <SplitItem>
                        <ClusterPolicyViolationCard risks={governanceData.clusterRisks} />
                    </SplitItem>
                    <SplitItem>
                        <PolicyViolationsCard risks={governanceData.policyRisks} />
                    </SplitItem>
                </Split>
                <Card>
                    <CardBody>
                        <Split hasGutter>
                            <SplitItem style={{ minWidth: 160, marginLeft: -8, marginTop: -6 }}>
                                <Select
                                    selections={group}
                                    isOpen={groupOpen}
                                    onToggle={setGroupOpen}
                                    onSelect={(_, v) => {
                                        setGroup(v as 'standards' | 'categories' | 'controls')
                                        setGroupOpen(false)
                                    }}
                                    isPlain
                                >
                                    <SelectOption value="categories">
                                        <b>Categories</b>
                                    </SelectOption>
                                    <SelectOption value="standards">
                                        <b>Standards</b>
                                    </SelectOption>
                                    <SelectOption value="controls">
                                        <b>Controls</b>
                                    </SelectOption>
                                </Select>
                            </SplitItem>
                            <SplitItem>
                                <div style={{ display: 'flex', columnGap: 48, rowGap: 16, flexWrap: 'wrap' }}>
                                    {(governanceData as unknown as Record<string, IPolicyGrouping>)[group].groups.map(
                                        (group) => {
                                            const hasRisks =
                                                group.policyRisks.high +
                                                    group.policyRisks.low +
                                                    group.policyRisks.medium +
                                                    group.policyRisks.synced +
                                                    group.policyRisks.unknown >
                                                0
                                            if (!hasRisks) return <Fragment />
                                            return (
                                                <Split hasGutter>
                                                    <SplitItem>
                                                        <span style={{ whiteSpace: 'nowrap' }}>{group.name}</span>
                                                    </SplitItem>
                                                    <PolicyViolationIcons risks={group.policyRisks} />
                                                </Split>
                                            )
                                        }
                                    )}
                                </div>
                            </SplitItem>
                        </Split>
                    </CardBody>
                </Card>
                <div>
                    <AcmTable<Cluster>
                        plural="clusters"
                        items={clusters}
                        columns={columns}
                        keyFn={mckeyFn}
                        key="managedClustersTable"
                    />
                </div>
            </Stack>
        </PageSection>
    )
}
