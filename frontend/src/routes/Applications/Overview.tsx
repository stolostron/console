/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmButton,
    AcmEmptyState,
    AcmTable,
    IAcmRowAction,
    IAcmTableColumn,
} from '@open-cluster-management/ui-components'
import { ButtonVariant, PageSection } from '@patternfly/react-core'
import { cellWidth } from '@patternfly/react-table'
import _ from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { TFunction, useTranslation } from 'react-i18next'
import { useHistory } from 'react-router'
import { Link } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { applicationSetsState, applicationsState, argoApplicationsState } from '../../atoms'
import { canUser } from '../../lib/rbac-util'
import { NavigationPath } from '../../NavigationPath'
import {
    ApplicationApiVersion,
    ApplicationDefinition,
    ApplicationKind,
    ApplicationSet,
    ApplicationSetKind,
    ArgoApplication,
    ArgoApplicationApiVersion,
    ArgoApplicationKind,
    IResource,
} from '../../resources'
import ResourceLabels from './components/ResourceLabels'
import { getAge, getClusterCountString, getSearchLink } from './helpers/resource-helper'

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

// Check if server URL matches hub URL, doesn't work when testing locally
function isLocalClusterURL(url: string) {
    let argoServerURL
    const localClusterURL = new URL(window.location.href)

    try {
        argoServerURL = new URL(url)
    } catch (_) {
        return false
    }

    const hostnameWithOutAPI = argoServerURL.hostname.substr(argoServerURL.hostname.indexOf('api.') + 4)
    if (localClusterURL.host.indexOf(hostnameWithOutAPI) > -1) {
        return true
    }
    return false
}

function calculateClusterCount(resource: ArgoApplication, clusterCount: any, clusterList: string[]) {
    if (
        resource.spec.destination?.name === 'in-cluster' ||
        resource.spec.destination?.name === 'local-cluster' ||
        isLocalClusterURL(resource.spec.destination?.server || '')
    ) {
        clusterCount.localPlacement = true
        clusterList.push('local-cluster')
    } else {
        clusterCount.remoteCount++
        if (resource.spec.destination?.name) {
            clusterList.push(resource.spec.destination?.name)
        }
    }
}

function createClustersText(
    resource: IResource,
    clusterCount: any,
    clusterList: string[],
    argoApplications: ArgoApplication[] | undefined
) {
    if (resource.kind === ApplicationSetKind) {
        argoApplications!.forEach((app) => {
            if (app.metadata?.ownerReferences) {
                if (app.metadata.ownerReferences[0].name === resource.metadata?.name) {
                    calculateClusterCount(app, clusterCount, clusterList)
                }
            }
        })
    }

    if (resource.apiVersion === ArgoApplicationApiVersion && resource.kind === ArgoApplicationKind) {
        calculateClusterCount(resource as ArgoApplication, clusterCount, clusterList)
    }

    return getClusterCountString(clusterCount.remoteCount, clusterCount.localPlacement)
}

// Cache cell text for sorting and searching
function generateTransformData(tableItem: IResource, argoApplications: ArgoApplication[] | undefined) {
    // Cluster column
    const clusterCount: any = {
        localPlacement: false,
        remoteCount: 0,
    }
    const clusterTransformData = createClustersText(tableItem, clusterCount, [], argoApplications)

    // Resource column
    const resourceMap: { [key: string]: string } = {}
    const appRepos = getApplicationRepos(tableItem)
    let resourceText = ''
    appRepos?.forEach((repo) => {
        if (!resourceMap[repo.type]) {
            resourceText = resourceText + repo.type
        }
        resourceMap[repo.type] = repo.type
    })

    const transformedObject = {
        transformed: {
            clusterCount: clusterTransformData,
            resourceText: resourceText,
            createdText: getAge(tableItem, '', 'metadata.creationTimestamp'),
        },
    }

    // Cannot add properties directly to objects in typescript
    return { ...tableItem, ...transformedObject }
}

