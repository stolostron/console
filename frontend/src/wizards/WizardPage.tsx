/* Copyright Contributors to the Open Cluster Management project */

import {
  Breadcrumb,
  BreadcrumbItem,
  Flex,
  Page,
  PageSection,
  PageSectionTypes,
  PageSectionVariants,
  Switch,
  Text,
  Title,
} from '@patternfly/react-core'
import { ReactNode, useCallback, useState } from 'react'
import { Wizard, WizardProps } from '@patternfly-labs/react-form-wizard'
import { Link } from 'react-router-dom'

export type WizardPageProps = {
  breadcrumb?: { text: string; to?: string }[]
  yaml?: boolean
  yamlEditor?: () => ReactNode
} & WizardProps

function getWizardYamlEditor() {
  return <></>
}

export function WizardPage(props: WizardPageProps) {
  let { yamlEditor } = props
  const { breadcrumb } = props
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
      breadcrumb={
        breadcrumb && (
          <Breadcrumb>
            {breadcrumb.map((crumb, i) => (
              <BreadcrumbItem key={i}>
                {breadcrumb.length > 1 && i === breadcrumb.length - 1 ? (
                  <a aria-current="page" className="pf-c-breadcrumb__link pf-m-current">
                    {crumb.text}
                  </a>
                ) : (
                  <Link to={crumb.to as string} className="pf-c-breadcrumb__link">
                    {crumb.text}
                  </Link>
                )}
              </BreadcrumbItem>
            ))}
          </Breadcrumb>
        )
      }
      isBreadcrumbGrouped
      additionalGroupedContent={
        <PageSection variant="light">
          <Flex alignItems={{ default: 'alignItemsCenter' }} wrap="noWrap" style={{ flexWrap: 'nowrap', gap: 16 }}>
            <Title headingLevel="h1">{props.title}</Title>
            {props.yaml !== false && (
              <Switch
                id="yaml-switch"
                label="YAML"
                isChecked={drawerExpanded}
                onChange={() => toggleDrawerExpanded()}
              />
            )}
          </Flex>
          {props.description && <Text component="small">{props.description}</Text>}
        </PageSection>
      }
      groupProps={{ sticky: 'top' }}
    >
      <PageSection type={PageSectionTypes.wizard} variant={PageSectionVariants.light}>
        <Wizard {...props} showHeader={false} showYaml={drawerExpanded} yamlEditor={yamlEditor}>
          {props.children}
        </Wizard>
      </PageSection>
    </Page>
  )
}
