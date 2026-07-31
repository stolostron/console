/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter, Outlet } from 'react-router'
import { axe } from 'jest-axe'
import { NavigationPath } from '../../NavigationPath'
import Applications from './Applications'

jest.mock('./ApplicationDetails/ApplicationDetails', () => ({
  __esModule: true,
  default: () => <Outlet />,
}))

jest.mock('./ApplicationsPage', () => ({
  __esModule: true,
  default: () => <Outlet />,
}))

jest.mock('./Overview', () => ({
  __esModule: true,
  default: () => <div>Overview page</div>,
}))

jest.mock('./AdvancedConfiguration', () => ({
  __esModule: true,
  default: () => <div>Advanced configuration page</div>,
}))

jest.mock('./CreateArgoApplication/CreatePushApplicationSet', () => ({
  CreatePushApplicationSet: () => <div>Create push application set</div>,
}))

jest.mock('./CreateArgoApplication/EditApplicationSetPage', () => ({
  EditApplicationSetPage: () => <div>Edit application set page</div>,
}))

jest.mock('./CreateArgoApplication/CreatePullApplicationSet', () => ({
  CreatePullApplicationSet: () => <div>Create pull application set</div>,
}))

jest.mock('./CreateSubscriptionApplication/SubscriptionApplication', () => ({
  __esModule: true,
  default: () => <div>Subscription application page</div>,
}))

jest.mock('./ApplicationDetails/ApplicationDetails/ApplicationDetails', () => ({
  ApplicationDetailsPageContent: () => <div>Application details content</div>,
}))

jest.mock('./ApplicationDetails/ApplicationTopology/ApplicationTopology', () => ({
  ApplicationTopologyPageContent: () => <div>Application topology content</div>,
}))

jest.mock('../../NavigationPath', () => {
  const actual = jest.requireActual('../../NavigationPath') as typeof import('../../NavigationPath')
  return {
    ...actual,
    SubRoutesRedirect: ({ targetPath }: { targetPath: string }) => <div>{`Redirect to ${targetPath}`}</div>,
  }
})

function renderAt(path: string) {
  return render(
    <MemoryRouter basename="/multicloud/applications" initialEntries={[path]}>
      <Applications />
    </MemoryRouter>
  )
}

describe('Applications', () => {
  it('renders the overview route', async () => {
    const { container } = renderAt(NavigationPath.applications)
    expect(screen.getByText('Overview page')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders advanced configuration', () => {
    renderAt(NavigationPath.advancedConfiguration)
    expect(screen.getByText('Advanced configuration page')).toBeInTheDocument()
  })

  it('renders create push application set', () => {
    renderAt(NavigationPath.createApplicationArgo)
    expect(screen.getByText('Create push application set')).toBeInTheDocument()
  })

  it('renders edit application set', () => {
    renderAt('/multicloud/applications/edit/argo/ns/name')
    expect(screen.getByText('Edit application set page')).toBeInTheDocument()
  })

  it('renders create pull application set', () => {
    renderAt(NavigationPath.createApplicationArgoPullModel)
    expect(screen.getByText('Create pull application set')).toBeInTheDocument()
  })

  it('renders create subscription application', () => {
    renderAt(NavigationPath.createApplicationSubscription)
    expect(screen.getByText('Subscription application page')).toBeInTheDocument()
  })

  it('renders edit subscription application', () => {
    renderAt('/multicloud/applications/edit/subscription/ns/name')
    expect(screen.getByText('Subscription application page')).toBeInTheDocument()
  })

  it('renders application topology under details layout', () => {
    renderAt('/multicloud/applications/details/ns/name/topology')
    expect(screen.getByText('Application topology content')).toBeInTheDocument()
  })

  it('renders application overview under details layout', () => {
    renderAt('/multicloud/applications/details/ns/name/details')
    expect(screen.getByText('Application details content')).toBeInTheDocument()
  })

  it('renders application details subroute redirect', () => {
    renderAt('/multicloud/applications/details/ns/name/extra')
    expect(screen.getByText(`Redirect to ${NavigationPath.applicationTopology}`)).toBeInTheDocument()
  })
})
