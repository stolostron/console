/* Copyright Contributors to the Open Cluster Management project */

import { ReactNode } from 'react'
import { Drawer, DrawerContent, DrawerContentBody, DrawerPanelContent } from '@patternfly/react-core'
import { ResourceNavigator, type ResourceNavigatorProps } from './ResourceNavigator'
import './ResourceNavigator.css'

type TopologyModalNavigatorLayoutProps = {
  showNavigator: boolean
  navigatorProps: ResourceNavigatorProps
  children: ReactNode
}

const NAVIGATOR_PANEL_PERCENT = 28

export function TopologyModalNavigatorLayout({
  showNavigator,
  navigatorProps,
  children,
}: Readonly<TopologyModalNavigatorLayoutProps>) {
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
      <div className="resource-navigator-panel-body">
        <ResourceNavigator {...navigatorProps} />
      </div>
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
