/* Copyright Contributors to the Open Cluster Management project */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { RoleAssignmentStatus } from '../../../resources/multicluster-role-assignment'
import { RoleAssignmentStatusComponent } from './RoleAssignmentStatusComponent'

jest.mock('../../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock Popover to always render header and body (simulates popover content visible on hover)
jest.mock('@patternfly/react-core', () => {
  const React = jest.requireActual<typeof import('react')>('react')
  const actual = jest.requireActual('@patternfly/react-core')
  const MockPopover = (props: {
    children?: React.ReactNode
    headerContent?: React.ReactNode
    bodyContent?: React.ReactNode
  }) =>
    React.createElement(
      'div',
      { 'data-testid': 'popover' },
      React.createElement('div', { 'data-testid': 'popover-trigger' }, props.children),
      React.createElement(
        'div',
        { 'data-testid': 'popover-content' },
        props.headerContent != null &&
          React.createElement('div', { 'data-testid': 'popover-header' }, props.headerContent),
        props.bodyContent != null && React.createElement('div', { 'data-testid': 'popover-body' }, props.bodyContent)
      )
    )
  return { ...actual, Popover: MockPopover }
})

const baseStatus: RoleAssignmentStatus = {
  name: 'test-role-assignment',
  status: 'Active',
  reason: 'Applied',
  message: 'Role assignment applied successfully',
}

describe('RoleAssignmentStatusComponent', () => {
  it('renders Unknown when status is undefined', () => {
    render(<RoleAssignmentStatusComponent />)

    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('renders Active label when status is Active', () => {
    render(<RoleAssignmentStatusComponent status={{ ...baseStatus, status: 'Active' }} />)

    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders Error label when status is Error', () => {
    render(
      <RoleAssignmentStatusComponent
        status={{
          ...baseStatus,
          status: 'Error',
          reason: 'Failed',
          message: 'Role assignment failed',
        }}
      />
    )

    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('renders Pending label and spinner when status is Pending', () => {
    render(<RoleAssignmentStatusComponent status={{ ...baseStatus, status: 'Pending' }} />)

    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Role Assignment being applied' })).toBeInTheDocument()
  })

  it('renders Unknown when status has an unsupported value', () => {
    render(
      <RoleAssignmentStatusComponent
        status={{ ...baseStatus, status: 'Something' as RoleAssignmentStatus['status'] }}
      />
    )

    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('renders label when status has no reason or message', () => {
    render(<RoleAssignmentStatusComponent status={{ name: 'ra1', status: 'Active' }} />)

    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('displays reason and message in popover when user hovers over label', () => {
    render(<RoleAssignmentStatusComponent status={{ ...baseStatus, status: 'Active' }} />)

    expect(screen.getByText('Active')).toBeInTheDocument()
    // Popover is mocked to always show content (simulating hover); reason and message are visible
    expect(screen.getByText('Applied')).toBeInTheDocument()
    expect(screen.getByText('Role assignment applied successfully')).toBeInTheDocument()
  })
})
