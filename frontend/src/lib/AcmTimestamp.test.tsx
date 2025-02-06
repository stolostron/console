/* Copyright Contributors to the Open Cluster Management project */
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import AcmTimestamp from './AcmTimestamp'
import { PluginContext } from './PluginContext'
import { UseK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk'
import { PluginDataContext } from './PluginDataContext'

interface TimestampProps {
  timestamp: string | number | Date
  simple?: boolean
  omitSuffix?: boolean
  className?: string
}

const MockTimestamp: React.FC<TimestampProps> = ({ timestamp, simple, omitSuffix, className }) => (
  <div className={className}>
    {String(timestamp)} {simple && 'simple'} {omitSuffix && 'omitSuffix'}
  </div>
)

const mockUseK8sWatchResource: UseK8sWatchResource = jest.fn()

const mockPluginContextValue = {
  ocpApi: {
    Timestamp: MockTimestamp,
    useK8sWatchResource: mockUseK8sWatchResource,
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

  test('renders the SimpleTimestamp component with an invalid timestamp', () => {
    const invalidTimestamp = ''
    const mockContextWithoutTimestamp = {
      ...mockPluginContextValue,
      ocpApi: {
        ...mockPluginContextValue.ocpApi,
        Timestamp: undefined,
      },
    }

    render(
      <PluginContext.Provider value={mockContextWithoutTimestamp}>
        <AcmTimestamp timestamp={invalidTimestamp} />
      </PluginContext.Provider>
    )
    expect(screen.getByText('Invalid Date')).toBeInTheDocument()
  })
})
