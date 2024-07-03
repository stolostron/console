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
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { ReactNode, useCallback, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../lib/acm-i18next'
import { deletePolicySet } from '../../../../lib/delete-policyset'
import { NavigationPath } from '../../../../NavigationPath'
import { PolicySet } from '../../../../resources'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { AcmDrawerContext, AcmDrawerProps } from '../../../../ui-components'
import { PolicySetDetailSidebar } from '../components/PolicySetDetailSidebar'

export default function PolicySetCard(props: {
  policySet: PolicySet
  selectedCardID: string
  setSelectedCardID: React.Dispatch<React.SetStateAction<string>>
  canEditPolicySet: boolean
  canDeletePolicySet: boolean
}) {
  const { policySet, selectedCardID, setSelectedCardID, canEditPolicySet, canDeletePolicySet } = props
  const { t } = useTranslation()
  const { setDrawerContext } = useContext(AcmDrawerContext)
  const [isKebabOpen, setIsKebabOpen] = useState<boolean>(false)
  const [modal, setModal] = useState<ReactNode | undefined>()
  const navigate = useNavigate()
  const cardID = `policyset-${policySet.metadata.namespace}-${policySet.metadata.name}`

  function onClick(cardId: string) {
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
            {`${t('Namespace')}: ${policySet.metadata.namespace}`}
          </div>
        </Stack>
      ),
      panelContent: <PolicySetDetailSidebar policySet={policySet} />,
      panelContentProps: { defaultSize: '40%' },
      isInline: true,
      isResizable: true,
    })
    // Introduce a delay (400ms) until scroll to selected card to wait for sidebar to transition.
    setTimeout(() => {
      const cardElement = document.querySelector(`#${cardId}`)
      cardElement?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    }, 400)
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
        isFullHeight
        isSelectable
        isSelected={selectedCardID === cardID}
        id={cardID}
        key={cardID}
        style={{ transition: 'box-shadow 0.25s', cursor: 'pointer' }}
        onClick={(event) => {
          const newSelectedCard = cardID === selectedCardID ? '' : cardID
          setSelectedCardID(newSelectedCard)
          if (!event.currentTarget.contains(event.target as Node)) {
            return
          }
          onClick(cardID)
        }}
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
                    const newSelectedCard = cardID === selectedCardID ? '' : cardID
                    setSelectedCardID(newSelectedCard)
                    onClick(cardID)
                  }}
                >
                  {t('View details')}
                </DropdownItem>,
                <DropdownItem
                  isAriaDisabled={!canEditPolicySet}
                  tooltip={!canEditPolicySet ? t('rbac.unauthorized') : ''}
                  key="edit"
                  onClick={() => {
                    navigate(
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
                  isAriaDisabled={!canDeletePolicySet}
                  tooltip={!canDeletePolicySet ? t('rbac.unauthorized') : ''}
                  key="delete"
                  onClick={() => {
                    setIsKebabOpen(false)
                    setModal(
                      <DeletePolicySetModal
                        item={policySet}
                        onClose={() => setModal(undefined)}
                        setDrawerContext={setDrawerContext}
                        setSelectedCardID={setSelectedCardID}
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
                          <CheckCircleIcon color="var(--pf-global--success-color--100)" /> &nbsp;
                          {t('No violations')}
                        </div>
                      )}
                      {policySet.status?.compliant === 'NonCompliant' && (
                        <div>
                          <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" /> &nbsp;
                          {t('Violations')}
                        </div>
                      )}
                      {policySet.status?.compliant === 'Pending' && (
                        <div>
                          <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" /> &nbsp;
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
            onChange={setDeletePlacementBindings}
            label={t('policy.modal.delete.associatedResources.placementBinding')}
          />
        </StackItem>
        <StackItem>
          <Checkbox
            id="delete-placements"
            isChecked={deletePlacements}
            onChange={setDeletePlacements}
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
