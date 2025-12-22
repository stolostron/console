/* Copyright Contributors to the Open Cluster Management project */

// Lodash imports removed - using native TypeScript equivalents
import { getResource, listNamespacedResources } from '../../../../../resources/utils'
import { fireManagedClusterView } from '../../../../../resources'
import { searchClient } from '../../../../Search/search-sdk/search-client'
import { SearchRelatedResult, SearchResultItemsAndRelatedItemsDocument } from '../../../../Search/search-sdk/search-sdk'
import { convertStringToQuery } from '../helpers/search-helper'
import {
  addClusters,
  getClusterName,
  getResourceTypes,
  processMultiples,
  createReplicaChild,
  createControllerRevisionChild,
  createDataVolumeChild,
  createVirtualMachineInstance,
  addTopologyNode,
} from './topologyUtils'
import {
  ApplicationModel,
  // AppSetCluster,
  TopologyNode,
  TopologyLink,
  RouteObject,
  ManagedClusterViewData,
  ProcessedDeployableResource,
  SearchQuery,
  ResourceItem,
  ExtendedTopology,
} from '../types'
import { TFunction } from 'react-i18next'
import { ToolbarControl } from '../topology/components/TopologyToolbar'

/**
 * Generates topology data for ApplicationSet applications
 * Creates nodes and links representing the application structure including:
 * - ApplicationSet node
 * - Placement node (if applicable)
 * - Cluster nodes
 * - Deployed resource nodes
 *
 * @param application - The ApplicationSet application model
 * @param hubClusterName - Name of the hub cluster
 * @returns Topology structure with nodes and links
 */
