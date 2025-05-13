/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { ButtonProps, Icon, Label, Popover, Text, TextContent, TextVariants } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, ExternalLinkAltIcon } from '@patternfly/react-icons'
import _ from 'lodash'
import queryString from 'query-string'
import { useMemo } from 'react'
import { TFunction } from 'react-i18next'
import { generatePath, Link } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../lib/acm-i18next'
import AcmTimestamp from '../../lib/AcmTimestamp'
import { NavigationPath } from '../../NavigationPath'
import { ConfigMap } from '../../resources'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { AcmButton, AcmLabels } from '../../ui-components'
import { useAllClusters } from '../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
export interface ResourceDefinitions {
  application: Record<'columns', SearchColumnDefinition[]>
  cluster: Record<'columns', SearchColumnDefinition[]>
  clusteroperator: Record<'columns', SearchColumnDefinition[]>
  clusterserviceversion: Record<'columns', SearchColumnDefinition[]>
  channel: Record<'columns', SearchColumnDefinition[]>
  cronjob: Record<'columns', SearchColumnDefinition[]>
  daemonset: Record<'columns', SearchColumnDefinition[]>
  deployable: Record<'columns', SearchColumnDefinition[]>
  deployment: Record<'columns', SearchColumnDefinition[]>
  genericresource: Record<'columns', SearchColumnDefinition[]>
  helmrelease: Record<'columns', SearchColumnDefinition[]>
  job: Record<'columns', SearchColumnDefinition[]>
  namespace: Record<'columns', SearchColumnDefinition[]>
  node: Record<'columns', SearchColumnDefinition[]>
  persistentvolume: Record<'columns', SearchColumnDefinition[]>
  persistentvolumeclaim: Record<'columns', SearchColumnDefinition[]>
  placementbinding: Record<'columns', SearchColumnDefinition[]>
  placementpolicy: Record<'columns', SearchColumnDefinition[]>
  placementrule: Record<'columns', SearchColumnDefinition[]>
  pod: Record<'columns', SearchColumnDefinition[]>
  policy: Record<'columns', SearchColumnDefinition[]>
  policyreport: Record<'columns', SearchColumnDefinition[]>
  release: Record<'columns', SearchColumnDefinition[]>
  replicaset: Record<'columns', SearchColumnDefinition[]>
  secret: Record<'columns', SearchColumnDefinition[]>
  service: Record<'columns', SearchColumnDefinition[]>
  statefulset: Record<'columns', SearchColumnDefinition[]>
  'subscription.apps.open-cluster-management.io': Record<'columns', SearchColumnDefinition[]>
  'subscription.operators.coreos.com': Record<'columns', SearchColumnDefinition[]>
  virtualmachine: Record<'columns', SearchColumnDefinition[]>
  virtualmachinespage: Record<'columns', SearchColumnDefinition[]>
  virtualmachineinstance: Record<'columns', SearchColumnDefinition[]>
  virtualmachinesnapshot: Record<'columns', SearchColumnDefinition[]>
}

export interface SearchColumnDefinition {
  header: string
  sort?: string
  search?: string | ((item: any) => string)
  cell: string | ((item: any) => JSX.Element | '-') | ((item: any) => string)
}

