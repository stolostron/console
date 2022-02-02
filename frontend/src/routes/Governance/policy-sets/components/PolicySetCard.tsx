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
    KebabToggle,
    Label,
    LabelGroup,
    Stack,
} from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { AcmDrawerContext } from '@stolostron/ui-components'
import { useContext, useState } from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'
import { deleteResource, PolicySet } from '../../../../resources'
import { PolicySetDetailSidebar } from '../components/PolicySetDetailSidebar'
import { usePolicySetSummary } from '../usePolicySetSummary'

export default function PolicySetCard(props: { policySet: PolicySet; cardIdx: number }) {
    const { policySet, cardIdx } = props
    const { t } = useTranslation()
    const { setDrawerContext } = useContext(AcmDrawerContext)
    const [cardOpenIdx, setCardOpenIdx] = useState<number>()
    const policySetSummary = usePolicySetSummary(policySet)

    function onCardToggle(cardIdx: number) {
        if (cardOpenIdx === cardIdx) {
            setCardOpenIdx(undefined)
        } else setCardOpenIdx(cardIdx)
    }

    const clusterViolationCount = policySetSummary.clusterViolations
    const clusterNonViolationCount = policySetSummary.clusterCount - clusterViolationCount
    const totalClusterCount = policySetSummary.clusterCount
    const policyViolationCount = policySetSummary.policyViolations
    const policyUnknownCount = policySetSummary.policyUnknownStatusCount
    const policyNonViolationCount = policySetSummary.policyCount - policyViolationCount - policyUnknownCount
    const totalPolicyCount = policySetSummary.policyCount

    return (
        <Card
            isRounded
            isLarge
            isHoverable
            isFullHeight
            key={`policyset-${cardIdx}`}
            style={{ transition: 'box-shadow 0.25s', cursor: 'pointer' }}
        >
            <CardHeader isToggleRightAligned={true}>
                <CardActions>
                    <Dropdown
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
                                        panelContent: <PolicySetDetailSidebar policySet={policySet} />,
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
                                onClick={() => {
                                    deleteResource({
                                        apiVersion: 'policy.open-cluster-management.io/v1',
                                        kind: 'PolicySet',
                                        metadata: {
                                            name: policySet.metadata.name,
                                            namespace: policySet.metadata.namespace,
                                        },
                                    })
                                }}
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
                <Stack hasGutter>
                    <div>{policySet.spec.description}</div>
                    <Stack>
                        <div style={{ marginTop: '.5rem' }}>
                            <strong>{totalClusterCount}</strong> clusters
                        </div>
                        {totalClusterCount > 0 && (
                            <LabelGroup>
                                {clusterNonViolationCount > 0 && (
                                    <Label icon={<CheckCircleIcon />} color="green">
                                        {clusterNonViolationCount}
                                    </Label>
                                )}
                                {clusterViolationCount > 0 && (
                                    <Label icon={<ExclamationCircleIcon />} color="red">
                                        {clusterViolationCount}
                                    </Label>
                                )}
                            </LabelGroup>
                        )}
                        <div style={{ marginTop: '.5rem' }}>
                            <strong>{totalPolicyCount}</strong> policies
                        </div>
                        {totalPolicyCount > 0 && (
                            <LabelGroup>
                                {policyNonViolationCount > 0 && (
                                    <Label icon={<CheckCircleIcon />} color="green">
                                        {policyNonViolationCount}
                                    </Label>
                                )}
                                {policyViolationCount > 0 && (
                                    <Label icon={<ExclamationCircleIcon />} color="red">
                                        {policyViolationCount}
                                    </Label>
                                )}
                                {policyUnknownCount > 0 && (
                                    <Label icon={<ExclamationTriangleIcon color="orange" />} color="orange">
                                        {policyUnknownCount}
                                    </Label>
                                )}
                            </LabelGroup>
                        )}
                    </Stack>
                </Stack>
            </CardBody>
        </Card>
    )
}
