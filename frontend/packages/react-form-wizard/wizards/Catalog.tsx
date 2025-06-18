/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
import {
    Breadcrumb,
    BreadcrumbItem,
    Button,
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    Checkbox,
    Drawer,
    DrawerContent,
    DrawerContentBody,
    DrawerPanelBody,
    DrawerPanelContent,
    DrawerSection,
    Flex,
    FlexItem,
    Icon,
    Label,
    LabelGroup,
    List,
    ListItem,
    Page,
    PageSection,
    SearchInput,
    Split,
    SplitItem,
    Stack,
    Text,
    Title,
} from '@patternfly/react-core'
import { CheckIcon } from '@patternfly/react-icons'
import Fuse from 'fuse.js'
import React, { Fragment, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Grid } from './common/Grid'
interface ICatalogBreadcrumb {
    id?: string
    label: string
    to?: string
    target?: string
    component?: React.ElementType
}

type CatalogFilterValue = string | number | boolean

interface ICatalogFilterGroup {
    id: string
    label: string
    filters?: ICatalogFilter[]
}

interface ICatalogFilter {
    id?: string
    label?: string
    value: CatalogFilterValue
    filters?: ICatalogFilter[]
}

interface ICatalogCard {
    id?: string
    icon?: ReactNode
    title: string
    descriptions?: string[]
    featureGroups?: ICatalogCardFeatureGroup[]
    labels?: string[] // TODO - disable/enable auto generated filters
    badge?: string
    onClick?: () => void
    // TODO maxHeight - adds scrolling
}

interface ICatalogCardFeatureGroup {
    title: string
    features: string[] // TODO - allow features to specify an optional icon
    // TODO - disable/enable auto generated filters
}

const fuseCardOptions: Fuse.IFuseOptions<ICatalogCard> = {
    includeScore: true,
    fieldNormWeight: 0,
    keys: [
        { name: 'title', weight: 0.35 },
        { name: 'descriptions', weight: 0.05 },
        { name: 'featureGroups.features', weight: 0.15 },
        { name: 'labels', weight: 0.15 },
        { name: 'labels.label', weight: 0.15 },
        { name: 'badge', weight: 0.15 },
    ],
}

