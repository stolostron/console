/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmExpandableCard,
    AcmTable,
    AcmTablePaginationContextProvider,
    IAcmTableColumn,
} from '@open-cluster-management/ui-components'
import {
    Card,
    CardTitle,
    CardBody,
    PageSection,
    Split,
    Stack,
    StackItem,
    TextContent,
    Text,
    TextVariants,
    ToggleGroup,
    ToggleGroupItem,
} from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { cellWidth } from '@patternfly/react-table'
import { DOC_LINKS } from '../../lib/doc-util'
import { useCallback, useMemo } from 'react'
import queryString from 'query-string'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useRecoilState } from 'recoil'
import { applicationsState, channelsState, placementRulesState, placementsState, subscriptionsState } from '../../atoms'
import {
    IResource,
    ChannelApiVersion,
    SubscriptionApiVersion,
    PlacementApiVersion,
    PlacementRuleApiVersion,
} from '../../resources'
import { getAge, getClusterCountString, getSearchLink, getEditLink } from './helpers/resource-helper'

import _ from 'lodash'

export default function AdvancedConfiguration() {
    const { t } = useTranslation()
    const [applications] = useRecoilState(applicationsState)
    const [channels] = useRecoilState(channelsState)
    const [placementrules] = useRecoilState(placementRulesState)
    const [placements] = useRecoilState(placementsState)
    const [subscriptions] = useRecoilState(subscriptionsState)
    const subscriptionsWithoutLocal = subscriptions.filter((subscription) => {
        return !_.endsWith(subscription.metadata.name, '-local')
    })

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
                                const searchParams: any = {
                                    properties: {
                                        name,
                                        namespace,
                                        kind: 'channel',
                                        apiversion: ChannelApiVersion,
                                    },
                                }
                                const channelLink = getSearchLink(searchParams)

                                return <a href={channelLink}>{name}</a>
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
                            let appCount = 0
                            if (resource.metadata) {
                                const { name, namespace } = resource.metadata
                                applications.forEach((application) => {
                                    const annotations = _.get(application, 'metadata.annotations')
                                    if (annotations) {
                                        const subscriptions =
                                            annotations['apps.open-cluster-management.io/subscriptions']
                                        const subscriptionList = subscriptions ? subscriptions.split(',') : []
                                        if (subscriptionList.length) {
                                            subscriptionList.forEach(
                                                (element: { split: (arg: string) => [any, any] }) => {
                                                    const [subscriptionNamespace, subscriptionName] = element.split('/')
                                                    if (
                                                        subscriptionNamespace === namespace &&
                                                        subscriptionName === name
                                                    ) {
                                                        appCount++
                                                    }
                                                }
                                            )
                                        }
                                    }
                                })
                                if (appCount != 0) {
                                    const searchParams: any = {
                                        properties: {
                                            name,
                                            namespace,
                                            kind: 'subscription',
                                            apigroup: SubscriptionApiVersion,
                                        },
                                        showRelated: 'application',
                                    }
                                    const channelLink = getSearchLink(searchParams)
                                    return <a href={channelLink}>{appCount}</a>
                                }
                            }
                            return appCount
                        },
                        tooltip:
                            'Displays the number of applications using the subscription. Click to search for all related applications.',
                    },
                    {
                        header: t('Clusters'),
                        cell: (resource) => {
                            let clusterCount = {
                                localPlacement: false,
                                remoteCount: 0,
                            }
                            const remoteContext = getSubscriptionClusterCount(resource, clusterCount, true)
                            if (remoteContext) {
                                return remoteContext
                            }

                            return getClusterCountString(clusterCount.remoteCount, clusterCount.localPlacement)
                        },
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
                []
            ),
            items: subscriptionsWithoutLocal,
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
                            if (channelType) {
                                return <span>{channelType}</span>
                            }
                            return ''
                        },
                        sort: 'spec.type',
                        tooltip: 'Provides a link to the resource repository that is represented by the channel.',
                    },
                    {
                        header: t('Subscriptions'),
                        cell: (resource) => {
                            let subscriptionCount = 0
                            if (resource.metadata) {
                                const { name, namespace } = resource.metadata
                                subscriptions.forEach((subscription) => {
                                    const channel = _.get(subscription, 'spec.channel')
                                    const [channelNamespace, channelName] = channel.split('/')
                                    if (channelNamespace === namespace && channelName === name) {
                                        subscriptionCount++
                                    }
                                })
                                if (subscriptionCount != 0) {
                                    const channelLink = getSearchLink({
                                        properties: {
                                            name,
                                            namespace,
                                            kind: 'channel',
                                        },
                                        showRelated: 'subscription',
                                    })
                                    return <a href={channelLink}>{subscriptionCount}</a>
                                }
                            }
                            return subscriptionCount
                        },
                        tooltip:
                            'Displays the number of local subscriptions using the channel. Click to search for all related subscriptions.',
                    },
                    {
                        header: t('Clusters'),
                        cell: (resource) => {
                            let clusterCount = {
                                localPlacement: false,
                                remoteCount: 0,
                            }
                            if (resource.metadata) {
                                const { name, namespace } = resource.metadata
                                const subscriptionsInUse = subscriptions.filter((subscription) => {
                                    const channel = _.get(subscription, 'spec.channel')
                                    const [channelNamespace, channelName] = channel.split('/')
                                    return channelName === name && channelNamespace === namespace
                                })
                                subscriptionsInUse.forEach((subscriptionInUse) => {
                                    getSubscriptionClusterCount(subscriptionInUse, clusterCount)
                                })
                            }
                            return getClusterCountString(clusterCount.remoteCount, clusterCount.localPlacement)
                        },
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
                []
            ),
            items: channels,
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
                                apiversion: PlacementApiVersion,
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
                        header: t('Created'),
                        cell: (resource) => {
                            return <span>{getAge(resource, '', 'metadata.creationTimestamp')}</span>
                        },
                        sort: 'metadata.creationTimestamp',
                    },
                ],
                []
            ),
            items: placements,
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
                        cell: (resource) => {
                            let clusterCount = {
                                localPlacement: false,
                                remoteCount: 0,
                            }
                            clusterCount = getPlacementruleClusterCount(resource, clusterCount)
                            return getClusterCountString(clusterCount.remoteCount, clusterCount.localPlacement)
                        },
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
                []
            ),
            items: placementrules,
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
            <AcmExpandableCard title={t('Learn more about the terminology')}>
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
                            'Placements define the target clusters that must subscribe to a ClusterSet where subscriptions and applicationSets are delivered. This is done by cluster name, cluster resource annotation(s), or cluster resource label(s).'
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
                        <Text
                            component={TextVariants.a}
                            isVisitedLink
                            href={DOC_LINKS.MANAGE_APPLICATIONS}
                            target="_blank"
                            style={{
                                cursor: 'pointer',
                                display: 'inline-block',
                                padding: '0px 10px',
                                fontSize: '14px',
                                color: '#0066cc',
                            }}
                        >
                            {t('View documentation')} <ExternalLinkAltIcon />
                        </Text>
                    </Text>
                </TextContent>
            </AcmExpandableCard>
        )
    }

    function getPlacementruleClusterCount(
        resource: IResource,
        clusterCount: { localPlacement: boolean; remoteCount: number }
    ) {
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

    function getSubscriptionClusterCount(
        resource: IResource,
        clusterCount: { localPlacement: boolean; remoteCount: number },
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
                        <a style={{ color: '#0066cc' }} href={searchLink}>
                            {getClusterCountString(clusterCount.remoteCount, clusterCount.localPlacement)}
                        </a>
                    )
                }
            }
        }
    }

    function getSelectedId(props: ISelectedIds) {
        let { options, query, queryParam, defaultOption, location } = props
        if (!query) {
            query = location && queryString.parse(location.search)
        }
        const validOptionIds = options.map((o) => o.id)
        const isQueryParam = query && queryParam ? (query[queryParam] as string) : undefined
        const isValidOptionIds = isQueryParam ? validOptionIds.includes(isQueryParam) : false
        return queryParam && query && isValidOptionIds ? query[queryParam] : defaultOption
    }

    function QuerySwitcher(props: IQuerySwitcherInterface) {
        const { options, defaultOption, queryParam = 'resources' } = props
        const query = queryString.parse(location.search)
        const selectedId = getSelectedId({
            query,
            options,
            defaultOption,
            queryParam,
        })

        let history = useHistory()

        const isSelected = (id: string) => id === selectedId
        const handleChange = (_: any, event: any) => {
            const id = event.currentTarget.id
            if (queryParam) {
                query[queryParam] = id
            }
            const newQueryString = queryString.stringify(query)
            const optionalNewQueryString = newQueryString && `?${newQueryString}`
            history.replace(`${location.pathname}${optionalNewQueryString}${location.hash}`, { noScrollToTop: true })
        }

        return (
            <ToggleGroup>
                {options.map(({ id, contents }) => (
                    <ToggleGroupItem
                        key={id}
                        buttonId={id}
                        isSelected={isSelected(id)}
                        onChange={handleChange}
                        text={contents}
                    />
                ))}
            </ToggleGroup>
        )
    }

    function editLink(params: { resource: any; kind: string; apiversion: string }) {
        const { resource, kind, apiversion } = params
        if (resource.metadata) {
            const { name, namespace } = resource.metadata
            if (name) {
                const searchParams: any = {
                    name,
                    namespace,
                    kind,
                    cluster: 'local-cluster',
                    apiversion,
                }
                const searchLink = getEditLink(searchParams)
                return <a href={searchLink}>{name}</a>
            }
        }
    }

    function AdvancedConfigurationTable() {
        const defaultOption = 'subscriptions'
        const options = [
            { id: 'subscriptions', title: 'Subscriptions' },
            { id: 'channels', title: 'Channels' },
            { id: 'placements', title: 'Placements' },
            { id: 'placementrules', title: 'Placement rules' },
        ]

        const selectedId = getSelectedId({ location, options, defaultOption, queryParam: 'resources' })
        const selectedResources = _.get(table, `${selectedId}`)

        return (
            <AcmTablePaginationContextProvider localStorageKey="advanced-tables-pagination">
                <AcmTable<IResource>
                    plural=""
                    columns={selectedResources.columns}
                    keyFn={keyFn}
                    items={selectedResources.items}
                    extraToolbarControls={
                        <QuerySwitcher
                            key="switcher"
                            options={options.map(({ id, title }) => ({
                                id,
                                contents: t(title),
                            }))}
                            defaultOption={defaultOption}
                        />
                    }
                />
            </AcmTablePaginationContextProvider>
        )
    }

    return (
        <PageSection>
            <Stack hasGutter>
                <StackItem>
                    <ApplicationDeploymentHighlights />
                </StackItem>
                <StackItem>
                    <AdvancedConfigurationTable />
                </StackItem>
            </Stack>
        </PageSection>
    )
}

export interface IQuerySwitcherInterface {
    options: { id: string; contents: string }[]
    defaultOption: String
    queryParam?: string
}

export interface ISelectedIds {
    location?: Location
    options: { id: string; contents?: string }[]
    defaultOption: String
    queryParam?: string
    query?: queryString.ParsedQuery<string>
}