export async function getAppSetTopology(
  toolbarControl: ToolbarControl,
  application: ApplicationModel,
  hubClusterName: string
): Promise<ExtendedTopology> {
  const links: TopologyLink[] = []
  const nodes: TopologyNode[] = []
  // const { name, namespace, appSetClusters = [], appSetApps = [], relatedPlacement } = application
  // const clusterNames = appSetClusters.map((cluster: AppSetCluster) => cluster.name)
  const { namespace, appSetClusters = [], appSetApps = [], relatedPlacement } = application
  const name = 'app-matrix-test-1'
  const clusterNames = ['clc-test'] //  appSetClusters.map((cluster: AppSetCluster) => cluster.name)
  const { activeTypes } = toolbarControl

  /////////////////////////////////////////////
  ////  APPLICATION SET NODE /////////////////
  /////////////////////////////////////////////
  const appId = `application--${name}`
  nodes.push({
    name,
    namespace,
    type: 'applicationset',
    id: appId,
    uid: appId,
    specs: {
      isDesign: true,
      raw: application.app,
      allClusters: {
        isLocal: clusterNames.includes(hubClusterName),
        remoteCount: clusterNames.includes(hubClusterName) ? clusterNames.length - 1 : clusterNames.length,
      },
      clusterNames,
      appSetApps,
      appSetClusters,
    },
  })

  /////////////////////////////////////////////
  ////  PLACEMENT NODE /////////////////
  /////////////////////////////////////////////

  // Extract placement name from ApplicationSet generators configuration
  const appSetPlacementName = (application.app as any)?.spec?.generators?.[0]?.clusterDecisionResource?.labelSelector
    ?.matchLabels?.['cluster.open-cluster-management.io/placement']

  // Clean up the application spec by removing apps array
  if (application.app && typeof application.app === 'object' && 'spec' in application.app) {
    const spec = application.app.spec as any
    if (spec && typeof spec === 'object' && 'apps' in spec) {
      delete spec.apps
    }
  }

  // Create placement node if placement exists
  let isPlacementFound = false
  let isArgoCDPullModelTargetLocalCluster = false
  const placement = application.placement ?? ''
  const placementId = `member--placements--${namespace}--${name}`

  if (placement) {
    isPlacementFound = true
    const placementName = (placement as any)?.metadata?.name || ''
    const placementNamespace = (placement as any)?.metadata?.namespace || ''
    const clusterDecisions = (placement as any)?.status?.decisions ?? []

    // Check if this is an ArgoCD pull model targeting the local cluster
    if (
      Array.isArray(clusterDecisions) &&
      clusterDecisions.find((cluster: any) => cluster.clusterName === hubClusterName) &&
      application.isAppSetPullModel
    ) {
      isArgoCDPullModelTargetLocalCluster = true
    }

    // Add placement node to topology
    nodes.push({
      name: placementName,
      namespace: placementNamespace,
      type: 'placement',
      id: placementId,
      uid: placementId,
      specs: {
        isDesign: true,
        raw: placement,
      },
      placement: relatedPlacement,
    })

    // Link ApplicationSet to Placement
    links.push({
      from: { uid: appId },
      to: { uid: placementId },
      type: '',
      specs: { isDesign: true },
    })
  } else {
    // Handle case where placement name exists but placement object doesn't
    if (!appSetPlacementName && appSetPlacementName !== '') {
      isPlacementFound = true
    }
  }

  // Set placement-related flags on the ApplicationSet node
  ;(nodes[0] as any).isPlacementFound = isPlacementFound
  ;(nodes[0] as any).isArgoCDPullModelTargetLocalCluster = isArgoCDPullModelTargetLocalCluster

  // Determine the parent node for clusters (placement if exists, otherwise ApplicationSet)
  const clusterParentId = appId

  // Extract source path from ApplicationSet template or generators
  const templateSourcePath = (application.app as any)?.spec?.template?.spec?.source?.path ?? ''
  const source =
    templateSourcePath !== '{{path}}'
      ? templateSourcePath
      : (Object.values((application.app as any)?.spec?.generators?.[0] ?? {})[0] as any)?.directories?.[0]?.path ?? ''

  ////////////////////////////////////////////////////////////////
  ////  USE SEARCH TO GET APPLICATIONSET RESOURCES /////////////////
  ////////////////////////////////////////////////////////////////
  const { applicationResourceMap, generatedApplicationNames } = await getAppSetResources(
    name,
    namespace,
    appSetApps,
    clusterNames
  )

  ////  SET TOOLBAR FILTERS ///////////////////
  toolbarControl.setAllClusters?.(clusterNames)
  toolbarControl.setAllApplications(generatedApplicationNames.length > 0 ? generatedApplicationNames : [name])
  const allApplicationTypes = new Set<string>()

  /////////////////////////////////////////////
  ////  CLUSTER AND RESOURCE NODES /////////////////
  /////////////////////////////////////////////

  // Iterate over applicationResourceMap which maps cluster names to application resources
  Object.entries(applicationResourceMap).forEach(([clusterName, appResourceMap]) => {
    // Add cluster node for this cluster
    const clusterId = addClusters(
      clusterParentId,
      undefined,
      source,
      [clusterName],
      (appSetClusters || []).filter((c: any) => c.name === clusterName) as any,
      links,
      nodes
    )

    // For each application in this cluster
    Object.entries(appResourceMap).forEach(([appName, resources]) => {
      if (appName === '') {
        // No application name - process resources directly under cluster
        const types = getResourceTypes(resources as Record<string, unknown>[])
        types.forEach((type) => allApplicationTypes.add(type))
        processResources(resources, clusterId, [clusterName], hubClusterName, activeTypes ?? [], links, nodes)
      } else {
        // Has application name - create application node
        const appNodeId = `member--application--${clusterName}--${appName}`
        const appNode: TopologyNode = {
          name: appName,
          namespace,
          type: 'application',
          id: appNodeId,
          uid: appNodeId,
          specs: {
            isDesign: false,
            clustersNames: [clusterName],
            parent: {
              clusterId,
            },
          },
        }
        addTopologyNode(clusterId, appNode, activeTypes, links, nodes)

        // Collect resource types
        const types = getResourceTypes(resources as Record<string, unknown>[])
        types.forEach((type) => allApplicationTypes.add(type))

        // Process and create resource nodes under the application node
        processResources(resources, appNodeId, [clusterName], hubClusterName, activeTypes ?? [], links, nodes)
      }
    })
  })

  // Set all resource types in toolbar
  toolbarControl.setAllTypes?.([...allApplicationTypes])
  // Return complete topology with unique nodes and all links
  return {
    nodes: nodes.filter((node, index, array) => array.findIndex((n) => n.uid === node.uid) === index), // Remove duplicate nodes based on unique ID
    links,
  }
}

