/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { Label, LabelGroup } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons'
import { AcmLabels } from '@stolostron/ui-components'
import _ from 'lodash'
import moment from 'moment'
import queryString from 'query-string'
import { Link } from 'react-router-dom'
import { NavigationPath } from '../../../NavigationPath'

const searchDefinitions: any = {
    application: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Namespace',
                sort: 'namespace',
                cell: 'namespace',
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Topology',
                cell: (item: any) => {
                    return CreateApplicationTopologyLink(item)
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    applicationrelationship: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Namespace',
                sort: 'namespace',
                cell: 'namespace',
            },
            {
                header: 'Source',
                sort: 'source',
                cell: 'source',
            },
            {
                header: 'Destination',
                sort: 'destination',
                cell: 'destination',
            },
            {
                header: 'Type',
                sort: 'type',
                cell: 'type',
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    cluster: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Available',
                sort: 'ManagedClusterConditionAvailable',
                cell: 'ManagedClusterConditionAvailable',
            },
            {
                header: 'Hub accepted',
                sort: 'HubAcceptedManagedCluster',
                cell: 'HubAcceptedManagedCluster',
            },
            {
                header: 'Joined',
                sort: 'ManagedClusterJoined',
                cell: 'ManagedClusterJoined',
            },
            {
                header: 'Nodes',
                sort: 'nodes',
                cell: 'nodes',
            },
            {
                header: 'Kubernetes version',
                sort: 'kubernetesVersion',
                cell: 'kubernetesVersion',
            },
            {
                header: 'CPU',
                sort: 'cpu',
                cell: 'cpu',
            },
            {
                header: 'Memory',
                sort: 'memory',
                cell: 'memory',
            },
            {
                header: 'Console URL',
                sort: 'consoleURL',
                cell: (item: any) => {
                    return CreateExternalLink(item)
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    channel: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Namespace',
                sort: 'namespace',
                cell: 'namespace',
            },
            {
                header: 'Cluster',
                sort: 'cluster',
                cell: 'cluster',
            },
            {
                header: 'Type',
                sort: 'type',
                cell: 'type',
            },
            {
                header: 'Pathname',
                sort: 'pathname',
                cell: 'pathname',
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    configmap: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Namespace',
                sort: 'namespace',
                cell: 'namespace',
            },
            {
                header: 'Cluster',
                sort: 'cluster',
                cell: 'cluster',
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    cronjob: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Namespace',
                sort: 'namespace',
                cell: 'namespace',
            },
            {
                header: 'Cluster',
                sort: 'cluster',
                cell: 'cluster',
            },
            {
                header: 'schedule',
                sort: 'schedule',
                cell: 'schedule',
            },
            {
                header: 'Suspend',
                sort: 'suspend',
                cell: 'suspend',
            },
            {
                header: 'Active',
                sort: 'active',
                cell: 'active',
            },
            {
                header: 'Last schedule',
                sort: 'lastSchedule',
                cell: (item: any) => {
                    return GetAge(item, 'lastSchedule')
                },
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    daemonset: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Namespace',
                sort: 'namespace',
                cell: 'namespace',
            },
            {
                header: 'Cluster',
                sort: 'cluster',
                cell: 'cluster',
            },
            {
                header: 'Desired',
                sort: 'desired',
                cell: 'desired',
            },
            {
                header: 'Current',
                sort: 'current',
                cell: 'current',
            },
            {
                header: 'Ready',
                sort: 'ready',
                cell: 'ready',
            },
            {
                header: 'Updated',
                sort: 'updated',
                cell: 'updated',
            },
            {
                header: 'Available',
                sort: 'available',
                cell: 'available',
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    deployable: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Namespace',
                sort: 'namespace',
                cell: 'namespace',
            },
            {
                header: 'Chart URL',
                sort: 'chartUrl',
                cell: 'chartUrl',
            },
            {
                header: 'Dependencies',
                sort: 'dependencies',
                cell: 'dependencies',
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    deployment: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Namespace',
                sort: 'namespace',
                cell: 'namespace',
            },
            {
                header: 'Cluster',
                sort: 'cluster',
                cell: 'cluster',
            },
            {
                header: 'Desired',
                sort: 'desired',
                cell: 'desired',
            },
            {
                header: 'Current',
                sort: 'current',
                cell: 'current',
            },
            {
                header: 'Ready',
                sort: 'ready',
                cell: 'ready',
            },
            {
                header: 'Available',
                sort: 'available',
                cell: 'available',
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    genericresource: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Namespace',
                sort: 'namespace',
                cell: 'namespace',
            },
            {
                header: 'Cluster',
                sort: 'cluster',
                cell: 'cluster',
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    helmrelease: {
        // This is the Application Helm CR.
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Namespace',
                sort: 'namespace',
                cell: 'namespace',
            },
            {
                header: 'Cluster',
                sort: 'cluster',
                cell: 'cluster',
            },
            {
                header: 'Source type',
                sort: 'sourceType',
                cell: 'sourceType',
            },
            {
                header: 'URL',
                sort: 'url',
                cell: 'url',
            },
            {
                header: 'Chart path',
                sort: 'chartPath',
                cell: 'chartPath',
            },
            {
                header: 'Branch',
                sort: 'branch',
                cell: 'branch',
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    job: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Namespace',
                sort: 'namespace',
                cell: 'namespace',
            },
            {
                header: 'Cluster',
                sort: 'cluster',
                cell: 'cluster',
            },
            {
                header: 'Completions',
                sort: 'completions',
                cell: 'completions',
            },
            {
                header: 'Parallelism',
                sort: 'parallelism',
                cell: 'parallelism',
            },
            {
                header: 'Successful',
                sort: 'successful',
                cell: 'successful',
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    namespace: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Cluster',
                sort: 'cluster',
                cell: 'cluster',
            },
            {
                header: 'Status',
                sort: 'status',
                cell: 'status',
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    node: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Cluster',
                sort: 'cluster',
                cell: 'cluster',
            },
            {
                header: 'Role',
                sort: 'role',
                cell: 'role',
            },
            {
                header: 'Architecture',
                sort: 'architecture',
                cell: 'architecture',
            },
            {
                header: 'OS image',
                sort: 'osImage',
                cell: 'osImage',
            },
            {
                header: 'CPU',
                sort: 'cpu',
                cell: 'cpu',
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    persistentvolume: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Cluster',
                sort: 'cluster',
                cell: 'cluster',
            },
            {
                header: 'Type',
                sort: 'type',
                cell: 'type',
            },
            {
                header: 'Status',
                sort: 'status',
                cell: 'status',
            },
            {
                header: 'Capacity',
                sort: 'capacity',
                cell: 'capacity',
            },
            {
                header: 'Access mode',
                sort: 'accessMode',
                cell: 'accessMode',
            },
            {
                header: 'Claim',
                sort: 'claimRef',
                cell: 'claimRef',
            },
            {
                header: 'Reclaim policy',
                sort: 'reclaimPolicy',
                cell: 'reclaimPolicy',
            },
            {
                header: 'Path',
                sort: 'path',
                cell: 'path',
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    persistentvolumeclaim: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Namespace',
                sort: 'namespace',
                cell: 'namespace',
            },
            {
                header: 'Cluster',
                sort: 'cluster',
                cell: 'cluster',
            },
            {
                header: 'Status',
                sort: 'status',
                cell: 'status',
            },
            {
                header: 'Persistent volume',
                sort: 'volumeName',
                cell: 'volumeName',
            },
            {
                header: 'Requests',
                sort: 'request',
                cell: 'request',
            },
            {
                header: 'Access mode',
                sort: 'accessMode',
                cell: 'accessMode',
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    placementbinding: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Namespace',
                sort: 'namespace',
                cell: 'namespace',
            },
            {
                header: 'Subjects',
                sort: 'subjects',
                cell: 'subjects',
            },
            {
                header: 'Placement policy',
                sort: 'placementpolicy',
                cell: 'placementpolicy',
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    placementpolicy: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Namespace',
                sort: 'namespace',
                cell: 'namespace',
            },
            {
                header: 'Replicas',
                sort: 'replicas',
                cell: 'replicas',
            },
            {
                header: 'Decisions',
                sort: 'decisions',
                cell: 'decisions',
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    placementrule: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Namespace',
                sort: 'namespace',
                cell: 'namespace',
            },
            {
                header: 'Cluster',
                sort: 'cluster',
                cell: 'cluster',
            },
            {
                header: 'Replicas',
                sort: 'replicas',
                cell: 'replicas',
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    pod: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Namespace',
                sort: 'namespace',
                cell: 'namespace',
            },
            {
                header: 'Cluster',
                sort: 'cluster',
                cell: 'cluster',
            },
            {
                header: 'Status',
                sort: 'status',
                cell: 'status',
            },
            {
                header: 'Restarts',
                sort: 'restarts',
                cell: 'restarts',
            },
            {
                header: 'Host IP',
                sort: 'hostIP',
                cell: 'hostIP',
            },
            {
                header: 'Pod IP',
                sort: 'podIP',
                cell: 'podIP',
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    policy: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Namespace',
                sort: 'namespace',
                cell: 'namespace',
            },
            {
                header: 'Cluster',
                sort: 'cluster',
                cell: 'cluster',
            },
            {
                header: 'Disabled',
                sort: 'disabled',
                cell: 'disabled',
            },
            {
                header: 'Violations',
                sort: 'compliant',
                cell: (item: any) => {
                    switch (item.compliant) {
                        case 'Compliant':
                            return (
                                <div>
                                    <CheckCircleIcon color="var(--pf-global--success-color--100)" />{' '}
                                    {'Without violations'}
                                </div>
                            )
                        case 'NonCompliant':
                            return (
                                <div>
                                    <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />{' '}
                                    {'With violations'}
                                </div>
                            )
                        default:
                            return '-'
                    }
                },
            },
            {
                header: 'Remediation action',
                sort: 'remediationAction',
                cell: 'remediationAction',
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    policyreport: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Scope',
                sort: 'scope',
                cell: 'scope',
                tooltip: 'Scope refers to the cluster associated to the PolicyReport.',
            },
            {
                header: 'Critical',
                sort: 'critical',
                cell: 'critical',
            },
            {
                header: 'Important',
                sort: 'important',
                cell: 'important',
            },
            {
                header: 'Moderate',
                sort: 'moderate',
                cell: 'moderate',
            },
            {
                header: 'Low',
                sort: 'low',
                cell: 'low',
            },
            {
                header: 'Rules',
                cell: (item: any) => {
                    return FormatPolicyReportPolicies(item)
                },
                tooltip: `Use the rules filter to search for PolicyReports that contain a specific rule.`,
            },
            {
                header: 'Categories',
                cell: (item: any) => {
                    return FormatPolicyReportCategories(item.category)
                },
            },
        ],
    },
    release: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Namespace',
                sort: 'namespace',
                cell: 'namespace',
            },
            {
                header: 'Cluster',
                sort: 'cluster',
                cell: 'cluster',
            },
            {
                header: 'Status',
                sort: 'status',
                cell: 'status',
            },
            {
                header: 'Chart name',
                sort: 'chartName',
                cell: 'chartName',
            },
            {
                header: 'Chart version',
                sort: 'chartVersion',
                cell: 'chartVersion',
            },
            {
                header: 'Updated',
                sort: 'updated',
                cell: (item: any) => {
                    return GetAge(item, 'updated')
                },
            },
        ],
    },
    replicaset: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Namespace',
                sort: 'namespace',
                cell: 'namespace',
            },
            {
                header: 'Cluster',
                sort: 'cluster',
                cell: 'cluster',
            },
            {
                header: 'Desired',
                sort: 'desired',
                cell: 'desired',
            },
            {
                header: 'Current',
                sort: 'current',
                cell: 'current',
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    secret: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Namespace',
                sort: 'namespace',
                cell: 'namespace',
            },
            {
                header: 'Cluster',
                sort: 'cluster',
                cell: 'cluster',
            },
            {
                header: 'Type',
                sort: 'type',
                cell: 'type',
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    service: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Namespace',
                sort: 'namespace',
                cell: 'namespace',
            },
            {
                header: 'Cluster',
                sort: 'cluster',
                cell: 'cluster',
            },
            {
                header: 'Type',
                sort: 'type',
                cell: 'type',
            },
            {
                header: 'Cluster IP',
                sort: 'clusterIP',
                cell: 'clusterIP',
            },
            {
                header: 'Port',
                sort: 'port',
                cell: 'port',
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    statefulset: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Namespace',
                sort: 'namespace',
                cell: 'namespace',
            },
            {
                header: 'Cluster',
                sort: 'cluster',
                cell: 'cluster',
            },
            {
                header: 'Desired',
                sort: 'desired',
                cell: 'desired',
            },
            {
                header: 'Current',
                sort: 'current',
                cell: 'current',
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
    subscription: {
        columns: [
            {
                header: 'Name',
                sort: 'name',
                cell: (item: any) => {
                    return CreateDetailsLink(item)
                },
            },
            {
                header: 'Namespace',
                sort: 'namespace',
                cell: 'namespace',
            },
            {
                header: 'Cluster',
                sort: 'cluster',
                cell: 'cluster',
            },
            {
                header: 'Package',
                sort: 'package',
                cell: 'package',
            },
            {
                header: 'Status',
                sort: 'status',
                cell: 'status',
            },
            {
                header: 'Local placement',
                sort: 'localPlacement',
                cell: 'localPlacement',
            },
            {
                header: 'Time window',
                sort: 'timeWindow',
                cell: 'timeWindow',
            },
            {
                header: 'Created',
                sort: 'created',
                cell: (item: any) => {
                    return GetAge(item, 'created')
                },
            },
            {
                header: 'Labels',
                sort: 'label',
                cell: (item: any) => {
                    return FormatLabels(item)
                },
            },
        ],
    },
}

