/* Copyright Contributors to the Open Cluster Management project */

import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Checkbox,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Icon,
  Stack,
  StackItem,
} from '@patternfly/react-core'
import { Modal, ModalVariant } from '@patternfly/react-core/deprecated'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { generatePath, Link, useNavigate } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../lib/acm-i18next'
import { deletePolicySet } from '../../../../lib/delete-policyset'
import { NavigationPath } from '../../../../NavigationPath'
import { PolicySet } from '../../../../resources'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { AcmDrawerContext, AcmDrawerProps } from '../../../../ui-components'
import { PolicySetDetailSidebar } from '../components/PolicySetDetailSidebar'
import { PolicyCardDropdown } from './PolicyCardDropdown'
import { getPlacementsForResource } from '../../common/util'

function PolicySetDrawerTitle(props: { policySet: PolicySet }) {
  const { policySet } = props
  const { t } = useTranslation()
  const { placementBindingsState, placementRulesState, placementsState, settingsState } = useSharedAtoms()
  const placements = useRecoilValue(placementsState)
  const placementRules = useRecoilValue(placementRulesState)
  const placementBindings = useRecoilValue(placementBindingsState)
  const settings = useRecoilValue(settingsState)

  const policySetPlacements = useMemo(
    () => [
      ...getPlacementsForResource(policySet, placementBindings, placements),
      ...getPlacementsForResource(policySet, placementBindings, placementRules),
    ],
    [policySet, placementBindings, placements, placementRules]
  )

  return (
    <Stack>
      {policySet.metadata.name}
      <div style={{ fontSize: 'smaller', opacity: 0.6, fontWeight: 'normal' }}>
        {`${t('Namespace')}: ${policySet.metadata.namespace}`}
      </div>
      {settings.enhancedPlacement === 'enabled' && policySetPlacements.length > 0 && (
        <div style={{ fontSize: 'smaller', opacity: 0.6, fontWeight: 'normal' }}>
          {`${t('Placement')}: `}
          {policySetPlacements
            .filter((placement) => placement.metadata?.name && placement.metadata?.namespace)
            .map((placement, index, filteredArray) => (
              <span key={`${placement.metadata.namespace}/${placement.metadata.name}`}>
                <Link
                  to={generatePath(NavigationPath.placementDetails, {
                    namespace: placement.metadata.namespace!,
                    name: placement.metadata.name!,
                  })}
                >
                  {placement.metadata.name}
                </Link>
                {index < filteredArray.length - 1 && ', '}
              </span>
            ))}
        </div>
      )}
    </Stack>
  )
}