async function getAppSetResources(name: string, namespace: string, appSetApps: any[], appSetClusters: string[]) {
  console.log('getAppSetResources', name, namespace, appSetApps, appSetClusters)
  // // // first get all applications that belong to this appset
  // const query: SearchQuery = convertStringToQuery(
  //   `name:${appSetApps?.map((application: ResourceItem) => application.metadata?.name).join(',')} kind:application namespace:${namespace} cluster:${appSetClusters.join(',')} apigroup:argoproj.io`
  // )
  // const appsetSearchResult = await searchClient.query({
  //   query: SearchResultItemsAndRelatedItemsDocument,
  //   variables: {
  //     input: [{ ...query }],
  //     limit: 1000,
  //   },
  //   fetchPolicy: 'network-only',
  // })

  const appsetSearchResultItems = [
    {
      __typename: 'SearchResult',
      items: [
        {
          _hostingResource: 'ApplicationSet/openshift-gitops/app-matrix-test-1',
          _uid: 'clc-test/5d925940-82f0-4feb-8717-18516c5913a2',
          apigroup: 'argoproj.io',
          apiversion: 'v1alpha1',
          applicationSet: '',
          chart: '',
          cluster: 'clc-test',
          created: '2025-12-19T16:45:02Z',
          destinationName: '',
          destinationNamespace: 'argo-workflows',
          destinationServer: 'https://kubernetes.default.svc',
          healthStatus: 'Healthy',
          kind: 'Application',
          kind_plural: 'applications',
          label: 'apps.open-cluster-management.io/application-set=true; velero.io/exclude-from-backup=true',
          name: 'app-matrix-test-1-clc-test-argo-workflows',
          namespace: 'openshift-gitops',
          path: '',
          repoURL: '',
          syncStatus: 'Synced',
          targetRevision: 'HEAD',
        },
        {
          _hostingResource: 'ApplicationSet/openshift-gitops/app-matrix-test-1',
          _uid: 'clc-test/5ea49784-6899-4b5a-afbb-fad17473c6cd',
          apigroup: 'argoproj.io',
          apiversion: 'v1alpha1',
          applicationSet: '',
          chart: '',
          cluster: 'clc-test',
          created: '2025-12-19T16:45:02Z',
          destinationName: '',
          destinationNamespace: 'prometheus-operator',
          destinationServer: 'https://kubernetes.default.svc',
          healthStatus: 'Healthy',
          kind: 'Application',
          kind_plural: 'applications',
          label: 'apps.open-cluster-management.io/application-set=true; velero.io/exclude-from-backup=true',
          name: 'app-matrix-test-1-clc-test-prometheus-operator',
          namespace: 'openshift-gitops',
          path: '',
          repoURL: '',
          syncStatus: 'Synced',
          targetRevision: 'HEAD',
        },
      ],
      related: [
        {
          __typename: 'SearchRelatedResult',
          kind: 'ReplicaSet',
          items: [
            {
              _relatedUids: ['clc-test/5ea49784-6899-4b5a-afbb-fad17473c6cd'],
              _uid: 'clc-test/4f71ff52-030d-4e86-956b-b1a162119938',
              apigroup: 'apps',
              apiversion: 'v1',
              cluster: 'clc-test',
              created: '2025-12-19T16:52:48Z',
              current: '1',
              desired: '1',
              kind: 'ReplicaSet',
              kind_plural: 'replicasets',
              label: 'app=helloworld-app; pod-template-hash=f44c4b7fc',
              name: 'helloworld-app-deploy-f44c4b7fc',
              namespace: 'prometheus-operator',
            },
            {
              _relatedUids: ['clc-test/5d925940-82f0-4feb-8717-18516c5913a2'],
              _uid: 'clc-test/fe7a1f99-cc6a-4cc1-b230-d94811a6e957',
              apigroup: 'apps',
              apiversion: 'v1',
              cluster: 'clc-test',
              created: '2025-12-19T16:53:02Z',
              current: '1',
              desired: '1',
              kind: 'ReplicaSet',
              kind_plural: 'replicasets',
              label: 'app=helloworld-app; pod-template-hash=f44c4b7fc',
              name: 'helloworld-app-deploy-f44c4b7fc',
              namespace: 'argo-workflows',
            },
          ],
        },
        {
          __typename: 'SearchRelatedResult',
          kind: 'Service',
          items: [
            {
              _relatedUids: ['clc-test/5d925940-82f0-4feb-8717-18516c5913a2'],
              _uid: 'clc-test/799a3dde-ff45-4dea-903d-ea50870a0e4c',
              apiversion: 'v1',
              cluster: 'clc-test',
              clusterIP: '172.30.156.151',
              created: '2025-12-19T16:53:02Z',
              kind: 'Service',
              kind_plural: 'services',
              label: 'app=helloworld-app',
              name: 'helloworld-app-svc',
              namespace: 'argo-workflows',
              port: '3002:32380/tcp',
              type: 'NodePort',
            },
            {
              _relatedUids: ['clc-test/5ea49784-6899-4b5a-afbb-fad17473c6cd'],
              _uid: 'clc-test/efdbcaab-1357-4958-9d3f-9bec85778763',
              apiversion: 'v1',
              cluster: 'clc-test',
              clusterIP: '172.30.136.97',
              created: '2025-12-19T16:52:48Z',
              kind: 'Service',
              kind_plural: 'services',
              label: 'app=helloworld-app',
              name: 'helloworld-app-svc',
              namespace: 'prometheus-operator',
              port: '3002:30601/tcp',
              type: 'NodePort',
            },
          ],
        },
        {
          __typename: 'SearchRelatedResult',
          kind: 'Route',
          items: [
            {
              _relatedUids: ['clc-test/5ea49784-6899-4b5a-afbb-fad17473c6cd'],
              _uid: 'clc-test/87abd767-4dc5-444b-abc5-08c64834376d',
              apigroup: 'route.openshift.io',
              apiversion: 'v1',
              cluster: 'clc-test',
              created: '2025-12-19T16:52:48Z',
              kind: 'Route',
              kind_plural: 'routes',
              label: 'app=helloworld-app',
              name: 'helloworld-app-route',
              namespace: 'prometheus-operator',
            },
            {
              _relatedUids: ['clc-test/5d925940-82f0-4feb-8717-18516c5913a2'],
              _uid: 'clc-test/ce7dc665-4241-43c9-bdd8-35c2706e131b',
              apigroup: 'route.openshift.io',
              apiversion: 'v1',
              cluster: 'clc-test',
              created: '2025-12-19T16:53:02Z',
              kind: 'Route',
              kind_plural: 'routes',
              label: 'app=helloworld-app',
              name: 'helloworld-app-route',
              namespace: 'argo-workflows',
            },
          ],
        },
        {
          __typename: 'SearchRelatedResult',
          kind: 'Cluster',
          items: [
            {
              HubAcceptedManagedCluster: 'True',
              ManagedClusterConditionAvailable: 'True',
              ManagedClusterConditionClockSynced: 'True',
              ManagedClusterImportSucceeded: 'True',
              ManagedClusterJoined: 'True',
              _hubClusterResource: 'true',
              _relatedUids: [
                'clc-test/5d925940-82f0-4feb-8717-18516c5913a2',
                'clc-test/5ea49784-6899-4b5a-afbb-fad17473c6cd',
              ],
              _uid: 'cluster__clc-test',
              addon:
                'application-manager=true; cert-policy-controller=true; cluster-proxy=true; config-policy-controller=true; governance-policy-framework=true; iam-policy-controller=false; observability-controller=false; search-collector=true; work-manager=true',
              apiEndpoint: 'https://api.clc-test.dev09.red-chesterfield.com:6443',
              apigroup: 'internal.open-cluster-management.io',
              cluster: 'clc-test',
              consoleURL: 'https://console-openshift-console.apps.clc-test.dev09.red-chesterfield.com',
              cpu: '24',
              created: '2025-12-19T14:52:54Z',
              kind: 'Cluster',
              kind_plural: 'managedclusterinfos',
              kubernetesVersion: 'v1.33.6',
              label:
                'cloud=Amazon; cluster.open-cluster-management.io/clusterset=auto-gitops-cluster-set; clusterID=672d88d7-857a-4b1a-a2ae-ac95a26a29d5; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-managed-serviceaccount=available; feature.open-cluster-management.io/addon-search-collector=available; feature.open-cluster-management.io/addon-work-manager=available; name=clc-test; openshiftVersion=4.20.8; openshiftVersion-major=4; openshiftVersion-major-minor=4.20; region=us-east-1; vendor=OpenShift',
              memory: '96418856Ki',
              name: 'clc-test',
              nodes: '6',
            },
          ],
        },
        {
          __typename: 'SearchRelatedResult',
          kind: 'EndpointSlice',
          items: [
            {
              _relatedUids: ['clc-test/5ea49784-6899-4b5a-afbb-fad17473c6cd'],
              _uid: 'clc-test/08584f5d-5603-46f0-a6b7-9fee1c7653e3',
              apigroup: 'discovery.k8s.io',
              apiversion: 'v1',
              cluster: 'clc-test',
              created: '2025-12-19T16:52:48Z',
              kind: 'EndpointSlice',
              kind_plural: 'endpointslices',
              label:
                'app=helloworld-app; endpointslice.kubernetes.io/managed-by=endpointslice-controller.k8s.io; kubernetes.io/service-name=helloworld-app-svc',
              name: 'helloworld-app-svc-mr9n9',
              namespace: 'prometheus-operator',
            },
            {
              _relatedUids: ['clc-test/5d925940-82f0-4feb-8717-18516c5913a2'],
              _uid: 'clc-test/ac91791f-9fbd-4b8a-a79d-0857ebcf0b67',
              apigroup: 'discovery.k8s.io',
              apiversion: 'v1',
              cluster: 'clc-test',
              created: '2025-12-19T16:53:02Z',
              kind: 'EndpointSlice',
              kind_plural: 'endpointslices',
              label:
                'app=helloworld-app; endpointslice.kubernetes.io/managed-by=endpointslice-controller.k8s.io; kubernetes.io/service-name=helloworld-app-svc',
              name: 'helloworld-app-svc-gnxsh',
              namespace: 'argo-workflows',
            },
          ],
        },
        {
          __typename: 'SearchRelatedResult',
          kind: 'Deployment',
          items: [
            {
              _relatedUids: ['clc-test/5d925940-82f0-4feb-8717-18516c5913a2'],
              _uid: 'clc-test/0f87e865-6948-430e-abb4-8306ff757ac1',
              apigroup: 'apps',
              apiversion: 'v1',
              available: '1',
              cluster: 'clc-test',
              created: '2025-12-19T16:53:02Z',
              current: '1',
              desired: '1',
              kind: 'Deployment',
              kind_plural: 'deployments',
              label: 'app=helloworld-app',
              name: 'helloworld-app-deploy',
              namespace: 'argo-workflows',
              ready: '1',
            },
            {
              _relatedUids: ['clc-test/5ea49784-6899-4b5a-afbb-fad17473c6cd'],
              _uid: 'clc-test/bf42569f-811a-4054-a5be-f6c3c8d05ab3',
              apigroup: 'apps',
              apiversion: 'v1',
              available: '1',
              cluster: 'clc-test',
              created: '2025-12-19T16:52:48Z',
              current: '1',
              desired: '1',
              kind: 'Deployment',
              kind_plural: 'deployments',
              label: 'app=helloworld-app',
              name: 'helloworld-app-deploy',
              namespace: 'prometheus-operator',
              ready: '1',
            },
          ],
        },
        {
          __typename: 'SearchRelatedResult',
          kind: 'Pod',
          items: [
            {
              _ownerUID: 'clc-test/fe7a1f99-cc6a-4cc1-b230-d94811a6e957',
              _relatedUids: ['clc-test/5d925940-82f0-4feb-8717-18516c5913a2'],
              _uid: 'clc-test/33cfbd17-2158-468e-b341-b9f39db52a47',
              apiversion: 'v1',
              cluster: 'clc-test',
              condition:
                'ContainersReady=True; Initialized=True; PodReadyToStartContainers=True; PodScheduled=True; Ready=True',
              container: 'helloworld-app-container',
              created: '2025-12-19T16:53:02Z',
              hostIP: '10.0.45.134',
              image: 'quay.io/fxiang1/helloworld:0.0.1',
              kind: 'Pod',
              kind_plural: 'pods',
              label: 'app=helloworld-app; pod-template-hash=f44c4b7fc',
              name: 'helloworld-app-deploy-f44c4b7fc-tkckn',
              namespace: 'argo-workflows',
              podIP: '10.131.2.21',
              restarts: '0',
              startedAt: '2025-12-19T16:53:02Z',
              status: 'Running',
            },
            {
              _ownerUID: 'clc-test/4f71ff52-030d-4e86-956b-b1a162119938',
              _relatedUids: ['clc-test/5ea49784-6899-4b5a-afbb-fad17473c6cd'],
              _uid: 'clc-test/615031f0-9519-4d63-afe7-82c40a7392fa',
              apiversion: 'v1',
              cluster: 'clc-test',
              condition:
                'ContainersReady=True; Initialized=True; PodReadyToStartContainers=True; PodScheduled=True; Ready=True',
              container: 'helloworld-app-container',
              created: '2025-12-19T16:52:48Z',
              hostIP: '10.0.45.134',
              image: 'quay.io/fxiang1/helloworld:0.0.1',
              kind: 'Pod',
              kind_plural: 'pods',
              label: 'app=helloworld-app; pod-template-hash=f44c4b7fc',
              name: 'helloworld-app-deploy-f44c4b7fc-xd8pc',
              namespace: 'prometheus-operator',
              podIP: '10.131.2.20',
              restarts: '0',
              startedAt: '2025-12-19T16:52:48Z',
              status: 'Running',
            },
          ],
        },
      ],
    },
  ]

  // then get all resources that belong to these applications
  const applications = appsetSearchResultItems[0]?.items
  // // Filter out excluded kinds from related results
  const excludedKinds = ['application', 'applicationset', 'cluster', 'subscription', 'namespace', 'pod', 'replicaset']
  const relatedResults = appsetSearchResultItems[0]?.related.filter(
    (relatedResult: SearchRelatedResult | null) =>
      relatedResult && !excludedKinds.includes(relatedResult.kind.toLowerCase())
  )
  // Sort cluster names by length (longest first) to match longer names before shorter ones
  const sortedAppSetClusters = [...appSetClusters].sort((a, b) => b.length - a.length)

  const generatedApplicationNames = new Set<string>()
  const applicationMap: Record<
    string,
    { clusterNames: string[]; applicationNames: string[]; resourceList: ResourceItem[] }
  > = {}
  applications?.forEach((application: ResourceItem) => {
    const compositeName = application.name as string
    const applicationUid = application._uid as string

    // first remove the appset name from the front of the application.name which becomes namePart
    let namePart = compositeName
    if (namePart.startsWith(name)) {
      namePart = namePart.substring(name.length + 1)
    }

    const clusterNames: string[] = []
    const applicationNames: string[] = []

    // find the cluster name that matches the start of namePart (sorted longest first for correct matching)
    const clusterName = sortedAppSetClusters.find((cluster: string) => namePart.startsWith(cluster))
    if (clusterName) {
      clusterNames.push(clusterName)
      // get the part after the cluster name
      let remainingPart = namePart.substring(clusterName.length)
      if (remainingPart.startsWith('-')) {
        remainingPart = remainingPart.substring(1)
      }
      if (remainingPart) {
        applicationNames.push(remainingPart)
      }
    } else {
      // no cluster match found, treat entire namePart as application name
      if (namePart) {
        applicationNames.push(namePart)
      }
    }

    // add unique names to generatedApplicationNames
    applicationNames.forEach((appName) => {
      generatedApplicationNames.add(appName)
    })

    // create the resourceList by taking the application._uid from the application above,
    // then finding a resource in relatedResults whose _relatedUids array is a match with application._uid
    const resourceList: ResourceItem[] = []
    relatedResults?.forEach((relatedResult: SearchRelatedResult | null) => {
      relatedResult?.items?.forEach((item: ResourceItem) => {
        if (item._relatedUids?.includes(applicationUid)) {
          resourceList.push(item)
        }
      })
    })

    applicationMap[applicationUid] = { clusterNames, applicationNames, resourceList }
  })

  // Convert applicationMap to applicationResourceMap
  // For each entry, create entries for each clusterName as key
  // If applicationNames exists, use applicationNames[0] as nested key
  // If no applicationNames, use empty string as the nested key
  const applicationResourceMap: Record<string, Record<string, ResourceItem[]>> = {}

  Object.entries(applicationMap).forEach(([, { clusterNames, applicationNames, resourceList }]) => {
    clusterNames.forEach((clusterName) => {
      if (!applicationResourceMap[clusterName]) {
        applicationResourceMap[clusterName] = {}
      }
      if (applicationNames.length > 0) {
        // Has applicationNames - use applicationNames[0] as key
        applicationResourceMap[clusterName][applicationNames[0]] = resourceList
      } else {
        // No applicationNames - add resourceList directly as value with empty key
        applicationResourceMap[clusterName][''] = resourceList
      }
    })
  })

  return {
    applicationResourceMap,
    generatedApplicationNames: [...generatedApplicationNames],
  }
}

