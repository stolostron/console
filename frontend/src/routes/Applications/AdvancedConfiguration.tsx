/* Copyright Contributors to the Open Cluster Management project */

import {
    Card,
    CardBody,
    CardTitle,
    PageSection,
    Split,
    Stack,
    StackItem,
    Text,
    TextContent,
    TextVariants,
} from '@patternfly/react-core'
import { cellWidth } from '@patternfly/react-table'
import { AcmExpandableCard, IAcmRowAction, IAcmTableColumn } from '@stolostron/ui-components'
import _ from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import {
    applicationsState,
    channelsState,
    namespacesState,
    placementRulesState,
    placementsState,
    subscriptionsState,
} from '../../atoms'
import { useTranslation } from '../../lib/acm-i18next'
import { DOC_LINKS, viewDocumentation } from '../../lib/doc-util'
import { canUser } from '../../lib/rbac-util'
import {
    ChannelApiVersion,
    ChannelDefinition,
    ChannelKind,
    IResource,
    PlacementApiVersionBeta,
    PlacementDefinition,
    PlacementKind,
    PlacementRuleApiVersion,
    PlacementRuleDefinition,
    PlacementRuleKind,
    SubscriptionApiVersion,
    SubscriptionDefinition,
    SubscriptionKind,
} from '../../resources'
import { IDeleteResourceModalProps } from './components/DeleteResourceModal'
import ResourceLabels from './components/ResourceLabels'
import { ToggleSelector } from './components/ToggleSelector'
import { ClusterCount, getAge, getClusterCountString, getEditLink, getSearchLink } from './helpers/resource-helper'