export default function PolicySetCard(props: {
  policySet: PolicySet
  selectedCardID: string
  setSelectedCardID: React.Dispatch<React.SetStateAction<string>>
  canEditPolicySet: boolean
  canDeletePolicySet: boolean
  cardIdActionMenuOpen: string | undefined
  setCardIdActionMenuOpen: (cardID: string | undefined) => void
}) {
  const {
    policySet,
    selectedCardID,
    setSelectedCardID,
    canEditPolicySet,
    canDeletePolicySet,
    cardIdActionMenuOpen,
    setCardIdActionMenuOpen,
  } = props
  const { t } = useTranslation()
  const { setDrawerContext } = useContext(AcmDrawerContext)
  const [modal, setModal] = useState<ReactNode | undefined>()
  const navigate = useNavigate()

  const cardID = `policyset-${policySet.metadata.namespace}-${policySet.metadata.name}`

  const scrollTimeoutRef = useRef<number | undefined>(undefined)
  useEffect(
    () => () => {
      if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current)
    },
    []
  )

  const openDetails = (cardId: string) => {
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current)
      scrollTimeoutRef.current = undefined
    }

    if (cardId) {
      setDrawerContext({
        isExpanded: true,
        onCloseClick: () => {
          setDrawerContext(undefined)
          setSelectedCardID('')
        },
        title: <PolicySetDrawerTitle policySet={policySet} />,
        panelContent: <PolicySetDetailSidebar policySet={policySet} />,
        panelContentProps: { defaultSize: '40%' },
        isInline: true,
        isResizable: true,
      })
      // Introduce a delay (400ms) until scroll to selected card to wait for sidebar to transition.
      scrollTimeoutRef.current = window.setTimeout(() => {
        const cardElement = document.getElementById(cardId)
        cardElement?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      }, 400)
    } else {
      setDrawerContext(undefined)
    }
  }

  const onSelect = (cardId: string) => {
    const newSelectedCard = cardId === selectedCardID ? '' : cardId
    setSelectedCardID(newSelectedCard)
    openDetails(newSelectedCard)
  }

  const onViewDetails = (cardId: string) => {
    setSelectedCardID(cardId)
    openDetails(cardId)
  }

  return (
    <div>
      {modal !== undefined && modal}
      <Card
        isFullHeight
        isClickable
        isSelectable
        isClicked={selectedCardID === cardID}
        isSelected={selectedCardID === cardID}
        id={cardID}
        key={cardID}
      >
        <CardHeader
          selectableActions={{
            selectableActionId: cardID,
            selectableActionAriaLabelledby: cardID,
            name: cardID,
            hasNoOffset: true,
            isHidden: true,
          }}
          actions={{
            actions: (
              <PolicyCardDropdown
                onView={() => onViewDetails(cardID)}
                onEdit={
                  canEditPolicySet
                    ? () => {
                        navigate(
                          generatePath(NavigationPath.editPolicySet, {
                            namespace: policySet.metadata.namespace,
                            name: policySet.metadata.name,
                          })
                        )
                      }
                    : undefined
                }
                onDelete={
                  canDeletePolicySet
                    ? () => {
                        setModal(
                          <DeletePolicySetModal
                            item={policySet}
                            onClose={() => setModal(undefined)}
                            setDrawerContext={setDrawerContext}
                            setSelectedCardID={setSelectedCardID}
                          />
                        )
                      }
                    : undefined
                }
                isOpen={cardIdActionMenuOpen === cardID}
                onOpenChange={(isOpen) => setCardIdActionMenuOpen(isOpen ? cardID : undefined)}
              />
            ),
            hasNoOffset: true,
            className: undefined,
          }}
          isToggleRightAligned
        >
          <CardTitle>
            <Stack>
              <Button variant="link" isInline onClick={() => onSelect(cardID)}>
                {policySet.metadata.name}
              </Button>
              <div style={{ fontSize: 'smaller', opacity: 0.6, fontWeight: 'normal' }}>
                {t('Namespace: {{namespace}}', { namespace: policySet.metadata.namespace })}
              </div>
            </Stack>
          </CardTitle>
        </CardHeader>
        <CardBody>
          <Stack hasGutter>
            {policySet.spec.description && <div>{policySet.spec.description ?? ''}</div>}
            <DescriptionList>
              {(policySet.status?.compliant || policySet.status?.statusMessage) && (
                <DescriptionListGroup>
                  <DescriptionListTerm>
                    <strong>{t('Status')}</strong>
                  </DescriptionListTerm>
                  {policySet.status?.compliant && (
                    <DescriptionListDescription>
                      {policySet.status?.compliant === 'Compliant' && (
                        <div>
                          <Icon status="success">
                            <CheckCircleIcon />
                          </Icon>{' '}
                          &nbsp;
                          {t('No violations')}
                        </div>
                      )}
                      {policySet.status?.compliant === 'NonCompliant' && (
                        <div>
                          <Icon status="danger">
                            <ExclamationCircleIcon />
                          </Icon>{' '}
                          &nbsp;
                          {t('Violations')}
                        </div>
                      )}
                      {policySet.status?.compliant === 'Pending' && (
                        <div>
                          <Icon status="warning">
                            <ExclamationTriangleIcon />
                          </Icon>{' '}
                          &nbsp;
                          {t('Pending')}
                        </div>
                      )}
                    </DescriptionListDescription>
                  )}
                  {policySet.status?.statusMessage && (
                    <div>
                      {policySet.status?.statusMessage
                        .split(';')
                        .map((statusMes) => (
                          <DescriptionListDescription key={`${policySet.metadata.name}-${statusMes}`}>
                            {statusMes}
                          </DescriptionListDescription>
                        ))}
                    </div>
                  )}
                </DescriptionListGroup>
              )}
            </DescriptionList>
          </Stack>
        </CardBody>
      </Card>
    </div>
  )
}

function DeletePolicySetModal(props: {
  item: PolicySet
  onClose: () => void
  setDrawerContext: React.Dispatch<React.SetStateAction<AcmDrawerProps | undefined>>
  setSelectedCardID: React.Dispatch<React.SetStateAction<string>>
}) {
  const { t } = useTranslation()
  const [deletePlacements, setDeletePlacements] = useState(true)
  const [deletePlacementBindings, setDeletePlacementBindings] = useState(true)
  const { placementBindingsState, placementRulesState, placementsState } = useSharedAtoms()
  const placements = useRecoilValue(placementsState)
  const placementRules = useRecoilValue(placementRulesState)
  const placementBindings = useRecoilValue(placementBindingsState)
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
      setIsDeleting(false)
      props.setDrawerContext(undefined)
      props.setSelectedCardID('')
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(t('Unknown error occurred'))
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
      titleIconVariant={'warning'}
      isOpen
      onClose={props.onClose}
      actions={[
        <Button key="confirm" variant="danger" onClick={onConfirm} isLoading={isDeleting}>
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
          {t(
            'Removing {{name}} is irreversible. Select any associated resources that you want to delete in addition to {{name}}.',
            { name: props.item.metadata.name }
          )}
        </StackItem>
        <StackItem>
          <Checkbox
            id="delete-placement-bindings"
            isChecked={deletePlacementBindings}
            onChange={(_event, val) => setDeletePlacementBindings(val)}
            label={t('policy.modal.delete.associatedResources.placementBinding')}
          />
        </StackItem>
        <StackItem>
          <Checkbox
            id="delete-placements"
            isChecked={deletePlacements}
            onChange={(_event, val) => setDeletePlacements(val)}
            label={t('policy.modal.delete.associatedResources.placement')}
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
