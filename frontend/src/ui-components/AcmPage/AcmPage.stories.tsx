/* Copyright Contributors to the Open Cluster Management project */

import {
  Bullseye,
  Card,
  CardBody,
  Dropdown,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
  PageSection,
  Switch,
} from '@patternfly/react-core'
import '@patternfly/react-core/dist/styles/base.css'
import { Meta } from '@storybook/react'
import { Fragment, useState } from 'react'
import { AlertGroupStory } from '../AcmAlert/AcmAlert.stories'
import { DescriptionList as DescriptionListStory } from '../AcmDescriptionList/AcmDescriptionList.stories'
import { FormStory } from '../AcmForm/AcmForm.stories'
import { LoadingPage as LoadingPageStory } from '../AcmLoadingPage/AcmLoadingPage.stories'
import { AcmRefreshTime } from '../AcmRefreshTime/AcmRefreshTime'
import { AcmSecondaryNav } from '../AcmSecondaryNav/AcmSecondaryNav'
import { TableStory } from '../AcmTable/AcmTable.stories'
import { AcmPage, AcmPageContent, AcmPageHeader, AcmPageHeaderProps } from './AcmPage'

const meta: Meta = {
  title: 'Page',
  component: AcmPage,
  argTypes: {
    showBreadcrumb: { type: 'boolean' },
    title: { type: 'string' },
    showTooltip: { type: 'boolean' },
    description: { type: 'string' },
    showNavigation: { type: 'boolean' },
    showSwitch: { type: 'boolean' },
    showControls: { type: 'boolean' },
    showActions: { type: 'boolean' },
  },
  excludeStories: ['PageStoryDefaults'],
}
export default meta

export const Page = (args: {
  showBreadcrumb: boolean
  title: string
  label: string
  labelColor: string
  showTooltip: boolean
  description: string
  showNavigation: boolean
  showSwitch: boolean
  showControls: boolean
  showActions: boolean
}) => {
  const [isActionDowndownOpen, setActionDowndownOpen] = useState(false)
  const [secondaryTab, setSecondaryTab] = useState('table')
  return (
    <AcmPage
      header={
        <AcmPageHeader
          breadcrumb={args.showBreadcrumb ? [{ text: 'AcmHeader' }, { text: 'AcmPage' }] : undefined}
          title={args.title}
          titleTooltip={
            args.showTooltip && (
              <>
                View all resources
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <a href="#" style={{ display: 'block', marginTop: '4px' }}>
                  Learn more
                </a>
              </>
            )
          }
          popoverPosition="bottom"
          popoverAutoWidth={true}
          label={args.label}
          labelColor={args.labelColor as AcmPageHeaderProps['labelColor']}
          description={args.description}
          switches={args.showSwitch && <Switch label="YAML on" />}
          controls={
            args.showControls && (
              <Fragment>
                <AcmRefreshTime
                  timestamp={'Wed Jan 06 2021 00:00:00 GMT+0000 (Coordinated Universal Time)'}
                  reloading={true}
                />
              </Fragment>
            )
          }
          actions={
            args.showActions && (
              <Dropdown
                isOpen={isActionDowndownOpen}
                onSelect={() => setActionDowndownOpen(!isActionDowndownOpen)}
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setActionDowndownOpen(!isActionDowndownOpen)}
                    isExpanded={isActionDowndownOpen}
                  >
                    Actions
                  </MenuToggle>
                )}
              >
                <DropdownItem component="button" key="1">
                  Action 1
                </DropdownItem>
                <DropdownItem component="button" key="2">
                  Action 2
                </DropdownItem>
              </Dropdown>
            )
          }
          navigation={
            args.showNavigation && (
              <AcmSecondaryNav
                navItems={[
                  {
                    key: 'page-story-tab-table',
                    title: 'Table',
                    isActive: secondaryTab === 'table',
                    onClick: () => setSecondaryTab('table'),
                  },
                  {
                    key: 'page-story-tab-form',
                    title: 'Form',
                    isActive: secondaryTab === 'form',
                    onClick: () => setSecondaryTab('form'),
                  },
                  {
                    key: 'page-story-tab-details',
                    title: 'Details',
                    isActive: secondaryTab === 'descriptionList',
                    onClick: () => setSecondaryTab('descriptionList'),
                  },
                  {
                    key: 'page-story-tab-loading',
                    title: 'Loading',
                    isActive: secondaryTab === 'loading',
                    onClick: () => setSecondaryTab('loading'),
                  },
                  {
                    key: 'page-story-tab-alerts',
                    title: 'Alerts',
                    isActive: secondaryTab === 'alerts',
                    onClick: () => setSecondaryTab('alerts'),
                  },
                ]}
              />
            )
          }
        />
      }
    >
      {/* Each tab needs it's own AcmPageContent so it has its own ErrorBoundary and AlertGroup */}
      {secondaryTab === 'table' ? (
        <AcmPageContent id="table">
          <PageSection hasBodyWrapper={false}>
            <TableStory />
          </PageSection>
        </AcmPageContent>
      ) : secondaryTab === 'form' ? (
        <AcmPageContent id="form">
          <PageSection hasBodyWrapper={false}>
            <Card isLarge>
              <CardBody>
                <FormStory />
              </CardBody>
            </Card>
          </PageSection>
        </AcmPageContent>
      ) : secondaryTab === 'descriptionList' ? (
        <AcmPageContent id="descriptionList">
          <PageSection hasBodyWrapper={false}>
            <DescriptionListStory />
          </PageSection>
        </AcmPageContent>
      ) : secondaryTab === 'loading' ? (
        <AcmPageContent id="loading">
          <PageSection hasBodyWrapper={false} isFilled>
            <Bullseye>
              <LoadingPageStory />
            </Bullseye>
          </PageSection>
        </AcmPageContent>
      ) : secondaryTab === 'alerts' ? (
        <AcmPageContent id="alerts">
          <PageSection hasBodyWrapper={false}>
            <AlertGroupStory />
          </PageSection>
        </AcmPageContent>
      ) : (
        <div />
      )}
    </AcmPage>
  )
}
Page.args = {
  title: 'AcmPage',
  showTooltip: true,
  label: 'Technology Preview',
  labelColor: 'orange',
  description: 'AcmPage is used with AcmPageHeader and AcmPageContent to consistently layout the page.',
  showBreadcrumb: true,
  showNavigation: true,
  showSwitch: true,
  showControls: false,
  showActions: true,
}

export const PageStoryDefaults = Page.args
