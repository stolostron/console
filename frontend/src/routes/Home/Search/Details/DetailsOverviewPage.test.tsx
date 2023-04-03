/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2022 Red Hat, Inc.

import { render, screen, waitFor } from '@testing-library/react'
import { createBrowserHistory } from 'history'
import { Router } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../lib/nock-util'
import DetailsOverviewPage, {
  LablesGroup,
  OwnerReferences,
  ResourceConditions,
  ResourceSearchLink,
} from './DetailsOverviewPage'

describe('DetailsOverviewPage', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  it('Should correctly return ResourceSearchLink', async () => {
    render(
      <RecoilRoot>
        <Router history={createBrowserHistory()}>
          <ResourceSearchLink
            cluster={'test-cluster'}
            apiversion={'v1/beta1'}
            kind={'test-kind'}
            name={'test-name'}
            namespace={'test-namespace'}
          />
        </Router>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('test-name')).toBeTruthy())
  })

  it('Should correctly return empty LablesGroup', async () => {
    render(
      <RecoilRoot>
        <Router history={createBrowserHistory()}>
          <LablesGroup labels={{}} />
        </Router>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('No labels')).toBeTruthy())
  })

  it('Should correctly return LablesGroup', async () => {
    render(
      <RecoilRoot>
        <Router history={createBrowserHistory()}>
          <LablesGroup labels={{ test: 'test1', region: 'east' }} />
        </Router>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('test=test1')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('region=east')).toBeTruthy())
  })

  it('Should correctly return empty OwnerReferences', async () => {
    render(
      <RecoilRoot>
        <Router history={createBrowserHistory()}>
          <OwnerReferences namespace={'test-ns'} cluster={'test-cluster'} />
        </Router>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('No owners')).toBeTruthy())
  })

  it('Should correctly return OwnerReferences', async () => {
    render(
      <RecoilRoot>
        <Router history={createBrowserHistory()}>
          <OwnerReferences
            ownerReferences={[
              {
                apiVersion: 'v1/alpha1',
                kind: 'kind',
                name: 'test-name',
              },
            ]}
            namespace={'test-ns'}
            cluster={'test-cluster'}
          />
        </Router>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('test-name')).toBeTruthy())
  })

  it('Should correctly return empty ResourceConditions', async () => {
    render(
      <RecoilRoot>
        <Router history={createBrowserHistory()}>
          <ResourceConditions conditions={[]} />
        </Router>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('No conditions found')).toBeTruthy())
  })

  it('Should correctly return ResourceConditions', async () => {
    render(
      <RecoilRoot>
        <Router history={createBrowserHistory()}>
          <ResourceConditions
            conditions={[
              {
                type: 'Initialized',
                status: 'True',
              },
              {
                type: 'Available',
                status: 'True',
                lastTransitionTime: '2022-10-31T09:26:14Z',
                reason: 'MinimumReplicasAvailable',
                message: 'Deployment has minimum availability.',
              },
            ]}
          />
        </Router>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('Initialized')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Available')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('MinimumReplicasAvailable')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Deployment has minimum availability.')).toBeTruthy())
  })

  // Full page tests
  it('Should correctly return DetailsOverviewPage in loading state', async () => {
    render(
      <RecoilRoot>
        <Router history={createBrowserHistory()}>
          <DetailsOverviewPage
            cluster={'test-cluster'}
            resource={{
              apiVersion: 'v1',
              kind: 'Pod',
              metadata: {
                name: 'testName',
                namespace: 'testNs',
              },
            }}
            name={'testName'}
            loading={true}
            error={''}
          />
        </Router>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('Loading')).toBeTruthy())
  })

  it('Should correctly return DetailsOverviewPage with errors', async () => {
    render(
      <RecoilRoot>
        <Router history={createBrowserHistory()}>
          <DetailsOverviewPage
            cluster={'test-cluster'}
            resource={{
              apiVersion: 'v1',
              kind: 'Pod',
              metadata: {
                name: 'testName',
                namespace: 'testNs',
              },
            }}
            name={'testName'}
            loading={false}
            error={'Error getting resource'}
          />
        </Router>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('Error querying for resource: testName')).toBeTruthy())
  })

  it('Should correctly return DetailsOverviewPage', async () => {
    render(
      <RecoilRoot>
        <Router history={createBrowserHistory()}>
          <DetailsOverviewPage
            cluster={'local-cluster'}
            resource={
              {
                kind: 'Deployment',
                apiVersion: 'apps/v1',
                metadata: {
                  name: 'application-manager',
                  namespace: 'open-cluster-management-agent-addon',
                  uid: '4185c145-eb24-472b-b35b-92fdeaaa1b6a',
                  resourceVersion: '105557',
                  creationTimestamp: '2022-10-31T11:24:07Z',
                  labels: { component: 'application-manager' },
                  annotations: { 'deployment.kubernetes.io/revision': '1' },
                  ownerReferences: [
                    {
                      apiVersion: 'work.open-cluster-management.io/v1',
                      kind: 'AppliedManifestWork',
                      name: 'b87371581c40be6a58d412e4f67b1a024e1520f3e0b23ca80d5b30e5a1faa960-addon-application-manager-deploy',
                      uid: '89a634bb-8106-44c6-bd02-87c847e11fa9',
                    },
                  ],
                },
                spec: {
                  selector: {
                    matchLabels: {
                      'app.kubernetes.io/component': 'exporter',
                      'app.kubernetes.io/name': 'kube-state-metrics',
                      'app.kubernetes.io/part-of': 'openshift-monitoring',
                    },
                  },
                  template: {
                    spec: {
                      nodeSelector: {
                        'kubernetes.io/os': 'linux',
                      },
                    },
                  },
                },
                status: {
                  observedGeneration: 1,
                  replicas: 1,
                  updatedReplicas: 1,
                  readyReplicas: 1,
                  availableReplicas: 1,
                  conditions: [
                    {
                      type: 'Progressing',
                      status: 'True',
                      lastUpdateTime: '2022-10-31T11:24:37Z',
                      lastTransitionTime: '2022-10-31T11:24:07Z',
                      reason: 'NewReplicaSetAvailable',
                      message: 'ReplicaSet "application-manager-84c48b9597" has successfully progressed.',
                    },
                    {
                      type: 'Available',
                      status: 'True',
                      lastUpdateTime: '2022-10-31T11:34:24Z',
                      lastTransitionTime: '2022-10-31T11:34:24Z',
                      reason: 'MinimumReplicasAvailable',
                      message: 'Deployment has minimum availability.',
                    },
                  ],
                },
              } as any
            }
            name={'application-manager'}
            loading={false}
            error={''}
          />
        </Router>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('application-manager')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('component=application-manager')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('kubernetes.io/os=linux')).toBeTruthy())
    await waitFor(() =>
      expect(
        screen.queryByText(
          'app.kubernetes.io/component=exporter, app.kubernetes.io/name=kube-state-metrics, app.kubernetes.io/part-of=openshift-monitoring'
        )
      ).toBeTruthy()
    )
    await waitFor(() => expect(screen.queryByText('Progressing')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('NewReplicaSetAvailable')).toBeTruthy())
    await waitFor(() =>
      expect(
        screen.queryByText('ReplicaSet "application-manager-84c48b9597" has successfully progressed.')
      ).toBeTruthy()
    )
  })
})
