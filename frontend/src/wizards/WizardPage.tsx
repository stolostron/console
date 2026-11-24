/* Copyright Contributors to the Open Cluster Management project */

import useResizeObserver from '@react-hook/resize-observer'
import { LabelProps, PageSection, Switch } from '@patternfly/react-core'
import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import { Step, Wizard } from '@patternfly-labs/react-form-wizard'
import type { StepProps, WizardProps } from '@patternfly-labs/react-form-wizard'
import { createPortal } from 'react-dom'
import { AcmErrorBoundary, AcmPage, AcmPageContent, AcmPageHeader } from '../ui-components'
import './WizardPage.css'
import { LostChangesMonitor, LostChangesPrompt } from '../components/LostChanges'

export type WizardPageProps = {
  breadcrumb?: { text: string; to?: string }[]
  yaml?: boolean
  yamlEditor?: () => ReactNode
  /** Render the shared YAML switch in an external header, such as a modal header. */
  yamlSwitchTarget?: HTMLElement | null
  /** Read and save the full-page YAML preference. Disable for session-only toggles. */
  persistYaml?: boolean
  isLoading?: boolean
  isModal?: boolean
  label?: ReactNode
  labelColor?: LabelProps['color']
} & WizardProps

function getWizardYamlEditor() {
  return <></>
}

function renderWizardSteps(children: ReactNode) {
  return (
    Children.toArray(children).filter(
      (child) => isValidElement(child) && child.type === Step
    ) as ReactElement<StepProps>[]
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
  const {
    breadcrumb,
    children,
    id,
    yaml,
    yamlEditor = getWizardYamlEditor,
    yamlSwitchTarget,
    persistYaml = true,
    isModal,
    label,
    labelColor,
    ...wizardProps
  } = props

  const [drawerExpanded, setDrawerExpanded] = useState(
    () => yaml !== false && persistYaml && localStorage.getItem('yaml') === 'true'
  )
  const toggleDrawerExpanded = useCallback(() => {
    setDrawerExpanded((drawerExpanded) => {
      if (persistYaml) localStorage.setItem('yaml', (!drawerExpanded).toString())
      return !drawerExpanded
    })
  }, [persistYaml])

  const yamlSwitch = yaml !== false && (
    <Switch id="yaml-switch" label="YAML" isChecked={drawerExpanded} onChange={toggleDrawerExpanded} />
  )

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
        {yamlSwitchTarget && createPortal(yamlSwitch, yamlSwitchTarget)}
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
          label={label}
          labelColor={labelColor}
          labelPosition="right"
          breadcrumb={breadcrumb}
          switches={yamlSwitch}
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
