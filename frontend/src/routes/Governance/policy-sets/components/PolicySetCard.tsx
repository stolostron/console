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
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    Dropdown,
    DropdownItem,
    DropdownSeparator,
    KebabToggle,
    Modal,
    ModalVariant,
    Stack,
    StackItem,
} from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons'
import { AcmDrawerContext } from '@stolostron/ui-components'
import { ReactNode, useCallback, useContext, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { placementBindingsState, placementRulesState, placementsState } from '../../../../atoms'
import { useTranslation } from '../../../../lib/acm-i18next'
import { deletePolicySet } from '../../../../lib/delete-policyset'
import { NavigationPath } from '../../../../NavigationPath'
import { PolicySet } from '../../../../resources'
import { PolicySetDetailSidebar } from '../components/PolicySetDetailSidebar'

export default function PolicySetCard(props: {
    policySet: PolicySet
    selectedCardID: string
    setSelectedCardID: React.Dispatch<React.SetStateAction<string>>
}) {
    const { policySet, selectedCardID, setSelectedCardID } = props
    const { t } = useTranslation()
    const { setDrawerContext } = useContext(AcmDrawerContext)
    const [isKebabOpen, setIsKebabOpen] = useState<boolean>(false)
    const [modal, setModal] = useState<ReactNode | undefined>()
    const history = useHistory()
    const cardID = `policyset-${policySet.metadata.namespace}-${policySet.metadata.name}`

    function onClick(event: React.MouseEvent) {
        const newSelectedCard = event.currentTarget.id === selectedCardID ? '' : event.currentTarget.id
        setSelectedCardID(newSelectedCard)
        if (!event.currentTarget.contains(event.target as Node)) {
            return
        }
        setDrawerContext({
            isExpanded: true,
            onCloseClick: () => {
                setDrawerContext(undefined)
                setSelectedCardID('')
            },
            title: (
                <Stack>
                    {policySet.metadata.name}
                    <div style={{ fontSize: 'smaller', opacity: 0.6, fontWeight: 'normal' }}>
                        {`Namespace: ${policySet.metadata.namespace}`}
                    </div>
                </Stack>
            ),
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
                isSelectable
                isSelected={selectedCardID === cardID}
                id={cardID}
                key={cardID}
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
                        <Stack>
                            {policySet.metadata.name}
                            <div style={{ fontSize: 'smaller', opacity: 0.6, fontWeight: 'normal' }}>
                                {`Namespace: ${policySet.metadata.namespace}`}
                            </div>
                        </Stack>
                    </CardTitle>
                </CardHeader>
                <CardBody>
                    <Stack hasGutter>
                        {policySet.spec.description && <div>{policySet.spec.description ?? ''}</div>}
                        {policySet.status?.compliant && (
                            <DescriptionList>
                                <DescriptionListGroup>
                                    <DescriptionListTerm>
                                        <strong>{t('Status')}</strong>
                                    </DescriptionListTerm>
                                    <DescriptionListDescription>
                                        {policySet.status?.compliant === 'Compliant' ? (
                                            <div>
                                                <CheckCircleIcon color="var(--pf-global--success-color--100)" /> &nbsp;
                                                {t('No violations')}
                                            </div>
                                        ) : (
                                            <div>
                                                <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />{' '}
                                                &nbsp;
                                                {t('Violations')}
                                            </div>
                                        )}
                                    </DescriptionListDescription>
                                </DescriptionListGroup>
                            </DescriptionList>
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
