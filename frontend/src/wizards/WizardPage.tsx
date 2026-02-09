/* Copyright Contributors to the Open Cluster Management project */

import { PageSection, Switch } from '@patternfly/react-core'
import { Children, cloneElement, isValidElement, ReactElement, ReactNode, useCallback, useState } from 'react'
import { Step, Wizard, WizardProps } from '@patternfly-labs/react-form-wizard'
import { AcmErrorBoundary, AcmPage, AcmPageContent, AcmPageHeader } from '../ui-components'
import './WizardPage.css'
import { LostChangesMonitor, LostChangesPrompt } from '../components/LostChanges'

export type WizardPageProps = {
  breadcrumb?: { text: string; to?: string }[]
  yaml?: boolean
  yamlEditor?: () => ReactNode
  isLoading?: boolean
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
          <PageSection hasBodyWrapper={false} type="wizard" className="no-drawer-transition">
            <LostChangesPrompt initialData={props.defaultData} />
            <Wizard {...props} showHeader={false} showYaml={drawerExpanded} yamlEditor={yamlEditor}>
              {(
                Children.toArray(children).filter(
                  (child) => isValidElement(child) && child.type === Step
                ) as ReactElement[]
              ).map((child, index) => {
                return index === 0
                  ? // Insert LostChangesMonitor in first Step child
                    cloneElement(child, {
                      ...child.props,
                      children: [<LostChangesMonitor key="lost-changes-monitor" />, ...child.props.children],
                    })
                  : child
              })}
            </Wizard>
          </PageSection>
        </AcmPageContent>
      </AcmErrorBoundary>
    </AcmPage>
  )
}
