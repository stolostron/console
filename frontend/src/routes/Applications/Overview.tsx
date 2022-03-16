/* Copyright Contributors to the Open Cluster Management project */

import { PageSection, Text, TextContent, TextVariants } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { cellWidth } from '@patternfly/react-table'
import { AcmDropdown, AcmEmptyState, AcmTable, IAcmRowAction, IAcmTableColumn } from '@stolostron/ui-components'
import { TFunction } from 'i18next'
import _ from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useHistory } from 'react-router'
import { Link } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import {
    applicationSetsState,
    applicationsState,
    argoApplicationsState,
    channelsState,
    managedClustersState,
    placementRulesState,
    subscriptionsState,
} from '../../atoms'
import { useTranslation } from '../../lib/acm-i18next'
import { DOC_LINKS } from '../../lib/doc-util'
import { canUser } from '../../lib/rbac-util'
import { queryRemoteArgoApps } from '../../lib/search'
import { useQuery } from '../../lib/useQuery'
import { NavigationPath } from '../../NavigationPath'
import {
    ApplicationApiVersion,
    ApplicationDefinition,
    ApplicationKind,
    ApplicationSet,
    ApplicationSetDefinition,
    ApplicationSetKind,
    ArgoApplication,
    ArgoApplicationApiVersion,
    ArgoApplicationKind,
    Channel,
    IResource,
    Subscription,
} from '../../resources'
import { DeleteResourceModal, IDeleteResourceModalProps } from './components/DeleteResourceModal'
import ResourceLabels from './components/ResourceLabels'
import {
    createClustersText,
    getAge,
    getAppChildResources,
    getAppSetRelatedResources,
    getSearchLink,
    getSubscriptionsFromAnnotation,
    hostingSubAnnotationStr,
    isResourceTypeOf,
} from './helpers/resource-helper'

const gitBranchAnnotationStr = 'apps.open-cluster-management.io/git-branch'
const gitPathAnnotationStr = 'apps.open-cluster-management.io/git-path'
const localSubSuffixStr = '-local'
const localClusterStr = 'local-cluster'

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

    const getTimeWindow = useCallback(
        (app: IResource) => {
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
        },
        [subscriptions, t]
    )

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
        [argoApplications, channels, getTimeWindow, localCluster, placementRules, subscriptions, t]
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

    const rowActionResolver = (resource: IResource) => {
        const actions: IAcmRowAction<any>[] = []

        if (isResourceTypeOf(resource, ApplicationDefinition)) {
            actions.push({
                id: 'viewApplication',
                title: t('View application'),
                click: () => {
                    history.push(
                        NavigationPath.applicationOverview
                            .replace(':namespace', resource.metadata?.namespace as string)
                            .replace(':name', resource.metadata?.name as string)
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
                            .replace(':name', resource.metadata?.name as string)
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
                        NavigationPath.applicationOverview
                            .replace(':namespace', resource.metadata?.namespace as string)
                            .replace(':name', resource.metadata?.name as string) +
                            '?apiVersion=applicationset.argoproj.io'
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
                            .replace(':name', resource.metadata?.name as string)
                    )
                },
            })
        }

        actions.push({
            id: 'searchApplication',
            title: t('Search application'),
            click: () => {
                const [apigroup, apiversion] = resource.apiVersion.split('/')
                const searchLink = getSearchLink({
                    properties: {
                        name: resource.metadata?.name,
                        namespace: resource.metadata?.namespace,
                        kind: resource.kind.toLowerCase(),
                        apigroup,
                        apiversion,
                    },
                })
                history.push(searchLink)
            },
        })

        if (isResourceTypeOf(resource, ApplicationDefinition)) {
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
