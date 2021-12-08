/* Copyright Contributors to the Open Cluster Management project */

import { AcmEmptyState } from '@open-cluster-management/ui-components'
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
import { Fragment, useCallback, useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { useRecoilState } from 'recoil'
import { policySetsState } from '../../../atoms'
import { PolicySet, PolicySetResultClusters, PolicySetResultsStatus } from '../../../resources/policy-set'

export default function PolicySetsPage() {
    const { t } = useTranslation()
    const [policySets] = useRecoilState(policySetsState)
    const [cardViewSearch, setCardViewSearch] = useState('')
    const [cardOpenIdx, setCardOpenIdx] = useState<number>()
    function onCardToggle(cardIdx: number) {
        if (cardOpenIdx === cardIdx) {
            setCardOpenIdx(undefined)
        } else setCardOpenIdx(cardIdx)
    }

    function renderPolicySetCard(policySet: PolicySet, cardIdx: number) {
        const policySetClusters: PolicySetResultClusters[] = policySet.status?.results.reduce(
            (acc: any, curr: PolicySetResultsStatus) => {
                return acc.concat(curr?.clusters ?? [])
            },
            []
        )
        const clusterCompliantCount = policySetClusters.filter((cluster) => cluster.compliant === 'Compliant').length
        const clusterNonCompliantCount = policySetClusters.filter(
            (cluster) => cluster.compliant === 'NonCompliant'
        ).length
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
                                <DropdownItem key="view details">{t('View details')}</DropdownItem>,
                                <DropdownItem key="edit">{t('Edit')}</DropdownItem>,
                                <DropdownSeparator key="separator" />,
                                <DropdownItem key="delete">{t('Delete')}</DropdownItem>,
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
                    {(clusterCompliantCount > 0 || clusterCompliantCount > 0) && (
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
                    <Gallery hasGutter>
                        {filteredPolicySets.map((policyset: PolicySet, cardIdx: number) => {
                            return renderPolicySetCard(policyset, cardIdx)
                        })}
                    </Gallery>
                </PageSection>
            )}
        </Fragment>
    )
}
