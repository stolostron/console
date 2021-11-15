/* Copyright Contributors to the Open Cluster Management project */

import { AcmButton, AcmEmptyState, AcmTable, IAcmRowAction, IAcmTableColumn } from '@open-cluster-management/ui-components'
import {
    ButtonVariant,
    PageSection
} from '@patternfly/react-core'
import { cellWidth } from '@patternfly/react-table'
import _ from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { TFunction, useTranslation } from 'react-i18next'
import { useHistory } from 'react-router'
import { useRecoilState } from 'recoil'
import { 
    applicationsState,
    subscriptionsState,
    channelsState,
    placementRulesState,
    applicationSetsState,
    argoApplicationsState
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
    Application,
    ApplicationDefinition
} from '../../resources'
import ResourceLabels from './components/ResourceLabels'
import { getAge } from './helpers/resource-helper'
import { canUser } from '../../lib/rbac-util'
import { Link } from 'react-router-dom'

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
function isLocalClusterURL(url : string) {
    let argoServerURL
    let localClusterURL = new URL(window.location.href)

    try {
        argoServerURL = new URL(url)
    } catch (_) {
        return false
    }

    const hostnameWithOutAPI = argoServerURL.hostname.substr(argoServerURL.hostname.indexOf('api.')+4)
    if (localClusterURL.host.indexOf(hostnameWithOutAPI) > -1) {
        return true
    }
    return false
}

function getClusterCountString(remoteCount: number, localPlacement: boolean) {
    if (remoteCount) {
        return localPlacement
            ? `${remoteCount} Remote, 1 Local`
            : `${remoteCount} Remote`
    } else if (localPlacement) {
        return 'Local'
    } else {
        return 'None'
    }
}

function calculateClusterCount(resource: ArgoApplication, clusterCount: any, clusterList: string[]) {
    if (resource.spec.destination?.name === 'in-cluster' ||
        resource.spec.destination?.name === 'local-cluster' ||
        isLocalClusterURL(resource.spec.destination?.server || '')) {
        clusterCount.localPlacement = true
        clusterList.push('local-cluster')
    } else {
        clusterCount.remoteCount++
        if (resource.spec.destination?.name){
            clusterList.push(resource.spec.destination?.name)
        }
    }
}

function getSearchLink(params: any) {
    const { properties, showRelated } = params
    const queryParams = []
    let textSearch = ''

    _.entries(properties).forEach(([key, value]) => {
        textSearch = `${textSearch}${textSearch ? ' ' : ''}${key}:${
            Array.isArray(value) ? value.join() : value
        }`
    })

    if (textSearch) {
        queryParams.push(
            `filters={"textsearch":"${encodeURIComponent(textSearch)}"}`
        )
    }
    if (showRelated) {
        queryParams.push(`showrelated=${showRelated}`)
    }
    return `/search${queryParams.length ? '?' : ''}${queryParams.join('&')}`
}

function createClustersText(resource: IResource, clusterCount: any, clusterList: string[], argoApplications: ArgoApplication[] | undefined) {
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
        remoteCount: 0
    }
    const clusterTransformData = createClustersText(
        tableItem,
        clusterCount,
        [],
        argoApplications)

    // Resource column
    const resourceMap : { [key:string]:string; } = {}
    const appRepos = getApplicationRepos(tableItem)
    let resourceText:string = ''
    appRepos?.forEach(repo => {
        if (!resourceMap[repo.type]) {
            resourceText = resourceText + repo.type
        }
        resourceMap[repo.type] = repo.type
    })

    const transformedObject = {
        transformed : {
           clusterCount: clusterTransformData,
           resourceText: resourceText,
           createdText: getAge(tableItem, '', 'metadata.creationTimestamp')
        }
    }

    // Cannot add properties directly to objects in typescript
    return {...tableItem, ...transformedObject}
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
                }
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
                }
            ]
        }
    }
}

function getEmptyMessage(t: TFunction<"application"[]>) {
    const buttonName = t('table.application.button.create')
    const buttonText = `<span class="emptyStateButtonReference">${buttonName}</span>`
    const message = t('no-resource.application.message').replace('{0}', buttonText)

    return (
        <p>
            <span dangerouslySetInnerHTML={{ __html: message }} />
            <br />
            {t('no-resource.documentation.message')}
        </p>
    )
}

