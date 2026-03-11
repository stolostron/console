/* Copyright Contributors to the Open Cluster Management project */
import { Divider, Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement } from '@patternfly/react-core'
import { EllipsisVIcon } from '@patternfly/react-icons'
import { useTranslation } from '../../../../lib/acm-i18next'
import './PolicyCardDropdown.css'

type PolicyActionDropdownProps = {
  onView: () => void
  onDelete?: () => void
  onEdit?: () => void
  onOpenChange: (isOpen: boolean) => void
  isOpen: boolean
}
export const PolicyCardDropdown = ({ onView, onDelete, onEdit, onOpenChange, isOpen }: PolicyActionDropdownProps) => {
  const { t } = useTranslation()

  const handleOpenChange = (
    event:
      | React.MouseEvent<HTMLAnchorElement>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
      | React.MouseEvent<HTMLDivElement, MouseEvent>,
    isOpen: boolean
  ) => {
    event.stopPropagation()
    event.preventDefault()
    onOpenChange(isOpen)
  }

  const handleActionClick = (event: React.MouseEvent<HTMLAnchorElement>, callback?: () => void) => {
    handleOpenChange(event, false)
    callback?.()
  }

  return (
    <Dropdown
      onOpenChange={() => onOpenChange(!isOpen)}
      onSelect={() => onOpenChange(!isOpen)}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          onClick={(event) => handleOpenChange(event, !isOpen)}
          variant="plain"
          isExpanded={isOpen}
        >
          <EllipsisVIcon />
        </MenuToggle>
      )}
      isOpen={isOpen}
    >
      <DropdownList>
        <DropdownItem key="view details" onClick={(event) => handleActionClick(event, onView)}>
          {t('View details')}
        </DropdownItem>
        <DropdownItem
          isAriaDisabled={!onEdit}
          tooltipProps={!onEdit ? { content: t('rbac.unauthorized') } : undefined}
          key="edit"
          onClick={(event) => handleActionClick(event, onEdit)}
        >
          {t('Edit')}
        </DropdownItem>
        <Divider component="li" key="separator" />
        <DropdownItem
          isAriaDisabled={!onDelete}
          tooltipProps={!onDelete ? { content: t('rbac.unauthorized') } : undefined}
          key="delete"
          onClick={(event) => handleActionClick(event, onDelete)}
        >
          {t('Delete')}
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  )
}
