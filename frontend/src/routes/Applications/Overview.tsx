/* Copyright Contributors to the Open Cluster Management project */

import { PageSection, Text, TextContent, TextVariants } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { cellWidth } from '@patternfly/react-table'
import { AcmDropdown, AcmEmptyState, AcmTable, IAcmRowAction, IAcmTableColumn } from '@stolostron/ui-components'
import { TFunction } from 'i18next'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useHistory } from 'react-router'
import { Link } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import {
    applicationSetsState,
    applicationsState,
    argoApplicationsState,
    channelsState,
    discoveredApplicationsState,
    discoveredKustomizationsState,
    discoveredOCPAppResourcesState,
    namespacesState,
    placementRulesState,
    subscriptionsState,
} from '../../atoms'
import { Trans, useTranslation } from '../../lib/acm-i18next'
import { DOC_LINKS, viewDocumentation } from '../../lib/doc-util'
import { checkPermission, rbacCreate, rbacDelete } from '../../lib/rbac-util'
import { NavigationPath } from '../../NavigationPath'
import {
    ApplicationApiVersion,
    ApplicationDefinition,
    ApplicationKind,
    ApplicationSet,
    ApplicationSetApiVersion,
    ApplicationSetDefinition,
    ApplicationSetKind,
    ArgoApplication,
    ArgoApplicationApiVersion,
    ArgoApplicationKind,
    Channel,
    CronJobDefinition,
    CronJobKind,
    DaemonSetDefinition,
    DaemonSetKind,
    DeploymentConfigDefinition,
    DeploymentConfigKind,
    DeploymentDefinition,
    DeploymentKind,
    DiscoveredArgoApplicationDefinition,
    getApiVersionResourceGroup,
    IResource,
    JobDefinition,
    JobKind,
    Kustomization,
    KustomizationApiVersion,
    KustomizationDefinition,
    KustomizationKind,
    OCPAppResource,
    StatefulSetDefinition,
    StatefulSetKind,
    Subscription,
} from '../../resources'
import { useAllClusters } from '../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import { DeleteResourceModal, IDeleteResourceModalProps } from './components/DeleteResourceModal'
import ResourceLabels from './components/ResourceLabels'
import { argoAppSetQueryString, subscriptionAppQueryString } from './CreateApplication/actions'
import {
    getAge,
    getAppChildResources,
    getAppSetRelatedResources,
    getClusterCount,
    getClusterCountField,
    getClusterCountSearchLink,
    getClusterCountString,
    getClusterList,
    getSearchLink,
    getSubscriptionsFromAnnotation,
    hostingSubAnnotationStr,
    isArgoApp,
    isResourceTypeOf,
} from './helpers/resource-helper'
import { isLocalSubscription } from './helpers/subscriptions'

const gitBranchAnnotationStr = 'apps.open-cluster-management.io/git-branch'
const gitPathAnnotationStr = 'apps.open-cluster-management.io/git-path'
const localClusterStr = 'local-cluster'

type IApplicationResource = IResource | OCPAppResource

// Map resource kind to type column
function getApplicationType(resource: IResource, t: TFunction) {
    if (resource.apiVersion === ApplicationApiVersion) {
        if (resource.kind === ApplicationKind) {
            return 'Subscription'
        }
    } else if (resource.apiVersion === ArgoApplicationApiVersion) {
        if (resource.kind === ArgoApplicationKind) {
            return t('Discovered')
        } else if (resource.kind === ApplicationSetKind) {
            return t('ApplicationSet')
        }
    } else if (['apps/v1', 'batch/v1', 'v1'].includes(resource.apiVersion)) {
        return t('Openshift')
    } else if (resource.apiVersion === KustomizationApiVersion) {
        return t('Flux')
    }
    return '-'
}

export function getAppSetApps(argoApps: IResource[], appSetName: string) {
    const appSetApps: string[] = []

    argoApps.forEach((app) => {
        if (app.metadata?.ownerReferences && app.metadata.ownerReferences[0].name === appSetName) {
            appSetApps.push(app.metadata.name!)
        }
    })

    return appSetApps
}

export function getAnnotation(resource: IResource, annotationString: string) {
    return resource.metadata?.annotations !== undefined ? resource.metadata?.annotations[annotationString] : undefined
}

