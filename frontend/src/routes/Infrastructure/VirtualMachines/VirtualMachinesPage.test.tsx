/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { MockedProvider } from '@apollo/client/testing'
import { render, screen, waitFor } from '@testing-library/react'
import { GraphQLError } from 'graphql'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { searchOperatorState } from '../../../atoms'
import { nockPostRequest } from '../../../lib/nock-util'
import { wait, waitForNocks } from '../../../lib/test-util'
import { SearchOperator } from '../../../resources'
import { SearchResultItemsDocument } from '../../Search/search-sdk/search-sdk'
import VirtualMachinesPage from './VirtualMachinesPage'

const mockHealthySearchOperator: SearchOperator = {
  apiVersion: 'search.open-cluster-management.io/v1alpha1',
  kind: 'Search',
  metadata: {
    name: 'search-v2-operator',
    namespace: 'open-cluster-management',
  },
  status: {
    conditions: [
      {
        message: 'None',
        reason: 'None',
        status: 'True',
        type: 'Ready--search-postgres',
      },
      {
        message: 'None',
        reason: 'None',
        status: 'True',
        type: 'Ready--search-collector',
      },
      {
        message: 'None',
        reason: 'None',
        status: 'True',
        type: 'Ready--search-indexer',
      },
      {
        message: 'None',
        reason: 'None',
        status: 'True',
        type: 'Ready--search-api',
      },
    ],
  },
}
const mockUNHealthySearchOperator: SearchOperator = {
  apiVersion: 'search.open-cluster-management.io/v1alpha1',
  kind: 'Search',
  metadata: {
    name: 'search-v2-operator',
    namespace: 'open-cluster-management',
  },
  status: {
    conditions: [
      {
        message: 'None',
        reason: 'None',
        status: 'True',
        type: 'Ready--search-postgres',
      },
      {
        message: 'None',
        reason: 'None',
        status: 'True',
        type: 'Ready--search-collector',
      },
      {
        message: 'None',
        reason: 'None',
        status: 'True',
        type: 'Ready--search-indexer',
      },
      {
        message: 'None',
        reason: 'None',
        status: 'False',
        type: 'Ready--search-api',
      },
    ],
  },
}

describe('VirtualMachinesPage Page', () => {
  it('should render page with correct vm data', async () => {
    const metricNock = nockPostRequest('/metrics?virtual-machines', {})
    const mocks = [
      {
        request: {
          query: SearchResultItemsDocument,
          variables: {
            input: [
              {
                keywords: [],
                filters: [
                  {
                    property: 'kind',
                    values: ['VirtualMachine', 'VirtualMachineInstance'],
                  },
                ],
                limit: -1,
              },
            ],
          },
        },
        result: {
          data: {
            searchResult: [
              {
                items: [
                  {
                    apigroup: 'kubevirt.io',
                    apiversion: 'v1',
                    cluster: 'managed-cluster-1',
                    created: '2021-01-04T14:53:52Z',
                    kind: 'VirtualMachine',
                    kind_plural: 'virtualmachines',
                    name: 'testVM1',
                    namespace: 'openshift-cnv',
                    _uid: 'testCluster/1234-abcd',
                    ready: 'True',
                    status: 'Running',
                  },
                  {
                    apigroup: 'kubevirt.io',
                    apiversion: 'v1',
                    cluster: 'managed-cluster-1',
                    created: '2021-01-04T14:53:52Z',
                    kind: 'VirtualMachineInstance',
                    kind_plural: 'virtualmachineinstances',
                    name: 'testVM1',
                    namespace: 'openshift-cnv',
                    _uid: 'testCluster/1234-abcd',
                    node: 'vmi-node-1',
                    ipaddress: '1.1.1.1',
                  },
                  {
                    apigroup: 'kubevirt.io',
                    apiversion: 'v1',
                    cluster: 'managed-cluster-2',
                    created: '2021-01-04T14:53:52Z',
                    kind: 'VirtualMachine',
                    kind_plural: 'virtualmachines',
                    name: 'testVM2',
                    namespace: 'openshift-cnv',
                    _uid: 'testCluster/5678-efgh',
                    ready: 'False',
                    status: 'Stopped',
                  },
                ],
                __typename: 'SearchResult',
              },
            ],
          },
        },
      },
    ]
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(searchOperatorState, [mockHealthySearchOperator])
        }}
      >
        <MemoryRouter>
          <MockedProvider mocks={mocks}>
            <VirtualMachinesPage />
          </MockedProvider>
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForNocks([metricNock])
    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the table has rendered with virtual machine 1 data
    await waitFor(() => expect(screen.queryByText('testVM1')).toBeTruthy()) // name
    await waitFor(() => expect(screen.queryByText('Running')).toBeTruthy()) // status
    await waitFor(() => expect(screen.queryByText('managed-cluster-1')).toBeTruthy()) // cluster
    await waitFor(() => expect(screen.queryByText('vmi-node-1')).toBeTruthy()) // node
    await waitFor(() => expect(screen.queryByText('1.1.1.1')).toBeTruthy()) // ip address

    // Test that the table has rendered with virtual machine 2 data
    await waitFor(() => expect(screen.queryByText('testVM2')).toBeTruthy()) // name
    await waitFor(() => expect(screen.queryByText('Stopped')).toBeTruthy()) // status
    await waitFor(() => expect(screen.queryByText('managed-cluster-2')).toBeTruthy()) // cluster
  })

  it('should render page with search unavailable empty state', async () => {
    const metricNock = nockPostRequest('/metrics?virtual-machines', {})
    const mocks = [
      {
        request: {
          query: SearchResultItemsDocument,
          variables: {
            input: [
              {
                keywords: [],
                filters: [
                  {
                    property: 'kind',
                    values: ['VirtualMachine', 'VirtualMachineInstance'],
                  },
                ],
                limit: -1,
              },
            ],
          },
        },
        result: {
          data: {},
          errors: [new GraphQLError('Error getting search data')],
        },
      },
    ]
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(searchOperatorState, [mockUNHealthySearchOperator])
        }}
      >
        <MemoryRouter>
          <MockedProvider mocks={mocks}>
            <VirtualMachinesPage />
          </MockedProvider>
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForNocks([metricNock])
    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the component has rendered errors correctly
    await waitFor(() => expect(screen.queryByText('Unable to display virtual machines')).toBeTruthy())
    await waitFor(() =>
      expect(
        screen.queryByText('To view managed virtual machines, you must enable the Red Hat Advanced Cluster Management.')
      ).toBeTruthy()
    )
  })

  it('should render page with errors', async () => {
    const metricNock = nockPostRequest('/metrics?virtual-machines', {})
    const mocks = [
      {
        request: {
          query: SearchResultItemsDocument,
          variables: {
            input: [
              {
                keywords: [],
                filters: [
                  {
                    property: 'kind',
                    values: ['VirtualMachine', 'VirtualMachineInstance'],
                  },
                ],
                limit: -1,
              },
            ],
          },
        },
        result: {
          data: {},
          errors: [new GraphQLError('Error getting search data')],
        },
      },
    ]
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(searchOperatorState, [mockHealthySearchOperator])
        }}
      >
        <MemoryRouter>
          <MockedProvider mocks={mocks}>
            <VirtualMachinesPage />
          </MockedProvider>
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForNocks([metricNock])
    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the component has rendered errors correctly
    await waitFor(() => expect(screen.queryByText('Error querying for VirtualMachines')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Error occurred while contacting the search service.')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Error getting search data')).toBeTruthy())
  })
})