/**
 * Processes resources and creates topology nodes for deployable resources
 * Creates nodes for each resource including child nodes for replicas, controller revisions, etc.
 *
 * @param resources - Array of resources to process
 * @param parentId - ID of the parent node to link resources to
 * @param parentClusterNames - Array of cluster names where resources are deployed
 * @param hubClusterName - Name of the hub cluster
 * @param activeTypes - Active resource types from toolbar filter
 * @param links - Array to add topology links to
 * @param nodes - Array to add topology nodes to
 */
export function processResources(
  resources: ResourceItem[],
  parentId: string,
  parentClusterNames: string[],
  hubClusterName: string,
  activeTypes: string[],
  links: TopologyLink[],
  nodes: TopologyNode[]
): void {
  processMultiples(resources).forEach((deployable: Record<string, unknown>) => {
    const typedDeployable = deployable as unknown as ProcessedDeployableResource
    const {
      name: deployableName,
      namespace: deployableNamespace,
      kind,
      version,
      group,
      resourceCount,
      resources: deployableResources,
    } = typedDeployable
    const type = kind.toLowerCase()

    // Generate unique member ID for the deployable resource
    const memberId = `member--member--deployable--member--clusters--${getClusterName(
      parentId,
      hubClusterName
    )}--${type}--${deployableNamespace}--${deployableName}`

    // Create raw resource object with metadata
    const raw: any = {
      metadata: {
        name: deployableName,
        namespace: deployableNamespace,
      },
      ...typedDeployable,
    }

    // Construct API version from group and version
    let apiVersion: string | null = null
    if (version) {
      apiVersion = group ? `${group}/${version}` : version
    }
    if (apiVersion) {
      raw.apiVersion = apiVersion
    }

    // Create deployable resource node
    let deployableObj: TopologyNode = {
      name: deployableName,
      namespace: deployableNamespace,
      type,
      id: memberId,
      uid: memberId,
      specs: {
        isDesign: false,
        raw,
        clustersNames: parentClusterNames,
        parent: {
          clusterId: parentId,
        },
        resources: deployableResources,
        resourceCount: resourceCount ? resourceCount : parentClusterNames.length,
      },
    }

    // Add deployable node and link to parent
    deployableObj = addTopologyNode(parentId, deployableObj, activeTypes, links, nodes)

    // Create replica child nodes (for Deployments, ReplicaSets, etc.)
    const template = { metadata: {} }
    createReplicaChild(deployableObj, parentClusterNames || [], template, activeTypes, links, nodes)

    // Create controller revision child nodes (for DaemonSets, StatefulSets)
    createControllerRevisionChild(deployableObj, parentClusterNames || [], activeTypes, links, nodes)

    // Create data volume child nodes (for KubeVirt)
    createDataVolumeChild(deployableObj, parentClusterNames || [], activeTypes, links, nodes)

    // Create virtual machine instance child nodes (for KubeVirt)
    createVirtualMachineInstance(deployableObj, parentClusterNames || [], activeTypes, links, nodes)
  })
}

