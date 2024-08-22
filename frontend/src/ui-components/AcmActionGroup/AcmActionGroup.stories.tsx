/* Copyright Contributors to the Open Cluster Management project */

import { useState } from 'react'
import { Card, CardBody } from '@patternfly/react-core'
import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core/deprecated'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { AcmActionGroup } from './AcmActionGroup'
import { AcmDropdown } from '../AcmDropdown/AcmDropdown'
import { AcmLaunchLink } from '../AcmLaunchLink/AcmLaunchLink'
import CaretDownIcon from '@patternfly/react-icons/dist/js/icons/caret-down-icon'

export default {
  title: 'ActionGroup',
  component: AcmActionGroup,
}

export function ActionGroup() {
  return (
    <Card>
      <CardBody>
        <AcmActionGroup>
          <ConfigDropdown />
          <AcmLaunchLink links={[{ id: 'link', text: 'Grafana', href: '/grafana' }]} />
          <ConfigDropdown />
          <ActionDropdown />
          <CreateDropdown />
        </AcmActionGroup>
      </CardBody>
    </Card>
  )
}

const ConfigDropdown = () => {
  const dropdownItems = [
    { id: 'install-config', text: 'Install config' },
    { id: 'kubeconfig', text: 'Kubeconfig' },
    { id: 'other-config', text: 'Other config', isDisabled: true, tooltip: 'Forbidden' },
    { id: 'launch-out', text: 'Launch page', icon: <ExternalLinkAltIcon /> },
    { id: 'link item', text: 'Link item', href: 'www.google.com', component: 'a' },
  ]
  const onSelect = (id: string) => alert(`clicked: ${id}`)
  const onHover = () => alert('hovered')
  return (
    <AcmDropdown
      onHover={onHover}
      isDisabled={false}
      tooltip="Tooltip message"
      id="dropdown"
      onSelect={onSelect}
      text="Download configuration"
      dropdownItems={dropdownItems}
      isKebab={false}
      isPlain={true}
    />
  )
}

const ActionDropdown = () => {
  const dropdownItems = [
    { id: 'edit-labels', text: 'Edit labels' },
    { id: 'search', text: 'Search cluster' },
    { id: 'launch-dashboard', text: 'Launch to console', icon: <ExternalLinkAltIcon /> },
    { id: 'destroy', text: 'Destroy cluster' },
  ]
  const onSelect = (id: string) => alert(`clicked: ${id}`)
  return (
    <AcmDropdown
      isDisabled={false}
      tooltip="Tooltip message"
      id="dropdown"
      onSelect={onSelect}
      text="Actions"
      dropdownItems={dropdownItems}
      isKebab={false}
      isPlain={true}
    />
  )
}

const CreateDropdown = () => {
  const [isOpen, setOpen] = useState<boolean>(false)
  return (
    <Dropdown
      isOpen={isOpen}
      toggle={
        <DropdownToggle
          onToggle={() => setOpen(!isOpen)}
          toggleIndicator={CaretDownIcon}
          toggleVariant="primary"
          id="cluster-actions"
        >
          Add cluster
        </DropdownToggle>
      }
      dropdownItems={[
        <DropdownItem key="create" component="a" onClick={() => alert('create-cluster')} id="create-cluster">
          Create cluster
        </DropdownItem>,
        <DropdownItem key="import" component="a" onClick={() => alert('import-cluster')} id="import-cluster">
          Import cluster
        </DropdownItem>,
      ]}
    />
  )
}
