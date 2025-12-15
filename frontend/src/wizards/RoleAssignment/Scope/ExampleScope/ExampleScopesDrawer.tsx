/* Copyright Contributors to the Open Cluster Management project */

import { Drawer, DrawerContent, DrawerContentBody } from '@patternfly/react-core'
import React from 'react'
import { ExampleScopesPanelContent } from './ExampleScopesPanelContent'

export interface ExampleScopesDrawerProps {
  isVisible: boolean
  onClose: () => void
  children?: React.ReactNode
}

export const ExampleScopesDrawer = ({ isVisible, onClose, children }: ExampleScopesDrawerProps) => {
  return (
    <Drawer isExpanded={isVisible}>
      <DrawerContent panelContent={<ExampleScopesPanelContent onClose={onClose} isVisible={false} />}>
        <DrawerContentBody>{children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  )
}