/**
 * Opens the Argo CD editor for a specific application
 * Handles both local hub cluster and remote managed cluster scenarios
 *
 * @param cluster - Target cluster name
 * @param namespace - Application namespace
 * @param name - Application name
 * @param toggleLoading - Function to toggle loading state
 * @param t - Translation function
 * @param hubClusterName - Hub cluster name
 */
export const openArgoCDEditor = (
  cluster: string,
  namespace: string,
  name: string,
  toggleLoading: () => void,
  t: TFunction,
  hubClusterName: string
): void => {
  if (cluster === hubClusterName) {
    // Handle local hub cluster
    toggleLoading()
    getArgoRoute(name, namespace, cluster, undefined, hubClusterName)
    toggleLoading()
  } else {
    // Handle remote managed cluster
    toggleLoading()
    getArgoRouteFromSearch(name, namespace, cluster, t, hubClusterName)
    toggleLoading()
  }
}

/**
 * Retrieves Argo CD route information and opens the editor
 * Supports both direct API calls for hub cluster and ManagedClusterView for remote clusters
 *
 * @param appName - Application name
 * @param appNamespace - Application namespace
 * @param cluster - Target cluster name
 * @param managedclusterviewdata - Optional ManagedClusterView data for remote clusters
 * @param hubClusterName - Hub cluster name
 */
