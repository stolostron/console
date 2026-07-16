/* Copyright Contributors to the Open Cluster Management project */

import useResizeObserver from '@react-hook/resize-observer'
import { PageSection, Switch } from '@patternfly/react-core'
import { Children, cloneElement, isValidElement, ReactElement, ReactNode, useCallback, useRef, useState } from 'react'
import { Step, Wizard, WizardProps } from '@patternfly-labs/react-form-wizard'
import { AcmErrorBoundary, AcmPage, AcmPageContent, AcmPageHeader } from '../ui-components'
import './WizardPage.css'
import { LostChangesMonitor, LostChangesPrompt } from '../components/LostChanges'

export type WizardPageProps = {
  breadcrumb?: { text: string; to?: string }[]
  yaml?: boolean
  yamlEditor?: () => ReactNode
  isLoading?: boolean
  isModal?: boolean
} & WizardProps

function getWizardYamlEditor() {
  return <></>
}

function renderWizardSteps(children: ReactNode) {
  return (
    Children.toArray(children).filter((child) => isValidElement(child) && child.type === Step) as ReactElement[]
  ).map((child, index) => {
    return index === 0
      ? cloneElement(child, {
          ...child.props,
          children: [<LostChangesMonitor key="lost-changes-monitor" />, ...Children.toArray(child.props.children)],
        })
      : child
  })
}

export function WizardPage(props: { id: string } & WizardPageProps) {
  const { breadcrumb, children, id, yaml, yamlEditor = getWizardYamlEditor, isModal, ...wizardProps } = props

  const [drawerExpanded, setDrawerExpanded] = useState(yaml !== false && localStorage.getItem('yaml') === 'true')
  const toggleDrawerExpanded = useCallback(() => {
    setDrawerExpanded((drawerExpanded) => {
      localStorage.setItem('yaml', (!drawerExpanded).toString())
      return !drawerExpanded
    })
  }, [])

  const [wizardHeight, setWizardHeight] = useState<number>()
  const containerRef = useRef<HTMLDivElement>(null)
  useResizeObserver(containerRef, (entry) => {
    setWizardHeight(entry.contentRect.height)
  })

  const wizard = (
    <>
      <LostChangesPrompt initialData={props.defaultData} />
      <Wizard
        {...wizardProps}
        title={props.title}
        showHeader={false}
        showYaml={drawerExpanded}
        yamlEditor={yamlEditor}
        height={isModal ? wizardHeight : undefined}
      >
        {renderWizardSteps(children)}
      </Wizard>
    </>
  )

  if (isModal) {
    return (
      <div ref={containerRef} className="wizard-modal-page">
        <AcmErrorBoundary>
          <PageSection hasBodyWrapper={false} type="wizard" isFilled className="wizard-modal-section">
            {wizard}
          </PageSection>
        </AcmErrorBoundary>
      </div>
    )
  }

  return (
    <AcmPage
      header={
        <AcmPageHeader
          title={props.title}
          description={props.description}
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
            {wizard}
          </PageSection>
        </AcmPageContent>
      </AcmErrorBoundary>
    </AcmPage>
  )
}
