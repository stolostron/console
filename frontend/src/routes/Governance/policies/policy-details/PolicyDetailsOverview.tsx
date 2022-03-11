/* Copyright Contributors to the Open Cluster Management project */
import { Alert, LabelGroup, PageSection, Stack, Text, TextVariants } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { AcmDescriptionList, AcmTable } from '@stolostron/ui-components'
import moment from 'moment'
import { useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import {
    placementBindingsState,
    placementDecisionsState,
    placementRulesState,
    placementsState,
    policyAutomationState,
    policySetsState,
} from '../../../../atoms'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import {
    Placement,
    PlacementDecision,
    PlacementDecisionStatus,
    PlacementRule,
    PlacementRuleStatus,
    Policy,
    PolicyAutomation,
    PolicySet,
} from '../../../../resources'
import { Metadata } from '../../../../resources/metadata'
import { getPlacementDecisionsForPlacements, getPlacementsForResource } from '../../common/util'
import { ClusterPolicyViolationIcons } from '../../components/ClusterPolicyViolations'
import { useGovernanceData } from '../../useGovernanceData'

interface TableData {
    apiVersion: string
    kind: string
    metadata: Metadata
    status: PlacementRuleStatus | PlacementDecisionStatus
    policy: Policy
}

export default function PolicyDetailsOverview(props: { policy: Policy }) {
    const { policy } = props
    const { t } = useTranslation()
    const [placements] = useRecoilState(placementsState)
    const [policySets] = useRecoilState(policySetsState)
    const [placementBindings] = useRecoilState(placementBindingsState)
    const [placementRules] = useRecoilState(placementRulesState)
    const [placementDecisions] = useRecoilState(placementDecisionsState)
    const [policyAutomations] = useRecoilState(policyAutomationState)
    const govData = useGovernanceData([policy])
    const clusterRiskScore =
        govData.clusterRisks.high +
        govData.clusterRisks.medium +
        govData.clusterRisks.low +
        govData.clusterRisks.unknown +
        govData.clusterRisks.synced
    const policyAutomationMatch = policyAutomations.find(
        (pa: PolicyAutomation) => pa.spec.policyRef === policy.metadata.name
    )

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
                value:
                    clusterRiskScore > 0 ? (
                        <ClusterPolicyViolationIcons risks={govData.clusterRisks} />
                    ) : (
                        <div>
                            <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" /> {'No status'}
                        </div>
                    ),
            },
        ]
        const rightItems = [
            {
                key: 'Categories',
                value: policy.metadata.annotations?.['policy.open-cluster-management.io/categories'] ?? '-',
            },
            {
                key: 'Controls',
                value: policy.metadata.annotations?.['policy.open-cluster-management.io/controls'] ?? '-',
            },
            {
                key: 'Standards',
                value: policy.metadata.annotations?.['policy.open-cluster-management.io/standards'] ?? '-',
            },
            {
                key: 'Created',
                value: moment(policy.metadata.creationTimestamp, 'YYYY-MM-DDTHH:mm:ssZ').fromNow(),
            },
            {
                key: 'Automation',
                value: policyAutomationMatch ? (
                    <Link
                        to={{
                            pathname: NavigationPath.editPolicyAutomation
                                .replace(':namespace', policy.metadata.namespace as string)
                                .replace(':name', policy.metadata.name as string),
                            state: {
                                from: NavigationPath.policyDetails
                                    .replace(':namespace', policy.metadata.namespace as string)
                                    .replace(':name', policy.metadata.name as string),
                            },
                        }}
                    >
                        {policyAutomationMatch.metadata.name}
                    </Link>
                ) : (
                    <Link
                        to={{
                            pathname: NavigationPath.createPolicyAutomation
                                .replace(':namespace', policy.metadata.namespace as string)
                                .replace(':name', policy.metadata.name as string),
                            state: {
                                from: NavigationPath.policyDetails
                                    .replace(':namespace', policy.metadata.namespace as string)
                                    .replace(':name', policy.metadata.name as string),
                            },
                        }}
                    >
                        {t('Configure')}
                    </Link>
                ),
            },
        ]
        return { leftItems, rightItems }
    }, [
        clusterRiskScore,
        govData.clusterRisks,
        policy.metadata.creationTimestamp,
        policy.metadata.name,
        policy.metadata.namespace,
        policy.metadata.annotations,
        policy.spec.disabled,
        policy.spec.remediationAction,
        policyAutomationMatch,
        t,
    ])

    // Need to get bindings for all policysets a policy is included in
    const associatedPolicySets = policySets.filter(
        (ps: PolicySet) =>
            ps.metadata.namespace === policy.metadata.namespace && ps.spec.policies.includes(policy.metadata.name!)
    )

    const getPlacementMatches = useCallback(
        function getPlacementMatches<T extends Placement | PlacementRule>(
            policy: Policy,
            placementResources: T[],
            placementDecisions: PlacementDecision[]
        ) {
            let matches: T[] = []
            const resources: any[] = [policy]
            if (associatedPolicySets.length > 0) {
                resources.push(...associatedPolicySets)
            }
            resources.forEach(
                (resource: Policy | PolicySet) =>
                    (matches = [
                        ...matches,
                        ...getPlacementsForResource(resource, placementBindings, placementResources),
                    ])
            )
            return matches.map((placement: T) => {
                if (placement.kind === 'Placement') {
                    const decisions = getPlacementDecisionsForPlacements(placementDecisions, [placement])[0]?.status
                    return {
                        apiVersion: placement.apiVersion,
                        kind: placement.kind,
                        metadata: placement.metadata,
                        status: decisions ?? {},
                        policy,
                    }
                }
                return {
                    apiVersion: placement.apiVersion,
                    kind: placement.kind,
                    metadata: placement.metadata,
                    status: placement.status ?? {},
                    policy,
                }
            })
        },
        [associatedPolicySets, placementBindings]
    )

    const placementRuleMatches: TableData[] = useMemo(() => {
        return getPlacementMatches(policy, placementRules, [])
    }, [getPlacementMatches, placementRules, policy])

    const placementMatches: TableData[] = useMemo(() => {
        return getPlacementMatches(policy, placements, placementDecisions)
    }, [getPlacementMatches, policy, placements, placementDecisions])

    const placementCols = useMemo(
        () => [
            {
                header: 'Name',
                cell: 'metadata.name',
                sort: 'metadata.name',
            },
            {
                header: 'Kind',
                cell: 'kind',
                sort: 'kind',
            },
            {
                header: 'Clusters',
                cell: (item: TableData) => {
                    const decisions = item.status.decisions ?? undefined
                    if (decisions) {
                        return decisions.map((decision: { clusterName: string }) => decision.clusterName).length
                    }
                    return 0
                },
            },
            {
                header: 'Violations',
                cell: (item: TableData) => {
                    // Gather full cluster list from placementPolicy status
                    const fullClusterList = item.status.decisions ?? []
                    // Gather status list from policy status
                    const rawStatusList: {
                        clustername: string
                        compliant: string
                    }[] = item.policy.status?.status ?? []
                    // Build lists of clusters, organized by status keys
                    const clusterList: Record<string, Set<string>> = {}
                    fullClusterList.forEach((clusterObj) => {
                        const statusObject = rawStatusList.filter(
                            (status) => status.clustername === clusterObj.clusterName
                        )
                        // Log error if more than one status is returned since each cluster name should be unique
                        if (statusObject.length > 1) {
                            console.error(`Expected one cluster but got ${statusObject.length}:`, statusObject)
                        } else if (statusObject.length === 0) {
                            // Push a new cluster object if there is no status found
                            statusObject.push({
                                clustername: clusterObj.clusterName,
                                compliant: 'nostatus',
                            })
                        }
                        let compliant = statusObject[0].compliant ?? 'nostatus'
                        compliant = compliant.toLowerCase()
                        const clusterName = statusObject[0].clustername
                        // Add cluster to its associated status list in the clusterList object
                        if (Object.prototype.hasOwnProperty.call(clusterList, compliant)) {
                            // Each cluster name should be unique, so if one is already present, log an error
                            if (clusterList[compliant].has(clusterName)) {
                                console.error(
                                    `Unexpected duplicate cluster in '${compliant}' cluster list: ${clusterName}`
                                )
                            } else {
                                clusterList[compliant].add(clusterName)
                            }
                        } else {
                            clusterList[compliant] = new Set([clusterName])
                        }
                    })
                    // Push lists of clusters along with status icon, heading, and overflow badge
                    const statusList = []
                    for (const status of Object.keys(clusterList)) {
                        let statusMsg = ' No status: '
                        let icon = <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />
                        switch (status) {
                            case 'noncompliant':
                                statusMsg = ' With violations: '
                                icon = <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />
                                break
                            case 'compliant':
                                statusMsg = ' Without violations: '
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
                        return (
                            <div>
                                <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />{' '}
                                {t('No status')}
                            </div>
                        )
                    }
                    return statusList
                },
            },
        ],
        [policy.metadata.name, policy.metadata.namespace, t]
    )

    return (
        <PageSection>
            <Stack hasGutter>
                <div id="violation.details">
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
                    {placementMatches.length > 0 || placementRuleMatches.length > 0 ? (
                        <AcmTable<TableData>
                            key="cluster-placement-list"
                            plural={'placements'}
                            items={[...placementMatches, ...placementRuleMatches]}
                            columns={placementCols}
                            keyFn={(item) => item.metadata.uid!.toString()}
                            autoHidePagination={true}
                        />
                    ) : (
                        <Alert title={t('No placement selectors found')} isInline />
                    )}
                </div>
            </Stack>
        </PageSection>
    )
}
