/* Copyright Contributors to the Open Cluster Management project */

import React, { ReactNode } from 'react'

/**
 * This needs to be updated to use Patternfly v6 Tabs component
 * in PF v5 we were using the <Nav>, <NavList> & <NavItem> components.
 * in PF v6 those components are not used for secondary navigation and thus the styling is incorrect.
 * The correct componentry is to use the PF Tabs seen here: https://www.patternfly.org/components/tabs#default-tabs
 * Updating to use Tabs will match the implementation in OCP so we have same look & feel.
 */

export function AcmSecondaryNav(props: { children: ReactNode }) {
  return (
    <nav className="pf-v6-c-tabs co-horizontal-nav">
      <ol className="pf-v6-c-tabs__list">{props.children}</ol>
    </nav>
  )
}
export function AcmSecondaryNavItem(props: {
  onClick?: () => void
  isActive: boolean
  to?: string
  children: ReactNode
}) {
  return (
    <li className={props.isActive ? 'pf-v6-c-tabs__item pf-m-current' : 'pf-v6-c-tabs__item'}>
      {/* map loops through the children and injects the .pf-v6-c-tabs__link classname. */}
      {React.Children.map(props.children, (child) => {
        if (!React.isValidElement(child)) return child

        const newClassName = [child.props.className, 'pf-v6-c-tabs__link'].filter(Boolean).join(' ')
        return React.cloneElement(child as React.ReactElement<any>, {
          className: newClassName,
        })
      })}
    </li>
  )
}
