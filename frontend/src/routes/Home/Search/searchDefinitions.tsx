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
        AddColumn(t, 'Name'),
        AddColumn(t, 'Namespace'),
        AddColumn(t, 'Created'),
        {
          header: t('Topology'),
          cell: (item: any) => {
            return CreateApplicationTopologyLink(item, t)
          },
        },
        AddColumn(t, 'Labels'),
      ],
    },
    cluster: {
      columns: [
        AddColumn(t, 'Name'),
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
        AddColumn(t, 'Nodes'),
        {
          header: t('Kubernetes version'),
          sort: 'kubernetesVersion',
          cell: 'kubernetesVersion',
        },
        AddColumn(t, 'CPU'),
        AddColumn(t, 'Memory'),
        {
          header: t('Console URL'),
          sort: 'consoleURL',
          cell: (item: any) => {
            return CreateExternalLink(item, t)
          },
        },
        AddColumn(t, 'Labels'),
      ],
    },
    clusteroperator: {
      columns: [
        AddColumn(t, 'Name'),
        AddColumn(t, 'Namespace'),
        AddColumn(t, 'Cluster'),
        AddColumn(t, 'Version'),
        AddColumn(t, 'Available'),
        AddColumn(t, 'Progressing'),
        AddColumn(t, 'Degraded'),
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
      ],
    },
    clusterserviceversion: {
      columns: [
        AddColumn(t, 'Name'),
        AddColumn(t, 'Namespace'),
        AddColumn(t, 'Cluster'),
        AddColumn(t, 'Version'),
        AddColumn(t, 'Phase'),
        AddColumn(t, 'Display'),
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
      ],
    },
    clusteroperator: {
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
          header: t('Version'),
          sort: 'version',
          cell: 'version',
        },
        {
          header: t('Available'),
          sort: 'available',
          cell: 'available',
        },
        {
          header: t('Progressing'),
          sort: 'progressing',
          cell: 'progressing',
        },
        {
          header: t('Degraded'),
          sort: 'degraded',
          cell: 'degraded',
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
    clusterserviceversion: {
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
          header: t('Version'),
          sort: 'version',
          cell: 'version',
        },
        {
          header: t('Phase'),
          sort: 'phase',
          cell: 'phase',
        },
        {
          header: t('Display'),
          sort: 'display',
          cell: 'display',
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
    channel: {
      columns: [
        AddColumn(t, 'Name'),
        AddColumn(t, 'Namespace'),
        AddColumn(t, 'Cluster'),
        AddColumn(t, 'Type'),
        AddColumn(t, 'Pathname'),
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
      ],
    },
    cronjob: {
      columns: [
        AddColumn(t, 'Name'),
        AddColumn(t, 'Namespace'),
        AddColumn(t, 'Cluster'),
        AddColumn(t, 'Schedule'),
        AddColumn(t, 'Suspend'),
        AddColumn(t, 'Active'),
        {
          header: t('Last schedule'),
          sort: 'lastSchedule',
          cell: (item: any) => {
            return GetAge(item, 'lastSchedule')
          },
        },
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
      ],
    },
    daemonset: {
      columns: [
        AddColumn(t, 'Name'),
        AddColumn(t, 'Namespace'),
        AddColumn(t, 'Cluster'),
        AddColumn(t, 'Desired'),
        AddColumn(t, 'Current'),
        AddColumn(t, 'Ready'),
        AddColumn(t, 'Updated'),
        AddColumn(t, 'Available'),
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
      ],
    },
    deployable: {
      columns: [
        AddColumn(t, 'Name'),
        AddColumn(t, 'Namespace'),
        {
          header: t('Chart URL'),
          sort: 'chartUrl',
          cell: 'chartUrl',
        },
        AddColumn(t, 'Dependencies'),
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
      ],
    },
    deployment: {
      columns: [
        AddColumn(t, 'Name'),
        AddColumn(t, 'Namespace'),
        AddColumn(t, 'Cluster'),
        AddColumn(t, 'Desired'),
        AddColumn(t, 'Current'),
        AddColumn(t, 'Ready'),
        AddColumn(t, 'Available'),
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
      ],
    },
    genericresource: {
      columns: [
        AddColumn(t, 'Name'),
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: (item: any) => {
            return item?.namespace ?? '-'
          },
        },
        AddColumn(t, 'Cluster'),
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
      ],
    },
    helmrelease: {
      // This is the Application Helm CR.
      columns: [
        AddColumn(t, 'Name'),
        AddColumn(t, 'Namespace'),
        AddColumn(t, 'Cluster'),
        {
          header: t('Source type'),
          sort: 'sourceType',
          cell: 'sourceType',
        },
        AddColumn(t, 'URL'),
        {
          header: t('Chart path'),
          sort: 'chartPath',
          cell: 'chartPath',
        },
        AddColumn(t, 'Branch'),
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
      ],
    },
    job: {
      columns: [
        AddColumn(t, 'Name'),
        AddColumn(t, 'Namespace'),
        AddColumn(t, 'Cluster'),
        AddColumn(t, 'Completions'),
        AddColumn(t, 'Parallelism'),
        AddColumn(t, 'Successful'),
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
      ],
    },
    namespace: {
      columns: [
        AddColumn(t, 'Name'),
        AddColumn(t, 'Cluster'),
        AddColumn(t, 'Status'), 
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
      ],
    },
    node: {
      columns: [
        AddColumn(t, 'Name'),
        AddColumn(t, 'Cluster'),
        AddColumn(t, 'Role'),
        AddColumn(t, 'Architecture'),
        {
          header: t('OS image'),
          sort: 'osImage',
          cell: 'osImage',
        },
        AddColumn(t, 'CPU'),
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
      ],
    },
    persistentvolume: {
      columns: [
        AddColumn(t, 'Name'),
        AddColumn(t, 'Cluster'),
        AddColumn(t, 'Type'),
        AddColumn(t, 'Status'),
        AddColumn(t, 'Capacity'),
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
        AddColumn(t, 'Path'),
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
      ],
    },
    persistentvolumeclaim: {
      columns: [
        AddColumn(t, 'Name'),
        AddColumn(t, 'Namespace'),
        AddColumn(t, 'Cluster'),
        AddColumn(t, 'Status'),
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
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
      ],
    },
    placementbinding: {
      columns: [
        AddColumn(t, 'Name'),
        AddColumn(t, 'Namespace'),
        AddColumn(t, 'Subjects'),
        {
          header: t('Placement policy'),
          sort: 'placementpolicy',
          cell: 'placementpolicy',
        },
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
      ],
    },
    placementpolicy: {
      columns: [
        AddColumn(t, 'Name'),
        AddColumn(t, 'Namespace'),
        AddColumn(t, 'Replicas'),
        AddColumn(t, 'Decisions'),
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
      ],
    },
    placementrule: {
      columns: [
        AddColumn(t, 'Name'),
        AddColumn(t, 'Namespace'),
        AddColumn(t, 'Cluster'),
        AddColumn(t, 'Replicas'),
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
      ],
    },
    pod: {
      columns: [
        AddColumn(t, 'Name'),
        AddColumn(t, 'Namespace'),
        AddColumn(t, 'Cluster'),
        AddColumn(t, 'Status'),
        AddColumn(t, 'Restarts'),
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
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
      ],
    },
    policy: {
      columns: [
        AddColumn(t, 'Name'),
        AddColumn(t, 'Namespace'),
        AddColumn(t, 'Cluster'),
        AddColumn(t, 'Disabled'),
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
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
      ],
    },
    policyreport: {
      columns: [
        AddColumn(t, 'Name'),
        {
          header: t('Scope'),
          sort: 'scope',
          cell: 'scope',
          tooltip: t('Scope refers to the cluster associated to the PolicyReport.'),
        },
        AddColumn(t, 'Critical'),
        AddColumn(t, 'Important'),
        AddColumn(t, 'Moderate'),
        AddColumn(t, 'Low'),
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
        AddColumn(t, 'Name'),
        AddColumn(t, 'Namespace'),
        AddColumn(t, 'Cluster'),
        AddColumn(t, 'Status'),
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
        AddColumn(t, 'Name'),
        AddColumn(t, 'Namespace'),
        AddColumn(t, 'Cluster'),
        AddColumn(t, 'Desired'),
        AddColumn(t, 'Current'),
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
      ],
    },
    secret: {
      columns: [
        AddColumn(t, 'Name'),
        AddColumn(t, 'Namespace'),
        AddColumn(t, 'Cluster'),
        AddColumn(t, 'Type'),
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
      ],
    },
    service: {
      columns: [
        AddColumn(t, 'Name'),
        AddColumn(t, 'Namespace'),
        AddColumn(t, 'Cluster'),
        AddColumn(t, 'Type'),
        {
          header: t('Cluster IP'),
          sort: 'clusterIP',
          cell: 'clusterIP',
        },
        AddColumn(t, 'Port'),
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
      ],
    },
    statefulset: {
      columns: [
        AddColumn(t, 'Name'),
        AddColumn(t, 'Namespace'),
        AddColumn(t, 'Cluster'),
        AddColumn(t, 'Desired'),
        AddColumn(t, 'Current'),
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
      ],
    },
    'subscription.apps.open-cluster-management.io': {
      columns: [
        AddColumn(t, 'Name'),
        AddColumn(t, 'Namespace'),
        AddColumn(t, 'Cluster'),
        AddColumn(t, 'Package'),
        AddColumn(t, 'Status'),
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
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
      ],
    },
    'subscription.operators.coreos.io': {
      columns: [
        AddColumn(t, 'Name'),
        AddColumn(t, 'Namespace'),
        AddColumn(t, 'Cluster'),
        AddColumn(t, 'Package'),
        AddColumn(t, 'Source'),
        AddColumn(t, 'Channel'),
        AddColumn(t, 'Created'),
        AddColumn(t, 'Labels'),
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

function AddColumn(t: TFunction, colHeader: string) {
  switch (colHeader) {
    case 'Name':
      return {
        header: t('Name'),
        sort: 'name',
        cell: (item: any) => {
          return CreateDetailsLink(item)
        },
      }
    case 'Labels':
      return {
        header: t('Labels'),
        sort: 'label',
        cell: (item: any) => {
          return FormatLabels(item)
        },
      }
    case 'Created':
      return {
        header: t('Created'),
        sort: 'created',
        cell: (item: any) => {
          return GetAge(item, 'created')
        },
      }
    default:
      return {
        header: t(colHeader),
        sort: colHeader.toLowerCase(),
        cell: colHeader.toLowerCase(),
      }
  }
}
