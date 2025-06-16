/* Copyright Contributors to the Open Cluster Management project */
import { useState } from 'react'
import { Dropdown, DropdownItem, DropdownList, Divider, MenuToggle, MenuToggleElement } from '@patternfly/react-core'

type DropdownBasicProps = {
  openMigrateModal: () => void
}

export const DropdownBasic: React.FunctionComponent<DropdownBasicProps> = ({ openMigrateModal }) => {
  const [isOpen, setIsOpen] = useState(false)

  const onToggleClick = () => {
    setIsOpen(!isOpen)
  }

  const onSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    // eslint-disable-next-line no-console
    console.log('selected', value)
    setIsOpen(false)
  }

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={onSelect}
      onOpenChange={setIsOpen}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle ref={toggleRef} onClick={onToggleClick} isExpanded={isOpen}>
          Actions
        </MenuToggle>
      )}
      ouiaId="BasicDropdown"
      shouldFocusToggleOnSelect
    >
      <DropdownList>
        <DropdownItem value="start" key="start">
          Start
        </DropdownItem>
        <DropdownItem value="restart" key="restart">
          Restart
        </DropdownItem>
        <DropdownItem value="pause" key="pause">
          Pause
        </DropdownItem>
        <Divider component="li" key="divider-1" />
        <DropdownItem value="migrate" key="migrate" onClick={openMigrateModal}>
          Migrate
        </DropdownItem>
        <Divider component="li" key="divider-2" />
        <DropdownItem value="edit" key="edit">
          Edit
        </DropdownItem>
        <DropdownItem value="view" key="view">
          View related resources
        </DropdownItem>
        <DropdownItem value="delete" key="delete">
          Delete
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  )
}
