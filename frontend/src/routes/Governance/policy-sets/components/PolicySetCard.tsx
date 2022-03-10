/* Copyright Contributors to the Open Cluster Management project */

import {
    Alert,
    Button,
    Card,
    CardActions,
    CardBody,
    CardHeader,
    CardTitle,
    Checkbox,
    Dropdown,
    DropdownItem,
    DropdownSeparator,
    KebabToggle,
    Modal,
    ModalVariant,
    Stack,
    StackItem,
} from '@patternfly/react-core'
import { AcmDrawerContext } from '@stolostron/ui-components'
import { ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { placementBindingsState, placementRulesState, placementsState } from '../../../../atoms'
import { useTranslation } from '../../../../lib/acm-i18next'
import { deletePolicySet } from '../../../../lib/delete-policyset'
import { NavigationPath } from '../../../../NavigationPath'
import { PolicySet } from '../../../../resources'
import { ClusterPolicyViolationIcons } from '../../components/ClusterPolicyViolations'
import { PolicyViolationIcons } from '../../components/PolicyViolations'
import { IPolicyRisks } from '../../useGovernanceData'
import { PolicySetDetailSidebar } from '../components/PolicySetDetailSidebar'
import { IPolicySetSummary, usePolicySetSummary } from '../usePolicySetSummary'

function getClusterRisks(policySetSummary: IPolicySetSummary) {
    const clusterViolationCount = policySetSummary.clusterViolations
    const clusterNonViolationCount = policySetSummary.clusterCount - clusterViolationCount
    const clusterRisks: IPolicyRisks = {
        synced: clusterNonViolationCount,
        high: clusterViolationCount,
        medium: 0,
        low: 0,
        unknown: 0,
    }
    return clusterRisks
}

function getPolicyRisks(policySetSummary: IPolicySetSummary) {
    const policyViolationCount = policySetSummary.policyViolations
    const policyUnknownCount = policySetSummary.policyUnknownStatusCount
    const policyNonViolationCount = policySetSummary.policyCount - policyViolationCount - policyUnknownCount
    const policyRisks: IPolicyRisks = {
        synced: policyNonViolationCount,
        high: policyViolationCount,
        medium: 0,
        low: 0,
        unknown: policyUnknownCount,
    }
    return policyRisks
}

export default function PolicySetCard(props: { policySet: PolicySet }) {
    const { policySet } = props
    const { t } = useTranslation()
    const { setDrawerContext } = useContext(AcmDrawerContext)
    const [isKebabOpen, setIsKebabOpen] = useState<boolean>(false)
    const [modal, setModal] = useState<ReactNode | undefined>()
    const history = useHistory()
    const policySetSummary = usePolicySetSummary(policySet)

    const { clusterRisks, policyRisks } = useMemo(() => {
        const clusterRisks = getClusterRisks(policySetSummary)
        const policyRisks = getPolicyRisks(policySetSummary)
        return { policySetSummary, clusterRisks, policyRisks }
    }, [policySetSummary])

    function onClick(event: React.MouseEvent) {
        if (!event.currentTarget.contains(event.target as Node)) {
            return
        }
        setDrawerContext({
            isExpanded: true,
            onCloseClick: () => setDrawerContext(undefined),
            panelContent: <PolicySetDetailSidebar policySet={policySet} />,
            panelContentProps: { defaultSize: '40%' },
            isInline: true,
            isResizable: true,
        })
    }

    function onToggle(
        isOpen: boolean,
        event: MouseEvent | KeyboardEvent | React.KeyboardEvent<any> | React.MouseEvent<HTMLButtonElement>
    ) {
        event.stopPropagation()
        setIsKebabOpen(isOpen)
    }

    function onSelectOverflow(event?: React.SyntheticEvent<HTMLDivElement>) {
        event?.stopPropagation()
        setIsKebabOpen(false)
    }

    return (
        <div>
            {modal !== undefined && modal}
            <Card
                isRounded
                isHoverable
                isFullHeight
                id={`policyset-${policySet.metadata.namespace}-${policySet.metadata.name}`}
                key={`policyset-${policySet.metadata.namespace}-${policySet.metadata.name}`}
                style={{ transition: 'box-shadow 0.25s', cursor: 'pointer' }}
                onClick={onClick}
            >
                <CardHeader isToggleRightAligned={true}>
                    <CardActions>
                        <Dropdown
                            onSelect={onSelectOverflow}
                            toggle={<KebabToggle onToggle={onToggle} />}
                            isOpen={isKebabOpen}
                            isPlain
                            dropdownItems={[
                                <DropdownItem
                                    key="view details"
                                    onClick={() => {
                                        setDrawerContext({
                                            isExpanded: true,
                                            onCloseClick: () => setDrawerContext(undefined),
                                            panelContent: <PolicySetDetailSidebar policySet={policySet} />,
                                            panelContentProps: { defaultSize: '40%' },
                                            isInline: true,
                                            isResizable: true,
                                        })
                                    }}
                                >
                                    {t('View details')}
                                </DropdownItem>,
                                <DropdownItem
                                    key="edit"
                                    onClick={() => {
                                        history.push(
                                            NavigationPath.editPolicySet
                                                .replace(':namespace', policySet.metadata.namespace)
                                                .replace(':name', policySet.metadata.name)
                                        )
                                    }}
                                >
                                    {t('Edit')}
                                </DropdownItem>,
                                <DropdownSeparator key="separator" />,
                                <DropdownItem
                                    key="delete"
                                    onClick={() => {
                                        setIsKebabOpen(false)
                                        setModal(
                                            <DeletePolicySetModal
                                                item={policySet}
                                                onClose={() => setModal(undefined)}
                                            />
                                        )
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
                            <div style={{ fontSize: 'small', opacity: 0.6, fontWeight: 'normal' }}>
                                {`Namespace: ${policySet.metadata.namespace}`}
                            </div>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardBody>
                    <Stack hasGutter>
                        {policySet.spec.description && <div>{policySet.spec.description ?? ''}</div>}
                        {policySetSummary.clusterCount > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <span>
                                    <strong>{policySetSummary.clusterCount}</strong> clusters
                                </span>
                                <div style={{ paddingLeft: 16 }}>
                                    <ClusterPolicyViolationIcons risks={clusterRisks} />
                                </div>
                            </div>
                        )}
                        {policySetSummary.policyCount > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <span>
                                    <strong>{policySetSummary.policyCount}</strong> policies
                                </span>
                                <div style={{ paddingLeft: 16 }}>
                                    <PolicyViolationIcons risks={policyRisks} />
                                </div>
                            </div>
                        )}
                    </Stack>
                </CardBody>
            </Card>
        </div>
    )
}

function DeletePolicySetModal(props: { item: PolicySet; onClose: () => void }) {
    const { t } = useTranslation()
    const [deletePlacements, setDeletePlacements] = useState(true)
    const [deletePlacementBindings, setDeletePlacementBindings] = useState(true)
    const [placements] = useRecoilState(placementsState)
    const [placementRules] = useRecoilState(placementRulesState)
    const [placementBindings] = useRecoilState(placementBindingsState)
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState('')
    const onConfirm = useCallback(async () => {
        setIsDeleting(true)
        try {
            setError('')
            await deletePolicySet(
                props.item,
                placements,
                placementRules,
                placementBindings,
                deletePlacements,
                deletePlacementBindings
            ).promise
            props.onClose()
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError(t('Unknown error occured'))
            }
            setIsDeleting(false)
        }
    }, [props, placements, placementRules, placementBindings, deletePlacements, deletePlacementBindings, t])
    return (
        <Modal
            title={t('Permanently delete {{type}} {{name}}?', {
                type: props.item.kind,
                name: '',
            })}
            titleIconVariant={'danger'}
            isOpen
            onClose={props.onClose}
            actions={[
                <Button key="confirm" variant="primary" onClick={onConfirm} isLoading={isDeleting}>
                    {isDeleting ? t('deleting') : t('delete')}
                </Button>,
                <Button key="cancel" variant="link" onClick={props.onClose}>
                    {t('Cancel')}
                </Button>,
            ]}
            variant={ModalVariant.medium}
        >
            <Stack hasGutter>
                <StackItem>
                    {t(`Removing ${props.item.metadata.name} is irreversible. Select any associated resources that need to be
            deleted in addition to ${props.item.metadata.name}.`)}
                </StackItem>
                <StackItem>
                    <Checkbox
                        id="delete-placement-bindings"
                        isChecked={deletePlacementBindings}
                        onChange={setDeletePlacementBindings}
                        label={t('policy.modal.delete.associatedResources.placementBinding')}
                    />
                </StackItem>
                <StackItem>
                    <Checkbox
                        id="delete-placements"
                        isChecked={deletePlacements}
                        onChange={setDeletePlacements}
                        label={t('policy.modal.delete.associatedResources.placementRule')}
                    />
                </StackItem>
                {error && (
                    <StackItem>
                        <Alert variant="danger" title={error} isInline />
                    </StackItem>
                )}
            </Stack>
        </Modal>
    )
}
