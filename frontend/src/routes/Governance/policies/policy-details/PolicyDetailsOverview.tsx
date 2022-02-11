/* Copyright Contributors to the Open Cluster Management project */
import { Alert, LabelGroup, PageSection, Split, SplitItem, Stack, Text, TextVariants } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { AcmDescriptionList, AcmTable } from '@stolostron/ui-components'
import _ from 'lodash'
import moment from 'moment'
import { Fragment, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { placementBindingsState, placementRulesState, placementsState } from '../../../../atoms'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { Placement, PlacementBinding, PlacementRule, PlacementRuleStatus, Policy } from '../../../../resources'
import { Metadata } from '../../../../resources/metadata'
import { Selector } from '../../../../resources/selector'
import {
    getPlacementBindingsForResource,
    getPlacementRulesForResource,
    getPlacementsForResource,
} from '../../common/util'
import { ClusterPolicyViolationIcons } from '../../components/ClusterPolicyViolations'
import { useGovernanceData } from '../../useGovernanceData'

interface PlacementTableData {
    clusterLabels: Selector
    metadata: Metadata
    raw: PlacementRule | Placement
    status: PlacementRuleStatus
    policy: Policy
}

function renderPlacementTable(policy: Policy) {
    const { t } = useTranslation()
    const [placements] = useRecoilState(placementsState)
    const [placementBindings] = useRecoilState(placementBindingsState)
    const [placementRules] = useRecoilState(placementRulesState)
    const placementRuleMatches: PlacementTableData[] = useMemo(() => {
        const bindings: PlacementBinding[] = getPlacementBindingsForResource(policy, placementBindings)
        const placementRuleMatches: PlacementRule[] = getPlacementRulesForResource(policy, bindings, placementRules)
        return placementRuleMatches.map((rule: PlacementRule) => {
            return {
                clusterLabels: rule.spec.clusterSelector ?? {},
                metadata: rule.metadata,
                raw: rule,
                status: rule.status ?? {},
                policy,
            }
        })
    }, [placementBindings, placementRules, policy])

    const placementMatches: PlacementTableData[] = useMemo(() => {
        const bindings: PlacementBinding[] = getPlacementBindingsForResource(policy, placementBindings)
        const placementMatches: Placement[] = getPlacementsForResource(policy, bindings, placements)
        return placementMatches.map((placement: Placement) => {
            return {
                clusterLabels: {}, // TODO
                metadata: placement.metadata,
                raw: placement,
                status: {}, // TODO
                policy,
            }
        })
    }, [placementBindings, placements, policy])

    const placementCols = useMemo(
        () => [
            {
                header: 'Cluster selector',
                cell: (item: any) => {
                    const labels = _.get(item, 'clusterLabels')
                    if (!labels || Object.keys(labels).length === 0) {
                        return '-'
                    }
                    return _.map(labels, (_, key) => {
                        return <p key={key}>{`${key}=${JSON.stringify(labels[key])}`}</p>
                    })
                },
            },
            {
                header: 'Clusters',
                cell: (item: any) => {
                    const decisions = _.get(item, 'status.decisions', undefined)
                    if (decisions) {
                        return decisions.map(
                            (decision: { clusterName: string; clusterNamespace: string }) => decision.clusterName
                        ).length
                    }
                    return 0
                },
            },
            {
                header: 'Compliance',
                cell: (item: any) => {
                    // Gather full cluster list from placementPolicy status
                    const fullClusterList = _.get(item, 'status.decisions', [])
                    // Gather status list from policy status
                    const rawStatusList = _.get(item, 'policy.status.status', [])
                    // Build lists of clusters, organized by status keys
                    const clusterList: Record<string, Set<string>> = {}
                    _.forEach(fullClusterList, (clusterObj) => {
                        const cluster = clusterObj.clusterNamespace
                        const statusObject = _.filter(rawStatusList, (status) => status.clusternamespace === cluster)
                        // Log error if more than one status is returned since each cluster name should be unique
                        if (statusObject.length > 1) {
                            console.error(`Expected one cluster but got ${statusObject.length}:`, statusObject)
                            // Push a new cluster object if there is no status found
                        } else if (statusObject.length === 0) {
                            statusObject.push({ clusternamespace: cluster })
                        }
                        const compliant = _.get(statusObject[0], 'compliant', 'nostatus').toLowerCase()
                        const clusterNamespace = _.get(statusObject[0], 'clusternamespace')
                        // Add cluster to its associated status list in the clusterList object
                        if (Object.prototype.hasOwnProperty.call(clusterList, compliant)) {
                            // Each cluster name should be unique, so if one is already present, log an error
                            if (clusterList[compliant].has(clusterNamespace)) {
                                console.error(
                                    `Unexpected duplicate cluster in '${compliant}' cluster list: ${clusterNamespace}`
                                )
                            } else {
                                clusterList[compliant].add(clusterNamespace)
                            }
                        } else {
                            clusterList[compliant] = new Set([clusterNamespace])
                        }
                    })
                    // Push lists of clusters along with status icon, heading, and overflow badge
                    const statusList = []
                    for (const status of Object.keys(clusterList)) {
                        let statusMsg = ' No status: '
                        let icon = <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />
                        switch (status) {
                            case 'noncompliant':
                                statusMsg = ' NonCompliant: '
                                icon = <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />
                                break
                            case 'compliant':
                                statusMsg = ' Compliant: '
                                icon = <CheckCircleIcon color="var(--pf-global--success-color--100)" />
                                break
                        }
                        statusList.push(
                            <div key={`${status}-status-container`}>
                                <span key={`${status}-status-heading`}>
                                    <span>
                                        <span>{icon}</span>
                                        <span>{statusMsg}</span>
                                    </span>
                                </span>
                                <span key={`${status}-status-list`}>
                                    <LabelGroup
                                        collapsedText={t('show.more').replace(
                                            '{{number}}',
                                            (clusterList[status].size - 2).toString()
                                        )}
                                        expandedText={t('show.less')}
                                        numLabels={2}
                                    >
                                        {Array.from(clusterList[status]).map((cluster: string, index) => {
                                            // If there's no status, there's no point in linking to the status page
                                            let href = ''
                                            if (status !== 'nostatus') {
                                                href = NavigationPath.policyDetailsResults
                                                    .replace(':namespace', policy.metadata.namespace!)
                                                    .replace(':name', policy.metadata.name!)
                                            } else {
                                                href = NavigationPath.policyDetails
                                                    .replace(':namespace', policy.metadata.namespace!)
                                                    .replace(':name', policy.metadata.name!)
                                            }
                                            // Return links to status page, filtered by selected cluster
                                            return (
                                                <span key={`${cluster}-link`}>
                                                    <Link to={href}>
                                                        {cluster}
                                                        {index < clusterList[status].size - 1 && ', '}
                                                    </Link>
                                                </span>
                                            )
                                        })}
                                    </LabelGroup>
                                </span>
                            </div>
                        )
                    }
                    // If there are no clusters, return a hyphen
                    if (statusList.length === 0) {
                        return '-'
                    }
                    return statusList
                },
            },
        ],
        []
    )

    if (placementMatches.length > 0) {
        return (
            <AcmTable<PlacementTableData>
                key="cluster-placement-list"
                plural={'placements'}
                items={placementMatches}
                columns={placementCols}
                keyFn={(item) => item.metadata.uid!.toString()}
                autoHidePagination={true}
            />
        )
    } else if (placementMatches.length === 0 && placementRuleMatches.length > 0) {
        return (
            <AcmTable<PlacementTableData>
                key="cluster-placement-list"
                plural={'placements'}
                items={placementRuleMatches}
                columns={placementCols}
                keyFn={(item) => item.metadata.uid!.toString()}
                autoHidePagination={true}
            />
        )
    }
    return <Alert title={t('No placement selectors found')} isInline />
}

export default function PolicyDetailsOverview(props: { policy: Policy }) {
    const { policy } = props
    const { t } = useTranslation()

    const govData = useGovernanceData([policy])

    const { leftItems, rightItems } = useMemo(() => {
        const leftItems = [
            {
                key: 'Name',
                value: policy.metadata.name ?? '-',
            },
            {
                key: 'Namespace',
                value: policy.metadata.namespace,
            },
            {
                key: 'Status',
                value: policy.spec.disabled ? 'Disabled' : 'Enabled' ?? '-',
            },
            {
                key: 'Remediation',
                value: policy.spec.remediationAction ?? '-',
            },
            {
                key: 'Cluster violations',
                value: <ClusterPolicyViolationIcons risks={govData.clusterRisks} />,
            },
        ]
        const rightItems = [
            {
                key: 'Categories',
                value:
                    govData.categories.groups.map((group) => {
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
                                    <Text>{group.name}</Text>
                                </SplitItem>
                            </Split>
                        )
                    }) ?? '-',
            },
            {
                key: 'Controls',
                value:
                    govData.controls.groups.map((group) => {
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
                                    <Text>{group.name}</Text>
                                </SplitItem>
                            </Split>
                        )
                    }) ?? '-',
            },
            {
                key: 'Standards',
                value:
                    govData.standards.groups.map((group) => {
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
                                    <Text>{group.name}</Text>
                                </SplitItem>
                            </Split>
                        )
                    }) ?? '-',
            },
            {
                key: 'Created',
                value: moment(policy.metadata.creationTimestamp, 'YYYY-MM-DDTHH:mm:ssZ').fromNow(),
            },
            // TODO need to implement automation
            // {
            //     key: 'Automation',
            //     value: '-', // react node (link)
            // },
        ]
        return { leftItems, rightItems }
    }, [policy])

    return (
        <PageSection>
            <Stack hasGutter>
                <div id="compliance.details">
                    <AcmDescriptionList title={t('Policy details')} leftItems={leftItems} rightItems={rightItems} />
                </div>
                <div>
                    <Text
                        component={TextVariants.h5}
                        style={{
                            fontWeight: '700',
                        }}
                    >
                        {t('Placement')}
                    </Text>
                    {renderPlacementTable(policy)}
                </div>
            </Stack>
        </PageSection>
    )
}
