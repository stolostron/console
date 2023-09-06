/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { render, screen, waitFor } from '@testing-library/react'
import { createBrowserHistory } from 'history'
import { Router } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { nockGet, nockIgnoreApiPaths, nockIgnoreRBAC, nockPostRequest } from '../../../../lib/nock-util'
import { waitForNocks } from '../../../../lib/test-util'
import DetailsPage from './DetailsPage'

jest.mock('react-router-dom', () => {
  const originalModule = jest.requireActual('react-router-dom')
  return {
    __esModule: true,
    ...originalModule,
    useLocation: () => ({
      pathname: '/multicloud/home/search/resources',
      search: '?cluster=local-cluster&kind=Pod&apiversion=v1&namespace=testNamespace&name=testLocalPod',
      state: {
        from: '/multicloud/home/search',
        fromSearch: '?filters={%22textsearch%22:%22kind%3APod%22}',
      },
    }),
    useHistory: () => ({
      push: jest.fn(),
    }),
  }
})
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/multicloud/home/search/resources',
    search: '?cluster=local-cluster&kind=Pod&apiversion=v1&namespace=testNamespace&name=testLocalPod',
    state: {
      from: '/multicloud/home/search',
      fromSearch: '?filters={%22textsearch%22:%22kind%3APod%2',
    },
  },
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

describe('DetailsPage', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })
  const metricNock = nockPostRequest('/metrics?search-details', {})

  it('should render local-cluster resource details correctly', async () => {
    render(
      <RecoilRoot>
        <Router history={createBrowserHistory()}>
          <DetailsPage />
        </Router>
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
  })
})
