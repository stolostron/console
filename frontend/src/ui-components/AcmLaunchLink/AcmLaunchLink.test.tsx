/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { AcmLaunchLink } from './AcmLaunchLink'
import { Tooltip } from '@patternfly/react-core'
import RedHatIcon from '../AcmIcons/RedHatIcon'

describe('AcmLaunchLink', () => {
  test('renders a link when only one link is provided', async () => {
    const { container, queryByTestId } = render(
      <AcmLaunchLink links={[{ id: 'grafana', text: 'Grafana', href: '/grafana' }]} />
    )
    expect(queryByTestId('addon-launch-links')).toBeNull()
    expect(queryByTestId('grafana')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
  test('renders a link when onClick is provided', async () => {
    const { container, queryByTestId } = render(
      <AcmLaunchLink
        links={[
          {
            id: 'grafana',
            text: 'Grafana',
            onClick: () => {
              alert('')
            },
          },
        ]}
      />
    )
    expect(queryByTestId('addon-launch-links')).toBeNull()
    expect(queryByTestId('grafana')).toBeInTheDocument()
    expect(queryByTestId('grafana')).toHaveAttribute('aria-disabled', 'false')
    expect(await axe(container)).toHaveNoViolations()
  })
  test('renders a disabled link when onClick is provided', async () => {
    const { container, queryByTestId } = render(
      <AcmLaunchLink
        links={[
          {
            id: 'grafana',
            text: 'Grafana',
            onClick: () => {
              alert('')
            },
            disabled: true,
          },
        ]}
      />
    )
    expect(queryByTestId('addon-launch-links')).toBeNull()
    expect(queryByTestId('grafana')).toBeInTheDocument()
    expect(queryByTestId('grafana')).toHaveAttribute('aria-disabled', 'true')
    expect(await axe(container)).toHaveNoViolations()
  })
  test('renders a link the link is nested in a label', async () => {
    const { container, queryByTestId } = render(
      <AcmLaunchLink links={[{ id: 'grafana', text: 'Grafana', href: '/grafana', label: true }]} />
    )
    expect(queryByTestId('addon-launch-links')).toBeNull()
    expect(queryByTestId('grafana')).toBeInTheDocument()
    expect(queryByTestId('grafana')).toHaveAttribute('aria-disabled', 'false')
    expect(await axe(container)).toHaveNoViolations()
  })
  test('renders a disabled link the link is nested in a label', async () => {
    const { container, queryByTestId } = render(
      <AcmLaunchLink links={[{ id: 'grafana', text: 'Grafana', href: '/grafana', label: true, disabled: true }]} />
    )
    expect(queryByTestId('addon-launch-links')).toBeNull()
    expect(queryByTestId('grafana')).toBeInTheDocument()
    expect(queryByTestId('grafana')).toHaveAttribute('aria-disabled', 'true')
    expect(await axe(container)).toHaveNoViolations()
  })
  test('renders a link when onClick is provided and label=true', async () => {
    const { container, queryByTestId } = render(
      <AcmLaunchLink
        links={[
          {
            id: 'grafana',
            text: 'Grafana',
            onClick: () => {
              alert('')
            },
            label: true,
          },
        ]}
      />
    )
    expect(queryByTestId('addon-launch-links')).toBeNull()
    expect(queryByTestId('grafana')).toBeInTheDocument()
    expect(queryByTestId('grafana')).toHaveAttribute('aria-disabled', 'false')
    expect(await axe(container)).toHaveNoViolations()
  })
  test('renders a link without icon', async () => {
    const { container, queryByTestId } = render(
      <AcmLaunchLink
        links={[
          {
            id: 'grafana',
            text: 'Grafana',
            onClick: () => {
              alert('')
            },
            label: true,
            noIcon: true,
          },
        ]}
      />
    )
    expect(queryByTestId('addon-launch-links')).toBeNull()
    expect(queryByTestId('grafana')).toBeInTheDocument()
    expect(queryByTestId('grafana')).toHaveAttribute('aria-disabled', 'false')
    expect(await axe(container)).toHaveNoViolations()
  })
  test('renders a link with user pass-in icon', async () => {
    const { container, queryByTestId } = render(
      <AcmLaunchLink
        links={[
          {
            id: 'grafana',
            text: 'Grafana',
            onClick: () => {
              alert('')
            },
            label: true,
            noIcon: false,
            icon: <RedHatIcon />,
          },
        ]}
      />
    )
    expect(queryByTestId('addon-launch-links')).toBeNull()
    expect(queryByTestId('grafana')).toBeInTheDocument()
    expect(queryByTestId('grafana')).toHaveAttribute('aria-disabled', 'false')
    expect(await axe(container)).toHaveNoViolations()
  })
  test('renders a dropdown when multiple links are provided', async () => {
    const { container, getByTestId } = render(
      <AcmLaunchLink
        links={[
          { id: 'grafana', text: 'Grafana', href: '/grafana' },
          { id: 'logs', text: 'Kibana', href: '/kibana' },
        ]}
      />
    )
    expect(getByTestId('addon-launch-links')).toBeInTheDocument()
    userEvent.click(getByTestId('addon-launch-links'))
    expect(getByTestId('grafana')).toBeInTheDocument()
    expect(getByTestId('logs')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
  test('renders a link when link text is a tooltip component', async () => {
    const textTooltip = (
      <Tooltip content={<div>I have a tooltip!</div>}>
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <span tabIndex={0} style={{ border: '1px dashed' }}>
          Grafana!
        </span>
      </Tooltip>
    )
    const { container, queryByTestId } = render(
      <AcmLaunchLink links={[{ id: 'grafana', text: textTooltip, href: '/grafana' }]} />
    )
    expect(queryByTestId('addon-launch-links')).toBeNull()
    expect(queryByTestId('grafana')).toBeInTheDocument()
    expect(queryByTestId('grafana')).toHaveAttribute('aria-disabled', 'false')
    expect(await axe(container)).toHaveNoViolations()
  })
  test('renders null when no links are provided', () => {
    const { queryByRole, queryByTestId } = render(<AcmLaunchLink links={[]} />)
    expect(queryByRole('link')).toBeNull()
    expect(queryByTestId('addon-launch-links')).toBeNull()
  })
  test('renders null when undefined is provided', () => {
    const { queryByRole, queryByTestId } = render(<AcmLaunchLink />)
    expect(queryByRole('link')).toBeNull()
    expect(queryByTestId('addon-launch-links')).toBeNull()
  })
})
