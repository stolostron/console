/* Copyright Contributors to the Open Cluster Management project */
import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { FlattenedRoleAssignment } from '../../../resources/clients/model/flattened-role-assignment'
import { MulticlusterRoleAssignment, RoleAssignmentStatus } from '../../../resources/multicluster-role-assignment'
import { RoleAssignmentStatusComponent, type RoleAssignmentCallbackReason } from './RoleAssignmentStatusComponent'

jest.mock('../../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock Popover to always render header, body, and footer (simulates popover content visible on hover)
// Mock ExpandableSection so the Show more/Show less toggle is always visible (real component hides it when content doesn't overflow in jsdom)
jest.mock('@patternfly/react-core', () => {
  const React = jest.requireActual<typeof import('react')>('react')
  const actual = jest.requireActual('@patternfly/react-core')
  const MockPopover = (props: {
    children?: React.ReactNode
    headerContent?: React.ReactNode
    bodyContent?: React.ReactNode
    footerContent?: React.ReactNode
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
        props.bodyContent != null && React.createElement('div', { 'data-testid': 'popover-body' }, props.bodyContent),
        props.footerContent != null &&
          React.createElement('div', { 'data-testid': 'popover-footer' }, props.footerContent)
      )
    )
  const MockExpandableSection = (props: {
    toggleText?: string
    onToggle?: (event: React.MouseEvent, isExpanded: boolean) => void
    isExpanded?: boolean
    children?: React.ReactNode
  }) =>
    React.createElement(
      'div',
      { 'data-testid': 'expandable-section' },
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: (e: React.MouseEvent) => props.onToggle?.(e, !props.isExpanded),
        },
        props.toggleText
      ),
      React.createElement('div', {}, props.children)
    )
  return { ...actual, Popover: MockPopover, ExpandableSection: MockExpandableSection }
})

const baseStatus: RoleAssignmentStatus = {
  name: 'test-role-assignment',
  status: 'Active',
  reason: 'SuccessfullyApplied',
  message: 'Role assignment applied successfully',
}

const createBaseRoleAssignment = (status?: RoleAssignmentStatus): FlattenedRoleAssignment => ({
  name: 'test-role-assignment',
  clusterRole: 'admin',
  targetNamespaces: [],
  clusterNames: [],
  clusterSetNames: [],
  clusterSelection: { type: 'placements', placements: [] },
  relatedMulticlusterRoleAssignment: {} as MulticlusterRoleAssignment,
  subject: { name: 'user1', kind: 'User' },
  status: status ?? baseStatus,
})

const defaultCallbackMap: Record<RoleAssignmentCallbackReason, (ra: FlattenedRoleAssignment) => void> = {
  Processing: jest.fn(),
  InvalidReference: jest.fn(),
  NoMatchingClusters: jest.fn(),
  SuccessfullyApplied: jest.fn(),
  ApplicationFailed: jest.fn(),
  MissingNamespaces: jest.fn(),
}

