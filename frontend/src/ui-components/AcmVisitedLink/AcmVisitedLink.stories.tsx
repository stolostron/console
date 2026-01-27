/* Copyright Contributors to the Open Cluster Management project */

import { Meta, StoryFn } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { AcmVisitedLink } from './AcmVisitedLink'
import { setItemWithExpiration } from '../AcmTable/AcmTableStateProvider'

const meta: Meta<typeof AcmVisitedLink> = {
  title: 'VisitedLink',
  component: AcmVisitedLink,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  argTypes: {
    to: { control: 'text' },
    children: { control: 'text' },
  },
}
export default meta

export const BasicLink: StoryFn<typeof AcmVisitedLink> = (args) => (
  <AcmVisitedLink {...args}>{args.children}</AcmVisitedLink>
)
BasicLink.args = {
  to: '/clusters',
  children: 'Clusters',
}

export const LinkWithObjectTo: StoryFn<typeof AcmVisitedLink> = () => (
  <AcmVisitedLink to={{ pathname: '/applications', search: '?filter=test' }}>Applications with filter</AcmVisitedLink>
)

export const VisitedLink: StoryFn<typeof AcmVisitedLink> = () => {
  // Pre-populate localStorage to simulate visited state
  setItemWithExpiration('visited-links', JSON.stringify(['/governance']))
  return <AcmVisitedLink to="/governance">Governance (visited)</AcmVisitedLink>
}

export const UnvisitedLink: StoryFn<typeof AcmVisitedLink> = () => {
  // Clear the specific link from localStorage
  localStorage.removeItem('visited-links')
  return <AcmVisitedLink to="/infrastructure">Infrastructure (not visited)</AcmVisitedLink>
}

export const MultipleLinksList: StoryFn<typeof AcmVisitedLink> = () => {
  // Pre-populate some links as visited
  setItemWithExpiration('visited-links', JSON.stringify(['/clusters', '/applications']))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <AcmVisitedLink to="/clusters">Clusters (visited)</AcmVisitedLink>
      <AcmVisitedLink to="/applications">Applications (visited)</AcmVisitedLink>
      <AcmVisitedLink to="/governance">Governance (not visited)</AcmVisitedLink>
      <AcmVisitedLink to="/infrastructure">Infrastructure (not visited)</AcmVisitedLink>
    </div>
  )
}

export const ClickToMarkVisited: StoryFn<typeof AcmVisitedLink> = () => {
  localStorage.removeItem('visited-links')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p style={{ marginBottom: '8px' }}>Click a link to mark it as visited (refresh to see the change):</p>
      <AcmVisitedLink to="/link-1">Link 1</AcmVisitedLink>
      <AcmVisitedLink to="/link-2">Link 2</AcmVisitedLink>
      <AcmVisitedLink to="/link-3">Link 3</AcmVisitedLink>
    </div>
  )
}
