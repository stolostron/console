// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { render, screen, waitFor } from '@testing-library/react'
import ClusterDetailsContainer from './ClusterDetailsContainer'
import { ClusterDetailsContainerControl, ClusterData } from '../types'

const t = (string: string): string => {
  return string
}

window.open = () => null // provide an empty implementation for window.open

describe('ClusterDetailsContainer with no clusters', () => {
  const mockData: {
    clusterID: string
    clusters: ClusterData[]
    clusterDetailsContainerControl: ClusterDetailsContainerControl
  } = {
    clusterID: 'cluster1',
    clusters: [],
    clusterDetailsContainerControl: {
      clusterDetailsContainerData: {
        page: 1,
        startIdx: 0,
        clusterSearchToggle: false,
        isSelectOpen: false,
        expandSectionToggleMap: new Set(),
        selectedClusterList: [],
      },
      handleClusterDetailsContainerUpdate: jest.fn(),
    },
  }
  let container: HTMLElement
  beforeEach(async () => {
    ;({ container } = render(
      <ClusterDetailsContainer
        clusterList={mockData.clusters}
        t={t}
        clusterDetailsContainerControl={mockData.clusterDetailsContainerControl}
        clusterID={mockData.clusterID}
      />
    ))

    await waitFor(() => container.querySelector(`input[placeholder="Find cluster"]`))
  })

  it('renders as expected', () => {
    expect(
      screen.getByRole('combobox', {
        name: 'Type to filter',
      })
    ).toBeTruthy()
  })
})

describe('ClusterDetailsContainer with some clusters', () => {
  const mockData: {
    clusterID: string
    clusters: ClusterData[]
    clusterDetailsContainerControl: ClusterDetailsContainerControl
  } = {
    clusterID: 'cluster1',
    clusters: [
      {
        cpu: '12',
        memory: '23308Mi',
        name: 'argo-fxiang-eks',
        namespace: 'argo-fxiang-eks',
        status: 'ok',
      },
      {
        allocatable: { cpu: '11580m', memory: '20056Mi' },
        capacity: { cpu: '12', memory: '23308Mi' },
        metadata: {
          name: 'fxiang-eks',
          namespace: 'fxiang-eks',
        },
        status: 'ok',
      },
      {
        allocatable: { cpu: '33', memory: '137847Mi' },
        capacity: { cpu: '36', memory: '144591Mi' },
        consoleURL: 'https://console-openshift-console.apps.vbirsan1-remote.dev06.red-chesterfield.com',
        metadata: {
          name: 'vbirsan1-remote',
          namespace: 'vbirsan1-remote',
        },
        status: 'ok',
      },
    ],
    clusterDetailsContainerControl: {
      clusterDetailsContainerData: {
        page: 1,
        startIdx: 0,
        clusterSearchToggle: false,
        isSelectOpen: false,
        expandSectionToggleMap: new Set(),
        selectedClusterList: [],
      },
      handleClusterDetailsContainerUpdate: jest.fn(),
    },
  }

  let container: HTMLElement
  beforeEach(async () => {
    ;({ container } = render(
      <ClusterDetailsContainer
        clusterList={mockData.clusters}
        t={t}
        clusterDetailsContainerControl={mockData.clusterDetailsContainerControl}
        clusterID={mockData.clusterID}
      />
    ))

    await waitFor(() => container.querySelector(`input[placeholder="Find cluster"]`))
  })

  it('renders as expected', () => {
    expect(screen.getAllByText('argo-fxiang-eks')).toBeTruthy()
  })
})

describe('ClusterDetailsContainer test functions', () => {
  const mockData: {
    clusterID: string
    clusters: ClusterData[]
    clusterDetailsContainerControl: ClusterDetailsContainerControl
  } = {
    clusterID: 'mycluster',
    clusters: [
      {
        allocatable: { cpu: '11580m', memory: '20056Mi' },
        capacity: { cpu: '12', memory: '23308Mi' },
        metadata: {
          name: 'fxiang-eks',
          namespace: 'fxiang-eks',
        },
        status: 'ok',
      },
      {
        allocatable: { cpu: '33', memory: '137847Mi' },
        capacity: { cpu: '36', memory: '144591Mi' },
        consoleURL: 'https://console-openshift-console.apps.vbirsan1-remote.dev06.red-chesterfield.com',
        metadata: {
          name: 'vbirsan1-remote',
          namespace: 'vbirsan1-remote',
        },
        status: 'ok',
      },
    ],
    clusterDetailsContainerControl: {
      clusterDetailsContainerData: {
        page: 1,
        startIdx: 0,
        clusterSearchToggle: false,
        isSelectOpen: false,
        expandSectionToggleMap: new Set(),
        selectedClusterList: [],
      },
      handleClusterDetailsContainerUpdate: jest.fn(),
    },
  }

  let container: HTMLElement
  beforeEach(async () => {
    ;({ container } = render(
      <ClusterDetailsContainer
        clusterList={mockData.clusters}
        t={t}
        clusterDetailsContainerControl={mockData.clusterDetailsContainerControl}
        clusterID={mockData.clusterID}
      />
    ))

    await waitFor(() => container.querySelector(`input[placeholder="Find cluster"]`))
  })

  it('renders cluster search and accordion', () => {
    expect(container.querySelector(`input[placeholder="Find cluster"]`)).toBeTruthy()
    expect(container.querySelector('.clusterDetails')).toBeTruthy()
  })
})
