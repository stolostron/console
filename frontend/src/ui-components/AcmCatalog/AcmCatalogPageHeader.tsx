/* Copyright Contributors to the Open Cluster Management project */

import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Content,
  PageSection,
  Popover,
  Split,
  SplitItem,
  Title,
} from '@patternfly/react-core'
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons'
import { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ICatalogBreadcrumb } from './catalogTypes'
import { useWindowSize, WindowSize } from './useBreakPoint'

export function AcmCatalogPageHeader({
  breadcrumbs,
  title,
  titleHelpTitle,
  titleHelp,
  description,
  navigation,
  actions,
}: {
  breadcrumbs?: ICatalogBreadcrumb[]
  title?: string
  titleHelpTitle?: string
  titleHelp?: ReactNode
  description?: string
  navigation?: ReactNode
  actions?: ReactNode
}) {
  const navigate = useNavigate()
  const isXlOrLarger = useWindowSize() >= WindowSize.xl

  return (
    <div
      style={{
        borderBottom: '1px solid var(--pf-t--global--border--color--default)',
        backgroundColor: 'var(--pf-t--global--background--color--primary--default)',
      }}
    >
      <Split>
        <SplitItem isFilled>
          {(title || breadcrumbs) && (
            <PageSection
              hasBodyWrapper={false}
              style={{
                backgroundColor: 'transparent',
                paddingBottom: navigation
                  ? isXlOrLarger
                    ? 'var(--pf-t--global--spacer--sm)'
                    : 'var(--pf-t--global--spacer--xs)'
                  : undefined,
              }}
            >
              {breadcrumbs && (
                <div
                  style={{
                    paddingBottom: isXlOrLarger ? 'var(--pf-t--global--spacer--sm)' : 'var(--pf-t--global--spacer--xs)',
                    marginTop: -6,
                  }}
                >
                  <Breadcrumb>
                    {breadcrumbs.map((breadcrumb) => (
                      <BreadcrumbItem
                        key={breadcrumb.id ?? breadcrumb.label}
                        id={breadcrumb.id}
                        component={breadcrumb.component}
                        to={breadcrumb.to}
                        target={breadcrumb.target}
                        onClick={
                          breadcrumb.to && !breadcrumb.target
                            ? (event) => {
                                event.preventDefault()
                                navigate(breadcrumb.to!)
                              }
                            : undefined
                        }
                        isActive={!breadcrumb.to}
                        style={{
                          color: breadcrumb.to ? 'var(--pf-t--global--text--color--link--default)' : undefined,
                          cursor: breadcrumb.to ? 'pointer' : undefined,
                        }}
                      >
                        {breadcrumb.label}
                      </BreadcrumbItem>
                    ))}
                  </Breadcrumb>
                </div>
              )}
              {title && (
                <Title headingLevel="h1">
                  {title}
                  {titleHelp && (
                    <Popover headerContent={titleHelpTitle} bodyContent={titleHelp}>
                      <Button
                        icon={<OutlinedQuestionCircleIcon />}
                        variant="link"
                        style={{ padding: 0, marginLeft: 'var(--pf-t--global--spacer--sm)', verticalAlign: 'middle' }}
                      />
                    </Popover>
                  )}
                </Title>
              )}
              {description && (
                <Content component="p" style={{ opacity: 0.85, paddingTop: 'var(--pf-t--global--spacer--xs)' }}>
                  {description}
                </Content>
              )}
            </PageSection>
          )}
          {navigation && (
            <div style={{ paddingLeft: isXlOrLarger ? 'var(--pf-t--global--spacer--sm)' : 0 }}>{navigation}</div>
          )}
        </SplitItem>
        {actions && (
          <SplitItem>
            <PageSection hasBodyWrapper={false} style={{ backgroundColor: 'transparent', height: '100%' }}>
              {actions}
            </PageSection>
          </SplitItem>
        )}
      </Split>
    </div>
  )
}