function getApplicationRepos(resource: IResource) {
    let castType
    if (resource.apiVersion === ApplicationApiVersion) {
        if (resource.kind === ApplicationKind) {
            return []
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

export default function ApplicationsOverview() {
    const { t } = useTranslation()

    const [applications] = useRecoilState(applicationsState)
    const [applicationSets] = useRecoilState(applicationSetsState)
    const [argoApplications] = useRecoilState(argoApplicationsState)
    const tableItems: IResource[] = []

    // Combine all application types
    applications.forEach((app) => {
        tableItems.push(generateTransformData(app, undefined))
    })
    applicationSets.forEach((appset) => {
        tableItems.push(generateTransformData(appset, argoApplications))
    })
    argoApplications.forEach((argoApp) => {
        if (
            !argoApp.metadata.ownerReferences ||
            (argoApp.metadata.ownerReferences && argoApp.metadata.ownerReferences[0].kind !== ApplicationSetKind)
        ) {
            tableItems.push(generateTransformData(argoApp, argoApplications))
        }
    })

    const keyFn = useCallback(
        (resource: IResource) => resource.metadata!.uid ?? `${resource.metadata!.namespace}/${resource.metadata!.name}`,
        []
    )
    const columns = useMemo<IAcmTableColumn<IResource>[]>(
        () => [
            {
                header: t('Name'),
                cell: 'metadata.name',
                sort: 'metadata.name',
                search: 'metadata.name',
                transforms: [cellWidth(20)],
            },
            {
                header: t('Type'),
                cell: (resource) => <span>{getResourceType(resource)}</span>,
                sort: 'kind',
                tooltip: t('Link to Learn more about different types'),
                transforms: [cellWidth(15)],
                // probably don't need search if we have a type filter
            },
            {
                header: t('Namespace'),
                cell: 'metadata.namespace',
                sort: 'metadata.namespace',
                search: 'metadata.namespace',
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
                    const clusterCountString = createClustersText(resource, clusterCount, clusterList, argoApplications)
                    const searchParams: any = {
                        properties: {
                            name: clusterList,
                            kind: 'cluster',
                        },
                    }
                    const searchLink = getSearchLink(searchParams)

                    if (clusterCount.remoteCount) {
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
                    const appRepos = getApplicationRepos(resource)
                    return (
                        <ResourceLabels
                            appRepos={appRepos!}
                            showSubscriptionAttributes={true}
                            isArgoApp={
                                getResourceType(resource) === 'Discovered' ||
                                getResourceType(resource) === 'ApplicationSet'
                            }
                        />
                    )
                },
                tooltip: t('Provides links to each of the resource repositories used by the application.'),
                sort: 'transformed.resourceText',
                search: 'transformed.resourceText',
            },
            {
                header: t('Time window'),
                cell: () => {
                    // TODO when new appsub specs are finalized
                    return ''
                },
                tooltip: t('table.header.application.timeWindow.tooltip'),
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
    useEffect(() => {
        const canCreateApplicationPromise = canUser('create', ApplicationDefinition)
        canCreateApplicationPromise.promise
            .then((result) => setCanCreateApplication(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canCreateApplicationPromise.abort()
    }, [])

    const rowActions = useMemo<IAcmRowAction<IResource>[]>(
        () => [
            {
                id: 'viewApplication',
                title: t('View application'),
                click: () => {},
            },
            {
                id: 'editApplication',
                title: t('Edit application'),
                click: () => {},
            },
            {
                id: 'searchApplication',
                title: t('Search application'),
                click: () => {},
                isDisabled: false, // implement when we use search for remote Argo apps
            },
            {
                id: 'deleteApplication',
                title: t('Delete application'),
                click: () => {
                    // need custom function to open modal
                },
            },
        ],
        []
    )
    return (
        <PageSection>
            <AcmTable<IResource>
                key="data-table"
                plural={t('Applications')}
                columns={columns}
                keyFn={keyFn}
                items={tableItems}
                filters={filters}
                tableActionButtons={[
                    {
                        id: 'createApplication',
                        title: t('Create application'),
                        click: () => history.push(NavigationPath.createApplication), // TODO add link to wizard
                        isDisabled: !canCreateApplication,
                        tooltip: t(
                            'You are not authorized to complete this action. See your cluster administrator for role-based access control information.'
                        ),
                        variant: ButtonVariant.primary,
                    },
                ]}
                emptyState={
                    <AcmEmptyState
                        key="appOverviewEmptyState"
                        title={t('You don’t have any applications')}
                        message={getEmptyMessage(t)}
                        action={
                            <AcmButton component={Link} variant="primary" to={''}>
                                {t('Create application')}
                            </AcmButton>
                        }
                    />
                }
                rowActions={rowActions}
            />
        </PageSection>
    )
}