export function Catalog(props: {
    title: string
    breadcrumbs?: ICatalogBreadcrumb[]
    filterGroups?: ICatalogFilterGroup[]
    cards?: ICatalogCard[]
    onBack?: () => void
}) {
    const breadcrumbs = useMemo(() => {
        if (!props.breadcrumbs) return <Fragment />
        return (
            <Breadcrumb>
                {props.breadcrumbs.map((breadcrumb) => (
                    <BreadcrumbItem
                        id={breadcrumb.id}
                        key={breadcrumb.id}
                        to={breadcrumb.to}
                        target={breadcrumb.target}
                        component={breadcrumb.component}
                    >
                        {breadcrumb.label}
                    </BreadcrumbItem>
                ))}
            </Breadcrumb>
        )
    }, [props.breadcrumbs])

    const [search, setSearch] = useState('')

    const [filterSelections, setFilterSelections] = useState<{ [id: string]: CatalogFilterValue[] }>({})

    const onClickFilter = useCallback(
        (filterGroup: ICatalogFilterGroup, filter: ICatalogFilter) => {
            const newSelections = { ...filterSelections }
            const filterGroupSelections = newSelections[filterGroup.id]
            if (!filterGroupSelections) {
                newSelections[filterGroup.id] = [filter.value]
            } else {
                if (filterGroupSelections.includes(filter.value)) {
                    filterGroupSelections.splice(filterGroupSelections.indexOf(filter.value), 1)
                } else {
                    filterGroupSelections.push(filter.value)
                }
            }
            setFilterSelections(newSelections)
        },
        [filterSelections]
    )

    const featureFilterGroups = useMemo(() => {
        const groupMap: Record<string, ICatalogFilterGroup> = {}
        for (const card of props.cards ?? []) {
            for (const featureGroup of card.featureGroups ?? []) {
                let catalogFilterGroup = groupMap[featureGroup.title]
                if (!catalogFilterGroup) {
                    catalogFilterGroup = {
                        id: featureGroup.title,
                        label: featureGroup.title,
                        filters: [],
                    }
                    groupMap[featureGroup.title] = catalogFilterGroup
                }
                for (const feature of featureGroup.features) {
                    if (!catalogFilterGroup.filters?.find((filter) => filter.value === feature)) {
                        const filter: ICatalogFilter = {
                            value: feature,
                        }
                        catalogFilterGroup.filters!.push(filter)
                    }
                }
            }
        }
        const groups = Object.values(groupMap)
        for (const group of groups) {
            group.filters?.sort((l, r) => (l.value as string).localeCompare(r.value as string))
        }
        return groups.sort((l, r) => l.label.localeCompare(r.label))
    }, [props.cards])

    const catalogFilterGroups = useMemo(() => {
        if (!props.filterGroups && !featureFilterGroups.length) return <Fragment />
        return (
            <DrawerPanelContent minSize="250px" defaultSize="250px" maxSize="250px">
                <DrawerPanelBody>
                    {props.filterGroups?.map((filterGroup) => (
                        <DrawerSection key={filterGroup.id} style={{ paddingBottom: 32 }}>
                            <FilterGroup
                                filterGroup={filterGroup}
                                selectedValues={filterSelections[filterGroup.id]}
                                onClickFilter={onClickFilter}
                            />
                        </DrawerSection>
                    ))}
                    {featureFilterGroups.map((filterGroup) => (
                        <DrawerSection key={filterGroup.id} style={{ paddingBottom: 32 }}>
                            <FilterGroup
                                filterGroup={filterGroup}
                                selectedValues={filterSelections[filterGroup.id]}
                                onClickFilter={onClickFilter}
                            />
                        </DrawerSection>
                    ))}
                </DrawerPanelBody>
            </DrawerPanelContent>
        )
    }, [props.filterGroups, filterSelections, onClickFilter, featureFilterGroups])

    const filteredCards = useMemo(() => {
        let filteredCards = props.cards
        if (!filteredCards) return undefined
        if (Object.keys(filterSelections).length > 0) {
            for (const key in filterSelections) {
                const t = filterSelections[key]
                if (t.length == 0) continue
                filteredCards = filteredCards?.filter((card) => {
                    const matchesLabel = card.labels?.find((label) => {
                        return t.includes(label)
                    })
                    if (matchesLabel) return true
                    const matchesFeature = card.featureGroups?.find((featureGroup) => {
                        for (const feature of featureGroup.features) {
                            if (t.includes(feature)) return true
                        }
                        return false
                    })
                    if (matchesFeature) return true
                    return false
                })
            }
        }
        return filteredCards
    }, [props.cards, filterSelections])

    const searchedCards = useMemo(() => {
        let activeCards = filteredCards
        if (!activeCards) return undefined
        if (search) {
            const fuse = new Fuse<ICatalogCard>(activeCards, fuseCardOptions)
            activeCards = fuse.search(search).map((result) => result.item)
        } else {
            activeCards = activeCards?.sort((lhs, rhs) => lhs.title.localeCompare(rhs.title))
        }
        return activeCards
    }, [filteredCards, search])

    const catalogCards = useMemo(() => {
        if (!searchedCards) return <Fragment />
        return (
            <Grid>
                {searchedCards.map((card) => {
                    return (
                        <Card
                            id={card.id}
                            key={card.id ?? card.title}
                            onClick={card.onClick}
                            isFlat
                            isLarge
                            isSelectable={card.onClick !== undefined}
                            isRounded
                            style={{
                                transition: 'box-shadow 0.25s',
                                cursor: card.onClick ? 'pointer' : undefined,
                                background: card.onClick ? undefined : '#00000008',
                            }}
                        >
                            <CardHeader>
                                <Split hasGutter style={{ width: '100%' }}>
                                    <SplitItem isFilled>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            {card.icon && (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        height: 40,
                                                        width: 40,
                                                        marginTop: -20,
                                                        marginBottom: -20,
                                                        marginRight: 12,
                                                        alignItems: 'center',
                                                        justifyItems: 'stretch',
                                                    }}
                                                >
                                                    {card.icon}
                                                </div>
                                            )}
                                            <CardTitle>{card.title}</CardTitle>
                                        </div>
                                    </SplitItem>
                                    {card.badge && (
                                        <SplitItem>
                                            <Label isCompact color="orange">
                                                {card.badge}
                                            </Label>
                                        </SplitItem>
                                    )}
                                </Split>
                            </CardHeader>
                            <CardBody style={{ paddingTop: 0 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
                                    {Array.isArray(card.descriptions) &&
                                        card.descriptions.map((description, index) => (
                                            <Text component="p" key={index}>
                                                {description}
                                            </Text>
                                        ))}
                                    {Array.isArray(card.featureGroups) &&
                                        card.featureGroups.map((featureGroup, index) => (
                                            <Stack key={index}>
                                                <Title headingLevel="h6" style={{ paddingBottom: 8 }}>
                                                    {featureGroup.title}
                                                </Title>
                                                <List isPlain>
                                                    {featureGroup.features?.map((feature, index) => (
                                                        <ListItem
                                                            key={index}
                                                            icon={
                                                                <Icon status="success" isInline>
                                                                    <CheckIcon />
                                                                </Icon>
                                                            }
                                                        >
                                                            {feature}
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </Stack>
                                        ))}
                                    {card.labels && (
                                        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'end' }}>
                                            <LabelGroup numLabels={999}>
                                                {card.labels.map((label) => (
                                                    <Label key={label}>{label}</Label>
                                                ))}
                                            </LabelGroup>
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    )
                })}
            </Grid>
        )
    }, [searchedCards])

    return (
        <Page>
            <PageSection variant="light" isWidthLimited>
                <Flex style={{ gap: 16 }}>
                    <FlexItem grow={{ default: 'grow' }}>
                        <Stack hasGutter>
                            {breadcrumbs}
                            <Title headingLevel="h1">{props.title}</Title>
                        </Stack>
                    </FlexItem>
                    <FlexItem alignSelf={{ default: 'alignSelfFlexEnd' }} grow={{ default: 'grow' }}>
                        <SearchInput value={search} onChange={(_event, value) => setSearch(value)} onClear={() => setSearch('')} />
                    </FlexItem>
                </Flex>
            </PageSection>
            <PageSection variant="light" padding={{ default: 'noPadding' }} isFilled hasOverflowScroll>
                <Drawer position="left" isStatic>
                    <DrawerContent panelContent={catalogFilterGroups}>
                        <DrawerContentBody hasPadding>{catalogCards}</DrawerContentBody>
                    </DrawerContent>
                </Drawer>
            </PageSection>
            {props.onBack && (
                <PageSection variant="light" isFilled={false}>
                    <Button onClick={props.onBack}>Back</Button>
                </PageSection>
            )}
        </Page>
    )
}

function FilterGroup(props: {
    filterGroup: ICatalogFilterGroup
    selectedValues?: CatalogFilterValue[]
    onClickFilter: (filterGroup: ICatalogFilterGroup, filter: ICatalogFilter) => void
}) {
    const { filterGroup, selectedValues, onClickFilter } = props
    return (
        <DrawerSection key={filterGroup.id}>
            <Stack hasGutter>
                <Title headingLevel="h4">{filterGroup.label}</Title>
                {filterGroup.filters?.map((filter) => (
                    <Filter
                        key={filter.id ?? filter.value.toString()}
                        filter={filter}
                        selectedValues={selectedValues}
                        onClick={() => onClickFilter(filterGroup, filter)}
                    />
                ))}
            </Stack>
        </DrawerSection>
    )
}

function Filter(props: { filter: ICatalogFilter; selectedValues?: CatalogFilterValue[]; onClick: () => void }) {
    const { filter, selectedValues, onClick } = props
    return (
        <Fragment>
            <Checkbox
                id={filter.id ?? filter.value.toString()}
                isChecked={selectedValues?.includes(filter.value)}
                onChange={onClick}
                label={filter.label ?? filter.value.toString()}
            />
            {filter.filters && (
                <Stack hasGutter>
                    {filter.filters.map((filter) => (
                        <Filter
                            key={filter.id ?? filter.value.toString()}
                            filter={filter}
                            selectedValues={selectedValues}
                            onClick={onClick}
                        />
                    ))}
                </Stack>
            )}
        </Fragment>
    )
}

/** Scollable container that adds a top and bottom shadow on scroll */
export function AcmScrollable(props: { children?: ReactNode; borderTop?: boolean; borderBottom?: boolean }) {
    const divEl = useRef<HTMLDivElement>(null)
    const [topShadow, setTopShadow] = useState(0)
    const [bottomShadow, setBottomShadow] = useState(0)
    const update = useCallback(() => {
        /* istanbul ignore else */
        if (divEl.current) {
            setTopShadow(Math.min(1, divEl.current.scrollTop / 8))
            const scrollBottom = divEl.current.scrollHeight - divEl.current.scrollTop - divEl.current.clientHeight
            setBottomShadow(Math.max(0, Math.min(1, scrollBottom / 8)))
        }
    }, [])
    useEffect(() => update(), [update, props.children])
    const shadowOpacityTop = 0.08 * topShadow
    const shadowOpacityBottom = 0.06 * bottomShadow

    /* istanbul ignore next */
    const borderTop = props.borderTop ? 'thin solid rgba(0, 0, 0, 0.12)' : ''

    /* istanbul ignore next */
    const borderBottom = props.borderBottom ? 'thin solid rgba(0, 0, 0, 0.12)' : ''

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflowY: 'hidden', position: 'relative' }}>
            <div
                ref={divEl}
                style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflowY: 'auto', borderTop, borderBottom }}
                onScroll={update}
            >
                {props.children}
            </div>
            {
                /* istanbul ignore next */ shadowOpacityTop > 0 && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            height: '8px',
                            width: '100%',
                            background: `linear-gradient(rgba(0,0,0,${shadowOpacityTop}), rgba(0,0,0,0))`,
                        }}
                    />
                )
            }
            {
                /* istanbul ignore next */ shadowOpacityBottom > 0 && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            height: '6px',
                            width: '100%',
                            background: `linear-gradient(rgba(0,0,0,0), rgba(0,0,0,${shadowOpacityBottom}))`,
                        }}
                    />
                )
            }
        </div>
    )
}