function getAppNamespace(resource: IResource) {
    let castType
    if (resource.apiVersion === ArgoApplicationApiVersion && resource.kind === ArgoApplicationKind) {
        castType = resource as ArgoApplication
        return castType.spec.destination.namespace
    }

    return resource.metadata?.namespace
}

export const getApplicationRepos = (resource: IResource, subscriptions: Subscription[], channels: Channel[]) => {
    let castType
    if (resource.apiVersion === ApplicationApiVersion) {
        if (resource.kind === ApplicationKind) {
            const subAnnotations = getSubscriptionsFromAnnotation(resource)
            const appRepos: any[] = []

            for (let i = 0; i < subAnnotations.length; i++) {
                if (isLocalSubscription(subAnnotations[i], subAnnotations)) {
                    // skip local sub
                    continue
                }
                const subDetails = subAnnotations[i].split('/')

                subscriptions.forEach((sub) => {
                    if (sub.metadata.name === subDetails[1] && sub.metadata.namespace === subDetails[0]) {
                        const channelStr = sub.spec.channel

                        if (channelStr) {
                            const chnDetails = channelStr?.split('/')
                            const channel = channels.find(
                                (chn) => chn.metadata.name === chnDetails[1] && chn.metadata.namespace === chnDetails[0]
                            )

                            appRepos.push({
                                type: channel?.spec.type,
                                pathName: channel?.spec.pathname,
                                gitBranch: getAnnotation(sub, gitBranchAnnotationStr),
                                gitPath: getAnnotation(sub, gitPathAnnotationStr),
                                package: sub.spec.name,
                                packageFilterVersion: sub.spec.packageFilter?.version,
                            })
                        }
                    }
                })
            }
            return appRepos
        }
    } else if (resource.apiVersion === ArgoApplicationApiVersion) {
        if (resource.kind === ArgoApplicationKind) {
            castType = resource as ArgoApplication
            return [
                {
                    type: castType.spec.source.path ? 'git' : 'helmrepo',
                    pathName: castType.spec.source.repoURL,
                    gitPath: castType.spec.source.path,
                    chart: castType.spec.source.chart,
                    targetRevision: castType.spec.source.targetRevision,
                },
            ]
        } else if (resource.kind === ApplicationSetKind) {
            castType = resource as ApplicationSet
            return [
                {
                    type: castType.spec.template?.spec?.source.path ? 'git' : 'helmrepo',
                    pathName: castType.spec.template?.spec?.source.repoURL,
                    gitPath: castType.spec.template?.spec?.source.path,
                    chart: castType.spec.template?.spec?.source.chart,
                    targetRevision: castType.spec.template?.spec?.source.targetRevision,
                },
            ]
        }
    }
}

