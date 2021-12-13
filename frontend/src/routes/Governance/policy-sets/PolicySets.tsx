/* Copyright Contributors to the Open Cluster Management project */

import { AcmDrawerContext, AcmEmptyState } from '@open-cluster-management/ui-components'
import {
    Button,
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
    SearchInput,
    Toolbar,
    ToolbarContent,
    ToolbarItem,
} from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons'
import { Fragment, useCallback, useContext, useState } from 'react'
// import { useRecoilState } from 'recoil'
// import { policySetsState } from '../../../atoms'
import { useTranslation } from '../../../lib/acm-i18next'
// import { deleteResource } from '../../../resources'
import { PolicySet, PolicySetResultClusters, PolicySetResultsStatus } from '../../../resources/policy-set'
import { PolicySetSidebar } from './PolicySetDetailSidebar'

export default function PolicySetsPage() {
    const { t } = useTranslation()
    // const [policySets] = useRecoilState(policySetsState)
    const { setDrawerContext } = useContext(AcmDrawerContext)
    const [cardViewSearch, setCardViewSearch] = useState('')
    const [cardOpenIdx, setCardOpenIdx] = useState<number>()
    const policySets: PolicySet[] = [
        {
            apiVersion: 'policy.open-cluster-management.io/v1',
            kind: 'PolicySet',
            metadata: {
                name: 'no-data-policyset',
                namespace: 'kube-system',
            },
            spec: {
                description: 'Policy set with no data',
                policies: [],
            },
            status: {
                placement: [
                    {
                        placement: 'placement1',
                        placementBinding: 'binding1',
                        placementDecisions: ['placementdecision1'],
                    },
                ],
                results: [],
            },
        },
        {
            apiVersion: 'policy.open-cluster-management.io/v1',
            kind: 'PolicySet',
            metadata: {
                name: 'pci-1',
                namespace: 'default',
            },
            spec: {
                description: 'Policies for PCI-1 compliance',
                policies: ['policy-pod', 'policy-namespace'],
            },
            status: {
                placement: [
                    {
                        placement: 'placement1',
                        placementBinding: 'binding1',
                        placementDecisions: ['placementdecision1'],
                    },
                ],
                results: [
                    {
                        policy: 'policy-pod',
                        compliant: 'NonCompliant',
                        clusters: [
                            {
                                clusterName: 'managed1',
                                clusterNamespace: 'managed1',
                                compliant: 'NonCompliant',
                            },
                            {
                                clusterName: 'managed2',
                                clusterNamespace: 'managed2',
                                compliant: 'NonCompliant',
                            },
                        ],
                    },
                    {
                        policy: 'policy-namespace',
                        message: 'policy-namespace not found',
                    },
                ],
            },
        },
        {
            apiVersion: 'policy.open-cluster-management.io/v1',
            kind: 'PolicySet',
            metadata: {
                name: 'pci-2',
                namespace: 'kube-system',
            },
            spec: {
                description: 'Policies for PCI-2 compliance',
                policies: ['policy-role', 'policy-rolebinding', 'policy-securitycontextconstraints'],
            },
            status: {
                placement: [
                    {
                        placement: 'placement1',
                        placementBinding: 'binding1',
                        placementDecisions: ['placementdecision1'],
                    },
                ],
                results: [
                    {
                        policy: 'policy-testing',
                        compliant: 'NonCompliant',
                        clusters: [
                            {
                                clusterName: 'local-cluster',
                                clusterNamespace: 'local-cluster',
                                compliant: 'Compliant',
                            },
                            {
                                clusterName: 'managed1',
                                clusterNamespace: 'managed1',
                                compliant: 'NonCompliant',
                            },
                            {
                                clusterName: 'managed2',
                                clusterNamespace: 'managed2',
                                compliant: 'NonCompliant',
                            },
                        ],
                    },
                    {
                        policy: 'policy-role',
                        compliant: 'NonCompliant',
                        clusters: [
                            {
                                clusterName: 'local-cluster',
                                clusterNamespace: 'local-cluster',
                                compliant: 'Compliant',
                            },
                            {
                                clusterName: 'managed2',
                                clusterNamespace: 'managed2',
                                compliant: 'NonCompliant',
                            },
                        ],
                    },
                    {
                        policy: 'policy-securitycontextconstraints',
                        compliant: 'Compliant',
                        clusters: [
                            {
                                clusterName: 'local-cluster',
                                clusterNamespace: 'local-cluster',
                                compliant: 'Compliant',
                            },
                        ],
                    },
                ],
            },
        },
        {
            apiVersion: 'policy.open-cluster-management.io/v1',
            kind: 'PolicySet',
            metadata: {
                name: 'pci-3',
                namespace: 'kube-system',
            },
            spec: {
                description: 'Policies for PCI-2 compliance',
                policies: ['policy-role', 'policy-rolebinding', 'policy-securitycontextconstraints'],
            },
            status: {
                placement: [
                    {
                        placement: 'placement1',
                        placementBinding: 'binding1',
                        placementDecisions: ['placementdecision1'],
                    },
                ],
                results: [
                    {
                        policy: 'policy-role',
                        compliant: 'NonCompliant',
                        clusters: [
                            {
                                clusterName: 'local-cluster',
                                clusterNamespace: 'local-cluster',
                                compliant: 'Compliant',
                            },
                            {
                                clusterName: 'managed2',
                                clusterNamespace: 'managed2',
                                compliant: 'Compliant',
                            },
                        ],
                    },
                ],
            },
        },
    ]

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
        return (
            <Card
                isRounded
                isLarge
                isHoverable
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
                                                <PolicySetSidebar
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
                    {(policyCompliantCount > 0 || policyNonCompliantCount > 0) && (
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
                        </LabelGroup>
                    )}
                </CardBody>
            </Card>
        )
    }

    const clearSearch = useCallback(() => {
        setCardViewSearch('')
    }, [setCardViewSearch])

    const updateSearch = useCallback(
        (newSearch: string) => {
            setCardViewSearch(newSearch)
        },
        [setCardViewSearch]
    )

    if (!policySets || policySets.length === 0) {
        return (
            <AcmEmptyState
                title={t('No resources found')}
                message={t('You do not have any PolicySets')}
                showIcon={true}
                action={
                    <Button
                        id={'create-policy-set'}
                        key={'create-policy-set'}
                        // onClick={() => {})} // TODO create PolicySet wizard
                        isDisabled={true} // TODO create PolicySet wizard
                        variant={'primary'}
                    >
                        {t('Create policy set')}
                    </Button>
                }
            />
        )
    }

    let filteredPolicySets = policySets
    if (cardViewSearch !== '') {
        filteredPolicySets = filteredPolicySets.filter((filteredPolicySet: PolicySet) =>
            filteredPolicySet.metadata.name.toLowerCase().includes(cardViewSearch.toLowerCase())
        )
    }

    return (
        <Fragment>
            <PageSection variant={PageSectionVariants.light}>
                <Toolbar isFullHeight={true} id="toolbar-group-types">
                    <ToolbarContent>
                        <Fragment>
                            <ToolbarItem variant="search-filter">
                                <SearchInput
                                    placeholder={t('Search by name')}
                                    value={cardViewSearch}
                                    onChange={updateSearch}
                                    onClear={clearSearch}
                                    resultsCount={`${filteredPolicySets.length} / ${policySets.length}`}
                                    style={{ flexGrow: 1 }}
                                />
                            </ToolbarItem>
                            <ToolbarItem key={`create-policy-set-toolbar-item`}>
                                <Button
                                    id={'create-policy-set'}
                                    key={'create-policy-set'}
                                    // onClick={() => {})} // TODO create PolicySet wizard
                                    isDisabled={true} // TODO create PolicySet wizard
                                    variant={'primary'}
                                >
                                    {t('Create policy set')}
                                </Button>
                            </ToolbarItem>
                        </Fragment>
                    </ToolbarContent>
                </Toolbar>
            </PageSection>
            {filteredPolicySets.length === 0 ? (
                <AcmEmptyState title={t('No resources match the current search filter')} showIcon={true} />
            ) : (
                <PageSection isFilled>
                    <Gallery
                        hasGutter
                        maxWidths={{
                            sm: '350px',
                            md: '350px',
                            lg: '350px',
                            xl: '350px',
                            '2xl': '350px',
                        }}
                        minWidths={{
                            sm: '350px',
                            md: '350px',
                            lg: '350px',
                            xl: '350px',
                            '2xl': '350px',
                        }}
                    >
                        {filteredPolicySets.map((policyset: PolicySet, cardIdx: number) => {
                            return renderPolicySetCard(policyset, cardIdx)
                        })}
                    </Gallery>
                </PageSection>
            )}
        </Fragment>
    )
}
