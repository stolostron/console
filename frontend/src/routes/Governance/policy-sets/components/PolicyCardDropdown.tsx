/* Copyright Contributors to the Open Cluster Management project */
import { Divider, Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement } from '@patternfly/react-core'
import { EllipsisVIcon } from '@patternfly/react-icons'
import { useTranslation } from '../../../../lib/acm-i18next'
import { useState } from 'react'

type PolicyActionDropdownProps = {
  onView: () => void
  onDelete?: () => void
  onEdit?: () => void
}
export const PolicyCardDropdown = ({ onView, onDelete, onEdit }: PolicyActionDropdownProps) => {
  const { t } = useTranslation()
  const [isKebabOpen, setIsKebabOpen] = useState(false)

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>, callback?: () => void) => {
    setIsKebabOpen(false)
    event.stopPropagation()
    callback?.()
  }

  return (
    <Dropdown
      onOpenChange={() => setIsKebabOpen(!isKebabOpen)}
      onSelect={() => setIsKebabOpen(!isKebabOpen)}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          onClick={(event) => {
            setIsKebabOpen(!isKebabOpen)
            event.stopPropagation()
          }}
          variant="plain"
          isExpanded={isKebabOpen}
        >
          <EllipsisVIcon />
        </MenuToggle>
      )}
      isOpen={isKebabOpen}
      isPlain={true}
    >
      <DropdownList>
        <DropdownItem key="view details" onClick={(event) => handleClick(event, onView)}>
          {t('View details')}
        </DropdownItem>
        <DropdownItem
          isAriaDisabled={!onEdit}
          tooltipProps={{ content: !onEdit ? t('rbac.unauthorized') : '' }}
          key="edit"
          onClick={(event) => handleClick(event, onEdit)}
        >
          {t('Edit')}
        </DropdownItem>
        <Divider component="li" key="separator" />
        <DropdownItem
          isAriaDisabled={!onDelete}
          tooltipProps={{ content: !onDelete ? t('rbac.unauthorized') : '' }}
          key="delete"
          onClick={(event) => handleClick(event, onDelete)}
        >
          {t('Delete')}
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  )
}
