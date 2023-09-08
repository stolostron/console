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
        AddColumn('Name', t('Name')),
        AddColumn('Namespace', t('Namespace')),
        AddColumn('Created', t('Created')),
        {
          header: t('Topology'),
          cell: (item: any) => {
            return CreateApplicationTopologyLink(item, t)
          },
        },
        AddColumn('Labels', t('Labels')),
      ],
    },
    cluster: {
      columns: [
        AddColumn('Name', t('Name')),
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
        AddColumn('Nodes', t('Nodes')),
        {
          header: t('Kubernetes version'),
          sort: 'kubernetesVersion',
          cell: 'kubernetesVersion',
        },
        AddColumn('CPU', t('CPU')),
        AddColumn('Memory', t('Memory')),
        {
          header: t('Console URL'),
          sort: 'consoleURL',
          cell: (item: any) => {
            return CreateExternalLink(item, t)
          },
        },
        AddColumn('Labels', t('Labels')),
      ],
    },
    clusteroperator: {
      columns: AddDefaultColumns(t, [
        AddColumn('Version', t('Version')),
        AddColumn('Available', t('Available')),
        AddColumn('Progressing', t('Progressing')),
        AddColumn('Degraded', t('Degraded')),
      ]),
    },
    clusterserviceversion: {
      columns: AddDefaultColumns(t, [
        AddColumn('Version', t('Version')),
        AddColumn('Phase', t('Phase')),
        AddColumn('Display', t('Display')),
      ]),
    },
    channel: {
      columns: AddDefaultColumns(t, [
        AddColumn('Type', t('Type')),
        AddColumn('Pathname', t('Pathname')),
      ]),
    },
    cronjob: {
      columns: AddDefaultColumns(t, [
        AddColumn('Schedule', t('Schedule')),
        AddColumn('Suspend', t('Suspend')),
        AddColumn('Active', t('Active')),
        {
          header: t('Last schedule'),
          sort: 'lastSchedule',
          cell: (item: any) => {
            return GetAge(item, 'lastSchedule')
          },
        },
      ]),
    },
    daemonset: {
      columns: AddDefaultColumns(t, [
        AddColumn('Desired', t('Desired')),
        AddColumn('Current', t('Current')),
        AddColumn('Ready', t('Ready')),
        AddColumn('Updated', t('Updated')),
        AddColumn('Available', t('Available')),
      ]),
    },
    deployable: {
      columns: [
        AddColumn('Name', t('Name')),
        AddColumn('Namespace', t('Namespace')),
        {
          header: t('Chart URL'),
          sort: 'chartUrl',
          cell: 'chartUrl',
        },
        AddColumn('Dependencies', t('Dependencies')),
        AddColumn('Created', t('Created')),
        AddColumn('Labels', t('Labels')),
      ],
    },
    deployment: {
      columns: AddDefaultColumns(t, [
        AddColumn('Desired', t('Desired')),
        AddColumn('Current', t('Current')),
        AddColumn('Ready', t('Ready')),
        AddColumn('Available', t('Available')),
      ]),
    },
    genericresource: {
      columns: [
        AddColumn('Name', t('Name')),
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: (item: any) => {
            return item?.namespace ?? '-'
          },
        },
        AddColumn('Cluster', t('Cluster')),
        AddColumn('Created', t('Created')),
        AddColumn('Labels', t('Labels')),
      ],
    },
    helmrelease: {
      // This is the Application Helm CR.
      columns: AddDefaultColumns(t, [
        {
          header: t('Source type'),
          sort: 'sourceType',
          cell: 'sourceType',
        },
        AddColumn('URL', t('URL')),
        {
          header: t('Chart path'),
          sort: 'chartPath',
          cell: 'chartPath',
        },
        AddColumn('Branch', t('Branch')),
      ]),
    },
    job: {
      columns: AddDefaultColumns(t, [
        AddColumn('Completions', t('Completions')),
        AddColumn('Parallelism', t('Parallelism')),
        AddColumn('Successful', t('Successful')),
      ]),
    },
    namespace: {
      columns: [
        AddColumn('Name', t('Name')),
        AddColumn('Cluster', t('Cluster')),
        AddColumn('Status', t('Status')),
        AddColumn('Created', t('Created')),
        AddColumn('Labels', t('Labels')),
      ],
    },
    node: {
      columns: [
        AddColumn('Name', t('Name')),
        AddColumn('Cluster', t('Cluster')),
        AddColumn('Role', t('Role')),
        AddColumn('Architecture', t('Architecture')),
        {
          header: t('OS image'),
          sort: 'osImage',
          cell: 'osImage',
        },
        AddColumn('CPU', t('CPU')),
        AddColumn('Created', t('Created')),
        AddColumn('Labels', t('Labels')),
      ],
    },
    persistentvolume: {
      columns: [
        AddColumn('Name', t('Name')),
        AddColumn('Cluster', t('Cluster')),
        AddColumn('Type', t('Type')),
        AddColumn('Status', t('Status')),
        AddColumn('Capacity', t('Capacity')),
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
        AddColumn('Path', t('Path')),
        AddColumn('Created', t('Created')),
        AddColumn('Labels', t('Labels')),
      ],
    },
    persistentvolumeclaim: {
      columns: AddDefaultColumns(t, [
        AddColumn('Status', t('Status')),
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
      ]),
    },
    placementbinding: {
      columns: [
        AddColumn('Name', t('Name')),
        AddColumn('Namespace', t('Namespace')),
        AddColumn('Subjects', t('Subjects')),
        {
          header: t('Placement policy'),
          sort: 'placementpolicy',
          cell: 'placementpolicy',
        },
        AddColumn('Created', t('Created')),
        AddColumn('Labels', t('Labels')),
      ],
    },
    placementpolicy: {
      columns: [
        AddColumn('Name', t('Name')),
        AddColumn('Namespace', t('Namespace')),
        AddColumn('Replicas', t('Replicas')),
        AddColumn('Decisions', t('Decisions')),
        AddColumn('Created', t('Created')),
        AddColumn('Labels', t('Labels')),
      ],
    },
    placementrule: {
      columns: AddDefaultColumns(t, [
        AddColumn('Replicas', t('Replicas')),
      ]),
    },
    pod: {
      columns: AddDefaultColumns(t, [
        AddColumn('Status', t('Status')),
        AddColumn('Restarts', t('Restarts')),
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
      ]),
    },
    policy: {
      columns: AddDefaultColumns(t, [
        AddColumn('Disabled', t('Disabled')),
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
      ]),
    },
    policyreport: {
      columns: [
        AddColumn('Name', t('Name')),
        {
          header: t('Scope'),
          sort: 'scope',
          cell: 'scope',
          tooltip: t('Scope refers to the cluster associated to the PolicyReport.'),
        },
        AddColumn('Critical', t('Critical')),
        AddColumn('Important', t('Important')),
        AddColumn('Moderate', t('Moderate')),
        AddColumn('Low', t('Low')),
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
        AddColumn('Name', t('Name')),
        AddColumn('Namespace', t('Namespace')),
        AddColumn('Cluster', t('Cluster')),
        AddColumn('Status', t('Status')),
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
      columns: AddDefaultColumns(t, [
        AddColumn('Desired', t('Desired')),
        AddColumn('Current', t('Current')),
      ]),
    },
    secret: {
      columns: AddDefaultColumns(t, [
        AddColumn('Type', t('Type')),
      ]),
    },
    service: {
      columns: AddDefaultColumns(t, [
        AddColumn('Type', t('Type')),
        {
          header: t('Cluster IP'),
          sort: 'clusterIP',
          cell: 'clusterIP',
        },
        AddColumn('Port', t('Port')),
      ]),
    },
    statefulset: {
      columns: AddDefaultColumns(t, [
        AddColumn('Desired', t('Desired')),
        AddColumn('Current', t('Current')),
      ]),
    },
    'subscription.apps.open-cluster-management.io': {
      columns: AddDefaultColumns(t, [
        AddColumn('Package', t('Package')),
        AddColumn('Status', t('Status')),
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
      ]),
    },
    'subscription.operators.coreos.io': {
      columns: AddDefaultColumns(t, [
        AddColumn('Package', t('Package')),
        AddColumn('Source', t('Source')),
        AddColumn('Channel', t('Channel')),
      ]),
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

function AddDefaultColumns(t: TFunction, customColumns: any[]) {
  return [
    AddColumn('Name', t('Name')),
    AddColumn('Namespace', t('Namespace')),
    AddColumn('Cluster', t('Cluster')),
    ...customColumns,
    AddColumn('Created', t('Created')),
    AddColumn('Labels', t('Labels')),
  ]
}

function AddColumn(key: string, localizedColumnName: string) {
  switch (key) {
    case 'Name':
      return {
        header: localizedColumnName,
        sort: 'name',
        cell: (item: any) => {
          return CreateDetailsLink(item)
        },
      }
    case 'Labels':
      return {
        header: localizedColumnName,
        sort: 'label',
        cell: (item: any) => {
          return FormatLabels(item)
        },
      }
    case 'Created':
      return {
        header: localizedColumnName,
        sort: 'created',
        cell: (item: any) => {
          return GetAge(item, 'created')
        },
      }
    default:
      return {
        header: localizedColumnName,
        sort: key.toLowerCase(),
        cell: key.toLowerCase(),
      }
  }
}
