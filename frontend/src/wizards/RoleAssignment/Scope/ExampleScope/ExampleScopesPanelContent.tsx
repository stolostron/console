/* Copyright Contributors to the Open Cluster Management project */
import {
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  Title,
} from '@patternfly/react-core'
import React from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'
import { ExampleScopes } from './ExampleScopes'

export interface ExampleScopesDrawerProps {
  isVisible: boolean
  onClose: () => void
  children?: React.ReactNode
}

export const ExampleScopesPanelContent = ({ onClose }: ExampleScopesDrawerProps) => {
  const { t } = useTranslation()

  return (
    <DrawerPanelContent isResizable defaultSize="50%" minSize="400px" maxSize="75%">
      <DrawerHead>
        <Title headingLevel="h2" size="xl">
          {t('Example scopes')}
        </Title>
        <DrawerActions>
          <DrawerCloseButton onClick={onClose} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelBody>
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <ExampleScopes />
        </div>
      </DrawerPanelBody>
    </DrawerPanelContent>
  )
}