const getArgoRoute = async (
  appName: string,
  appNamespace: string,
  cluster: string,
  managedclusterviewdata: ManagedClusterViewData | undefined,
  hubClusterName: string
): Promise<void> => {
  let routes: any[]
  let argoRoute: RouteObject | undefined

  // Handle hub cluster - direct API call
  if (cluster === hubClusterName) {
    try {
      routes = await listNamespacedResources({
        apiVersion: 'route.openshift.io/v1',
        kind: 'Route',
        metadata: { namespace: appNamespace },
      }).promise
    } catch (err) {
      console.error('Error listing resource:', err)
      return
    }

    if (routes && routes.length > 0) {
      // Filter routes to find Argo CD server routes
      const routeObjs = routes.filter(
        (route: any) =>
          (route.metadata?.labels?.['app.kubernetes.io/part-of'] ?? '') === 'argocd' &&
          (route.metadata?.labels?.['app.kubernetes.io/name'] ?? '').endsWith('-server') &&
          !(route.metadata?.name ?? '').toLowerCase().includes('grafana') &&
          !(route.metadata?.name ?? '').toLowerCase().includes('prometheus')
      )

      argoRoute = routeObjs[0]

      // Prefer routes with 'server' in the name if multiple routes exist
      if (routeObjs.length > 1) {
        const serverRoute = routeObjs.find((route: any) =>
          (route.metadata?.name ?? '').toLowerCase().includes('server')
        )
        if (serverRoute) {
          argoRoute = serverRoute
        }
      }

      if (argoRoute) {
        openArgoEditorWindow(argoRoute, appName)
      }
    }
  } else {
    // Handle remote cluster using ManagedClusterView
    if (!managedclusterviewdata) return

    const { cluster: clusterName, kind, apiVersion, name, namespace } = managedclusterviewdata
    fireManagedClusterView(clusterName, kind, apiVersion, name, namespace)
      .then((viewResponse: any) => {
        if (viewResponse.message) {
          // Handle error case - could add error handling here
        } else {
          openArgoEditorWindow(viewResponse.result, appName)
        }
      })
      .catch((err: any) => {
        console.error('Error getting resource: ', err)
      })
  }
}