export default function ApplicationsOverview() {
    const { t } = useTranslation()

    const [applications] = useRecoilState(applicationsState)
    const [applicationSets] = useRecoilState(applicationSetsState)
    const [argoApplications] = useRecoilState(argoApplicationsState)
    const [subscriptions] = useRecoilState(subscriptionsState)
    const [channels] = useRecoilState(channelsState)
    const [placementRules] = useRecoilState(placementRulesState)
    const [namespaces] = useRecoilState(namespacesState)

    const [discoveredOCPAppResources] = useRecoilState(discoveredOCPAppResourcesState)
    const [kustomizations] = useRecoilState(discoveredKustomizationsState)

    const fluxAppresources: IResource[] = useMemo(
        () =>
            kustomizations.filter((item: any) => {
                const labels = item.label
                return (
                    labels &&
                    labels.includes('kustomize.toolkit.fluxcd.io/name') &&
                    labels.includes('kustomize.toolkit.fluxcd.io/namespace')
                )
            }),
        [kustomizations]
    )

    const allClusters = useAllClusters()
    const managedClusters = useMemo(
        () =>
            allClusters.filter((cluster) => {
                // don't show clusters in cluster pools in table
                if (cluster.hive.clusterPool) {
                    return cluster.hive.clusterClaimName !== undefined
                } else {
                    return true
                }
            }),
        [allClusters]
    )
    const localCluster = useMemo(() => managedClusters.find((cls) => cls.name === localClusterStr), [managedClusters])
    const [modalProps, setModalProps] = useState<IDeleteResourceModalProps | { open: false }>({
        open: false,
    })
    const [discoveredApplications] = useRecoilState(discoveredApplicationsState)

    const getTimeWindow = useCallback(
        (app: IResource) => {
            if (!(app.apiVersion === ApplicationApiVersion && app.kind === ApplicationKind)) {
                return ''
            }

            const subAnnotations = getSubscriptionsFromAnnotation(app)
            let hasTimeWindow = false

            for (let i = 0; i < subAnnotations.length; i++) {
                if (isLocalSubscription(subAnnotations[i], subAnnotations)) {
                    // skip local sub
                    continue
                }
                const subDetails = subAnnotations[i].split('/')

                for (let j = 0; j < subscriptions.length; j++) {
                    if (
                        subscriptions[j].metadata.name === subDetails[1] &&
                        subscriptions[j].metadata.namespace === subDetails[0]
                    ) {
                        if (subscriptions[j].spec.timewindow) {
                            hasTimeWindow = true
                            break
                        }
                    }
                }
            }

            return hasTimeWindow ? t('Yes') : ''
        },
        [subscriptions, t]
    )

    // Cache cell text for sorting and searching
    const generateTransformData = useCallback(
        (tableItem: IResource) => {
            // Cluster column
            const clusterList = getClusterList(
                tableItem,
                argoApplications,
                placementRules,
                subscriptions,
                localCluster,
                managedClusters
            )
            const clusterCount = getClusterCount(clusterList)
            const clusterTransformData = getClusterCountString(t, clusterCount, clusterList, tableItem)

            // Resource column
            const resourceMap: { [key: string]: string } = {}
            const appRepos = getApplicationRepos(tableItem, subscriptions, channels)
            let resourceText = ''
            appRepos?.forEach((repo) => {
                if (!resourceMap[repo.type]) {
                    resourceText = resourceText + repo.type
                }
                resourceMap[repo.type] = repo.type
            })

            const timeWindow = getTimeWindow(tableItem)
            const transformedNamespace = getAppNamespace(tableItem)
            const transformedObject = {
                transformed: {
                    clusterCount: clusterTransformData,
                    resourceText: resourceText,
                    createdText: getAge(tableItem, '', 'metadata.creationTimestamp'),
                    timeWindow: timeWindow,
                    namespace: transformedNamespace,
                },
            }

            // Cannot add properties directly to objects in typescript
            return { ...tableItem, ...transformedObject }
        },
        [argoApplications, channels, getTimeWindow, localCluster, managedClusters, placementRules, subscriptions, t]
    )

    // Combine all application types
    const applicationTableItems = useMemo(
        () => applications.map(generateTransformData),
        [applications, generateTransformData]
    )

    const applicationSetsTableItems = useMemo(
        () => applicationSets.map(generateTransformData),
        [applicationSets, generateTransformData]
    )

    const argoApplicationTableItems = useMemo(
        () =>
            argoApplications
                .filter((argoApp) => {
                    const isChildOfAppset =
                        argoApp.metadata.ownerReferences &&
                        argoApp.metadata.ownerReferences[0].kind === ApplicationSetKind
                    if (!argoApp.metadata.ownerReferences || !isChildOfAppset) {
                        return true
                    }
                    return false
                })
                .map(generateTransformData),
        [argoApplications, generateTransformData]
    )

    const discoveredApplicationsTableItems = useMemo(() => {
        return discoveredApplications.map((remoteArgoApp: any) =>
            generateTransformData({
                apiVersion: ArgoApplicationApiVersion,
                kind: ArgoApplicationKind,
                metadata: {
                    name: remoteArgoApp.name,
                    namespace: remoteArgoApp.namespace,
                    creationTimestamp: remoteArgoApp.created,
                },
                spec: {
                    destination: {
                        namespace: remoteArgoApp.destinationNamespace,
                        name: remoteArgoApp.destinationName,
                        server: remoteArgoApp.destinationCluster,
                    },
                    source: {
                        path: remoteArgoApp.path,
                        repoURL: remoteArgoApp.repoURL,
                        targetRevision: remoteArgoApp.targetRevision,
                        chart: remoteArgoApp.chart,
                    },
                },
                status: {
                    cluster: remoteArgoApp.cluster,
                },
            } as ArgoApplication)
        )
    }, [discoveredApplications, generateTransformData])

    const ocpAppResourceTableItems = useMemo(() => {
        return discoveredOCPAppResources
            .filter(({ label }) => {
                return label && (label.includes('app=') || label.includes('app.kubernetes.io/part-of='))
            })
            .map((remoteOCPApp: any) =>
                generateTransformData({
                    apiVersion: remoteOCPApp.apigroup
                        ? `${remoteOCPApp.apigroup}/${remoteOCPApp.apiversion}`
                        : remoteOCPApp.apiversion,
                    kind: remoteOCPApp.kind,
                    metadata: {
                        name: remoteOCPApp.name,
                        namespace: remoteOCPApp.namespace,
                        creationTimestamp: remoteOCPApp.created,
                    },
                    status: {
                        cluster: remoteOCPApp.cluster,
                    },
                } as OCPAppResource)
            )
    }, [discoveredOCPAppResources, generateTransformData])

    const fluxApplicationTableItems = useMemo(() => {
        return fluxAppresources.map((fluxApp: any) =>
            generateTransformData({
                apiVersion: fluxApp.apigroup ? `${fluxApp.apigroup}/${fluxApp.apiversion}` : fluxApp.apiversion,
                kind: fluxApp.kind,
                metadata: {
                    name: fluxApp.name,
                    namespace: fluxApp.namespace,
                    creationTimestamp: fluxApp.created,
                },
                status: {
                    cluster: fluxApp.cluster,
                },
            } as Kustomization)
        )
    }, [fluxAppresources, generateTransformData])

    const tableItems: IResource[] = useMemo(
        () => [
            ...applicationTableItems,
            ...applicationSetsTableItems,
            ...argoApplicationTableItems,
            ...discoveredApplicationsTableItems,
            ...ocpAppResourceTableItems,
            ...fluxApplicationTableItems,
        ],
        [
            applicationSetsTableItems,
            applicationTableItems,
            argoApplicationTableItems,
            discoveredApplicationsTableItems,
            ocpAppResourceTableItems,
            fluxApplicationTableItems,
        ]
    )

    const keyFn = useCallback(
        (resource: IResource) => resource.metadata!.uid ?? `${resource.metadata!.namespace}/${resource.metadata!.name}`,
        []
    )
    const columns = useMemo<IAcmTableColumn<IApplicationResource>[]>(
        () => [
            {
                header: t('Name'),
                sort: 'metadata.name',
                search: 'metadata.name',
                transforms: [cellWidth(20)],
                cell: (application) => {
                    let clusterQuery = ''
                    if (
                        application.apiVersion === ArgoApplicationApiVersion &&
                        application.kind === ArgoApplicationKind
                    ) {
                        const cluster = application?.status?.cluster
                        clusterQuery = cluster ? `&cluster=${cluster}` : ''
                    }
                    return (
                        <span style={{ whiteSpace: 'nowrap' }}>
                            <Link
                                to={
                                    NavigationPath.applicationDetails
                                        .replace(':namespace', application.metadata?.namespace as string)
                                        .replace(':name', application.metadata?.name as string) +
                                    '?apiVersion=' +
                                    application.kind.toLowerCase() +
                                    '.' +
                                    application.apiVersion.split('/')[0] +
                                    clusterQuery
                                }
                            >
                                {application.metadata?.name}
                            </Link>
                        </span>
                    )
                },
            },
            {
                header: t('Type'),
                cell: (resource) => <span>{getApplicationType(resource, t)}</span>,
                sort: 'kind',
                tooltip: () => (
                    <span>
                        {t('Displays the type of the application. ')}
                        <TextContent>
                            <Text
                                component={TextVariants.a}
                                isVisitedLink
                                href={DOC_LINKS.MANAGE_APPLICATIONS}
                                target="_blank"
                                style={{
                                    cursor: 'pointer',
                                    display: 'inline-block',
                                    padding: '0px',
                                    fontSize: '14px',
                                    color: '#0066cc',
                                }}
                            >
                                {t('View documentation')} <ExternalLinkAltIcon />
                            </Text>
                        </TextContent>
                    </span>
                ),
                transforms: [cellWidth(15)],
                // probably don't need search if we have a type filter
            },
            {
                header: t('Namespace'),
                cell: (resource) => getAppNamespace(resource),
                sort: 'transformed.namespace',
                search: 'transformed.namespace',
                tooltip: t(
                    'Displays the namespace of the application resource, which by default is where the application deploys other resources. For Argo applications, this is the destination namespace.'
                ),
                transforms: [cellWidth(20)],
            },
            {
                header: t('Clusters'),
                cell: (resource) => {
                    const clusterList = getClusterList(
                        resource,
                        argoApplications,
                        placementRules,
                        subscriptions,
                        localCluster,
                        managedClusters
                    )
                    const clusterCount = getClusterCount(clusterList)
                    const clusterCountString = getClusterCountString(t, clusterCount, clusterList, resource)
                    const clusterCountSearchLink = getClusterCountSearchLink(resource, clusterCount, clusterList)
                    return getClusterCountField(clusterCount, clusterCountString, clusterCountSearchLink)
                },
                tooltip: t(
                    'Displays the number of remote and local clusters where resources for the application are deployed. For an individual Argo application, the name of the destination cluster is displayed. Click to search for all related clusters.'
                ),
                sort: 'transformed.clusterCount',
                search: 'transformed.clusterCount',
            },
            {
                header: t('Resource'),
                cell: (resource) => {
                    const appRepos = getApplicationRepos(resource, subscriptions, channels)
                    return (
                        <ResourceLabels
                            appRepos={appRepos!}
                            showSubscriptionAttributes={true}
                            isArgoApp={isArgoApp(resource) || isResourceTypeOf(resource, ApplicationSetDefinition)}
                            translation={t}
                        />
                    )
                },
                tooltip: t('Provides links to each of the resource repositories used by the application.'),
                sort: 'transformed.resourceText',
                search: 'transformed.resourceText',
            },
            {
                header: t('Time window'),
                cell: (resource) => {
                    return getTimeWindow(resource)
                },
                tooltip: t(
                    'Indicates if updates to any of the application resources are subject to a deployment time window.'
                ),
                sort: 'transformed.timeWindow',
                search: 'transformed.timeWindow',
            },
            {
                header: t('Created'),
                cell: (resource) => {
                    return <span>{getAge(resource, '', 'metadata.creationTimestamp')}</span>
                },
                sort: 'metadata.creationTimestamp',
                search: 'transformed.createdText',
            },
        ],
        [argoApplications, channels, getTimeWindow, localCluster, placementRules, subscriptions, t, managedClusters]
    )

    const filters = useMemo(
        () => [
            {
                label: t('Type'),
                id: 'table.filter.type.acm.application.label',
                options: [
                    {
                        label: t('Subscription'),
                        value: `${getApiVersionResourceGroup(ApplicationApiVersion)}/${ApplicationKind}`,
                    },
                    {
                        label: t('Argo CD'),
                        value: `${getApiVersionResourceGroup(ArgoApplicationApiVersion)}/${ArgoApplicationKind}`,
                    },
                    {
                        label: t('Application Set'),
                        value: `${getApiVersionResourceGroup(ApplicationSetApiVersion)}/${ApplicationSetKind}`,
                    },
                    {
                        label: t('Flux'),
                        value: `${getApiVersionResourceGroup(KustomizationApiVersion)}/${KustomizationKind}`,
                    },
                    // TBD Openshift
                ],
                tableFilterFn: (selectedValues: string[], item: IResource) => {
                    return selectedValues.includes(`${getApiVersionResourceGroup(item.apiVersion)}/${item.kind}`)
                },
            },
        ],
        [t]
    )

    const history = useHistory()
    const [canCreateApplication, setCanCreateApplication] = useState<boolean>(false)
    const [canDeleteApplication, setCanDeleteApplication] = useState<boolean>(false)
    const [canDeleteApplicationSet, setCanDeleteApplicationSet] = useState<boolean>(false)

    const rowActionResolver = useCallback(
        (resource: IResource) => {
            const actions: IAcmRowAction<any>[] = []

            if (isResourceTypeOf(resource, ApplicationDefinition)) {
                actions.push({
                    id: 'viewApplication',
                    title: t('View application'),
                    click: () => {
                        history.push(
                            `${
                                NavigationPath.applicationOverview
                                    .replace(':namespace', resource.metadata?.namespace as string)
                                    .replace(':name', resource.metadata?.name as string) + subscriptionAppQueryString
                            }`
                        )
                    },
                })
                actions.push({
                    id: 'editApplication',
                    title: t('Edit application'),
                    click: () => {
                        history.push(
                            NavigationPath.editApplicationSubscription
                                .replace(':namespace', resource.metadata?.namespace as string)
                                .replace(':name', resource.metadata?.name as string) + '?context=applications'
                        )
                    },
                })
            }

            if (isResourceTypeOf(resource, ApplicationSetDefinition)) {
                actions.push({
                    id: 'viewApplication',
                    title: t('View application'),
                    click: () => {
                        history.push(
                            `${NavigationPath.applicationOverview
                                .replace(':namespace', resource.metadata?.namespace as string)
                                .replace(':name', resource.metadata?.name as string)}${argoAppSetQueryString}`
                        )
                    },
                })
                actions.push({
                    id: 'editApplication',
                    title: t('Edit application'),
                    click: () => {
                        history.push(
                            NavigationPath.editApplicationArgo
                                .replace(':namespace', resource.metadata?.namespace as string)
                                .replace(':name', resource.metadata?.name as string) + '?context=applicationsets'
                        )
                    },
                })
            }

            if (isResourceTypeOf(resource, DiscoveredArgoApplicationDefinition)) {
                actions.push({
                    id: 'viewApplication',
                    title: t('View application'),
                    click: () => {
                        history.push(
                            `${NavigationPath.applicationOverview
                                .replace(':namespace', resource.metadata?.namespace as string)
                                .replace(
                                    ':name',
                                    resource.metadata?.name as string
                                )}?apiVersion=application.argoproj.io`
                        )
                    },
                })
            }

            actions.push({
                id: 'searchApplication',
                title: t('Search application'),
                click: () => {
                    const [apigroup, apiversion] = resource.apiVersion.split('/')
                    const { cluster } = resource.status
                    const searchLink = getSearchLink({
                        properties: {
                            name: resource.metadata?.name,
                            namespace: resource.metadata?.namespace,
                            kind: resource.kind.toLowerCase(),
                            apigroup,
                            apiversion,
                            cluster: cluster ? cluster : 'local-cluster',
                        },
                    })
                    history.push(searchLink)
                },
            })

            if (
                isResourceTypeOf(resource, [
                    CronJobDefinition,
                    DaemonSetDefinition,
                    DeploymentDefinition,
                    DeploymentConfigDefinition,
                    JobDefinition,
                    StatefulSetDefinition,
                ])
            ) {
                actions.push({
                    id: 'viewApplication',
                    title: t('View application'),
                    click: () => {
                        history.push(
                            `${NavigationPath.applicationOverview
                                .replace(':namespace', resource.metadata?.namespace as string)
                                .replace(
                                    ':name',
                                    resource.metadata?.name as string
                                )}?apiVersion=ocp&cluster=local-cluster`
                        )
                    },
                })
            }

            if (isResourceTypeOf(resource, KustomizationDefinition)) {
                actions.push({
                    id: 'viewApplication',
                    title: t('View application'),
                    click: () => {
                        history.push(
                            // TBD - may need to refactor the url
                            `${NavigationPath.applicationOverview
                                .replace(':namespace', resource.metadata?.namespace as string)
                                .replace(
                                    ':name',
                                    resource.metadata?.name as string
                                )}?'apiVersion=flux&cluster=local-cluster'`
                        )
                    },
                })
            }

            if (
                [CronJobKind, DaemonSetKind, DeploymentKind, DeploymentConfigKind, JobKind, StatefulSetKind]
                    .map((kind) => kind.toLowerCase())
                    .includes(resource.kind)
            ) {
                actions.push({
                    id: 'viewApplication',
                    title: t('View application'),
                    click: () => {
                        history.push(
                            `${NavigationPath.applicationOverview
                                .replace(':namespace', resource.metadata?.namespace as string)
                                .replace(':name', resource.metadata?.name as string)}?apiVersion=ocp&cluster=${
                                resource.status.cluster
                            }`
                        )
                    },
                })
            }

            if (
                isResourceTypeOf(resource, ApplicationDefinition) ||
                isResourceTypeOf(resource, ApplicationSetDefinition)
            ) {
                actions.push({
                    id: 'deleteApplication',
                    title: t('Delete application'),
                    click: () => {
                        const appChildResources =
                            resource.kind === ApplicationKind
                                ? getAppChildResources(resource, applications, subscriptions, placementRules, channels)
                                : [[], []]
                        const appSetRelatedResources =
                            resource.kind === ApplicationSetKind
                                ? getAppSetRelatedResources(resource, applicationSets)
                                : ['', []]
                        const hostingSubAnnotation = getAnnotation(resource, hostingSubAnnotationStr)
                        let modalWarnings: string | undefined
                        if (hostingSubAnnotation) {
                            const subName = hostingSubAnnotation.split('/')[1]
                            modalWarnings = t(
                                'This application is deployed by the subscription {{subName}}. The delete action might be reverted when resources are reconciled with the resource repository.',
                                { subName }
                            )
                        }
                        setModalProps({
                            open: true,
                            canRemove:
                                resource.kind === ApplicationSetKind ? canDeleteApplicationSet : canDeleteApplication,
                            resource: resource,
                            errors: undefined,
                            warnings: modalWarnings,
                            loading: false,
                            selected: appChildResources[0], // children
                            shared: appChildResources[1], // shared children
                            appSetPlacement: appSetRelatedResources[0],
                            appSetsSharingPlacement: appSetRelatedResources[1],
                            appKind: resource.kind,
                            appSetApps: getAppSetApps(argoApplications, resource.metadata?.name!),
                            close: () => {
                                setModalProps({ open: false })
                            },
                            t,
                        })
                    },
                    isDisabled: resource.kind === ApplicationSetKind ? !canDeleteApplicationSet : !canDeleteApplication,
                })
            }

            return actions
        },
        [
            applicationSets,
            applications,
            argoApplications,
            canDeleteApplication,
            canDeleteApplicationSet,
            channels,
            history,
            placementRules,
            subscriptions,
            t,
        ]
    )

    useEffect(() => {
        checkPermission(rbacCreate(ApplicationDefinition), setCanCreateApplication, namespaces)
    }, [namespaces])
    useEffect(() => {
        checkPermission(rbacDelete(ApplicationDefinition), setCanDeleteApplication, namespaces)
    }, [namespaces])
    useEffect(() => {
        checkPermission(rbacDelete(ApplicationSetDefinition), setCanDeleteApplicationSet, namespaces)
    }, [namespaces])

    const appCreationButton = useMemo(
        () => (
            <AcmDropdown
                isDisabled={!canCreateApplication}
                tooltip={!canCreateApplication ? t('rbac.unauthorized') : ''}
                id={'application-create'}
                onSelect={(id) => {
                    id === 'create-argo'
                        ? history.push(NavigationPath.createApplicationArgo)
                        : history.push(NavigationPath.createApplicationSubscription)
                }}
                text={'Create application'}
                dropdownItems={[
                    {
                        id: 'psuedo.group.label',
                        isDisabled: true,
                        text: <span style={{ fontSize: '14px' }}>Choose a type</span>,
                    },
                    {
                        id: 'create-argo',
                        text: 'ApplicationSet',
                        isDisabled: false,
                        path: NavigationPath.createApplicationArgo,
                    },
                    {
                        id: 'create-subscription',
                        text: 'Subscription',
                        isDisabled: false,
                        path: NavigationPath.createApplicationSubscription,
                    },
                ]}
                isKebab={false}
                isPlain={true}
                isPrimary={true}
                // tooltipPosition={tableDropdown.tooltipPosition}
                // dropdownPosition={DropdownPosition.left}
            />
        ),
        [canCreateApplication, history, t]
    )

    return (
        <PageSection>
            <DeleteResourceModal {...modalProps} />
            <AcmTable<IResource>
                key="data-table"
                plural={t('Applications')}
                columns={columns}
                keyFn={keyFn}
                items={tableItems}
                filters={filters}
                customTableAction={appCreationButton}
                emptyState={
                    <AcmEmptyState
                        key="appOverviewEmptyState"
                        title={t("You don't have any applications")}
                        message={
                            <Text>
                                <Trans
                                    i18nKey="Click <bold>Create application</bold> to create your resource."
                                    components={{ bold: <strong /> }}
                                />
                            </Text>
                        }
                        action={
                            <>
                                {appCreationButton}
                                <TextContent>{viewDocumentation(DOC_LINKS.MANAGE_APPLICATIONS, t)}</TextContent>
                            </>
                        }
                    />
                }
                rowActionResolver={rowActionResolver}
            />
        </PageSection>
    )
}