export default function AdvancedConfiguration() {
    const { t } = useTranslation()
    const [applications] = useRecoilState(applicationsState)
    const [channels] = useRecoilState(channelsState)
    const [placementrules] = useRecoilState(placementRulesState)
    const [placements] = useRecoilState(placementsState)
    const [subscriptions] = useRecoilState(subscriptionsState)
    const [namespaces] = useRecoilState(namespacesState)

    const subscriptionsWithoutLocal = subscriptions.filter((subscription) => {
        return !_.endsWith(subscription.metadata.name, '-local')
    })
    const [modalProps, setModalProps] = useState<IDeleteResourceModalProps | { open: false }>({
        open: false,
    })
    const history = useHistory()
    const [canDeleteSubscription, setCanDeleteSubscription] = useState<boolean>(false)
    const [canDeleteChannel, setCanDeleteChannel] = useState<boolean>(false)
    const [canDeletePlacement, setCanDeletePlacement] = useState<boolean>(false)
    const [canDeletePlacementRule, setCanDeletePlacementRule] = useState<boolean>(false)
    const ChanneltableItems: IResource[] = []
    const SubscriptiontableItems: IResource[] = []
    const PlacementRuleTableItems: IResource[] = []

    useEffect(() => {
        const canDeleteSubscriptionPromise = canUser('delete', SubscriptionDefinition)
        canDeleteSubscriptionPromise.promise
            .then((result) => setCanDeleteSubscription(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canDeleteSubscriptionPromise.abort()
    }, [])

    useEffect(() => {
        const canDeleteChannelPromise = canUser('delete', ChannelDefinition)
        canDeleteChannelPromise.promise
            .then((result) => setCanDeleteChannel(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canDeleteChannelPromise.abort()
    }, [])

    useEffect(() => {
        const canDeletePlacementPromise = canUser('delete', PlacementDefinition)
        canDeletePlacementPromise.promise
            .then((result) => setCanDeletePlacement(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canDeletePlacementPromise.abort()
    }, [])

    useEffect(() => {
        const canDeletePlacementRulePromise = canUser('delete', PlacementRuleDefinition)
        canDeletePlacementRulePromise.promise
            .then((result) => setCanDeletePlacementRule(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canDeletePlacementRulePromise.abort()
    }, [])

    const getSubscriptionClusterCount = useCallback(
        function getSubscriptionClusterCount(
            resource: IResource,
            clusterCount: ClusterCount,
            showSearchLink?: boolean
        ) {
            const namespace = _.get(resource, 'metadata.namespace')
            const placementrule = _.get(resource, 'spec.placement')
            const localDeployment = _.get(placementrule, 'local', '')
            const placementRef = _.get(placementrule, 'placementRef', '')
            if (localDeployment) {
                clusterCount.localPlacement = true
            }
            if (placementRef) {
                const name = _.get(placementRef, 'name')
                const selectedPlacementrule = placementrules.find(
                    (placement) => placement.metadata.name === name && placement.metadata.namespace === namespace
                )
                if (selectedPlacementrule) {
                    clusterCount = getPlacementruleClusterCount(selectedPlacementrule, clusterCount)
                    if (clusterCount.remoteCount && showSearchLink) {
                        const subscriptionName = _.get(resource, 'metadata.name')
                        const searchLink = getSearchLink({
                            properties: {
                                name: subscriptionName,
                                namespace,
                                kind: 'subscription',
                            },
                            showRelated: 'cluster',
                        })
                        return (
                            <Link style={{ color: '#0066cc' }} to={searchLink}>
                                {getClusterCountString(t, clusterCount)}
                            </Link>
                        )
                    }
                }
            }
        },
        [placementrules, t]
    )

    // Cache cell text for sorting and searching
    const generateTransformData = (tableItem: IResource) => {
        const transformedObject = {
            transformed: {},
        }
        let clusterCount = {
            localPlacement: false,
            remoteCount: 0,
        }
        switch (tableItem.kind) {
            case 'Channel': {
                let subscriptionCount = 0
                if (tableItem.metadata) {
                    const { name, namespace } = tableItem.metadata
                    subscriptionsWithoutLocal.forEach((subscription) => {
                        const channel = _.get(subscription, 'spec.channel')
                        const [channelNamespace, channelName] = channel.split('/')
                        if (channelNamespace === namespace && channelName === name) {
                            subscriptionCount++
                        }
                    })
                    const subscriptionsInUse = subscriptionsWithoutLocal.filter((subscription) => {
                        const channel = _.get(subscription, 'spec.channel')
                        const [channelNamespace, channelName] = channel.split('/')
                        return channelName === name && channelNamespace === namespace
                    })
                    subscriptionsInUse.forEach((subscriptionInUse) => {
                        getSubscriptionClusterCount(subscriptionInUse, clusterCount)
                    })
                }

                const clusterCountString = getClusterCountString(t, clusterCount)
                _.set(transformedObject.transformed, 'subscriptionCount', subscriptionCount)
                _.set(transformedObject.transformed, 'clusterCount', clusterCountString)
                break
            }
            case 'Subscription': {
                //appCount
                if (tableItem.metadata) {
                    let appCount = 0
                    const { name, namespace } = tableItem.metadata
                    applications.forEach((application) => {
                        const annotations = _.get(application, 'metadata.annotations')
                        if (annotations) {
                            const subscriptions = annotations['apps.open-cluster-management.io/subscriptions']
                            const subscriptionList = subscriptions ? subscriptions.split(',') : []
                            if (subscriptionList.length) {
                                subscriptionList.forEach((element: { split: (arg: string) => [any, any] }) => {
                                    const [subscriptionNamespace, subscriptionName] = element.split('/')
                                    if (subscriptionNamespace === namespace && subscriptionName === name) {
                                        appCount++
                                    }
                                })
                            }
                        }
                    })

                    getSubscriptionClusterCount(tableItem, clusterCount, true)
                    const clusterString = getClusterCountString(t, clusterCount)
                    _.set(transformedObject.transformed, 'clusterCount', clusterString)
                    _.set(transformedObject.transformed, 'appCount', appCount)
                }
                break
            }
            case 'PlacementRule': {
                clusterCount = getPlacementruleClusterCount(tableItem, clusterCount)
                const clusterString = getClusterCountString(t, clusterCount)
                _.set(transformedObject.transformed, 'clusterCount', clusterString)
                break
            }
        }
        // Cannot add properties directly to objects in typescript
        return { ...tableItem, ...transformedObject }
    }

    channels.forEach((channel) => {
        ChanneltableItems.push(generateTransformData(channel))
    })

    subscriptionsWithoutLocal.forEach((subscription) => {
        SubscriptiontableItems.push(generateTransformData(subscription))
    })
    placementrules.forEach((placementrule) => {
        PlacementRuleTableItems.push(generateTransformData(placementrule))
    })

    const getRowActionResolver = (item: IResource) => {
        debugger
        const kind = _.get(item, 'kind') == 'PlacementRule' ? 'placement rule' : _.get(item, 'kind').toLowerCase()
        const actions: IAcmRowAction<any>[] = []

        // edit
        actions.push({
            id: `edit${kind}`,
            /*
                t('Edit subscription')
                t('Edit channel')
                t('Edit placement')
                t('Edit placement rule')
                */
            title: t(`Edit ${kind}`),
            click: () => {
                const searchParams: any = {
                    properties: {
                        name: item.metadata?.name,
                        namespace: item.metadata?.namespace,
                        kind: item.kind,
                        cluster: 'local-cluster',
                        apiversion: item.apiVersion,
                    },
                }
                const editLink = getEditLink(searchParams)
                history.push(editLink)
            },
        })

        // search
        actions.push({
            id: `search${kind}`,
            /*
                t('Search subscription')
                t('Search channel')
                t('Search placement')
                t('Search placement rule')
                */
            title: t(`Search ${kind}`),
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
            isDisabled: false, // implement when we use search for remote Argo apps
        })

        let canDeleteResource = false

        switch (_.get(item, 'kind')) {
            case SubscriptionKind:
                canDeleteResource = canDeleteSubscription
                break
            case ChannelKind:
                canDeleteResource = canDeleteChannel
                break
            case PlacementKind:
                canDeleteResource = canDeletePlacement
                break
            case PlacementRuleKind:
                canDeleteResource = canDeletePlacementRule
                break
        }

        //delete
        actions.push({
            id: `delete${kind}`,
            /*
                t('Delete subscription')
                t('Delete channel')
                t('Delete placement')
                t('Delete placement rule')
                */
            title: t(`Delete ${kind}`),
            click: () => {
                setModalProps({
                    open: true,
                    canRemove: canDeleteResource,
                    resource: item,
                    errors: undefined,
                    loading: false,
                    appKind: item.kind,
                    close: () => {
                        setModalProps({ open: false })
                    },
                    t,
                })
            },
            isDisabled: !canDeleteResource,
        })

        return actions
    }

    const table = {
        subscriptions: {
            columns: useMemo<IAcmTableColumn<IResource>[]>(
                () => [
                    {
                        header: t('Name'),
                        cell: (resource) => {
                            return editLink({
                                resource,
                                kind: 'Subscription',
                                apiversion: SubscriptionApiVersion,
                            })
                        },
                        sort: 'metadata.name',
                        search: 'metadata.name',
                        transforms: [cellWidth(20)],
                    },
                    {
                        header: t('Namespace'),
                        cell: 'metadata.namespace',
                        sort: 'metadata.namespace',
                        transforms: [cellWidth(20)],
                    },
                    {
                        header: t('Channel'),
                        cell: (resource) => {
                            const channel = _.get(resource, 'spec.channel')
                            if (channel) {
                                const [namespace, name] = channel.split('/')
                                const [apigroup, apiversion] = ChannelApiVersion.split('/')
                                const searchParams: any = {
                                    properties: {
                                        name,
                                        namespace,
                                        kind: 'channel',
                                        apigroup,
                                        apiversion,
                                    },
                                }
                                const channelLink = getSearchLink(searchParams)

                                return <Link to={channelLink}>{name}</Link>
                            }
                            return '-'
                        },
                        sort: 'spec.channel',
                        transforms: [cellWidth(20)],
                        tooltip:
                            'Displays the name of the channel used by the subscription. Click to search for the channel.',
                    },
                    {
                        header: t('Applications'),
                        cell: (resource) => {
                            const appCount = _.get(resource, 'transformed.appCount')
                            if (resource.metadata) {
                                const { name, namespace } = resource.metadata
                                const [apigroup, apiversion] = SubscriptionApiVersion.split('/')
                                if (appCount != 0) {
                                    const searchParams: any = {
                                        properties: {
                                            name,
                                            namespace,
                                            kind: 'subscription',
                                            apigroup,
                                            apiversion,
                                        },
                                        showRelated: 'application',
                                    }
                                    const channelLink = getSearchLink(searchParams)
                                    return <Link to={channelLink}>{appCount}</Link>
                                }
                            }
                            return appCount
                        },
                        sort: 'transformed.appCount',
                        tooltip:
                            'Displays the number of applications using the subscription. Click to search for all related applications.',
                    },
                    {
                        header: t('Clusters'),
                        cell: (resource) => {
                            const clusterCount = {
                                localPlacement: false,
                                remoteCount: 0,
                            }
                            const remoteContext = getSubscriptionClusterCount(resource, clusterCount, true)
                            if (remoteContext) {
                                return remoteContext
                            }

                            return getClusterCountString(t, clusterCount)
                        },
                        sort: 'transformed.clusterCount',
                        tooltip:
                            'Displays the number of remote and local clusters where resources for the subscription are deployed. Click to search for all related clusters.',
                    },
                    {
                        header: t('Time window'),
                        cell: (resource) => {
                            const timeWindow = _.get(resource, 'spec.timewindow.windowtype', '')
                            if (['active', 'blocked'].includes(timeWindow)) {
                                return <span>{_.upperFirst(_.toLower(timeWindow))}</span>
                            }
                            return ''
                        },
                        sort: 'spec.timewindow.windowtype',
                        tooltip:
                            'Indicates if updates to the subscription resources are subject to an active or blocked deployment time window.',
                    },
                    {
                        header: t('Created'),
                        cell: (resource) => {
                            return <span>{getAge(resource, '', 'metadata.creationTimestamp')}</span>
                        },
                        sort: 'metadata.creationTimestamp',
                    },
                ],
                [getSubscriptionClusterCount, t]
            ),
            items: SubscriptiontableItems,
            rowActionResolver: getRowActionResolver,
        },
        channels: {
            columns: useMemo<IAcmTableColumn<IResource>[]>(
                () => [
                    {
                        header: t('Name'),
                        cell: (resource) => {
                            return editLink({
                                resource,
                                kind: 'Channel',
                                apiversion: ChannelApiVersion,
                            })
                        },
                        sort: 'metadata.name',
                        search: 'metadata.name',
                        transforms: [cellWidth(20)],
                    },
                    {
                        header: t('Namespace'),
                        cell: 'metadata.namespace',
                        sort: 'metadata.namespace',
                        transforms: [cellWidth(20)],
                    },
                    {
                        header: t('Type'),
                        cell: (resource) => {
                            const channelType = _.get(resource, 'spec.type')
                            const pathName = _.get(resource, 'spec.pathname')
                            if (channelType) {
                                return (
                                    <ResourceLabels
                                        appRepos={[
                                            {
                                                type: channelType,
                                                pathName: pathName,
                                            },
                                        ]}
                                        translation={t}
                                        isArgoApp={false}
                                        showSubscriptionAttributes={false}
                                    />
                                )
                            }
                        },
                        sort: 'spec.type',
                        tooltip: 'Provides a link to the resource repository that is represented by the channel.',
                    },
                    {
                        header: t('Subscriptions'),
                        cell: (resource) => {
                            const subscriptionCount = _.get(resource, 'transformed.subscriptionCount')
                            if (resource.metadata) {
                                const { name, namespace } = resource.metadata
                                if (subscriptionCount != 0) {
                                    const channelLink = getSearchLink({
                                        properties: {
                                            name,
                                            namespace,
                                            kind: 'channel',
                                        },
                                        showRelated: 'subscription',
                                    })
                                    return <Link to={channelLink}>{subscriptionCount}</Link>
                                }
                            }
                            return subscriptionCount
                        },
                        sort: 'transformed.subscriptionCount',
                        tooltip:
                            'Displays the number of local subscriptions using the channel. Click to search for all related subscriptions.',
                    },
                    {
                        header: t('Clusters'),
                        cell: 'transformed.clusterCount',
                        sort: 'transformed.clusterCount',
                        tooltip:
                            'Displays the number of remote and local clusters where resources from the channel are deployed.',
                    },
                    {
                        header: t('Created'),
                        cell: (resource) => {
                            return <span>{getAge(resource, '', 'metadata.creationTimestamp')}</span>
                        },
                        sort: 'metadata.creationTimestamp',
                    },
                ],
                [t]
            ),
            items: ChanneltableItems,
            rowActionResolver: getRowActionResolver,
        },
        placements: {
            columns: useMemo<IAcmTableColumn<IResource>[]>(
                () => [
                    {
                        header: t('Name'),
                        cell: (resource) => {
                            return editLink({
                                resource,
                                kind: 'Placement',
                                apiversion: PlacementApiVersionBeta,
                            })
                        },
                        sort: 'metadata.name',
                        search: 'metadata.name',
                    },
                    {
                        header: t('Namespace'),
                        cell: 'metadata.namespace',
                        sort: 'metadata.namespace',
                    },
                    {
                        header: t('Clusters'),
                        tooltip: t(
                            'Displays the number of remote and local clusters where resources are deployed because of the placement.'
                        ),
                        cell: 'status.numberOfSelectedClusters',
                        sort: (resource) => {
                            const numberOfSelectedClusters = _.get(resource, 'status.numberOfSelectedClusters')
                            if (numberOfSelectedClusters) {
                                return numberOfSelectedClusters
                            }
                        },
                    },
                    {
                        header: t('Created'),
                        cell: (resource) => {
                            return <span>{getAge(resource, '', 'metadata.creationTimestamp')}</span>
                        },
                        sort: 'metadata.creationTimestamp',
                    },
                ],
                [t]
            ),
            items: placements,
            rowActionResolver: getRowActionResolver,
        },
        placementrules: {
            columns: useMemo<IAcmTableColumn<IResource>[]>(
                () => [
                    {
                        header: t('Name'),
                        cell: (resource) => {
                            return editLink({
                                resource,
                                kind: 'PlacementRule',
                                apiversion: PlacementRuleApiVersion,
                            })
                        },
                        sort: 'metadata.name',
                        search: 'metadata.name',
                    },
                    {
                        header: t('Namespace'),
                        cell: 'metadata.namespace',
                        sort: 'metadata.namespace',
                    },
                    {
                        header: t('Clusters'),
                        cell: 'transformed.clusterCount',
                        sort: 'transformed.clusterCount',
                        tooltip:
                            'Displays the number of remote and local clusters where resources are deployed because of the placement rule.',
                    },
                    {
                        header: t('Replicas'),
                        cell: 'spec.clusterReplicas',
                        sort: 'spec.clusterReplicas',
                        tooltip:
                            'Displays the desired number of clusters to which subscriptions that use this placement rule should be propagated.',
                    },
                    {
                        header: t('Created'),
                        cell: (resource) => {
                            return <span>{getAge(resource, '', 'metadata.creationTimestamp')}</span>
                        },
                        sort: 'metadata.creationTimestamp',
                    },
                ],
                [t]
            ),
            items: PlacementRuleTableItems,
            rowActionResolver: getRowActionResolver,
        },
    }

    const keyFn = useCallback(
        (resource: IResource) => resource.metadata!.uid ?? `${resource.metadata!.name}/${resource.metadata!.namespace}`,
        []
    )

    function TerminologyCard(props: { title: string; description: string }) {
        return (
            <Card isPlain isCompact>
                <CardTitle
                    style={{
                        color: '#5a6872',
                        fontSize: '16px',
                        lineHeight: '18px',
                        fontWeight: 600,
                        marginBottom: '10px',
                    }}
                >
                    {props.title}
                </CardTitle>
                <CardBody style={{ color: '#5a6872', fontSize: '12px', lineHeight: '20px' }}>
                    {props.description}
                </CardBody>
            </Card>
        )
    }

    function ApplicationDeploymentHighlights() {
        return (
            <AcmExpandableCard
                title={t('Learn more about the terminology')}
                id="ApplicationDeploymentHighlightsTerminology"
            >
                <Split hasGutter>
                    <TerminologyCard
                        title={t('Subsciptions')}
                        description={t(
                            'Subscriptions identify Kubernetes resources within channels (source repositories). Then, the subscription places the Kubernetes resources on the target clusters.'
                        )}
                    />
                    <TerminologyCard
                        title={t('Channels')}
                        description={t(
                            'Channels point to repositories where Kubernetes resources are stored, such as Git, Helm chart, or object storage repositories, or Namespaces on the local cluster. Channels support multiple subscriptions from multiple targets.'
                        )}
                    />
                    <TerminologyCard
                        title={t('Placements')}
                        description={t(
                            'Placements define the target clusters that must subscribe to a ClusterSet where subscriptions and application sets are delivered. This is done by cluster name, cluster resource annotation(s), or cluster resource label(s).'
                        )}
                    />
                    <TerminologyCard
                        title={t('Placement rules')}
                        description={t(
                            'Placement rules define the target clusters where subscriptions are delivered. This is done by cluster name, cluster resource annotation(s), or cluster resource label(s).'
                        )}
                    />
                </Split>
                <TextContent>
                    <Text
                        component={TextVariants.p}
                        style={{
                            textAlign: 'right',
                            display: 'inline-block',
                            width: '100%',
                            padding: '1.5rem 1rem 0',
                        }}
                    >
                        <TextContent>{viewDocumentation(DOC_LINKS.MANAGE_APPLICATIONS, t)}</TextContent>
                    </Text>
                </TextContent>
            </AcmExpandableCard>
        )
    }

    function getPlacementruleClusterCount(resource: IResource, clusterCount: ClusterCount) {
        const clusterDecisions = _.get(resource, 'status.decisions')
        if (clusterDecisions) {
            clusterDecisions.forEach((clusterDecision: { clusterName: string; clusterNamespace: string }) => {
                const { clusterName } = clusterDecision
                if (clusterName === 'local-cluster') {
                    clusterCount.localPlacement = true
                } else {
                    clusterCount.remoteCount++
                }
            })
        }
        return clusterCount
    }

    function editLink(params: { resource: any; kind: string; apiversion: string }) {
        const { resource, kind, apiversion } = params
        if (resource.metadata) {
            const { name, namespace } = resource.metadata
            if (name) {
                const searchParams: any = {
                    properties: {
                        name,
                        namespace,
                        kind,
                        cluster: 'local-cluster',
                        apiversion,
                    },
                }
                const searchLink = getEditLink(searchParams)
                return <Link to={searchLink}>{name}</Link>
            }
        }
    }

    return (
        <PageSection>
            <Stack hasGutter>
                <StackItem>
                    <ApplicationDeploymentHighlights />
                </StackItem>
                <StackItem>
                    {
                        <ToggleSelector
                            modalProps={modalProps}
                            table={table}
                            keyFn={keyFn}
                            t={t}
                            namespaces={namespaces}
                        />
                    }
                </StackItem>
            </Stack>
        </PageSection>
    )
}
