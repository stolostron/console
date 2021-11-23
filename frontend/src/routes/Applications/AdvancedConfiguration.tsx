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
import { DOC_LINKS } from '../../lib/doc-util'
import { useCallback, useMemo } from 'react'
import queryString from 'query-string'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useRecoilState } from 'recoil'
import { channelsState, placementRulesState, placementsState, subscriptionsState } from '../../atoms'
import { IResource } from '../../resources'
import _ from 'lodash'

export default function AdvancedConfiguration() {
    const { t } = useTranslation('application')
    const [subscriptions] = useRecoilState(subscriptionsState)
    const [channels] = useRecoilState(channelsState)
    const [placementrules] = useRecoilState(placementRulesState)
    const [placements] = useRecoilState(placementsState)

    const table = {
        subscriptions: {
            columns: useMemo<IAcmTableColumn<IResource>[]>(
                () => [
                    {
                        header: t('Name'),
                        cell: 'metadata.name',
                        sort: 'metadata.name',
                        search: 'metadata.name',
                    },
                    {
                        header: t('Namespace'),
                        cell: 'metadata.namespace',
                        sort: 'metadata.namespace',
                    },
                    {
                        header: t('Channel'),
                        cell: 'spec.channel',
                        sort: 'spec.channel',
                    },
                    {
                        header: t('Created'),
                        cell: 'metadata.creationTimestamp',
                        sort: 'metadata.creationTimestamp',
                    },
                ],
                []
            ),
            items: subscriptions,
        },
        channels: {
            columns: useMemo<IAcmTableColumn<IResource>[]>(
                () => [
                    {
                        header: t('Name'),
                        cell: 'metadata.name',
                        sort: 'metadata.name',
                        search: 'metadata.name',
                    },
                    {
                        header: t('Namespace'),
                        cell: 'metadata.namespace',
                        sort: 'metadata.namespace',
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
                        cell: 'metadata.name',
                        sort: 'metadata.name',
                        search: 'metadata.name',
                    },
                    {
                        header: t('Namespace'),
                        cell: 'metadata.namespace',
                        sort: 'metadata.namespace',
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
                        cell: 'metadata.name',
                        sort: 'metadata.name',
                        search: 'metadata.name',
                    },
                    {
                        header: t('Namespace'),
                        cell: 'metadata.namespace',
                        sort: 'metadata.namespace',
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
                        title={t('Placement rules')}
                        description={t(
                            'Placement rules define the target clusters where subscriptions are delivered. This is done by cluster name, cluster resource annotation(s), or cluster resource label(s).'
                        )}
                    />
                    <TerminologyCard
                        title={t('Channels')}
                        description={t(
                            'Channels point to repositories where Kubernetes resources are stored, such as Git, Helm chart, or object storage repositories, or Namespaces on the local cluster. Channels support multiple subscriptions from multiple targets.'
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

    function getSelectedId(props: ISelectedIds) {
        let { options, query, queryParam, defaultOption, location } = props
        if (!query) {
            query = queryString.parse(location.search)
        }
        const validOptionIds = options.map((o) => o.id)
        return queryParam && validOptionIds.includes(query[queryParam]) ? query[queryParam] : defaultOption
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
        const handleChange = (_, event) => {
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

    function AdvancedConfigurationTable() {
        const defaultOption = 'subscriptions'
        const options = [{ id: 'subscriptions' }, { id: 'channels' }, { id: 'placements' }, { id: 'placementrules' }]

        const selectedId = getSelectedId({ location, options, defaultOption, queryParam: 'resources' })
        const selectedResources = _.get(table, selectedId)

        return (
            <AcmTablePaginationContextProvider localStorageKey="advanced-tables-pagination">
                <AcmTable<IResource>
                    plural={t('Applications')}
                    columns={selectedResources.columns}
                    keyFn={keyFn}
                    items={selectedResources.items}
                    extraToolbarControls={
                        <QuerySwitcher
                            key="switcher"
                            options={options.map(({ id }) => ({
                                id,
                                contents: t(`application:resource.${id}`),
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
    queryParam: string
}

export interface ISelectedIds {
    location?: Location
    options: { id: string; contents?: string }[]
    defaultOption: String
    queryParam?: string
    query?: queryString.ParsedQuery<string>
}
