/* Copyright Contributors to the Open Cluster Management project */
import {
    Card,
    CardActions,
    CardBody,
    CardHeader,
    CardTitle,
    Dropdown,
    DropdownItem,
    DropdownSeparator,
    Gallery,
    KebabToggle,
    Label,
    LabelGroup,
    PageSection,
    PageSectionVariants,
    Pagination,
    PaginationVariant,
    Toolbar,
    ToolbarContent,
    ToolbarGroup,
    ToolbarItem,
} from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { AcmButton, AcmDrawerContext, AcmEmptyState } from '@stolostron/ui-components'
import { Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { policySetsState } from '../../../atoms'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { PolicySet, PolicySetResultClusters, PolicySetResultsStatus } from '../../../resources/policy-set'
import { GovernanceCreatePolicysetEmptyState } from '../components/GovernanceEmptyState'
import CardViewToolbarFilter from './components/CardViewToolbarFilter'
import CardViewToolbarSearch from './components/CardViewToolbarSearch'
import { PolicySetDetailSidebar } from './components/PolicySetDetailSidebar'

function clusterViolationFilterFn(policySet: PolicySet) {
    return (
        policySet.status.results.filter(
            (result) => result.clusters && result.clusters?.some((cluster) => cluster.compliant === 'NonCompliant')
        ).length > 0
    )
}
function clusterNonViolationFilterFn(policySet: PolicySet) {
    return policySet.status.results.every((result) => {
        return (result.clusters && result.clusters.every((cluster) => cluster.compliant !== 'NonCompliant')) ?? true
    })
}
function policyViolationFilterFn(policySet: PolicySet) {
    return policySet.status.results.filter((result) => result.compliant === 'NonCompliant').length > 0
}
function policyNonViolationFilterFn(policySet: PolicySet) {
    return policySet.status.results.every((result) => {
        return (result && result.compliant !== 'NonCompliant') ?? true
    })
}
function policyUnknownFilterFn(policySet: PolicySet) {
    return policySet.status.results.filter((result) => !result.compliant).length > 0
}

export default function PolicySetsPage() {
    const { t } = useTranslation()
    const [policySets] = useRecoilState(policySetsState)

    // const [placement] = useRecoilState(placementsState) to be used for getting cluster selector
    const { setDrawerContext } = useContext(AcmDrawerContext)
    const [cardOpenIdx, setCardOpenIdx] = useState<number>()
    const [searchFilter, setSearchFilter] = useState<Record<string, string[]>>({})
    const [violationFilters, setViolationFilters] = useState<string[]>([])
    const [page, setPage] = useState<number>(1)
    const [perPage, setPerPage] = useState<number>(10)
    const [filteredPolicySets, setFilteredPolicySets] = useState<PolicySet[]>(policySets)

    const updatePerPage = useCallback(
        (newPerPage: number) => {
            // keep the first item in view on pagination size change
            const newPage = Math.floor(((page - 1) * perPage) / newPerPage) + 1
            setPage(newPage)
            setPerPage(newPerPage)
        },
        [page, perPage, setPage, setPerPage]
    )

    useEffect(() => {
        setPage(1)
        const filteredByViolation: PolicySet[] = policySets.filter((policySet: PolicySet) => {
            // Return all if no filters
            if (violationFilters.length === 0) {
                return true
            }
            let clusterFilterMatch =
                violationFilters.includes('cluster-violation') || violationFilters.includes('cluster-no-violation')
                    ? false
                    : true
            let policyFilterMatch =
                violationFilters.includes('policy-violation') ||
                violationFilters.includes('policy-no-violation') ||
                violationFilters.includes('policy-unknown')
                    ? false
                    : true

            for (const filter of violationFilters) {
                switch (filter) {
                    case 'cluster-violation':
                        if (clusterViolationFilterFn(policySet)) {
                            clusterFilterMatch = true
                        }
                        break
                    case 'cluster-no-violation':
                        if (clusterNonViolationFilterFn(policySet)) {
                            clusterFilterMatch = true
                        }
                        break
                    case 'policy-violation':
                        if (policyViolationFilterFn(policySet)) {
                            policyFilterMatch = true
                        }
                        break
                    case 'policy-no-violation':
                        if (policyNonViolationFilterFn(policySet)) {
                            policyFilterMatch = true
                        }
                        break
                    case 'policy-unknown':
                        if (policyUnknownFilterFn(policySet)) {
                            policyFilterMatch = true
                        }
                        break
                }
            }

            // AND different group filter selections
            return clusterFilterMatch && policyFilterMatch
        })

        // multi values are OR, multi attributes are AND
        const filteredBySearch: PolicySet[] = filteredByViolation.filter((policySet: PolicySet) => {
            let match = true
            if (searchFilter['Name'] && searchFilter['Name'].length > 0) {
                match = searchFilter['Name'].indexOf(policySet.metadata.name) > -1
                if (!match) return false
            } else if (searchFilter['Namespace'] && searchFilter['Namespace'].length > 0) {
                match = searchFilter['Namespace'].indexOf(policySet.metadata.namespace) > -1
                if (!match) return false
            }
            return true
        })
        setFilteredPolicySets(filteredBySearch)
    }, [searchFilter, violationFilters])

    const actualPage = useMemo<number>(() => {
        const start = (page - 1) * perPage
        let actualPage = page
        if (start >= filteredPolicySets.length) {
            actualPage = Math.max(1, Math.ceil(filteredPolicySets.length / perPage))
        }
        return actualPage
    }, [filteredPolicySets, page, perPage])

    useEffect(() => {
        if (page !== actualPage) {
            setPage(actualPage)
        }
    }, [page, actualPage])

    /**
     * PolicySet array for the current pages data
     */
    const paged = useMemo<PolicySet[]>(() => {
        const start = (actualPage - 1) * perPage
        return filteredPolicySets.slice(start, start + perPage)
    }, [filteredPolicySets, actualPage, perPage])

    const policySetNames: string[] = policySets.map((policySet: PolicySet) => policySet.metadata.name)
    const policySetNamespaces: string[] = policySets.map((policySet: PolicySet) => policySet.metadata.namespace)
    const uniqueNs: string[] = policySetNamespaces.filter((p, idx) => {
        return policySetNamespaces.indexOf(p) === idx
    })
    const searchData: any = {
        Name: policySetNames,
        Namespace: uniqueNs,
    }
    const searchDataKeyNames: string[] = ['Name', 'Namespace']

    function onCardToggle(cardIdx: number) {
        if (cardOpenIdx === cardIdx) {
            setCardOpenIdx(undefined)
        } else setCardOpenIdx(cardIdx)
    }

    function renderPolicySetCard(policySet: PolicySet, cardIdx: number) {
        /** allClusters - Get all clusters from policySet - nonunique */
        const allClusters: PolicySetResultClusters[] = policySet.status?.results.reduce(
            (acc: PolicySetResultClusters[], curr: PolicySetResultsStatus) => {
                if (curr.clusters) {
                    return acc.concat(curr.clusters)
                }
                return acc
            },
            []
        )
        /**
         * policySetClusters: Unique clusters array from PolicySet resource
         */
        const policySetClusters: PolicySetResultClusters[] = policySet.status?.results.reduce(
            (acc: PolicySetResultClusters[], curr: PolicySetResultsStatus) => {
                const currClusters = curr.clusters ?? []
                const newClusters: PolicySetResultClusters[] = currClusters.filter(
                    (cluster: PolicySetResultClusters) => {
                        if (acc.filter((c) => c.clusterName === cluster.clusterName).length === 0) {
                            return cluster
                        }
                    }
                )
                return acc.concat(newClusters)
            },
            []
        )
        let clusterCompliantCount = 0
        let clusterNonCompliantCount = 0
        policySetClusters.forEach((cluster: PolicySetResultClusters) => {
            const compliant: boolean =
                allClusters.filter((c: PolicySetResultClusters) => {
                    if (c.clusterName === cluster.clusterName) {
                        return c.compliant === 'Compliant' ? true : false
                    }
                }).length > 0
            compliant ? clusterCompliantCount++ : clusterNonCompliantCount++
        })
        const policySetPolicyCount: number = policySet.spec.policies.length ?? 0
        const policyCompliantCount: number = policySet.status?.results.reduce(
            (acc: any, curr: PolicySetResultsStatus) => {
                const isCompliant = curr?.compliant && curr?.compliant === 'Compliant' ? 1 : 0
                return acc + isCompliant
            },
            0
        )
        const policyNonCompliantCount: number = policySet.status?.results.reduce(
            (acc: any, curr: PolicySetResultsStatus) => {
                const isNonCompliant = curr?.compliant && curr?.compliant === 'NonCompliant' ? 1 : 0
                return acc + isNonCompliant
            },
            0
        )
        const policyUnknownCount: number = policySet.status?.results.reduce(
            (acc: any, curr: PolicySetResultsStatus) => {
                const isUnknown = curr && !curr?.compliant ? 1 : 0
                return acc + isUnknown
            },
            0
        )
        return (
            <Card
                isRounded
                isLarge
                isHoverable
                isFullHeight
                key={policySet.metadata.name}
                style={{ transition: 'box-shadow 0.25s', cursor: 'pointer' }}
            >
                <CardHeader isToggleRightAligned={true}>
                    <CardActions>
                        <Dropdown
                            // onSelect={} on item select
                            toggle={<KebabToggle onToggle={() => onCardToggle(cardIdx)} />}
                            isOpen={cardOpenIdx === cardIdx}
                            isPlain
                            dropdownItems={[
                                <DropdownItem
                                    key="view details"
                                    onClick={() => {
                                        setDrawerContext({
                                            isExpanded: true,
                                            onCloseClick: () => setDrawerContext(undefined),
                                            panelContent: (
                                                <PolicySetDetailSidebar
                                                    policySet={policySet}
                                                    policySetClusters={policySetClusters}
                                                />
                                            ),
                                            panelContentProps: { minSize: '50%' },
                                        })
                                    }}
                                >
                                    {t('View details')}
                                </DropdownItem>,
                                <DropdownItem key="edit" isDisabled>
                                    {t('Edit')}
                                </DropdownItem>,
                                <DropdownSeparator key="separator" />,
                                <DropdownItem
                                    key="delete"
                                    isDisabled
                                    // onClick={() => {
                                    //     deleteResource({
                                    //         apiVersion: 'policy.open-cluster-management.io/v1',
                                    //         kind: 'PolicySet',
                                    //         metadata: {
                                    //             name: policySet.metadata.name,
                                    //             namespace: policySet.metadata.namespace,
                                    //         },
                                    //     })
                                    // }}
                                >
                                    {t('Delete')}
                                </DropdownItem>,
                            ]}
                            position={'right'}
                        />
                    </CardActions>
                    <CardTitle>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {policySet.metadata.name}
                            <p style={{ fontSize: '12px', color: '#6A6E73', fontWeight: 100 }}>
                                {`Namespace: ${policySet.metadata.namespace}`}
                            </p>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardBody>
                    <div>{policySet.spec.description}</div>
                    <div style={{ marginTop: '.5rem' }}>
                        <strong>{policySetClusters.length}</strong> clusters
                    </div>
                    {(clusterCompliantCount > 0 || clusterNonCompliantCount > 0) && (
                        <LabelGroup>
                            {clusterCompliantCount > 0 && (
                                <Label icon={<CheckCircleIcon />} color="green">
                                    {clusterCompliantCount}
                                </Label>
                            )}
                            {clusterNonCompliantCount > 0 && (
                                <Label icon={<ExclamationCircleIcon />} color="red">
                                    {clusterNonCompliantCount}
                                </Label>
                            )}
                        </LabelGroup>
                    )}
                    <div style={{ marginTop: '.5rem' }}>
                        <strong>{policySetPolicyCount}</strong> policies
                    </div>
                    {(policyCompliantCount > 0 || policyNonCompliantCount > 0 || policyUnknownCount > 0) && (
                        <LabelGroup>
                            {policyCompliantCount > 0 && (
                                <Label icon={<CheckCircleIcon />} color="green">
                                    {policyCompliantCount}
                                </Label>
                            )}
                            {policyNonCompliantCount > 0 && (
                                <Label icon={<ExclamationCircleIcon />} color="red">
                                    {policyNonCompliantCount}
                                </Label>
                            )}
                            {policyUnknownCount > 0 && (
                                <Label icon={<ExclamationTriangleIcon color="orange" />} color="orange">
                                    {policyUnknownCount}
                                </Label>
                            )}
                        </LabelGroup>
                    )}
                </CardBody>
            </Card>
        )
    }

    if (!policySets || policySets.length === 0) {
        return <GovernanceCreatePolicysetEmptyState />
    }

    return (
        <Fragment>
            <PageSection variant={PageSectionVariants.light}>
                <Toolbar isFullHeight={true} id="toolbar-group-types">
                    <ToolbarContent>
                        <Fragment>
                            <ToolbarGroup variant="filter-group">
                                <ToolbarItem variant="search-filter">
                                    <CardViewToolbarFilter
                                        policySets={policySets}
                                        setViolationFilters={setViolationFilters}
                                    />
                                </ToolbarItem>
                                <ToolbarItem variant="search-filter">
                                    <CardViewToolbarSearch
                                        searchData={searchData}
                                        dataKeyNames={searchDataKeyNames}
                                        setSearchFilter={setSearchFilter}
                                    />
                                </ToolbarItem>
                            </ToolbarGroup>
                            <ToolbarItem key={`create-policy-set-toolbar-item`}>
                                <AcmButton component={Link} variant="primary" to={NavigationPath.createPolicySet}>
                                    {t('Create policy set')}
                                </AcmButton>
                            </ToolbarItem>
                            <ToolbarItem variant="pagination">
                                <Pagination
                                    itemCount={filteredPolicySets.length}
                                    perPage={perPage}
                                    page={page}
                                    variant={PaginationVariant.top}
                                    onSetPage={(_event, page) => setPage(page)}
                                    onPerPageSelect={(_event, perPage) => updatePerPage(perPage)}
                                    aria-label="Pagination top"
                                    isCompact
                                />
                            </ToolbarItem>
                        </Fragment>
                    </ToolbarContent>
                </Toolbar>
            </PageSection>
            {filteredPolicySets.length === 0 ? (
                <AcmEmptyState title={t('No resources match the current filter')} showIcon={true} />
            ) : (
                <PageSection isFilled>
                    <Gallery
                        hasGutter
                        minWidths={{
                            sm: '300px',
                            md: '300px',
                            lg: '300px',
                            xl: '300px',
                            '2xl': '300px',
                        }}
                    >
                        {paged.map((policyset: PolicySet, cardIdx: number) => {
                            return renderPolicySetCard(policyset, cardIdx)
                        })}
                    </Gallery>
                </PageSection>
            )}
            <Pagination
                itemCount={filteredPolicySets.length}
                perPage={perPage}
                page={page}
                variant={PaginationVariant.bottom}
                onSetPage={/* istanbul ignore next */ (_event, page) => setPage(page)}
                onPerPageSelect={/* istanbul ignore next */ (_event, perPage) => updatePerPage(perPage)}
                aria-label="Pagination bottom"
            />
        </Fragment>
    )
}
