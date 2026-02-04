/* Copyright Contributors to the Open Cluster Management project */

import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  Content,
  Label,
  LabelProps,
  PageSection,
  Popover,
  PopoverProps,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core'
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons'
import { Fragment, ReactNode } from 'react'
import { Link } from 'react-router-dom-v5-compat'
import { AcmAlertContext, AcmAlertGroup, AcmAlertProvider } from '../AcmAlert/AcmAlert'
import { AcmDrawer, AcmDrawerProvider } from '../AcmDrawer/AcmDrawer'
import { AcmErrorBoundary } from '../AcmErrorBoundary/AcmErrorBoundary'

export function AcmPage(props: { header: ReactNode; children: ReactNode; hasDrawer?: boolean }) {
  const page = (
    <>
      <Fragment>{props.header}</Fragment>
      {props.children}
    </>
  )
  return props.hasDrawer ? (
    <AcmDrawerProvider>
      <AcmDrawer>{page}</AcmDrawer>
    </AcmDrawerProvider>
  ) : (
    page
  )
}

export interface AcmPageHeaderProps {
  title: string | React.ReactNode
  titleTooltip?: string | React.ReactNode
  popoverPosition?: PopoverProps['position']
  popoverAutoWidth?: PopoverProps['hasAutoWidth']
  label?: string | React.ReactNode
  labelColor?: LabelProps['color']
  description?: string | React.ReactNode
  breadcrumb?: { text: string; to?: string }[]
  navigation?: React.ReactNode
  controls?: React.ReactNode
  switches?: React.ReactNode
  actions?: React.ReactNode
  searchbar?: React.ReactNode
}

export function AcmPageHeader(props: AcmPageHeaderProps) {
  return (
    <PageSection
      id={'page-header'}
      hasBodyWrapper={false}
      padding={{ default: 'noPadding' }}
      style={{
        border: 'none',
      }}
      stickyOnBreakpoint={{ default: 'top' }}
    >
      <Split>
        <SplitItem isFilled>
          <Stack hasGutter>
            <StackItem isFilled>
              <PageSection
                hasBodyWrapper={false}
                style={{
                  paddingBottom: props.navigation ? 'inherit' : undefined,
                }}
              >
                <Stack hasGutter>
                  {props.breadcrumb && (
                    <StackItem>
                      <AcmBreadcrumb breadcrumb={props.breadcrumb} />
                    </StackItem>
                  )}
                  <StackItem isFilled>
                    <Split hasGutter>
                      <SplitItem>
                        <Content>
                          <Title headingLevel="h1">
                            {props.title}
                            {props.titleTooltip && (
                              <Popover
                                bodyContent={props.titleTooltip}
                                hasAutoWidth={
                                  /* istanbul ignore next */
                                  props.popoverAutoWidth ?? true
                                }
                                position={
                                  /* istanbul ignore next */
                                  props.popoverPosition ?? 'right'
                                }
                              >
                                <Button
                                  icon={<OutlinedQuestionCircleIcon />}
                                  variant="plain"
                                  style={{
                                    padding: 0,
                                    marginLeft: '8px',
                                    verticalAlign: 'middle',
                                  }}
                                />
                              </Popover>
                            )}
                          </Title>
                        </Content>
                      </SplitItem>
                      {props.label && props.labelColor && (
                        <SplitItem>
                          <Label color={props.labelColor}>{props.label}</Label>
                        </SplitItem>
                      )}
                      {props.switches && (
                        <SplitItem>
                          <span
                            style={{
                              paddingLeft: '24px',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {props.switches}
                          </span>
                        </SplitItem>
                      )}
                      {/* <SplitItem>{props.description && <p>{props.description}</p>}</SplitItem> */}
                    </Split>
                    {props.description && <div style={{ paddingTop: '8px' }}>{props.description}</div>}
                  </StackItem>
                </Stack>
              </PageSection>
            </StackItem>
          </Stack>
        </SplitItem>
        {(props.controls || props.actions || props.searchbar) && (
          <SplitItem>
            <PageSection hasBodyWrapper={false} type={'breadcrumb'}>
              <Stack hasGutter>
                {props.searchbar && (
                  <SplitItem style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                    {props.searchbar}
                  </SplitItem>
                )}
                {props.controls && (
                  <StackItem style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    {props.controls}
                  </StackItem>
                )}
                {props.actions && (
                  <StackItem
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      justifyContent: 'flex-end',
                    }}
                    isFilled
                  >
                    {props.actions}
                  </StackItem>
                )}
              </Stack>
            </PageSection>
          </SplitItem>
        )}
      </Split>
      {props.navigation}
    </PageSection>
  )
}

export function AcmPageCard(props: { children: ReactNode }) {
  return (
    <PageSection hasBodyWrapper={false}>
      <Card>
        <CardBody>{props.children}</CardBody>
      </Card>
    </PageSection>
  )
}

export function AcmBreadcrumb(props: { breadcrumb?: { text: string; to?: string }[] | undefined }) {
  const { breadcrumb } = props
  if (breadcrumb?.length) {
    return (
      <Breadcrumb>
        {breadcrumb.map((crumb, i) => (
          <BreadcrumbItem key={i}>
            {breadcrumb.length > 1 && i === breadcrumb.length - 1 ? (
              // eslint-disable-next-line jsx-a11y/anchor-is-valid
              <a aria-current="page" className="pf-v6-c-breadcrumb__link pf-m-current">
                {crumb.text}
              </a>
            ) : (
              <Link to={crumb.to as string} className="pf-v6-c-breadcrumb__link">
                {crumb.text}
              </Link>
            )}
          </BreadcrumbItem>
        ))}
      </Breadcrumb>
    )
  }
  return null
}

export type AcmPageContentProps = {
  /** Content ID is needed because react needs the key to detect content changes */
  id: string

  /** React children for this component */
  children: ReactNode
}

export function AcmPageContent(props: AcmPageContentProps) {
  return (
    <AcmErrorBoundary key={props.id}>
      <AcmAlertProvider>
        <AcmAlertContext.Consumer>
          {(context) => (
            <Fragment>
              {context.alertInfos.length > 0 && (
                <PageSection hasBodyWrapper={false} style={{ paddingBottom: 0 }}>
                  <AcmAlertGroup isInline canClose />
                </PageSection>
              )}
            </Fragment>
          )}
        </AcmAlertContext.Consumer>
        {props.children}
      </AcmAlertProvider>
    </AcmErrorBoundary>
  )
}