export const getSearchDefinitions: (t: TFunction, isGlobalHub?: boolean) => ResourceDefinitions = (
  t: TFunction,
  isGlobalHub?: boolean
) => {
  return {
    application: {
      columns: [
        AddColumn('name', t('Name')),
        AddColumn('namespace', t('Namespace')),
        AddColumn('created', t('Created')),
        {
          header: t('Topology'),
          cell: (item: any) => {
            return <CreateApplicationTopologyLink item={item} t={t} />
          },
        },
        AddColumn('labels', t('Labels')),
      ],
    },
    cluster: {
      columns: [
        AddColumn('name', t('Name')),
        ...(isGlobalHub ? [AddColumn('managedHub', t('Managed hub'))] : []),
        AddColumn('ManagedClusterConditionAvailable', t('Available')),
        AddColumn('HubAcceptedManagedCluster', t('Hub accepted')),
        AddColumn('ManagedClusterJoined', t('Joined')),
        AddColumn('nodes', t('Nodes')),
        AddColumn('kubernetesVersion', t('Kubernetes version')),
        AddColumn('cpu', t('CPU')),
        AddColumn('memory', t('Memory')),
        {
          header: t('Console URL'),
          sort: 'consoleURL',
          cell: (item: any) => {
            return CreateExternalLink(item, t)
          },
        },
        AddColumn('labels', t('Labels')),
      ],
    },
    clusteroperator: {
      columns: AddDefaultColumns(t, [
        AddColumn('version', t('Version')),
        AddColumn('available', t('Available')),
        AddColumn('progressing', t('Progressing')),
        AddColumn('degraded', t('Degraded')),
      ]),
    },
    clusterserviceversion: {
      columns: AddDefaultColumns(t, [
        AddColumn('version', t('Version')),
        AddColumn('phase', t('Phase')),
        AddColumn('display', t('Display')),
      ]),
    },
    channel: {
      columns: AddDefaultColumns(t, [AddColumn('type', t('Type')), AddColumn('pathname', t('Pathname'))]),
    },
    cronjob: {
      columns: AddDefaultColumns(t, [
        AddColumn('schedule', t('schedule')),
        AddColumn('suspend', t('Suspend')),
        AddColumn('active', t('Active')),
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
        AddColumn('desired', t('Desired')),
        AddColumn('current', t('Current')),
        AddColumn('ready', t('Ready')),
        AddColumn('updated', t('Updated')),
        AddColumn('available', t('Available')),
      ]),
    },
    deployable: {
      columns: [
        AddColumn('name', t('Name')),
        AddColumn('namespace', t('Namespace')),
        AddColumn('chartUrl', t('Chart URL')),
        AddColumn('dependencies', t('Dependencies')),
        AddColumn('created', t('Created')),
        AddColumn('labels', t('Labels')),
      ],
    },
    deployment: {
      columns: AddDefaultColumns(t, [
        AddColumn('desired', t('Desired')),
        AddColumn('current', t('Current')),
        AddColumn('ready', t('Ready')),
        AddColumn('available', t('Available')),
      ]),
    },
    genericresource: {
      columns: [
        AddColumn('name', t('Name')),
        {
          header: t('Namespace'),
          sort: 'namespace',
          cell: (item: any) => {
            return item?.namespace ?? '-'
          },
        },
        AddColumn('cluster', t('Cluster')),
        AddColumn('created', t('Created')),
        AddColumn('labels', t('Labels')),
      ],
    },
    helmrelease: {
      // This is the Application Helm CR.
      columns: AddDefaultColumns(t, [
        AddColumn('sourceType', t('Source type')),
        AddColumn('url', t('URL')),
        AddColumn('chartPath', t('Chart path')),
        AddColumn('branch', t('Branch')),
      ]),
    },
    job: {
      columns: AddDefaultColumns(t, [
        AddColumn('completions', t('Completions')),
        AddColumn('parallelism', t('Parallelism')),
        AddColumn('successful', t('Successful')),
      ]),
    },
    namespace: {
      columns: [
        AddColumn('name', t('Name')),
        AddColumn('cluster', t('Cluster')),
        AddColumn('status', t('Status')),
        AddColumn('created', t('Created')),
        AddColumn('labels', t('Labels')),
      ],
    },
    node: {
      columns: [
        AddColumn('name', t('Name')),
        AddColumn('cluster', t('Cluster')),
        AddColumn('status', t('Status')),
        AddColumn('role', t('Role')),
        AddColumn('architecture', t('Architecture')),
        AddColumn('osImage', t('OS image')),
        AddColumn('cpu', t('CPU')),
        AddColumn('created', t('Created')),
        AddColumn('labels', t('Labels')),
      ],
    },
    persistentvolume: {
      columns: [
        AddColumn('name', t('Name')),
        AddColumn('cluster', t('Cluster')),
        AddColumn('type', t('Type')),
        AddColumn('status', t('Status')),
        AddColumn('capacity', t('Capacity')),
        AddColumn('accessMode', t('Access mode')),
        AddColumn('claimRef', t('Claim')),
        AddColumn('reclaimPolicy', t('Reclaim policy')),
        AddColumn('path', t('Path')),
        AddColumn('created', t('Created')),
        AddColumn('labels', t('Labels')),
      ],
    },
    persistentvolumeclaim: {
      columns: AddDefaultColumns(t, [
        AddColumn('status', t('Status')),
        AddColumn('volumeName', t('Persistent volume')),
        AddColumn('request', t('Requests')),
        AddColumn('accessMode', t('Access mode')),
      ]),
    },
    placementbinding: {
      columns: [
        AddColumn('name', t('Name')),
        AddColumn('namespace', t('Namespace')),
        AddColumn('subjects', t('Subjects')),
        AddColumn('placementpolicy', t('Placement policy')),
        AddColumn('created', t('Created')),
        AddColumn('labels', t('Labels')),
      ],
    },
    placementpolicy: {
      columns: [
        AddColumn('name', t('Name')),
        AddColumn('namespace', t('Namespace')),
        AddColumn('replicas', t('Replicas')),
        AddColumn('decisions', t('Decisions')),
        AddColumn('created', t('Created')),
        AddColumn('labels', t('Labels')),
      ],
    },
    placementrule: {
      columns: AddDefaultColumns(t, [AddColumn('replicas', t('Replicas'))]),
    },
    pod: {
      columns: AddDefaultColumns(t, [
        AddColumn('status', t('Status')),
        AddColumn('restarts', t('Restarts')),
        AddColumn('hostIP', t('Host IP')),
        AddColumn('podIP', t('Pod IP')),
      ]),
    },
    policy: {
      columns: AddDefaultColumns(t, [
        AddColumn('disabled', t('Disabled')),
        {
          header: t('Violations'),
          sort: 'compliant',
          cell: (item: any) => {
            switch (item.compliant) {
              case 'Compliant':
                return (
                  <div>
                    <Icon status="success">
                      <CheckCircleIcon />
                    </Icon>{' '}
                    {t('No violations')}
                  </div>
                )
              case 'NonCompliant':
                return (
                  <div>
                    <Icon status="danger">
                      <ExclamationCircleIcon />
                    </Icon>{' '}
                    {t('Violations')}
                  </div>
                )
              default:
                return '-'
            }
          },
        },
        AddColumn('remediationAction', t('Remediation action')),
      ]),
    },
    policyreport: {
      columns: [
        AddColumn('name', t('Name')),
        {
          header: t('Scope'),
          sort: 'scope',
          cell: 'scope',
          tooltip: t('Scope refers to the cluster associated to the PolicyReport.'),
        },
        AddColumn('critical', t('Critical')),
        AddColumn('important', t('Important')),
        AddColumn('moderate', t('Moderate')),
        AddColumn('low', t('Low')),
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
        AddColumn('name', t('Name')),
        AddColumn('namespace', t('Namespace')),
        AddColumn('cluster', t('Cluster')),
        AddColumn('status', t('Status')),
        AddColumn('chartName', t('Chart name')),
        AddColumn('chartVersion', t('Chart version')),
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
      columns: AddDefaultColumns(t, [AddColumn('desired', t('Desired')), AddColumn('current', t('Current'))]),
    },
    secret: {
      columns: AddDefaultColumns(t, [AddColumn('type', t('Type'))]),
    },
    service: {
      columns: AddDefaultColumns(t, [
        AddColumn('type', t('Type')),
        AddColumn('clusterIP', t('Cluster IP')),
        AddColumn('port', t('Port')),
      ]),
    },
    statefulset: {
      columns: AddDefaultColumns(t, [AddColumn('desired', t('Desired')), AddColumn('current', t('Current'))]),
    },
    'subscription.apps.open-cluster-management.io': {
      columns: AddDefaultColumns(t, [
        AddColumn('package', t('Package')),
        AddColumn('status', t('Status')),
        AddColumn('localPlacement', t('Local placement')),
        AddColumn('timeWindow', t('Time window')),
      ]),
    },
    'subscription.operators.coreos.com': {
      columns: AddDefaultColumns(t, [
        AddColumn('package', t('Package')),
        AddColumn('source', t('Source')),
        AddColumn('Channel', t('Channel')),
      ]),
    },
    virtualmachine: {
      columns: AddDefaultColumns(t, [
        AddColumn('status', t('Status')),
        AddColumn('ready', t('Ready')),
        {
          id: 'launch-links',
          header: '',
          cell: (item: any) => {
            return <VMLaunchLinks item={item} t={t} />
          },
        },
      ]),
    },
    virtualmachineinstance: {
      columns: AddDefaultColumns(t, [AddColumn('node', t('Node')), AddColumn('ipaddress', t('IP address'))]),
    },
    virtualmachinesnapshot: {
      columns: [
        AddColumn('name', t('Name')),
        AddColumn('namespace', t('Namespace')),
        AddColumn('cluster', t('Cluster')),
        AddColumn('_conditionReadyReason', t('Status')),
        {
          id: 'vmsnapshot-indications',
          header: t('Indications'),
          cell: (item: any) => {
            return <VMSnapshotIndications item={item} />
          },
        },
        AddColumn('created', t('Created')),
      ],
    },
    virtualmachinespage: {
      columns: [
        { id: 'name', order: 1, isDefault: true, ...AddColumn('name', t('Name')) },
        {
          id: 'status',
          order: 2,
          isDefault: false,
          isFirstVisitChecked: true,
          ...AddColumn('status', t('Status')),
        },
        {
          id: 'cluster',
          order: 3,
          isDefault: false,
          isFirstVisitChecked: true,
          ...AddColumn('cluster', t('Cluster')),
        },
        {
          id: 'namespace',
          order: 4,
          isDefault: false,
          isFirstVisitChecked: true,
          ...AddColumn('namespace', t('Namespace')),
        },
        {
          id: 'node',
          order: 5,
          isDefault: false,
          isFirstVisitChecked: true,
          ...AddColumn('node', t('Node')),
        },
        {
          id: 'ipaddress',
          order: 6,
          isDefault: false,
          isFirstVisitChecked: true,
          ...AddColumn('ipaddress', t('IP address')),
        },
        {
          id: 'launch-links',
          order: 7,
          isDefault: false,
          isFirstVisitChecked: true,
          header: t('Launch links'),
          cell: (item: any) => {
            return <VMLaunchLinks item={item} t={t} />
          },
        },
        {
          id: 'created',
          order: 8,
          isDefault: false,
          isFirstVisitChecked: false,
          ...AddColumn('created', t('Created')),
        },
        {
          id: 'agent-connected',
          order: 9,
          isDefault: false,
          isFirstVisitChecked: false,
          ...AddColumn('agentConnected', t('Agent connected')),
        },
        {
          id: 'flavor',
          order: 10,
          isDefault: false,
          isFirstVisitChecked: false,
          ...AddColumn('flavor', t('Flavor')),
        },
        {
          id: 'os-name',
          order: 11,
          isDefault: false,
          isFirstVisitChecked: false,
          ...AddColumn('osName', t('OS Name')),
        },
        {
          id: 'workload',
          order: 12,
          isDefault: false,
          isFirstVisitChecked: false,
          ...AddColumn('workload', t('Workload')),
        },
        {
          id: 'os-version',
          order: 13,
          isDefault: false,
          isFirstVisitChecked: false,
          ...AddColumn('osVersion', t('OS Version')),
        },
        {
          id: 'vm-size',
          order: 14,
          isDefault: false,
          isFirstVisitChecked: false,
          ...AddColumn('vmSize', t('VM Size')),
        },
        {
          id: 'labels',
          order: 15,
          isDefault: false,
          isFirstVisitChecked: false,
          ...AddColumn('labels', t('Labels')),
        },
      ],
    },
  }
}

export const useSearchDefinitions = () => {
  const { t } = useTranslation()
  const { isGlobalHubState, settingsState } = useSharedAtoms()
  const isGlobalHub = useRecoilValue(isGlobalHubState)
  const settings = useRecoilValue(settingsState)
  const globalHub = isGlobalHub && settings.globalSearchFeatureFlag === 'enabled'

  return useMemo(() => getSearchDefinitions(t, globalHub), [t, globalHub])
}

export function GetAge(item: any, key: string) {
  const createdTime = _.get(item, key)
  return <AcmTimestamp timestamp={createdTime} />
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
  if (resource._hubClusterResource && resource._hubClusterResource === 'true') {
    searchString = `${searchString}&_hubClusterResource=true`
  }
  return `?${encodeURIComponent(searchString)}`
}

export function CreateDetailsLink(props: Readonly<{ item: any }>) {
  const { item } = props

  const defaultSearchLink = (
    <Link
      to={{
        pathname: NavigationPath.resources,
        search: GetUrlSearchParam(item),
      }}
      state={{
        from: NavigationPath.search,
        fromSearch: window.location.search,
      }}
    >
      {item.name}
    </Link>
  )

  switch (item.kind.toLowerCase()) {
    case 'cluster':
    case 'managedcluster':
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
          cluster: item._hubClusterResource ? undefined : cluster,
          applicationset: applicationSet ?? undefined,
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
      return defaultSearchLink
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
      return defaultSearchLink
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
      return defaultSearchLink
  }
}

export function CreateGlobalSearchDetailsLink(props: { item: any }) {
  const { item } = props
  const clusters = useAllClusters(true)

  const managedHub = clusters.find((cluster) => {
    if (item.managedHub === 'global-hub') {
      // If the resource lives on a managed hub (managed by global hub) use the cluster name
      return cluster.name === item.cluster
    }
    return cluster.name === item.managedHub
  })

  const generateLink = (linkType: string, path: string, params?: string) => {
    const linkProps: ButtonProps = {
      variant: 'link',
      component: 'a',
      target: '_blank',
      icon: <ExternalLinkAltIcon />,
      iconPosition: 'right',
      isInline: true,
    }

    switch (linkType) {
      case 'internal':
        return <Link to={{ pathname: path, search: params }}>{item.name}</Link>
      case 'external':
        return (
          <AcmButton {...linkProps} href={`${managedHub?.consoleURL}${path}${params ?? ''}`}>
            {item.name}
          </AcmButton>
        )
      default:
        return item.name
    }
  }

  switch (item.kind.toLowerCase()) {
    case 'cluster':
    case 'managedcluster': {
      if (item.managedHub === 'global-hub') {
        return generateLink(
          'internal',
          generatePath(NavigationPath.clusterOverview, { name: item.name, namespace: item.name })
        )
      }
      return generateLink(
        'external',
        generatePath(NavigationPath.clusterOverview, { name: item.name, namespace: item.name }),
        GetUrlSearchParam(item)
      )
    }
    case 'application': {
      const { apigroup, applicationSet, cluster, name, namespace, kind } = item
      if (apigroup === 'app.k8s.io' || apigroup === 'argoproj.io') {
        const params = queryString.stringify({
          apiVersion: `${kind}.${apigroup}`.toLowerCase(),
          cluster: item._hubClusterResource ? undefined : cluster,
          applicationset: applicationSet ?? undefined,
        })
        const path = generatePath(NavigationPath.applicationOverview, { namespace, name })
        if (item.managedHub === 'global-hub' && !item._hubClusterResource) {
          return generateLink('external', path, `?${params}`)
        }
        return generateLink('internal', path, `?${params}`)
      }
      return generateLink(
        item.managedHub === 'global-hub' && !item._hubClusterResource ? 'external' : 'internal',
        NavigationPath.resources,
        GetUrlSearchParam(item)
      )
    }
    case 'policy': {
      if (
        item.apigroup === 'policy.open-cluster-management.io' &&
        !item.label?.includes('policy.open-cluster-management.io/root-policy')
      ) {
        const path = generatePath(NavigationPath.policyDetails, { name: item.name, namespace: item.namespace })
        return item._hubClusterResource ? generateLink('internal', path) : generateLink('external', path)
      }
      return generateLink(
        item.managedHub !== 'global-hub' && !item._hubClusterResource ? 'external' : 'internal',
        NavigationPath.resources,
        GetUrlSearchParam(item)
      )
    }
    case 'policyreport': {
      const path = generatePath(NavigationPath.clusterOverview, { name: item.namespace, namespace: item.namespace })
      return generateLink(
        item.managedHub === 'global-hub' && !item._hubClusterResource ? 'external' : 'internal',
        path,
        `?${encodeURIComponent('showClusterIssues=true')}`
      )
    }
    default: {
      const searchLink = generateLink('internal', NavigationPath.resources, GetUrlSearchParam(item))
      const externalLink = generateLink('external', NavigationPath.resources, GetUrlSearchParam(item))
      return item.managedHub !== 'global-hub' ? externalLink : searchLink
    }
  }
}

export function CreateApplicationTopologyLink(props: Readonly<{ item: any; t: TFunction }>) {
  const { item, t } = props
  const allClusters = useAllClusters(true)
  if (item?.apiversion && item?.apigroup) {
    const apiversion = encodeURIComponent(`${item.kind}.${item.apigroup}`.toLowerCase())
    const link = {
      pathname: generatePath(NavigationPath.applicationTopology, { name: item.name, namespace: item.namespace }),
      search: `?apiVersion=${apiversion}`,
    }
    if (item.managedHub && !item._hubClusterResource) {
      const hubUrl = allClusters.find((cluster) => cluster.name === item.cluster)?.consoleURL
      const path = generatePath(NavigationPath.applicationTopology, { name: item.name, namespace: item.namespace })
      return (
        <AcmButton
          variant="link"
          component="a"
          target="_blank"
          icon={<ExternalLinkAltIcon />}
          iconPosition="right"
          isInline={true}
          href={`${hubUrl}${path}?apiVersion=${apiversion}`}
        >
          {t('View topology')}
        </AcmButton>
      )
    }
    return <Link to={link}>{t('View topology')}</Link>
  }
  return <div>{'-'}</div>
}

export function CreateExternalLink(item: any, t: TFunction) {
  if (item.consoleURL) {
    return (
      <AcmButton
        variant="link"
        component="a"
        target="_blank"
        isInline={true}
        href={`${item.consoleURL}`}
        icon={<ExternalLinkAltIcon />}
        iconPosition="right"
      >
        {t('Launch')}
      </AcmButton>
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
    AddColumn('name', t('Name')),
    AddColumn('namespace', t('Namespace')),
    AddColumn('cluster', t('Cluster')),
    ...customColumns,
    AddColumn('created', t('Created')),
    AddColumn('labels', t('Labels')),
  ]
}

function AddColumn(key: string, localizedColumnName: string): SearchColumnDefinition {
  switch (key) {
    case 'name':
      return {
        header: localizedColumnName,
        sort: 'name',
        cell: (item: any) => {
          if (item.managedHub) {
            // item exists in global search env
            return <CreateGlobalSearchDetailsLink item={item} />
          }
          return <CreateDetailsLink item={item} />
        },
      }
    case 'labels':
      return {
        header: localizedColumnName,
        sort: 'label',
        cell: (item: any) => {
          return FormatLabels(item)
        },
      }
    case 'created':
      return {
        header: localizedColumnName,
        sort: 'created',
        cell: (item: any) => {
          return GetAge(item, 'created')
        },
      }
    case 'cluster':
      return {
        header: localizedColumnName,
        sort: 'cluster',
        cell: (item: any) => {
          return (
            <>
              {item?.cluster ?? '-'}
              {item?.managedHub && (
                <TextContent>
                  <Text component={TextVariants.small}>{item.managedHub}</Text>
                </TextContent>
              )}
            </>
          )
        },
      }
    default:
      return {
        header: localizedColumnName,
        sort: key,
        cell: (item: any) => {
          return item[key] ?? '-'
        },
      }
  }
}

export function CreateExternalVMLink(props: Readonly<{ item: any; t: TFunction }>) {
  const { item, t } = props
  const allClusters = useAllClusters(true)
  const vmCluster = item.cluster
  const clusterURL = allClusters.filter((c) => c.name === vmCluster)?.[0]?.consoleURL

  if (clusterURL) {
    return (
      <AcmButton
        variant="link"
        component="a"
        target="_blank"
        isInline={true}
        href={`${clusterURL}/k8s/ns/${item.namespace}/kubevirt.io~v1~VirtualMachine/${item.name}`}
        icon={<ExternalLinkAltIcon />}
        iconPosition="right"
      >
        {t('Details')}
      </AcmButton>
    )
  }
  return <>{'-'}</>
}

export function VMLaunchLinks(props: Readonly<{ item: any; t: TFunction }>) {
  const { item, t } = props
  const { useIsObservabilityInstalled, configMapsState, clusterManagementAddonsState } = useSharedAtoms()
  const configMaps = useRecoilValue(configMapsState)
  const clusterManagementAddons = useRecoilValue(clusterManagementAddonsState)
  const isObservabilityInstalled = useIsObservabilityInstalled()
  const allClusters = useAllClusters(true)
  const vmCluster = item.cluster
  const clusterURL = allClusters.filter((c) => c.name === vmCluster)?.[0]?.consoleURL

  const vmMetricLink = useMemo(() => {
    const obsCont = clusterManagementAddons.filter((cma) => cma.metadata.name === 'observability-controller')
    let grafanaLink = obsCont?.[0]?.metadata?.annotations?.['console.open-cluster-management.io/launch-link']
    if (grafanaLink) {
      grafanaLink = new URL(grafanaLink).origin
    }
    if (isObservabilityInstalled) {
      const vmDashboard = configMaps.filter(
        (cm: ConfigMap) => cm.metadata.name === 'grafana-dashboard-acm-openshift-virtualization-single-vm-view'
      )
      if (vmDashboard.length > 0) {
        const parsedDashboardData = JSON.parse(
          vmDashboard[0].data?.['acm-openshift-virtualization-single-vm-view.json']
        )
        const dashboardId = parsedDashboardData?.uid
        return `${grafanaLink}/d/${dashboardId}/executive-dashboards-single-virtual-machine-view?orgId=1&var-name=${item.name}&var-namespace=${item.namespace}&var-cluster=${item.cluster}`
      }
    }
    return ''
  }, [item, clusterManagementAddons, configMaps, isObservabilityInstalled])

  return (
    <Popover
      bodyContent={
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <AcmButton
            variant="link"
            component="a"
            target="_blank"
            isInline={true}
            href={`${clusterURL}/k8s/ns/${item.namespace}/kubevirt.io~v1~VirtualMachine/${item.name}`}
            icon={<ExternalLinkAltIcon />}
            iconPosition="right"
          >
            {t('Virtual machine details')}
          </AcmButton>
          <AcmButton
            variant="link"
            component="a"
            target="_blank"
            isInline={true}
            href={`${clusterURL}/k8s/ns/${item.namespace}/kubevirt.io~v1~VirtualMachine/${item.name}/console`}
            icon={<ExternalLinkAltIcon />}
            iconPosition="right"
          >
            {t('Virtual machine console')}
          </AcmButton>
          {isObservabilityInstalled && (
            <AcmButton
              variant="link"
              component="a"
              target="_blank"
              isInline={true}
              href={vmMetricLink}
              icon={<ExternalLinkAltIcon />}
              iconPosition="right"
            >
              {t('Observability metrics')}
            </AcmButton>
          )}
        </div>
      }
      className="label-with-popover"
      enableFlip
      hasAutoWidth
      minWidth="18.75rem"
      maxWidth="30rem"
      position={'top'}
      flipBehavior={['bottom', 'top', 'right', 'left']}
      zIndex={999}
    >
      <Label
        onClick={(event) => {
          event.preventDefault()
          event.nativeEvent.preventDefault()
        }}
        color="grey"
      >
        {t('Launch links')}
      </Label>
    </Popover>
  )
}

export function VMSnapshotIndications(props: Readonly<{ item: any }>) {
  const { item } = props
  if (item.indications) {
    const indications = item.indications.split('; ')
    const indicationsToHide = indications.slice(3).map((l: string) => l.split('=')[0])
    return <AcmLabels labels={indications} collapse={indicationsToHide} />
  }
  return <>{'-'}</>
}