export function GetAge(item: any, key: string) {
    const createdTime = _.get(item, key)
    if (createdTime && createdTime.includes('T')) {
        return moment(createdTime, 'YYYY-MM-DDTHH:mm:ssZ').fromNow()
    } else if (createdTime) {
        return moment(createdTime, 'YYYY-MM-DD HH:mm:ss').fromNow()
    }
    return '-'
}

export const GetUrlSearchParam = (resource: any) => {
    let searchString = `cluster=${resource.cluster}`
    if (resource.kind) {
        searchString = `${searchString}&kind=${resource.kind}`
    }
    if (resource.apigroup && resource.apiversion) {
        searchString = `${searchString}&apiversion=${resource.apigroup}/${resource.apiversion}`
    } else if (!resource.apigroup && resource.apiversion) {
        searchString = `${searchString}&apiversion=${resource.apiversion}`
    }
    if (resource.namespace) {
        searchString = `${searchString}&namespace=${resource.namespace}`
    }
    if (resource.name) {
        searchString = `${searchString}&name=${resource.name}`
    }
    return `?${encodeURIComponent(searchString)}`
}

export function CreateDetailsLink(item: any) {
    switch (item.kind) {
        case 'cluster':
            return <a href={`/multicloud/infrastructure/clusters/details/${item.name}/overview`}>{item.name}</a>

        case 'application': {
            const { apigroup, applicationSet, cluster, name, namespace, kind } = item
            if (apigroup === 'app.k8s.io' || apigroup === 'argoproj.io') {
                // only redirect to apps page if it is an ACM application
                const params = queryString.stringify({
                    apiVersion: `${kind}.${apigroup}`,
                    cluster: cluster === 'local-cluster' ? undefined : cluster,
                    applicationset: applicationSet == null ? undefined : applicationSet,
                })
                return (
                    <a
                        href={`${NavigationPath.applicationTopology
                            .replace(':namespace', namespace)
                            .replace(':name', name)}?${params}`}
                    >
                        {name}
                    </a>
                )
            }
            return (
                <Link
                    to={{
                        pathname: '/multicloud/home/search/resources',
                        search: GetUrlSearchParam(item),
                        state: {
                            from: '/multicloud/home/search',
                        },
                    }}
                >
                    {item.name}
                </Link>
            )
        }
        case 'policy':
            // Redirects to the policy page if the policy is a hub cluster resource.
            // If the policy is not, it will redirect and just show the yaml.
            if (item._hubClusterResource && item.apigroup === 'policy.open-cluster-management.io') {
                return (
                    <a
                        href={NavigationPath.policyDetails
                            .replace(':namespace', item.namespace)
                            .replace(':name', item.name)}
                    >
                        {item.name}
                    </a>
                )
            }
            return (
                <Link
                    to={{
                        pathname: '/multicloud/home/search/resources',
                        search: GetUrlSearchParam(item),
                        state: {
                            from: '/multicloud/home/search',
                        },
                    }}
                >
                    {item.name}
                </Link>
            )
        case 'policyreport':
            return (
                <a
                    href={`/multicloud/infrastructure/clusters/details/${item.namespace}/overview?${encodeURIComponent(
                        'showClusterIssues=true'
                    )}`}
                >
                    {item.name}
                </a>
            )
        default:
            return (
                <Link
                    to={{
                        pathname: '/multicloud/home/search/resources',
                        search: GetUrlSearchParam(item),
                        state: {
                            from: '/multicloud/home/search',
                        },
                    }}
                >
                    {item.name}
                </Link>
            )
    }
}

