/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import ClusterSetsPage from './ClusterSets'
import { PluginContext, defaultPlugin } from '../../../../lib/PluginContext'
import React from 'react'

// Mock the ClusterSetsTable component
jest.mock('../../../../components/ClusterSets/ClusterSetsTable', () => ({
  ClusterSetsTable: jest.fn((props: any) => (
    <div data-testid="mocked-cluster-sets-table" data-hiddencolumns={JSON.stringify(props.hiddenColumns)}>
      Mocked ClusterSets Table
    </div>
  )),
}))

// Mock AcmTableStateProvider and other ui-components
jest.mock('../../../../ui-components', () => {
  const React = require('react')
  return {
    AcmPageContent: jest.fn(({ children }: { children: React.ReactNode }) => (
      <div data-testid="acm-page-content">{children}</div>
    )),
    AcmExpandableCard: jest.fn(({ children }: { children: React.ReactNode }) => (
      <div data-testid="acm-expandable-card">{children}</div>
    )),
    AcmButton: jest.fn(({ children }: { children: React.ReactNode }) => <button>{children}</button>),
    AcmAlertContext: React.createContext({ clearAlerts: jest.fn() }),
    AcmTableStateProvider: jest.fn(
      ({ children, localStorageKey }: { children: React.ReactNode; localStorageKey: string }) => (
        <div data-testid="acm-table-state-provider" data-localstorage-key={localStorageKey}>
          {children}
        </div>
      )
    ),
  }
})

// Mock shared-recoil
jest.mock('../../../../shared-recoil', () => ({
  useRecoilValue: jest.fn(() => []),
  useSharedAtoms: jest.fn(() => ({ managedClusterSetsState: {} })),
}))

// Mock translation
jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
  })),
}))

// Mock doc-util
jest.mock('../../../../lib/doc-util', () => ({
  DOC_LINKS: {
    CLUSTER_SETS: 'https://example.com/cluster-sets',
    SUBMARINER: 'https://example.com/submariner',
  },
}))

function Component() {
  return (
    <RecoilRoot>
      <PluginContext.Provider value={defaultPlugin}>
        <MemoryRouter>
          <ClusterSetsPage />
        </MemoryRouter>
      </PluginContext.Provider>
    </RecoilRoot>
  )
}

describe('ClusterSetsPage', () => {
  test('should render component without errors', () => {
    const { container } = render(<Component />)
    expect(container).toBeInTheDocument()
  })

  test('should wrap ClusterSetsTable with AcmTableStateProvider using correct localStorageKey', () => {
    const { container } = render(<Component />)

    const provider = container.querySelector('[data-testid="acm-table-state-provider"]')
    expect(provider).toBeInTheDocument()
    expect(provider).toHaveAttribute('data-localstorage-key', 'cluster-sets-table-state')
  })

  test('should render ClusterSetsTable as a child of AcmTableStateProvider', () => {
    const { container } = render(<Component />)

    const provider = container.querySelector('[data-testid="acm-table-state-provider"]')
    const clusterSetsTable = provider?.querySelector('[data-testid="mocked-cluster-sets-table"]')
    expect(clusterSetsTable).toBeInTheDocument()
  })

  test('should pass hiddenColumns prop to ClusterSetsTable', () => {
    const { container } = render(<Component />)

    const clusterSetsTable = container.querySelector('[data-testid="mocked-cluster-sets-table"]')
    expect(clusterSetsTable).toBeInTheDocument()
    expect(clusterSetsTable).toHaveAttribute('data-hiddencolumns', '["table.clusters"]')
  })
})
