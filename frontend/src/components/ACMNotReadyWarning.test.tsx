/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { subscriptionOperatorsState } from '../atoms'
import { clickByRole, waitForText } from '../lib/test-util'
import { SubscriptionOperator, SubscriptionOperatorApiVersion, SubscriptionOperatorKind } from '../resources'
import { nockIgnoreOperatorCheck } from '../lib/nock-util'
import { ACMNotReadyWarning } from './ACMNotReadyWarning'
import { PluginDataContext } from '../lib/PluginDataContext'
import { PluginContext } from '../lib/PluginContext'

const acm_unhealthy: SubscriptionOperator = {
  apiVersion: SubscriptionOperatorApiVersion,
  kind: SubscriptionOperatorKind,
  metadata: {
    name: 'advanced-cluster-management',
    namespace: 'open-cluster-management',
  },
  status: {
    installedCSV: 'advanced-cluster-management.v2.8.0',
    conditions: [
      {
        reason: 'SomethingWentWrong',
        lastTransitionTime: '',
        message: '',
        type: 'CatalogSourcesUnhealthy',
        status: 'True',
      },
    ],
  },
  spec: {},
}

const acm: SubscriptionOperator = {
  apiVersion: SubscriptionOperatorApiVersion,
  kind: SubscriptionOperatorKind,
  metadata: {
    name: 'advanced-cluster-management',
    namespace: 'open-cluster-management',
  },
  status: {
    installedCSV: 'advanced-cluster-management.v2.8.0',
    conditions: [
      {
        reason: 'AllCatalogSourcesHealthy',
        lastTransitionTime: '',
        message: '',
        type: 'CatalogSourcesUnhealthy',
        status: 'False',
      },
    ],
  },
  spec: {},
}

function WrappedACMNotReadyWarning(props: { acmOperators?: SubscriptionOperator[] }) {
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(subscriptionOperatorsState, props.acmOperators || [])
      }}
    >
      <MemoryRouter>
        <ACMNotReadyWarning>Default Content</ACMNotReadyWarning>
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('ACMNotReadyWarning', () => {
  beforeEach(() => {
    nockIgnoreOperatorCheck(true)
  })
  it('does not display the modal when ACM is not installed', async () => {
    render(<WrappedACMNotReadyWarning acmOperators={[acm_unhealthy]} />)
    await waitForText('Default Content')
  })
  it('displays the modal when ACM is installed but the plugin is not available', async () => {
    const setItem = jest.fn()
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem,
      },
      writable: true,
    })
    render(
      <PluginContext.Provider
        value={{
          isACMAvailable: false,
          isOverviewAvailable: true,
          isSubmarinerAvailable: true,
          isApplicationsAvailable: true,
          isGovernanceAvailable: true,
          isSearchAvailable: true,
          dataContext: PluginDataContext,
          acmExtensions: {},
          ocpApi: {
            useK8sWatchResource: () => [[] as any, true, undefined],
          },
        }}
      >
        <WrappedACMNotReadyWarning acmOperators={[acm]} />
      </PluginContext.Provider>
    )
    await waitForText('Red Hat Advanced Cluster Management for Kubernetes is not ready')
    await clickByRole('checkbox', { name: 'Do not show this message again' })
    await clickByRole('button', { name: 'Dismiss' })
    expect(setItem).toHaveBeenCalledWith('acm-not-ready-suppress-advanced-cluster-management.v2.8.0', 'true')
  })
  it('does not display the modal when user has requested to not be bothered', async () => {
    const getItem = (key: string) => {
      if (key === 'acm-not-ready-suppress-advanced-cluster-management.v2.8.0') {
        return 'true'
      }
      return undefined
    }
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem,
      },
      writable: true,
    })
    render(
      <PluginContext.Provider
        value={{
          isACMAvailable: false,
          isOverviewAvailable: true,
          isSubmarinerAvailable: true,
          isApplicationsAvailable: true,
          isGovernanceAvailable: true,
          isSearchAvailable: true,
          dataContext: PluginDataContext,
          acmExtensions: {},
          ocpApi: {
            useK8sWatchResource: () => [[] as any, true, undefined],
          },
        }}
      >
        <WrappedACMNotReadyWarning acmOperators={[acm]} />
      </PluginContext.Provider>
    )
    await waitForText('Default Content')
  })
  it('does not display the modal when the ACM plugin is available', async () => {
    const removeItem = jest.fn()
    Object.defineProperty(window, 'localStorage', {
      value: {
        removeItem,
      },
      writable: true,
    })
    render(<WrappedACMNotReadyWarning acmOperators={[acm]} />)
    await waitForText('Default Content')
    expect(removeItem).toHaveBeenCalledWith('acm-not-ready-suppress-advanced-cluster-management.v2.8.0')
  })
})
