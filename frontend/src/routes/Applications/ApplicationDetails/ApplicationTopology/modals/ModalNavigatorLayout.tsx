/* Copyright Contributors to the Open Cluster Management project */

import { ReactNode } from 'react'
import { Drawer, DrawerContent, DrawerContentBody, DrawerPanelContent } from '@patternfly/react-core'
import './ResourceNavigator.css'

type ModalNavigatorLayoutProps = {
  /** Defaults to true. Set to false to hide the navigator panel and render only `children`. */
  showNavigator?: boolean
  /** Navigator component rendered in the left-hand panel, e.g. ResourceNavigator or RepositoryNavigator. */
  navigator: ReactNode
  children: ReactNode
}

const NAVIGATOR_PANEL_PERCENT = 28

export function ModalNavigatorLayout({
  showNavigator = true,
  navigator,
  children,
}: Readonly<ModalNavigatorLayoutProps>) {
  if (!showNavigator) {
    return <>{children}</>
  }

  const panelContent = (
    <DrawerPanelContent
      id="resource-navigator-panel"
      className="resource-modal-navigator-panel"
      isResizable
      defaultSize={`${NAVIGATOR_PANEL_PERCENT}%`}
      minSize="200px"
      maxSize="40%"
      resizeAriaLabel="Resize resource navigator"
    >
      <div className="resource-navigator-panel-body">{navigator}</div>
    </DrawerPanelContent>
  )

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0, height: '100%' }}>
      <Drawer isInline isExpanded position="start" className="resource-modal-navigator-drawer">
        <DrawerContent panelContent={panelContent}>
          <DrawerContentBody className="resource-modal-navigator-content">
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, minWidth: 0 }}>
              {children}
            </div>
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