export default function ApplicationsOverview() {
    const { t } = useTranslation(['application'])

    const [applications] = useRecoilState(applicationsState)
    const [subscriptions] = useRecoilState(subscriptionsState)
    const [channels] = useRecoilState(channelsState)
    const [placementRules] = useRecoilState(placementRulesState)
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
        if (!argoApp.metadata.ownerReferences
            || (argoApp.metadata.ownerReferences
                && argoApp.metadata.ownerReferences[0].kind !== ApplicationSetKind)) {
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
                header: t('table.column.application.name'),
                cell: 'metadata.name',
                sort: 'metadata.name',
                search: 'metadata.name',
                transforms: [cellWidth(20)],
            },
            {
                header: t('table.column.application.type'),
                cell: (resource) => (
                    <span>{getResourceType(resource)}</span>
                ),
                sort: 'kind',
                tooltip: t('table.header.application.type.tooltip'),
                transforms: [cellWidth(15)],
                // probably don't need search if we have a type filter
            },
            {
                header: t('table.column.application.namespace'),
                cell: 'metadata.namespace',
                sort: 'metadata.namespace',
                search: 'metadata.namespace',
                tooltip: t('table.header.application.namespace.tooltip'),
                transforms: [cellWidth(20)],
            },
            {
                header: t('table.column.application.clusters'),
                cell: (resource) => {
                    let clusterCount = {
                        localPlacement: false,
                        remoteCount: 0
                    }
                    const clusterList: string[] = []
                    const clusterCountString = createClustersText(resource, clusterCount, clusterList, argoApplications)
                    const searchParams: any = {
                        properties: {
                            name: clusterList,
                            kind: 'cluster'
                        }
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
                tooltip: t('table.header.application.clusters.tooltip'),
                sort: 'transformed.clusterCount',
                search: 'transformed.clusterCount'
            },
            {
                header: t('table.column.application.resource'),
                cell: (resource) => {
                    const appRepos = getApplicationRepos(resource)
                    return (
                        <ResourceLabels
                            appRepos={appRepos}
                            showSubscriptionAttributes={true}
                            isArgoApp={getResourceType(resource) === 'Discovered' || getResourceType(resource) === 'ApplicationSet'}
                        />
                    )
                },
                tooltip: t('table.header.application.resource.tooltip'),
                sort: 'transformed.resourceText',
                search: 'transformed.resourceText'
            },
            {
                header: t('table.column.application.timeWindow'),
                cell: () => {
                    // TODO when new appsub specs are finalized
                    return ('')
                },
                tooltip: t('table.header.application.timeWindow.tooltip')
            },
            {
                header: t('table.column.application.created'),
                cell: (resource) => {
                    return (
                        <span>{getAge(resource, '', 'metadata.creationTimestamp')}</span>
                    )
                },
                sort: 'metadata.creationTimestamp',
                search: 'transformed.createdText'
            },
        ],
        []
    )

    const filters = [
        {
            label: t('table.filter.type.acm.application.label'),
            id: 'table.filter.type.acm.application.label',
            options: [
                {
                    label: t('table.filter.type.acm.application'),
                    value: t('table.filter.type.acm.application.value')
                },
                {
                    label: t('table.filter.type.argo.application'),
                    value: t('table.filter.type.argo.application.value')
                },
                {
                    label: t('table.filter.type.appset.application'),
                    value: t('table.filter.type.appset.application.value')
                }
            ],
            tableFilterFn: (selectedValues:string[], item: IResource) => {
                return selectedValues.includes(`${item.kind.toLocaleLowerCase()}.${item.apiVersion}`)
            }
        }
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
    const tableButtonActions = [
        {
            id: 'createApplication',
            title: t('table.application.button.create'),
            click: () => history.push(''),  // TODO add link to wizard
            isDisabled: !canCreateApplication,
            tooltip: t('actions.create.application.access.denied'),
            variant: ButtonVariant.primary,
        }
    ]

    const rowActions = useMemo<IAcmRowAction<IResource>[]>(
        () => [
            {
                id: 'viewApplication',
                title: t('table.actions.applications.view'),
                click: () => {},
            },
            {
                id: 'editApplication',
                title: t('table.actions.applications.edit'),
                click: () => {},
            },
            {
                id: 'searchApplication',
                title: t('table.actions.applications.search'),
                click: () => {},
                isDisabled: false // implement when we use search for remote Argo apps
            },
            {
                id: 'deleteApplication',
                title: t('table.actions.applications.delete'),
                click: () => {
                    // need custom function to open modal
                }
            }
        ],
        []
    )
    return (
        <PageSection>
            <AcmTable<IResource>
                key="data-table"
                plural={t('table.name')}
                columns={columns}
                keyFn={keyFn}
                items={tableItems}
                filters={filters}
                tableActionButtons={tableButtonActions}
                emptyState={
                    <AcmEmptyState
                        key="appOverviewEmptyState"
                        title={t('no-resource.application.title')}
                        message={getEmptyMessage(t)}
                        action={
                            <AcmButton component={Link} variant="primary" to={''}>
                                {t('table.application.button.create')}
                            </AcmButton>
                        }
                    />
                }
                rowActions={rowActions}
            />
        </PageSection>
    )
}