/**
 * Opens a route URL in a new browser window
 * Handles both hub cluster direct access and remote cluster ManagedClusterView access
 *
 * @param routeObject - Route object containing metadata and cluster information
 * @param toggleLoading - Function to toggle loading state
 * @param hubClusterName - Hub cluster name
 */
export const openRouteURL = (
  routeObject: {
    name?: string
    namespace?: string
    cluster?: string
    kind?: string
    apigroup?: string
    apiversion?: string
  },
  toggleLoading: () => void,
  hubClusterName: string
): void => {
  const name = routeObject.name ?? ''
  const namespace = routeObject.namespace ?? ''
  const cluster = routeObject.cluster ?? ''
  const kind = routeObject.kind ?? ''
  const apigroup = routeObject.apigroup ?? ''
  const apiversion = routeObject.apiversion ?? ''
  const apiVersion = `${apigroup}/${apiversion}`

  toggleLoading()

  if (cluster === hubClusterName) {
    // Handle hub cluster - direct API access
    const route = getResource({ apiVersion, kind, metadata: { namespace, name } }).promise
    route
      .then((result: RouteObject) => {
        toggleLoading()
        openRouteURLWindow(result)
      })
      .catch((err: any) => {
        toggleLoading()
        console.error('Error getting resource: ', err)
      })
  } else {
    // Handle remote cluster using ManagedClusterView
    fireManagedClusterView(cluster, kind, apiVersion, name, namespace)
      .then((viewResponse: any) => {
        toggleLoading()
        if (viewResponse.message) {
          // Handle error case - could add error handling here
        } else {
          openRouteURLWindow(viewResponse.result)
        }
      })
      .catch((err: any) => {
        toggleLoading()
        console.error('Error getting resource: ', err)
      })
  }
}

