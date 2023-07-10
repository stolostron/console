/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons'
import _ from 'lodash'
import moment from 'moment'
import queryString from 'query-string'
import { useMemo } from 'react'
import { TFunction } from 'react-i18next'
import { generatePath, Link } from 'react-router-dom'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { AcmLabels } from '../../../ui-components'

export const getSearchDefinitions = (t: TFunction) => {
  return {
    application: {
      columns: [
        {
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: 'namespace',
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Topology'),
          cell: (item: any) => {
            return CreateApplicationTopologyLink(item, t)
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: 'namespace',
        },
        {
          header: t('Source'),
          sort: 'source',
          cell: 'source',
        },
        {
          header: t('Destination'),
          sort: 'destination',
          cell: 'destination',
        },
        {
          header: t('Type'),
          sort: 'type',
          cell: 'type',
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Available'),
          sort: 'ManagedClusterConditionAvailable',
          cell: 'ManagedClusterConditionAvailable',
        },
        {
          header: t('Hub accepted'),
          sort: 'HubAcceptedManagedCluster',
          cell: 'HubAcceptedManagedCluster',
        },
        {
          header: t('Joined'),
          sort: 'ManagedClusterJoined',
          cell: 'ManagedClusterJoined',
        },
        {
          header: t('Nodes'),
          sort: 'nodes',
          cell: 'nodes',
        },
        {
          header: t('Kubernetes version'),
          sort: 'kubernetesVersion',
          cell: 'kubernetesVersion',
        },
        {
          header: t('CPU'),
          sort: 'cpu',
          cell: 'cpu',
        },
        {
          header: t('Memory'),
          sort: 'memory',
          cell: 'memory',
        },
        {
          header: t('Console URL'),
          sort: 'consoleURL',
          cell: (item: any) => {
            return CreateExternalLink(item, t)
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: 'namespace',
        },
        {
          header: t('Cluster'),
          sort: 'cluster',
          cell: 'cluster',
        },
        {
          header: t('Type'),
          sort: 'type',
          cell: 'type',
        },
        {
          header: t('Pathname'),
          sort: 'pathname',
          cell: 'pathname',
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: 'namespace',
        },
        {
          header: t('Cluster'),
          sort: 'cluster',
          cell: 'cluster',
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: 'namespace',
        },
        {
          header: t('Cluster'),
          sort: 'cluster',
          cell: 'cluster',
        },
        {
          header: t('schedule'),
          sort: 'schedule',
          cell: 'schedule',
        },
        {
          header: t('Suspend'),
          sort: 'suspend',
          cell: 'suspend',
        },
        {
          header: t('Active'),
          sort: 'active',
          cell: 'active',
        },
        {
          header: t('Last schedule'),
          sort: 'lastSchedule',
          cell: (item: any) => {
            return GetAge(item, 'lastSchedule')
          },
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: 'namespace',
        },
        {
          header: t('Cluster'),
          sort: 'cluster',
          cell: 'cluster',
        },
        {
          header: t('Desired'),
          sort: 'desired',
          cell: 'desired',
        },
        {
          header: t('Current'),
          sort: 'current',
          cell: 'current',
        },
        {
          header: t('Ready'),
          sort: 'ready',
          cell: 'ready',
        },
        {
          header: t('Updated'),
          sort: 'updated',
          cell: 'updated',
        },
        {
          header: t('Available'),
          sort: 'available',
          cell: 'available',
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: 'namespace',
        },
        {
          header: t('Chart URL'),
          sort: 'chartUrl',
          cell: 'chartUrl',
        },
        {
          header: t('Dependencies'),
          sort: 'dependencies',
          cell: 'dependencies',
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: 'namespace',
        },
        {
          header: t('Cluster'),
          sort: 'cluster',
          cell: 'cluster',
        },
        {
          header: t('Desired'),
          sort: 'desired',
          cell: 'desired',
        },
        {
          header: t('Current'),
          sort: 'current',
          cell: 'current',
        },
        {
          header: t('Ready'),
          sort: 'ready',
          cell: 'ready',
        },
        {
          header: t('Available'),
          sort: 'available',
          cell: 'available',
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: (item: any) => {
            return item?.namespace ?? '-'
          },
        },
        {
          header: t('Cluster'),
          sort: 'cluster',
          cell: 'cluster',
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: 'namespace',
        },
        {
          header: t('Cluster'),
          sort: 'cluster',
          cell: 'cluster',
        },
        {
          header: t('Source type'),
          sort: 'sourceType',
          cell: 'sourceType',
        },
        {
          header: t('URL'),
          sort: 'url',
          cell: 'url',
        },
        {
          header: t('Chart path'),
          sort: 'chartPath',
          cell: 'chartPath',
        },
        {
          header: t('Branch'),
          sort: 'branch',
          cell: 'branch',
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: 'namespace',
        },
        {
          header: t('Cluster'),
          sort: 'cluster',
          cell: 'cluster',
        },
        {
          header: t('Completions'),
          sort: 'completions',
          cell: 'completions',
        },
        {
          header: t('Parallelism'),
          sort: 'parallelism',
          cell: 'parallelism',
        },
        {
          header: t('Successful'),
          sort: 'successful',
          cell: 'successful',
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Cluster'),
          sort: 'cluster',
          cell: 'cluster',
        },
        {
          header: t('Status'),
          sort: 'status',
          cell: 'status',
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Cluster'),
          sort: 'cluster',
          cell: 'cluster',
        },
        {
          header: t('Role'),
          sort: 'role',
          cell: 'role',
        },
        {
          header: t('Architecture'),
          sort: 'architecture',
          cell: 'architecture',
        },
        {
          header: t('OS image'),
          sort: 'osImage',
          cell: 'osImage',
        },
        {
          header: t('CPU'),
          sort: 'cpu',
          cell: 'cpu',
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Cluster'),
          sort: 'cluster',
          cell: 'cluster',
        },
        {
          header: t('Type'),
          sort: 'type',
          cell: 'type',
        },
        {
          header: t('Status'),
          sort: 'status',
          cell: 'status',
        },
        {
          header: t('Capacity'),
          sort: 'capacity',
          cell: 'capacity',
        },
        {
          header: t('Access mode'),
          sort: 'accessMode',
          cell: 'accessMode',
        },
        {
          header: t('Claim'),
          sort: 'claimRef',
          cell: 'claimRef',
        },
        {
          header: t('Reclaim policy'),
          sort: 'reclaimPolicy',
          cell: 'reclaimPolicy',
        },
        {
          header: t('Path'),
          sort: 'path',
          cell: 'path',
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: 'namespace',
        },
        {
          header: t('Cluster'),
          sort: 'cluster',
          cell: 'cluster',
        },
        {
          header: t('Status'),
          sort: 'status',
          cell: 'status',
        },
        {
          header: t('Persistent volume'),
          sort: 'volumeName',
          cell: 'volumeName',
        },
        {
          header: t('Requests'),
          sort: 'request',
          cell: 'request',
        },
        {
          header: t('Access mode'),
          sort: 'accessMode',
          cell: 'accessMode',
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: 'namespace',
        },
        {
          header: 'Subjects',
          sort: 'subjects',
          cell: 'subjects',
        },
        {
          header: t('Placement policy'),
          sort: 'placementpolicy',
          cell: 'placementpolicy',
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: 'namespace',
        },
        {
          header: t('Replicas'),
          sort: 'replicas',
          cell: 'replicas',
        },
        {
          header: t('Decisions'),
          sort: 'decisions',
          cell: 'decisions',
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: 'namespace',
        },
        {
          header: t('Cluster'),
          sort: 'cluster',
          cell: 'cluster',
        },
        {
          header: t('Replicas'),
          sort: 'replicas',
          cell: 'replicas',
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: 'namespace',
        },
        {
          header: t('Cluster'),
          sort: 'cluster',
          cell: 'cluster',
        },
        {
          header: t('Status'),
          sort: 'status',
          cell: 'status',
        },
        {
          header: t('Restarts'),
          sort: 'restarts',
          cell: 'restarts',
        },
        {
          header: t('Host IP'),
          sort: 'hostIP',
          cell: 'hostIP',
        },
        {
          header: t('Pod IP'),
          sort: 'podIP',
          cell: 'podIP',
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: 'namespace',
        },
        {
          header: t('Cluster'),
          sort: 'cluster',
          cell: 'cluster',
        },
        {
          header: 'Disabled',
          sort: 'disabled',
          cell: 'disabled',
        },
        {
          header: t('Violations'),
          sort: 'compliant',
          cell: (item: any) => {
            switch (item.compliant) {
              case 'Compliant':
                return (
                  <div>
                    <CheckCircleIcon color="var(--pf-global--success-color--100)" /> {t('Without violations')}
                  </div>
                )
              case 'NonCompliant':
                return (
                  <div>
                    <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" /> {t('With violations')}
                  </div>
                )
              default:
                return '-'
            }
          },
        },
        {
          header: t('Remediation action'),
          sort: 'remediationAction',
          cell: 'remediationAction',
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Scope'),
          sort: 'scope',
          cell: 'scope',
          tooltip: t('Scope refers to the cluster associated to the PolicyReport.'),
        },
        {
          header: t('Critical'),
          sort: 'critical',
          cell: 'critical',
        },
        {
          header: t('Important'),
          sort: 'important',
          cell: 'important',
        },
        {
          header: t('Moderate'),
          sort: 'moderate',
          cell: 'moderate',
        },
        {
          header: t('Low'),
          sort: 'low',
          cell: 'low',
        },
        {
          header: t('Rules'),
          cell: (item: any) => {
            return FormatPolicyReportPolicies(item)
          },
          tooltip: t('Use the rules filter to search for PolicyReports that contain a specific rule.'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: 'namespace',
        },
        {
          header: t('Cluster'),
          sort: 'cluster',
          cell: 'cluster',
        },
        {
          header: t('Status'),
          sort: 'status',
          cell: 'status',
        },
        {
          header: t('Chart name'),
          sort: 'chartName',
          cell: 'chartName',
        },
        {
          header: t('Chart version'),
          sort: 'chartVersion',
          cell: 'chartVersion',
        },
        {
          header: t('Updated'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: 'namespace',
        },
        {
          header: t('Cluster'),
          sort: 'cluster',
          cell: 'cluster',
        },
        {
          header: t('Desired'),
          sort: 'desired',
          cell: 'desired',
        },
        {
          header: t('Current'),
          sort: 'current',
          cell: 'current',
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: 'namespace',
        },
        {
          header: t('Cluster'),
          sort: 'cluster',
          cell: 'cluster',
        },
        {
          header: t('Type'),
          sort: 'type',
          cell: 'type',
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: 'namespace',
        },
        {
          header: t('Cluster'),
          sort: 'cluster',
          cell: 'cluster',
        },
        {
          header: t('Type'),
          sort: 'type',
          cell: 'type',
        },
        {
          header: t('Cluster IP'),
          sort: 'clusterIP',
          cell: 'clusterIP',
        },
        {
          header: t('Port'),
          sort: 'port',
          cell: 'port',
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: 'namespace',
        },
        {
          header: t('Cluster'),
          sort: 'cluster',
          cell: 'cluster',
        },
        {
          header: t('Desired'),
          sort: 'desired',
          cell: 'desired',
        },
        {
          header: t('Current'),
          sort: 'current',
          cell: 'current',
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Labels'),
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
          header: t('Name'),
          sort: 'name',
          cell: (item: any) => {
            return CreateDetailsLink(item)
          },
        },
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: 'namespace',
        },
        {
          header: t('Cluster'),
          sort: 'cluster',
          cell: 'cluster',
        },
        {
          header: t('Package'),
          sort: 'package',
          cell: 'package',
        },
        {
          header: t('Status'),
          sort: 'status',
          cell: 'status',
        },
        {
          header: t('Local placement'),
          sort: 'localPlacement',
          cell: 'localPlacement',
        },
        {
          header: t('Time window'),
          sort: 'timeWindow',
          cell: 'timeWindow',
        },
        {
          header: t('Created'),
          sort: 'created',
          cell: (item: any) => {
            return GetAge(item, 'created')
          },
        },
        {
          header: t('Labels'),
          sort: 'label',
          cell: (item: any) => {
            return FormatLabels(item)
          },
        },
      ],
    },
  }
}
export const useSearchDefinitions = () => {
  const { t } = useTranslation()

  return useMemo(() => getSearchDefinitions(t), [t])
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
  switch (item.kind.toLowerCase()) {
    case 'cluster':
      return (
        <Link to={generatePath(NavigationPath.clusterOverview, { name: item.name, namespace: item.name })}>
          {item.name}
        </Link>
      )
    case 'application': {
      const { apigroup, applicationSet, cluster, name, namespace, kind } = item
      if (apigroup === 'app.k8s.io' || apigroup === 'argoproj.io') {
        // only redirect to apps page if it is an ACM application
        const params = queryString.stringify({
          apiVersion: `${kind}.${apigroup}`.toLowerCase(),
          cluster: cluster === 'local-cluster' ? undefined : cluster,
          applicationset: applicationSet == null ? undefined : applicationSet,
        })
        return (
          <Link
            to={{
              pathname: generatePath(NavigationPath.applicationOverview, {
                namespace,
                name,
              }),
              search: `?${params}`,
            }}
          >
            {name}
          </Link>
        )
      }
      return (
        <Link
          to={{
            pathname: NavigationPath.resources,
            search: GetUrlSearchParam(item),
            state: {
              from: NavigationPath.search,
              fromSearch: window.location.search,
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
      if (
        item._hubClusterResource &&
        item.apigroup === 'policy.open-cluster-management.io' &&
        !item.label?.includes('policy.open-cluster-management.io/root-policy') // only go to Policies page for non-propagated Policies
      ) {
        return (
          <Link to={generatePath(NavigationPath.policyDetails, { name: item.name, namespace: item.namespace })}>
            {item.name}
          </Link>
        )
      }
      return (
        <Link
          to={{
            pathname: NavigationPath.resources,
            search: GetUrlSearchParam(item),
            state: {
              from: NavigationPath.search,
              fromSearch: window.location.search,
            },
          }}
        >
          {item.name}
        </Link>
      )
    case 'policyreport':
      return (
        <Link
          to={{
            pathname: generatePath(NavigationPath.clusterOverview, {
              name: item.namespace,
              namespace: item.namespace,
            }),
            search: `?${encodeURIComponent('showClusterIssues=true')}`,
          }}
        >
          {item.name}
        </Link>
      )
    default:
      return (
        <Link
          to={{
            pathname: NavigationPath.resources,
            search: GetUrlSearchParam(item),
            state: {
              from: NavigationPath.search,
              fromSearch: window.location.search,
            },
          }}
        >
          {item.name}
        </Link>
      )
  }
}

export function CreateApplicationTopologyLink(item: any, t: TFunction) {
  if (item.apiversion && item.apigroup) {
    const apiversion = encodeURIComponent(`${item.kind}.${item.apigroup}`.toLowerCase())
    const link = {
      pathname: generatePath(NavigationPath.applicationTopology, { name: item.name, namespace: item.namespace }),
      search: `?apiVersion=${apiversion}`,
    }
    return <Link to={link}>{t('View topology')}</Link>
  }
  return '-'
}

export function CreateExternalLink(item: any, t: TFunction) {
  if (item.consoleURL) {
    return (
      <a target="_blank" rel="noopener noreferrer" href={`${item.consoleURL}`}>
        {t('Launch')}
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
    return <AcmLabels labels={policyArray} collapse={policiesToHide} />
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