export function CreateApplicationTopologyLink(item: any) {
    if (item.apiversion && item.apigroup) {
        const apiversion = encodeURIComponent(`${item.kind}.${item.apigroup}`)
        const link = `${NavigationPath.applicationTopology
            .replace(':namespace', item.namespace)
            .replace(':name', item.name)}?apiVersion=${apiversion}`
        return (
            <a href={link}>
                {/* TODO Not translating - caused issue: https://github.com/open-cluster-management/backlog/issues/9184 */}
                {'View topology'}
            </a>
        )
    }
    return '-'
}

export function CreateExternalLink(item: any) {
    if (item.consoleURL) {
        return (
            <a target="_blank" rel="noopener noreferrer" href={`${item.consoleURL}`}>
                {/* TODO Not translating - caused issue: https://github.com/open-cluster-management/backlog/issues/9184 */}
                {'Launch'}
            </a>
        )
    } else if (item.clusterip) {
        return item.clusterip
    }
    return '-'
}

export function FormatLabels(item: any) {
    if (item.label) {
        const labels = item.label.split('; ')
        const labelsToHide = labels.slice(3).map((l: string) => l.split('=')[0])
        return <AcmLabels labels={labels} collapse={labelsToHide} />
    }
    return '-'
}

export function FormatPolicyReportPolicies(item: any) {
    if (item.rules) {
        const policyArray = item.rules.split('; ')
        const policiesToHide = policyArray.slice(2)
        return (
            <LabelGroup collapsedText={`${policiesToHide.length} more`} expandedText={'Show less'} numLabels={2}>
                {policyArray.map((policy: any, index: number) => {
                    return (
                        <Label
                            style={{ backgroundColor: '#fff', padding: '0 .25rem 0 0' }}
                            key={policy}
                            render={({ content }) => (
                                <div>
                                    {content}
                                    {index < policyArray.length - 1 && ', '}
                                </div>
                            )}
                        >
                            {policy}
                        </Label>
                    )
                })}
            </LabelGroup>
        )
    }
    return '-'
}

export function FormatPolicyReportCategories(data: string) {
    if (data) {
        const dataArray = data.split('; ')
        const dataToHide = dataArray.slice(3)
        return <AcmLabels labels={dataArray} collapse={dataToHide} />
    }
    return '-'
}

export default searchDefinitions