/**
 * Searches for Argo CD routes using the search API
 * Used when accessing Argo CD on remote managed clusters
 *
 * @param appName - Application name
 * @param appNamespace - Application namespace
 * @param cluster - Target cluster name
 * @param t - Translation function
 * @param hubClusterName - Hub cluster name
 */
const getArgoRouteFromSearch = async (
  appName: string,
  appNamespace: string,
  cluster: string,
  t: TFunction,
  hubClusterName: string
): Promise<void> => {
  // Build search query for Argo CD routes
  const query: SearchQuery = convertStringToQuery(
    `kind:route namespace:${appNamespace} cluster:${cluster} label:app.kubernetes.io/part-of=argocd`
  )

  try {
    const result = await searchClient.query({
      query: SearchResultItemsAndRelatedItemsDocument,
      variables: {
        input: [{ ...query }],
        limit: 1000,
      },
      fetchPolicy: 'network-only',
    })

    if (result.errors) {
      console.log(`Error: ${result.errors[0].message}`)
      return
    }

    const searchResult = result.data?.searchResult ?? []
    if (searchResult.length > 0) {
      let route: any = null

      // Filter out Grafana and Prometheus routes
      const routes = (searchResult[0]?.items ?? []).filter(
        (routeObj: any) =>
          !(routeObj.name ?? '').toLowerCase().includes('grafana') &&
          !(routeObj.name ?? '').toLowerCase().includes('prometheus')
      )

      if (routes.length > 0) {
        // Prefer routes with 'server' in the name
        const serverRoute = routes.find((routeObj: any) => (routeObj.name ?? '').toLowerCase().includes('server'))
        if (serverRoute) {
          route = serverRoute
        } else {
          route = routes[0]
        }
      }

      if (!route) {
        const errMsg = t('No Argo route found for namespace {0} on cluster {1}', [appNamespace, cluster])
        console.log(errMsg)
        return
      }

      // Use the found route to get the actual route resource
      await getArgoRoute(
        appName,
        appNamespace,
        cluster,
        {
          cluster,
          name: route.name,
          namespace: route.namespace,
          kind: 'Route',
          apiVersion: 'route.openshift.io/v1',
        },
        hubClusterName
      )
    }
  } catch (error) {
    console.error('Error searching for Argo route:', error)
  }
}

/**
 * Opens the Argo CD editor in a new browser window
 * Constructs the URL from the route specification
 *
 * @param route - Route object containing host and TLS information
 * @param appName - Application name to navigate to
 */
const openArgoEditorWindow = (route: RouteObject, appName: string): void => {
  const hostName = route.spec?.host ?? 'unknown'
  const transport = route.spec?.tls ? 'https' : 'http'
  const argoURL = `${transport}://${hostName}/applications`
  window.open(`${argoURL}/${appName}`, '_blank')
}

/**
 * Opens a route URL in a new browser window
 * Constructs the URL from the route specification
 *
 * @param route - Route object containing host and TLS information
 */
const openRouteURLWindow = (route: RouteObject): void => {
  const hostName = route.spec?.host ?? 'unknown'
  const transport = route.spec?.tls ? 'https' : 'http'
  const routeURL = `${transport}://${hostName}`
  window.open(`${routeURL}`, '_blank')
}
