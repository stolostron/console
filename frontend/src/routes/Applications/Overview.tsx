/* Copyright Contributors to the Open Cluster Management project */

import { AcmDropdown, AcmEmptyState, AcmTable, IAcmRowAction, IAcmTableColumn } from '@stolostron/ui-components'
import { PageSection, Text, TextContent, TextVariants } from '@patternfly/react-core'
import { cellWidth } from '@patternfly/react-table'
import _ from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { TFunction } from 'react-i18next'
import { useHistory } from 'react-router'
import { useRecoilState } from 'recoil'
import {
    applicationsState,
    applicationSetsState,
    argoApplicationsState,
    subscriptionsState,
    channelsState,
    placementRulesState,
    managedClustersState,
} from '../../atoms'
import {
    ApplicationApiVersion,
    ApplicationKind,
    ArgoApplication,
    ArgoApplicationApiVersion,
    ArgoApplicationKind,
    ApplicationSetKind,
    IResource,
    ApplicationSet,
    ApplicationDefinition,
    ApplicationSetDefinition,
    Channel,
    SubscriptionKind,
    SubscriptionApiVersion,
    Subscription,
    PlacementRuleKind,
    PlacementRuleApiVersion,
} from '../../resources'
import ResourceLabels from './components/ResourceLabels'
import {
    createClustersText,
    isArgoApp,
    getAge,
    getSubscriptionsFromAnnotation,
    getSearchLink,
    subAnnotationStr,
} from './helpers/resource-helper'
import { canUser } from '../../lib/rbac-util'
import { Link } from 'react-router-dom'
import { DeleteResourceModal, IDeleteResourceModalProps } from './components/DeleteResourceModal'
import { useQuery } from '../../lib/useQuery'
import { queryRemoteArgoApps } from '../../lib/search'
import { NavigationPath } from '../../NavigationPath'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { DOC_LINKS } from '../../lib/doc-util'

const hostingSubAnnotationStr = 'apps.open-cluster-management.io/hosting-subscription'
const hostingDeployableAnnotationStr = 'apps.open-cluster-management.io/hosting-deployable'
const gitBranchAnnotationStr = 'apps.open-cluster-management.io/git-branch'
const gitPathAnnotationStr = 'apps.open-cluster-management.io/git-path'
const localSubSuffixStr = '-local'
const localClusterStr = 'local-cluster'
const appSetPlacementStr =
    'clusterDecisionResource.labelSelector.matchLabels["cluster.open-cluster-management.io/placement"]'

// Map resource kind to type column
function getResourceType(resource: IResource) {
    if (resource.apiVersion === ApplicationApiVersion) {
        if (resource.kind === ApplicationKind) {
            return 'Subscription'
        }
    } else if (resource.apiVersion === ArgoApplicationApiVersion) {
        if (resource.kind === ArgoApplicationKind) {
            return 'Discovered'
        } else if (resource.kind === ApplicationSetKind) {
            return 'ApplicationSet'
        }
    }
}

function getEmptyMessage(t: TFunction) {
    return (
        <p>
            <span
                dangerouslySetInnerHTML={{ __html: t('Click the Create application button to create your resource.') }}
            />
            <br />
            {t('View the documentation for more information.')}
        </p>
    )
}

