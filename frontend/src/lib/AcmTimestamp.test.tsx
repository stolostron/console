/* Copyright Contributors to the Open Cluster Management project */
import { UseK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk'
import { useFleetK8sWatchResource } from '@stolostron/multicluster-sdk'
import '@testing-library/jest-dom/extend-expect'
import { render, screen } from '@testing-library/react'
import React from 'react'
import AcmTimestamp from './AcmTimestamp'
import { PluginContext } from './PluginContext'
import { PluginDataContext } from './PluginDataContext'

interface TimestampProps {
  timestamp: string | number | Date
  simple?: boolean
  omitSuffix?: boolean
  className?: string
  noDateText?: string
}

const MockTimestamp: React.FC<TimestampProps> = ({ timestamp, simple, omitSuffix, className }) => (
  <div className={className}>
    {String(timestamp)} {simple && 'simple'} {omitSuffix && 'omitSuffix'}
  </div>
)

const mockUseK8sWatchResource: UseK8sWatchResource = jest.fn()
const mockUseFleetK8sWatchResource: typeof useFleetK8sWatchResource = jest.fn()

const mockPluginContextValue = {
  ocpApi: {
    Timestamp: MockTimestamp,
    useK8sWatchResource: mockUseK8sWatchResource,
  },
  multiclusterApi: {
    useFleetK8sWatchResource: mockUseFleetK8sWatchResource,
  },
  isACMAvailable: true,
  isOverviewAvailable: true,
  isSubmarinerAvailable: true,
  isApplicationsAvailable: true,
  isGovernanceAvailable: true,
  isSearchAvailable: true,
  dataContext: PluginDataContext,
  acmExtensions: {},
}

describe('AcmTimestamp', () => {
  const timestamp = 'Jan 3, 2025, 6:53 PM'

  test('renders dash when timestamp is undefined', () => {
    render(
      <PluginContext.Provider value={mockPluginContextValue}>
        <AcmTimestamp timestamp={undefined} />
      </PluginContext.Provider>
    )
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  test('renders the component with the Timestamp from PluginContext', () => {
    render(
      <PluginContext.Provider value={mockPluginContextValue}>
        <AcmTimestamp timestamp={timestamp} />
      </PluginContext.Provider>
    )
    expect(screen.getByText(timestamp)).toBeInTheDocument()
  })

  test('renders the component with simple prop', () => {
    render(
      <PluginContext.Provider value={mockPluginContextValue}>
        <AcmTimestamp timestamp={timestamp} simple />
      </PluginContext.Provider>
    )
    expect(screen.getByText(`${timestamp} simple`)).toBeInTheDocument()
  })

  test('renders the component with omitSuffix prop', () => {
    render(
      <PluginContext.Provider value={mockPluginContextValue}>
        <AcmTimestamp timestamp={timestamp} omitSuffix />
      </PluginContext.Provider>
    )
    expect(screen.getByText(`${timestamp} omitSuffix`)).toBeInTheDocument()
  })

  test('renders the component with className prop', () => {
    const className = 'test-class'
    render(
      <PluginContext.Provider value={mockPluginContextValue}>
        <AcmTimestamp timestamp={timestamp} className={className} />
      </PluginContext.Provider>
    )
    expect(screen.getByText(timestamp)).toHaveClass(className)
  })

  test('renders the component with showIcon prop', () => {
    render(
      <PluginContext.Provider value={mockPluginContextValue}>
        <AcmTimestamp timestamp={timestamp} showIcon />
      </PluginContext.Provider>
    )
    expect(screen.getByText(timestamp)).toBeInTheDocument()
  })

  test('renders the SimpleTimestamp component when Timestamp is not available in PluginContext', () => {
    const mockContextWithoutTimestamp = {
      ...mockPluginContextValue,
      ocpApi: {
        ...mockPluginContextValue.ocpApi,
        Timestamp: undefined,
      },
    }

    render(
      <PluginContext.Provider value={mockContextWithoutTimestamp}>
        <AcmTimestamp timestamp={timestamp} />
      </PluginContext.Provider>
    )
    expect(screen.getByText(timestamp)).toBeInTheDocument()
  })

  test('renders with a Date object timestamp', () => {
    const dateTimestamp = new Date('2025-01-03T18:53:00')
    render(
      <PluginContext.Provider value={mockPluginContextValue}>
        <AcmTimestamp timestamp={dateTimestamp} />
      </PluginContext.Provider>
    )
    expect(screen.getByText(String(dateTimestamp))).toBeInTheDocument()
  })

  test('renders with a numeric timestamp', () => {
    const numericTimestamp = 1735732380000
    render(
      <PluginContext.Provider value={mockPluginContextValue}>
        <AcmTimestamp timestamp={numericTimestamp} />
      </PluginContext.Provider>
    )
    expect(screen.getByText(String(numericTimestamp))).toBeInTheDocument()
  })

  test('renders with empty string timestamp', () => {
    render(
      <PluginContext.Provider value={mockPluginContextValue}>
        <AcmTimestamp timestamp={''} />
      </PluginContext.Provider>
    )
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  test('renders with custom noDateText', () => {
    const customNoDateText = 'No date available'
    render(
      <PluginContext.Provider value={mockPluginContextValue}>
        <AcmTimestamp timestamp={undefined} noDateText={customNoDateText} />
      </PluginContext.Provider>
    )
    expect(screen.getByText(customNoDateText)).toBeInTheDocument()
  })

  test('handles null timestamp gracefully', () => {
    render(
      <PluginContext.Provider value={mockPluginContextValue}>
        <AcmTimestamp timestamp={null as unknown as string} />
      </PluginContext.Provider>
    )
    expect(screen.getByText('-')).toBeInTheDocument()
  })
})