describe('RoleAssignmentStatusComponent', () => {
  it('renders Unknown when roleAssignment has no status', () => {
    render(
      <RoleAssignmentStatusComponent
        roleAssignment={{ ...createBaseRoleAssignment(), status: undefined }}
        callbackMap={defaultCallbackMap}
      />
    )

    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('renders Active label when status is Active', () => {
    render(
      <RoleAssignmentStatusComponent
        roleAssignment={createBaseRoleAssignment({ ...baseStatus, status: 'Active' })}
        callbackMap={defaultCallbackMap}
      />
    )

    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders Error label when status is Error', () => {
    render(
      <RoleAssignmentStatusComponent
        roleAssignment={createBaseRoleAssignment({
          ...baseStatus,
          status: 'Error',
          reason: 'ApplicationFailed',
          message: 'Role assignment failed',
        })}
        callbackMap={defaultCallbackMap}
      />
    )

    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('renders Pending label and spinner when status is Pending', () => {
    render(
      <RoleAssignmentStatusComponent
        roleAssignment={createBaseRoleAssignment({ ...baseStatus, status: 'Pending' })}
        callbackMap={defaultCallbackMap}
      />
    )

    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Role Assignment being applied' })).toBeInTheDocument()
  })

  it('renders Unknown when status has an unsupported value', () => {
    render(
      <RoleAssignmentStatusComponent
        roleAssignment={createBaseRoleAssignment({
          ...baseStatus,
          status: 'Something' as RoleAssignmentStatus['status'],
        })}
        callbackMap={defaultCallbackMap}
      />
    )

    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('renders label when status has no reason or message', () => {
    render(
      <RoleAssignmentStatusComponent
        roleAssignment={createBaseRoleAssignment({ name: 'ra1', status: 'Active' })}
        callbackMap={defaultCallbackMap}
      />
    )

    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('displays reason and message in popover when user hovers over label', () => {
    render(
      <RoleAssignmentStatusComponent
        roleAssignment={createBaseRoleAssignment({ ...baseStatus, status: 'Active' })}
        callbackMap={defaultCallbackMap}
      />
    )

    expect(screen.getByText('Active')).toBeInTheDocument()
    // Popover is mocked to always show content (simulating hover); reason and message are visible
    expect(screen.getByText('Successfully applied')).toBeInTheDocument()
    expect(screen.getByText('Role assignment applied successfully')).toBeInTheDocument()
  })

  it('renders "Creating common projects" label and spinner when isCallbackProcessing is true', () => {
    render(
      <RoleAssignmentStatusComponent
        roleAssignment={createBaseRoleAssignment({ ...baseStatus, status: 'Active' })}
        callbackMap={defaultCallbackMap}
        isCallbackProcessing
      />
    )

    expect(screen.getByText('Creating common projects')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Creating common projects' })).toBeInTheDocument()
  })

  it('renders Error state with expandable section containing message', () => {
    render(
      <RoleAssignmentStatusComponent
        roleAssignment={createBaseRoleAssignment({
          ...baseStatus,
          status: 'Error',
          reason: 'ApplicationFailed',
          message: 'Detailed error message here',
        })}
        callbackMap={defaultCallbackMap}
      />
    )

    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Detailed error message here')).toBeInTheDocument()
  })

  it('toggles expandable section on Show more/Show less click', () => {
    render(
      <RoleAssignmentStatusComponent
        roleAssignment={createBaseRoleAssignment({
          ...baseStatus,
          status: 'Error',
          reason: 'ApplicationFailed',
          message: 'Error details',
        })}
        callbackMap={defaultCallbackMap}
      />
    )
    const showMore = screen.getByText('Show more')
    showMore.click()
    expect(screen.getByText('Show less')).toBeInTheDocument()
  })

  describe('ReasonString in popover', () => {
    it.each([
      ['Processing', 'Processing'],
      ['InvalidReference', 'Invalid reference'],
      ['NoMatchingClusters', 'No matching clusters'],
      ['SuccessfullyApplied', 'Successfully applied'],
      ['ApplicationFailed', 'Application failed'],
    ] as const)('displays translated reason for %s', (reason, expectedText) => {
      render(
        <RoleAssignmentStatusComponent
          roleAssignment={createBaseRoleAssignment({
            ...baseStatus,
            status: 'Error',
            reason,
            message: 'Some message',
          })}
          callbackMap={defaultCallbackMap}
        />
      )
      expect(screen.getByText(expectedText)).toBeInTheDocument()
    })

    it('displays reason string as-is when reason is unknown', () => {
      render(
        <RoleAssignmentStatusComponent
          roleAssignment={createBaseRoleAssignment({
            ...baseStatus,
            status: 'Error',
            reason: 'CustomReason',
            message: 'Message',
          } as unknown as RoleAssignmentStatus)}
          callbackMap={defaultCallbackMap}
        />
      )
      expect(screen.getByText('CustomReason')).toBeInTheDocument()
    })
  })

  describe('ReasonFooter and Create missing projects button', () => {
    it('shows Create missing projects button when reason is ApplicationFailed and message indicates missing namespaces', () => {
      const onMissingNamespaces = jest.fn()
      render(
        <RoleAssignmentStatusComponent
          roleAssignment={createBaseRoleAssignment({
            ...baseStatus,
            status: 'Error',
            reason: 'ApplicationFailed',
            message: 'Namespaces not found',
          })}
          callbackMap={{ ...defaultCallbackMap, MissingNamespaces: onMissingNamespaces }}
        />
      )
      const button = screen.getByRole('button', { name: 'Create missing projects' })
      expect(button).toBeInTheDocument()
      fireEvent.click(button)
      expect(onMissingNamespaces).toHaveBeenCalled()
    })

    it('shows Create missing projects button when message contains namespaces and not found', () => {
      render(
        <RoleAssignmentStatusComponent
          roleAssignment={createBaseRoleAssignment({
            ...baseStatus,
            status: 'Error',
            reason: 'ApplicationFailed',
            message: 'Required namespaces not found on cluster',
          })}
          callbackMap={defaultCallbackMap}
        />
      )
      expect(screen.getByRole('button', { name: 'Create missing projects' })).toBeInTheDocument()
    })

    it('disables Create missing projects button when areActionButtonsDisabled is true', () => {
      render(
        <RoleAssignmentStatusComponent
          roleAssignment={createBaseRoleAssignment({
            ...baseStatus,
            status: 'Error',
            reason: 'ApplicationFailed',
            message: 'Required namespaces not found on cluster',
          })}
          callbackMap={defaultCallbackMap}
          areActionButtonsDisabled
        />
      )
      const button = screen.getByRole('button', { name: 'Create missing projects' })
      expect(button).toBeDisabled()
    })

    it('invokes callback when Create missing projects is clicked', () => {
      const onMissingNamespaces = jest.fn()
      render(
        <RoleAssignmentStatusComponent
          roleAssignment={createBaseRoleAssignment({
            ...baseStatus,
            status: 'Error',
            reason: 'ApplicationFailed',
            message: 'Required namespaces not found on cluster',
          })}
          callbackMap={{ ...defaultCallbackMap, MissingNamespaces: onMissingNamespaces }}
        />
      )
      fireEvent.click(screen.getByRole('button', { name: 'Create missing projects' }))
      expect(onMissingNamespaces).toHaveBeenCalledTimes(1)
      expect(onMissingNamespaces).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test-role-assignment',
          status: expect.objectContaining({ reason: 'ApplicationFailed' }),
        })
      )
    })
  })

  describe('Popover fallbacks', () => {
    it('displays Not available when status has no reason', () => {
      render(
        <RoleAssignmentStatusComponent
          roleAssignment={createBaseRoleAssignment({
            name: 'ra1',
            status: 'Error',
            message: 'Something failed',
          })}
          callbackMap={defaultCallbackMap}
        />
      )
      expect(screen.getByText('Not available')).toBeInTheDocument()
    })

    it('displays Not available in Error expandable section when status has no message', () => {
      render(
        <RoleAssignmentStatusComponent
          roleAssignment={createBaseRoleAssignment({
            ...baseStatus,
            status: 'Error',
            reason: 'ApplicationFailed',
            message: undefined,
          })}
          callbackMap={defaultCallbackMap}
        />
      )
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText('Not available')).toBeInTheDocument()
    })

    it('displays Not available when status has no message (default bodyContent used for Active)', () => {
      render(
        <RoleAssignmentStatusComponent
          roleAssignment={createBaseRoleAssignment({
            name: 'ra1',
            status: 'Active',
            reason: 'SuccessfullyApplied',
            message: undefined,
          })}
          callbackMap={defaultCallbackMap}
        />
      )
      expect(screen.getByText('Not available')).toBeInTheDocument()
    })
  })
})