function getAppSetApps(argoApps: IResource[], appSetName: string) {
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
    if (resource.kind === ApplicationSetKind) {
        castType = resource as ApplicationSet
        return castType.spec.template?.spec?.destination?.namespace
    }
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
                if (
                    _.endsWith(subAnnotations[i], localSubSuffixStr) &&
                    _.indexOf(subAnnotations, _.trimEnd(subAnnotations[i], localSubSuffixStr)) !== -1
                ) {
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
    const [managedClusters] = useRecoilState(managedClustersState)
    const localCluster = managedClusters.find((cls) => cls.metadata.name === localClusterStr)
    const [modalProps, setModalProps] = useState<IDeleteResourceModalProps | { open: false }>({
        open: false,
    })
    const tableItems: IResource[] = []
    const { data, loading, startPolling } = useQuery(queryRemoteArgoApps)
    useEffect(startPolling, [startPolling])

    // Cache cell text for sorting and searching
    const generateTransformData = (tableItem: IResource) => {
        // Cluster column
        const clusterCount: any = {
            localPlacement: false,
            remoteCount: 0,
        }
        const clusterTransformData = createClustersText({
            resource: tableItem,
            clusterCount,
            clusterList: [],
            argoApplications,
            placementRules,
            subscriptions,
            localCluster,
        })

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
    }

    const getTimeWindow = (app: IResource) => {
        if (!(app.apiVersion === ApplicationApiVersion && app.kind === ApplicationKind)) {
            return ''
        }

        const subAnnotations = getSubscriptionsFromAnnotation(app)
        let hasTimeWindow = false

        for (let i = 0; i < subAnnotations.length; i++) {
            if (
                _.endsWith(subAnnotations[i], localSubSuffixStr) &&
                _.indexOf(subAnnotations, _.trimEnd(subAnnotations[i], localSubSuffixStr)) !== -1
            ) {
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
    }

    // Combine all application types
    applications.forEach((app) => {
        tableItems.push(generateTransformData(app))
    })
    applicationSets.forEach((appset) => {
        tableItems.push(generateTransformData(appset))
    })
    argoApplications.forEach((argoApp) => {
        const isChildOfAppset =
            argoApp.metadata.ownerReferences && argoApp.metadata.ownerReferences[0].kind === ApplicationSetKind
        if (!argoApp.metadata.ownerReferences || !isChildOfAppset) {
            tableItems.push(generateTransformData(argoApp))
        }
    })

    if (!loading && data) {
        const remoteArgoApps = data?.[0]?.data?.searchResult?.[0]?.items || []
        remoteArgoApps.forEach((remoteArgoApp: any) => {
            tableItems.push(
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
        })
    }

    const keyFn = useCallback(
        (resource: IResource) => resource.metadata!.uid ?? `${resource.metadata!.namespace}/${resource.metadata!.name}`,
        []
    )
    const columns = useMemo<IAcmTableColumn<IResource>[]>(
        () => [
            {
                header: t('Name'),
                sort: 'metadata.name',
                search: 'metadata.name',
                transforms: [cellWidth(20)],
                cell: (application) => (
                    <span style={{ whiteSpace: 'nowrap' }}>
                        <Link
                            to={
                                NavigationPath.applicationDetails
                                    .replace(':namespace', application.metadata?.namespace as string)
                                    .replace(':name', application.metadata?.name as string) +
                                '?apiVersion=' +
                                application.kind.toLowerCase() +
                                '.' +
                                application.apiVersion.split('/')[0]
                            }
                        >
                            {application.metadata?.name}
                        </Link>
                    </span>
                ),
            },
            {
                header: t('Type'),
                cell: (resource) => <span>{getResourceType(resource)}</span>,
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
                    const clusterCount = {
                        localPlacement: false,
                        remoteCount: 0,
                    }
                    const clusterList: string[] = []

                    const clusterCountString = createClustersText({
                        resource: resource,
                        clusterCount,
                        clusterList: clusterList,
                        argoApplications,
                        placementRules,
                        subscriptions,
                        localCluster,
                    })
                    const searchParams: any =
                        resource.kind === ApplicationKind && resource.apiVersion === ApplicationApiVersion
                            ? {
                                  properties: {
                                      apigroup: 'app.k8s.io',
                                      kind: 'application',
                                      name: resource.metadata?.name,
                                      namespace: resource.metadata?.namespace,
                                  },
                                  showRelated: 'cluster',
                              }
                            : {
                                  properties: {
                                      name: clusterList,
                                      kind: 'cluster',
                                  },
                              }
                    const searchLink = getSearchLink(searchParams)

                    if (clusterCount.remoteCount && clusterCountString !== 'None') {
                        return (
                            <a className="cluster-count-link" href={searchLink}>
                                {clusterCountString}
                            </a>
                        )
                    }
                    return clusterCountString
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
                            isArgoApp={
                                getResourceType(resource) === 'Discovered' ||
                                getResourceType(resource) === 'ApplicationSet'
                            }
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
        []
    )

    const filters = [
        {
            label: t('Type'),
            id: 'table.filter.type.acm.application.label',
            options: [
                {
                    label: t('Subscription'),
                    value: t('application.app.k8s.io/v1beta1'),
                },
                {
                    label: t('Argo CD'),
                    value: t('application.argoproj.io/v1alpha1'),
                },
                {
                    label: t('ApplicationSet'),
                    value: t('applicationset.argoproj.io/v1alpha1'),
                },
            ],
            tableFilterFn: (selectedValues: string[], item: IResource) => {
                return selectedValues.includes(`${item.kind.toLocaleLowerCase()}.${item.apiVersion}`)
            },
        },
    ]

    const history = useHistory()
    const [canCreateApplication, setCanCreateApplication] = useState<boolean>(false)
    const [canDeleteApplication, setCanDeleteApplication] = useState<boolean>(false)
    const [canDeleteApplicationSet, setCanDeleteApplicationSet] = useState<boolean>(false)

    let modalWarnings: string
    const getAppChildResources = (app: IResource) => {
        const hostingSubAnnotation = getAnnotation(app, hostingSubAnnotationStr)

        if (hostingSubAnnotation) {
            const subName = hostingSubAnnotation.split('/')[1]
            modalWarnings = t(
                'This application is deployed by the subscription {{subName}}. The delete action might be reverted when resources are reconciled with the resource repository.',
                { subName }
            )
            return [[], []]
        }

        const subAnnotationArray = getSubscriptionsFromAnnotation(app)
        const removableSubs: any[] = []
        const children: any[] = []
        const sharedChildren: any[] = []
        const related: IResource[] = []
        const rules: any[] = []

        for (let i = 0; i < subAnnotationArray.length; i++) {
            const siblingApps: string[] = []
            const subChildResources: string[] = []
            if (
                _.endsWith(subAnnotationArray[i], localSubSuffixStr) &&
                _.indexOf(subAnnotationArray, _.trimEnd(subAnnotationArray[i], localSubSuffixStr)) !== -1
            ) {
                // skip local sub
                continue
            }
            const subDetails = subAnnotationArray[i].split('/')

            // Find apps sharing the same sub
            applications.forEach((item) => {
                if (item.metadata.uid !== app.metadata?.uid && item.metadata.namespace === app.metadata?.namespace) {
                    if (
                        item.metadata.annotations &&
                        item.metadata.annotations[subAnnotationStr] &&
                        item.metadata.annotations[subAnnotationStr]
                            .split(',')
                            .find((sub) => sub === subAnnotationArray[i])
                    ) {
                        siblingApps.push(item.metadata.name!)
                        related.push(item)
                    }
                    const appHostingSubAnnotation = getAnnotation(item, hostingSubAnnotationStr)

                    if (appHostingSubAnnotation && appHostingSubAnnotation.indexOf(subAnnotationArray[i]) > -1) {
                        related.push(item)
                        subChildResources.push(`${item.metadata.name} [${item.kind}]`)
                    }
                }
            })

            // Find current sub and subs deployed by this sub
            let currentSub: IResource | undefined = undefined
            subscriptions.forEach((item) => {
                if (
                    item.metadata.name !== subDetails[1] ||
                    (item.metadata.name === subDetails[1] && item.metadata.namespace !== subDetails[0])
                ) {
                    const subHostingSubAnnotation = getAnnotation(item, hostingSubAnnotationStr)
                    const subHostingDeployableAnnotation = getAnnotation(item, hostingDeployableAnnotationStr)

                    if (
                        subHostingSubAnnotation &&
                        subHostingSubAnnotation.indexOf(subAnnotationArray[i]) > -1 &&
                        !(subHostingDeployableAnnotation && subHostingDeployableAnnotation.startsWith(localClusterStr))
                    ) {
                        related.push(item)
                        subChildResources.push(`${item.metadata.name} [${item.kind}]`)
                    }
                } else if (item.metadata.name === subDetails[1] && item.metadata.namespace === subDetails[0]) {
                    currentSub = item
                }
            })

            // Find PRs referenced/deployed by this sub
            let subWithPR
            const referencedPR = currentSub ? (currentSub as Subscription).spec.placement?.placementRef : undefined
            placementRules.forEach((item) => {
                if (referencedPR && referencedPR.name === item.metadata.name) {
                    related.push(item)
                    subWithPR = { ...currentSub, rule: item }
                }
                const prHostingSubAnnotation = getAnnotation(item, hostingSubAnnotationStr)

                if (prHostingSubAnnotation && prHostingSubAnnotation.indexOf(subAnnotationArray[i]) > -1) {
                    subChildResources.push(`${item.metadata.name} [${item.kind}]`)
                }
            })

            // Find channels deployed by this sub
            channels.forEach((item) => {
                const channelHostingSubAnnotation = getAnnotation(item, hostingSubAnnotationStr)

                if (channelHostingSubAnnotation && channelHostingSubAnnotation === subAnnotationArray[i]) {
                    subChildResources.push(`${item.metadata.name} [${item.kind}]`)
                }
            })

            if (siblingApps.length === 0) {
                removableSubs.push(subWithPR || currentSub)
                children.push({
                    id: `subscriptions-${subDetails[0]}-${subDetails[1]}`,
                    name: subDetails[1],
                    namespace: subDetails[0],
                    kind: SubscriptionKind,
                    apiVersion: SubscriptionApiVersion,
                    label: `${subDetails[1]} [${SubscriptionKind}]`,
                    subChildResources: subChildResources,
                })
            } else {
                sharedChildren.push({
                    id: `subscriptions-${subDetails[0]}-${subDetails[1]}`,
                    label: `${subDetails[1]} [${SubscriptionKind}]`,
                    siblingApps: siblingApps,
                })
            }
        }

        removableSubs.forEach((sub) => {
            const prName = sub.rule?.metadata.name
            const prNamespace = sub.rule?.metadata.namespace
            if (prName) {
                rules.push({
                    id: `rules-${prNamespace}-${prName}`,
                    name: prName,
                    namespace: prNamespace,
                    kind: PlacementRuleKind,
                    apiVersion: PlacementRuleApiVersion,
                    label: `${prName} [${PlacementRuleKind}]`,
                })
            }
        })

        // Find subs sharing the PR
        rules.forEach((rule) => {
            const siblingSubs: string[] = []
            for (let i = 0; i < subscriptions.length; i++) {
                const item = subscriptions[i]
                const subHostingDeployableAnnotation = getAnnotation(item, hostingDeployableAnnotationStr)

                if (subHostingDeployableAnnotation && subHostingDeployableAnnotation.startsWith(localClusterStr)) {
                    continue
                }

                const foundSub = removableSubs.find((sub) => sub.metadata.uid === item.metadata.uid)
                if (
                    foundSub === undefined &&
                    item.spec.placement?.placementRef?.name === rule.name &&
                    item.metadata.namespace === rule.namespace
                ) {
                    siblingSubs.push(item.metadata.name!)
                }
            }

            if (siblingSubs.length === 0) {
                children.push(rule)
            } else {
                sharedChildren.push({
                    id: rule.id,
                    label: rule.label,
                    siblingSubs: siblingSubs,
                })
            }
        })

        return [children.sort((a, b) => a.label.localeCompare(b.label)), sharedChildren]
    }

    const getAppSetRelatedResources = (appSet: IResource) => {
        const appSetsSharingPlacement: string[] = []
        const currentAppSetGenerators = (appSet as ApplicationSet).spec.generators
        const currentAppSetPlacement = currentAppSetGenerators
            ? _.get(currentAppSetGenerators[0], appSetPlacementStr, '')
            : undefined

        if (!currentAppSetPlacement) return ['', []]

        applicationSets.forEach((item) => {
            const appSetGenerators = item.spec.generators
            const appSetPlacement = appSetGenerators ? _.get(appSetGenerators[0], appSetPlacementStr, '') : ''
            if (
                item.metadata.name !== appSet.metadata?.name ||
                (item.metadata.name === appSet.metadata?.name && item.metadata.namespace !== appSet.metadata?.namespace)
            ) {
                if (appSetPlacement && appSetPlacement === currentAppSetPlacement) {
                    appSetsSharingPlacement.push(item.metadata.name!)
                }
            }
        })

        return [currentAppSetPlacement, appSetsSharingPlacement]
    }

    const rowActionResolver = (item: IResource) => {
        const actions: IAcmRowAction<any>[] = [
            {
                id: 'viewApplication',
                title: t('View application'),
                click: () => {},
            },
        ]

        if (!isArgoApp(item)) {
            actions.push({
                id: 'editApplication',
                title: t('Edit application'),
                click: () => {
                    history.push(
                        NavigationPath.editApplicationSubscription
                            .replace(':namespace', item.metadata?.namespace as string)
                            .replace(':name', item.metadata?.name as string)
                    )
                },
            })
        }

        actions.push({
            id: 'searchApplication',
            title: t('Search application'),
            click: () => {
                const [apigroup, apiversion] = item.apiVersion.split('/')
                const searchLink = getSearchLink({
                    properties: {
                        name: item.metadata?.name,
                        namespace: item.metadata?.namespace,
                        kind: item.kind.toLowerCase(),
                        apigroup,
                        apiversion,
                    },
                })
                history.push(searchLink)
            },
        })

        if (!isArgoApp(item)) {
            actions.push({
                id: 'deleteApplication',
                title: t('Delete application'),
                click: () => {
                    const appChildResources = item.kind === ApplicationKind ? getAppChildResources(item) : [[], []]
                    const appSetRelatedResources =
                        item.kind === ApplicationSetKind ? getAppSetRelatedResources(item) : ['', []]
                    setModalProps({
                        open: true,
                        canRemove: item.kind === ApplicationSetKind ? canDeleteApplicationSet : canDeleteApplication,
                        resource: item,
                        errors: undefined,
                        warnings: modalWarnings,
                        loading: false,
                        selected: appChildResources[0], // children
                        shared: appChildResources[1], // shared children
                        appSetPlacement: appSetRelatedResources[0],
                        appSetsSharingPlacement: appSetRelatedResources[1],
                        appKind: item.kind,
                        appSetApps: getAppSetApps(argoApplications, item.metadata?.name!),
                        close: () => {
                            setModalProps({ open: false })
                        },
                        t,
                    })
                },
                isDisabled: item.kind === ApplicationSetKind ? !canDeleteApplicationSet : !canDeleteApplication,
            })
        }
        return actions
    }

    useEffect(() => {
        const canCreateApplicationPromise = canUser('create', ApplicationDefinition)
        canCreateApplicationPromise.promise
            .then((result) => setCanCreateApplication(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canCreateApplicationPromise.abort()
    }, [])
    useEffect(() => {
        const canDeleteApplicationPromise = canUser('delete', ApplicationDefinition)
        canDeleteApplicationPromise.promise
            .then((result) => setCanDeleteApplication(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canDeleteApplicationPromise.abort()
    }, [])
    useEffect(() => {
        const canDeleteApplicationSetPromise = canUser('delete', ApplicationSetDefinition)
        canDeleteApplicationSetPromise.promise
            .then((result) => setCanDeleteApplicationSet(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canDeleteApplicationSetPromise.abort()
    }, [])

    const appCreationButton = () => {
        return (
            <AcmDropdown
                isDisabled={!canCreateApplication}
                tooltip={
                    !canCreateApplication
                        ? 'You are not authorized to complete this action. See your cluster administrator for role-based access control information.'
                        : ''
                }
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
                        text: 'Argo CD ApplicationSet',
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
        )
    }

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
                customTableAction={appCreationButton()}
                emptyState={
                    <AcmEmptyState
                        key="appOverviewEmptyState"
                        title={t('You don’t have any applications')}
                        message={getEmptyMessage(t)}
                        action={appCreationButton()}
                    />
                }
                rowActionResolver={rowActionResolver}
            />
        </PageSection>
    )
}
