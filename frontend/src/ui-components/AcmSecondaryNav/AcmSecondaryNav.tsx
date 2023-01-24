/* Copyright Contributors to the Open Cluster Management project */

import { Nav, NavItem, NavList } from '@patternfly/react-core'
import { ReactNode } from 'react'

export function AcmSecondaryNav(props: { children: ReactNode }) {
  return (
    <Nav variant="tertiary">
      <NavList>{props.children}</NavList>
    </Nav>
  )
}
export function AcmSecondaryNavItem(props: {
  onClick?: () => void
  isActive: boolean
  to?: string
  children: ReactNode
}) {
  return (
    <NavItem onClick={props.onClick} isActive={props.isActive} to={props.to}>
      {props.children}
    </NavItem>
  )
}
