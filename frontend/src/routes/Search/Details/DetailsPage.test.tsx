/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { isFineGrainedRbacEnabledState, settingsState } from '../../../atoms'
import { nockGet, nockIgnoreApiPaths, nockIgnoreRBAC, nockPostRequest } from '../../../lib/nock-util'
import { waitForNocks } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import Search from '../Search'
import { getResourceParams } from './DetailsPage'

let capturedActionsDropdownProps: Record<string, unknown> | null = null
let onOpenChangeCalledFromEscape = false
jest.mock('@patternfly/react-core', () => {
  const actual = jest.requireActual('@patternfly/react-core')
  return {
    ...actual,
    Dropdown: (props: Record<string, unknown>) => {
      capturedActionsDropdownProps = props
      const toggle = typeof props.toggle === 'function' ? props.toggle(React.createRef()) : props.toggle
      const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape' && typeof props.onOpenChange === 'function') {
          onOpenChangeCalledFromEscape = true
          ;(props.onOpenChange as (open: boolean) => void)(false)
        }
      }
      return React.createElement(
        'div',
        { 'data-testid': 'actions-dropdown-mock', onKeyDown },
        toggle,
        props.isOpen ? props.children : null
      )
    },
  }
})

const mockLocalClusterPod = {
  kind: 'Pod',
  apiVersion: 'v1',
  metadata: {
    name: 'testLocalPod',
    namespace: 'testNamespace',
    resourceVersion: '100702',
    creationTimestamp: '2022-11-18T11:33:56Z',
  },
  spec: {
    restartPolicy: 'Always',
    terminationGracePeriodSeconds: 30,
    dnsPolicy: 'ClusterFirst',
    nodeSelector: { 'kubernetes.io/os': 'linux' },
    containers: [
      {
        name: 'testContainer',
        resources: { requests: { cpu: '10m', memory: '50Mi' } },
        livenessProbe: {
          initialDelaySeconds: 10,
          timeoutSeconds: 5,
          periodSeconds: 10,
          successThreshold: 1,
          failureThreshold: 3,
        },
        readinessProbe: {
          initialDelaySeconds: 5,
          timeoutSeconds: 5,
          periodSeconds: 10,
          successThreshold: 1,
          failureThreshold: 3,
        },
      },
    ],
  },
  status: {
    phase: 'Running',
    conditions: [
      { type: 'Ready', status: 'True', lastProbeTime: null, lastTransitionTime: '2022-11-18T11:34:09Z' },
      {
        type: 'ContainersReady',
        status: 'True',
        lastProbeTime: null,
        lastTransitionTime: '2022-11-18T11:34:09Z',
      },
    ],
  },
}
const originalLocation = window.location
describe('DetailsPage', () => {
  beforeEach(async () => {
    // jest.resetAllMocks()
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })
  afterEach(() => {
    jest.resetAllMocks()
    onOpenChangeCalledFromEscape = false
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    })
  })
  const metricNock = nockPostRequest('/metrics?search-details', {})

  it('should render local-cluster resource details correctly', async () => {
    jest.mock('react-router-dom-v5-compat', () => {
      const originalModule = jest.requireActual('react-router-dom-v5-compat')
      return {
        __esModule: true,
        ...originalModule,
        useLocation: () => ({
          pathname: '/multicloud/search/resources',
          search:
            '?cluster=local-cluster&kind=Pod&apiversion=v1&namespace=testNamespace&name=testLocalPod&_hubClusterResource=true',
          state: {
            from: '/multicloud/search',
            fromSearch: '?filters={%22textsearch%22:%22kind%3APod%22}',
          },
        }),
        useNavigate: () => jest.fn(),
      }
    })
    Object.defineProperty(window, 'location', {
      value: {
        ...originalLocation,
        pathname: '/multicloud/search/resources',
        search:
          '?cluster=local-cluster&kind=Pod&apiversion=v1&namespace=testNamespace&name=testLocalPod&_hubClusterResource=true',
        state: {
          from: '/multicloud/search',
          fromSearch: '?filters={%22textsearch%22:%22kind%3APod%2',
        },
      },
      writable: true,
    })
    render(
      <RecoilRoot>
        <MemoryRouter initialEntries={[NavigationPath.resources]}>
          <Routes>
            <Route path={`${NavigationPath.search}/*`} element={<Search />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Wait for delete resource requests to finish
    await waitForNocks([metricNock, nockGet(mockLocalClusterPod)])

    // Test that the component has rendered correctly with data
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          name: /testlocalpod/i,
        })
      ).toBeTruthy()
    )

    // Wait for the details page to be loaded
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          name: /pod details/i,
        })
      ).toBeTruthy()
    )

    // Regression: Actions Dropdown must receive onOpenChange so it stays in sync when closed (e.g. click outside)
    expect(capturedActionsDropdownProps).not.toBeNull()
    expect(typeof capturedActionsDropdownProps?.onOpenChange).toBe('function')
    expect(() => (capturedActionsDropdownProps?.onOpenChange as (open: boolean) => void)(false)).not.toThrow()

    // Regression: when ESC is pressed, onOpenChange should be called so the dropdown closes
    onOpenChangeCalledFromEscape = false
    const actionsButton = screen.getByRole('button', { name: /actions/i })
    fireEvent.click(actionsButton)
    fireEvent.keyDown(actionsButton, { key: 'Escape' })
    expect(onOpenChangeCalledFromEscape).toBe(true)
  })

  test('Should return the url search params correctly', () => {
    const res = getResourceParams()
    expect(res).toMatchSnapshot()
  })

  test('Should return the url search params incorrectly', () => {
    Object.defineProperty(window, 'location', {
      value: {
        ...originalLocation,
        pathname: '/multicloud/search/resources',
        search: '?',
        state: {
          from: '/multicloud/search',
          fromSearch: '?filters={%22textsearch%22:%22kind%3APod%2',
        },
      },
      writable: true,
    })
    const res = getResourceParams()
    expect(res).toMatchSnapshot()
  })

  it('should render VirtualMachine resource details correctly', async () => {
    jest.mock('react-router-dom-v5-compat', () => {
      const originalModule = jest.requireActual('react-router-dom-v5-compat')
      return {
        __esModule: true,
        ...originalModule,
        useLocation: () => ({
          pathname: '/multicloud/search/resources',
          search:
            '?cluster=local-cluster&kind=VirtualMachine&apiversion=kubevirt.io/v1&namespace=openshift-cnv&name=test-vm&_hubClusterResource=true',
          state: {
            from: '/multicloud/search',
            fromSearch: '?filters={%22textsearch%22:%22kind%3AVirtualMachine%22}',
          },
        }),
        useNavigate: () => jest.fn(),
      }
    })
    Object.defineProperty(window, 'location', {
      value: {
        ...originalLocation,
        pathname: '/multicloud/search/resources',
        search:
          '?cluster=local-cluster&kind=VirtualMachine&apiversion=kubevirt.io/v1&namespace=openshift-cnv&name=test-vm&_hubClusterResource=true',
        state: {
          from: '/multicloud/search',
          fromSearch: '?filters={%22textsearch%22:%22kind%3AVirtualMachine%2',
        },
      },
      writable: true,
    })
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(settingsState, { VIRTUAL_MACHINE_ACTIONS: 'enabled' })
        }}
      >
        <MemoryRouter initialEntries={[NavigationPath.resources]}>
          <Routes>
            <Route path={`${NavigationPath.search}/*`} element={<Search />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Wait for delete resource requests to finish
    await waitForNocks([
      metricNock,
      nockGet({
        apiVersion: 'kubevirt.io/v1',
        kind: 'VirtualMachine',
        metadata: {
          creationTimestamp: '2024-10-02T20:02:14Z',
          name: 'test-vm',
          namespace: 'openshift-cnv',
        },
        spec: {
          running: true,
          template: {
            metadata: {
              creationTimestamp: null,
            },
            spec: {},
          },
          status: {
            created: true,
            desiredGeneration: 9,
            observedGeneration: 9,
            printableStatus: 'Running',
            ready: true,
            runStrategy: 'Always',
          },
        },
      }),
    ])

    // Test that the component has rendered correctly with data
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          name: /test-vm/i,
        })
      ).toBeTruthy()
    )
  })

  it('should render VirtualMachineSnapshot resource details correctly', async () => {
    jest.mock('react-router-dom-v5-compat', () => {
      const originalModule = jest.requireActual('react-router-dom-v5-compat')
      return {
        __esModule: true,
        ...originalModule,
        useLocation: () => ({
          pathname: '/multicloud/search/resources',
          search:
            '?cluster=local-cluster&kind=VirtualMachineSnapshot&apiversion=snapshot.kubevirt.io/v1beta1&namespace=openshift-cnv&name=test-vm-snapshot&_hubClusterResource=true',
          state: {
            from: '/multicloud/search',
            fromSearch: '?filters={%22textsearch%22:%22kind%3AVirtualMachineSnapshot%22}',
          },
        }),
        useNavigate: () => jest.fn(),
      }
    })
    Object.defineProperty(window, 'location', {
      value: {
        ...originalLocation,
        pathname: '/multicloud/search/resources',
        search:
          '?cluster=local-cluster&kind=VirtualMachineSnapshot&apiversion=snapshot.kubevirt.io/v1beta1&namespace=openshift-cnv&name=test-vm-snapshot&_hubClusterResource=true',
        state: {
          from: '/multicloud/search',
          fromSearch: '?filters={%22textsearch%22:%22kind%3AVirtualMachineSnapshot%2',
        },
      },
      writable: true,
    })
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(settingsState, { VIRTUAL_MACHINE_ACTIONS: 'enabled' })
        }}
      >
        <MemoryRouter initialEntries={[NavigationPath.resources]}>
          <Routes>
            <Route path={`${NavigationPath.search}/*`} element={<Search />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Wait for delete resource requests to finish
    await waitForNocks([
      metricNock,
      nockGet({
        apiVersion: 'snapshot.kubevirt.io/v1beta1',
        kind: 'VirtualMachineSnapshot',
        metadata: {
          creationTimestamp: '2025-05-13T12:41:24Z',
          name: 'test-vm-snapshot',
          namespace: 'default',
          ownerReferences: [
            {
              apiVersion: 'kubevirt.io/v1',
              blockOwnerDeletion: false,
              kind: 'VirtualMachine',
              name: 'test-vm',
            },
          ],
        },
        spec: {
          source: {
            apiGroup: 'kubevirt.io',
            kind: 'VirtualMachine',
            name: 'test-vm',
          },
        },
        status: {
          conditions: [
            {
              lastProbeTime: null,
              lastTransitionTime: '2025-05-13T12:41:24Z',
              reason: 'Operation complete',
              status: 'False',
              type: 'Progressing',
            },
            {
              lastProbeTime: null,
              lastTransitionTime: '2025-05-13T12:41:24Z',
              reason: 'Operation complete',
              status: 'True',
              type: 'Ready',
            },
          ],
          creationTime: '2025-05-13T12:41:24Z',
          phase: 'Succeeded',
          readyToUse: true,
          snapshotVolumes: {
            excludedVolumes: ['rootdisk', 'cloudinitdisk'],
          },
        },
      }),
    ])

    // Test that the component has rendered correctly with data
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          name: /test-vm-snapshot/i,
        })
      ).toBeTruthy()
    )
  })

  it('should render VirtualMachine details with fine-grained RBAC', async () => {
    jest.mock('../../../resources/utils/resource-request', () => ({
      getBackendUrl: jest.fn(() => ''),
      getRequest: jest.fn((url) => {
        if (url === '/virtualmachines/get/local-cluster/testVM/testNamespace') {
          return {
            promise: Promise.resolve({
              apiVersion: 'kubevirt.io/v1',
              kind: 'VirtualMachine',
              metadata: {
                name: 'testVM',
                namespace: 'testNamespace',
              },
            }),
          }
        } else {
          return Promise.resolve()
        }
      }),
    }))
    jest.mock('react-router-dom-v5-compat', () => {
      const originalModule = jest.requireActual('react-router-dom-v5-compat')
      return {
        __esModule: true,
        ...originalModule,
        useLocation: () => ({
          pathname: '/multicloud/search/resources',
          search:
            '?cluster=local-cluster&kind=VirtualMachine&apiversion=kubevirt.io/v1&namespace=testNamespace&name=testVM&_hubClusterResource=true',
          state: {
            from: '/multicloud/search',
            fromSearch: '?filters={%22textsearch%22:%22kind%3AVirtualMachine%22}',
          },
        }),
        useNavigate: () => jest.fn(),
      }
    })
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/multicloud/search/resources',
        search:
          '?cluster=local-cluster&kind=VirtualMachine&apiversion=kubevirt.io/v1&namespace=testNamespace&name=testVM&_hubClusterResource=true',
        state: {
          from: '/multicloud/search',
          fromSearch: '?filters={%22textsearch%22:%22kind%3AVirtualMachine%2',
        },
      },
    })
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(isFineGrainedRbacEnabledState, true)
        }}
      >
        <MemoryRouter initialEntries={[NavigationPath.resources]}>
          <Routes>
            <Route path={`${NavigationPath.search}/*`} element={<Search />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Wait for delete resource requests to finish
    await waitForNocks([metricNock])
    // Test that the component has rendered correctly with data
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          name: /testvm/i,
        })
      ).toBeTruthy()
    )

    // Wait for the details page to be loaded
    await waitFor(() => expect(screen.getByText(/virtualmachine details/i)).toBeTruthy())
  })
})
