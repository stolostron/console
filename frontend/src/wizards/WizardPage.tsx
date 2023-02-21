/* Copyright Contributors to the Open Cluster Management project */

import { PageSection, Switch } from '@patternfly/react-core'
import { ReactNode, useCallback, useState } from 'react'
import { Wizard, WizardProps } from '@patternfly-labs/react-form-wizard'
import { AcmErrorBoundary, AcmPage, AcmPageContent, AcmPageHeader } from '../ui-components'
import './WizardPage.css'

export type WizardPageProps = {
  breadcrumb?: { text: string; to?: string }[]
  yaml?: boolean
  yamlEditor?: () => ReactNode
} & WizardProps

function getWizardYamlEditor() {
  return <></>
}

export function WizardPage(props: { id: string } & WizardPageProps) {
  const { breadcrumb, children, id, title, description, yaml, yamlEditor = getWizardYamlEditor } = props

  const [drawerExpanded, setDrawerExpanded] = useState(yaml !== false && localStorage.getItem('yaml') === 'true')
  const toggleDrawerExpanded = useCallback(() => {
    setDrawerExpanded((drawerExpanded) => {
      localStorage.setItem('yaml', (!drawerExpanded).toString())
      return !drawerExpanded
    })
  }, [])
  return (
    <AcmPage
      header={
        <AcmPageHeader
          title={title}
          description={description}
          breadcrumb={breadcrumb}
          switches={
            yaml !== false && (
              <Switch
                id="yaml-switch"
                label="YAML"
                isChecked={drawerExpanded}
                onChange={() => toggleDrawerExpanded()}
              />
            )
          }
        />
      }
    >
      <AcmErrorBoundary>
        <AcmPageContent id={id}>
          <PageSection variant="light" type="wizard">
            <div className="wizard-page">
              <Wizard {...props} showHeader={false} showYaml={drawerExpanded} yamlEditor={yamlEditor}>
                {children}
              </Wizard>
            </div>
          </PageSection>
        </AcmPageContent>
      </AcmErrorBoundary>
    </AcmPage>
  )
}
