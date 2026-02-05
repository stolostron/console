/* Copyright Contributors to the Open Cluster Management project */
import {
  Breadcrumb,
  BreadcrumbItem,
  Content,
  Flex,
  Page,
  PageSection,
  PageSectionTypes,
  Switch,
  Title,
} from '@patternfly/react-core'
import { ReactNode, useCallback, useState } from 'react'
import { WizardYamlEditor } from './components/YamlEditor'
import { Wizard, WizardProps } from './Wizard'

export type WizardPageProps = {
  breadcrumb?: { label: string; to?: string }[]
  yaml?: boolean
  yamlEditor?: () => ReactNode
} & WizardProps

function getWizardYamlEditor() {
  return <WizardYamlEditor />
}

export function WizardPage(props: WizardPageProps) {
  let { yamlEditor } = props
  if (!yamlEditor) yamlEditor = getWizardYamlEditor
  const [drawerExpanded, setDrawerExpanded] = useState(props.yaml !== false && localStorage.getItem('yaml') === 'true')
  const toggleDrawerExpanded = useCallback(() => {
    setDrawerExpanded((drawerExpanded) => {
      localStorage.setItem('yaml', (!drawerExpanded).toString())
      return !drawerExpanded
    })
  }, [])
  return (
    <Page
      sidebar={null}
      breadcrumb={
        props.breadcrumb && (
          <Breadcrumb>
            {props.breadcrumb.map((crumb) => (
              <BreadcrumbItem key={crumb.label} to={crumb.to}>
                {crumb.label}
              </BreadcrumbItem>
            ))}
          </Breadcrumb>
        )
      }
    >
      <PageSection hasBodyWrapper={false} stickyOnBreakpoint={{ default: 'top' }}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} wrap="noWrap" style={{ flexWrap: 'nowrap', gap: 16 }}>
          <Title headingLevel="h1">{props.title}</Title>
          {props.yaml !== false && (
            <Switch id="yaml-switch" label="YAML" isChecked={drawerExpanded} onChange={() => toggleDrawerExpanded()} />
          )}
        </Flex>
        {props.description && <Content component="small">{props.description}</Content>}
      </PageSection>
      <PageSection hasBodyWrapper={false} type={PageSectionTypes.wizard}>
        <Wizard {...props} showHeader={false} showYaml={drawerExpanded} yamlEditor={yamlEditor}>
          {props.children}
        </Wizard>
      </PageSection>
    </Page>
  )
}
