// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { render, screen, waitFor } from '@testing-library/react'
import ArgoAppDetailsContainer from './ArgoAppDetailsContainer'

const t = (string) => {
  return string
}
window.open = () => {} // provide an empty implementation for window.open

describe('ArgoAppDetailsContainer with no apps', () => {
  const mockData = {
    argoAppList: [],
    argoAppDetailsContainerControl: {
      argoAppDetailsContainerData: {
        page: 1,
        startIdx: 0,
        argoAppSearchToggle: false,
        expandSectionToggleMap: new Set(),
        selected: undefined,
        selectedArgpAppList: [],
        isLoading: false,
      },
      handleArgoAppDetailsContainerUpdate: jest.fn(),
      handleErrorMsg: jest.fn(),
    },
  }
  let container
  beforeEach(async () => {
    ;({ container } = render(
      <ArgoAppDetailsContainer
        argoAppList={mockData.argoAppList}
        t={t}
        argoAppDetailsContainerControl={mockData.argoAppDetailsContainerControl}
        hubClusterName="local-cluster"
      />
    ))

    await waitFor(() => container.querySelector(`input[placeholder="Find application"]`))
  })
  it('renders as expected', async () => {
    expect(
      screen.getByRole('combobox', {
        name: 'Type to filter',
      })
    ).toBeTruthy()
  })
})

describe('ArgoAppDetailsContainer with no apps', () => {
  const mockData = {
    argoAppList: [
      {
        name: 'test1',
        cluster: 'local-cluster',
        namespace: 'ns1',
        destinationCluster: 'cluster1',
        detinationNamespace: 'test1-ns',
      },
      {
        name: 'test2',
        cluster: 'local-cluster',
        namespace: 'ns2',
        destinationCluster: 'cluster2',
        detinationNamespace: 'test2-ns',
      },
    ],
    argoAppDetailsContainerControl: {
      argoAppDetailsContainerData: {
        page: 1,
        startIdx: 0,
        argoAppSearchToggle: false,
        expandSectionToggleMap: new Set(),
        selected: undefined,
        selectedArgpAppList: [],
        isLoading: false,
      },
      handleArgoAppDetailsContainerUpdate: jest.fn(),
      handleErrorMsg: jest.fn(),
    },
  }

  let container
  beforeEach(async () => {
    ;({ container } = render(
      <ArgoAppDetailsContainer
        argoAppList={mockData.argoAppList}
        t={t}
        argoAppDetailsContainerControl={mockData.argoAppDetailsContainerControl}
        hubClusterName="local-cluster"
      />
    ))

    await waitFor(() => container.querySelector(`input[placeholder="Find application"]`))
  })

  it('renders as expected', () => {
    expect(screen.getByText('test1')).toBeTruthy()
    expect(screen.getByText('test2')).toBeTruthy()
  })
})

describe('ArgoAppDetailsContainer test functions', () => {
  const mockData = {
    argoAppList: [
      {
        name: 'test1',
        cluster: 'local-cluster',
        namespace: 'ns1',
        destinationCluster: 'cluster1',
        detinationNamespace: 'test1-ns',
      },
      {
        name: 'test2',
        cluster: 'local-cluster',
        namespace: 'ns2',
        destinationCluster: 'cluster2',
        detinationNamespace: 'test2-ns',
      },
    ],
    argoAppDetailsContainerControl: {
      argoAppDetailsContainerData: {
        page: 1,
        startIdx: 0,
        argoAppSearchToggle: false,
        expandSectionToggleMap: new Set(),
        selected: undefined,
        selectedArgpAppList: [],
        isLoading: false,
      },
      handleArgoAppDetailsContainerUpdate: jest.fn(),
      handleErrorMsg: jest.fn(),
    },
  }

  let container
  let instance
  beforeEach(async () => {
    ;({ container } = render(
      <ArgoAppDetailsContainer
        argoAppList={mockData.argoAppList}
        t={t}
        argoAppDetailsContainerControl={mockData.argoAppDetailsContainerControl}
        ref={(node) => {
          instance = node
        }}
        hubClusterName="local-cluster"
      />
    ))

    await waitFor(() => container.querySelector(`input[placeholder="Find application"]`))
  })

  it('works as expected', () => {
    Object.prototype.toString.call(instance.toggleLinkLoading())
    Object.prototype.toString.call(instance.handleExpandSectionToggle(0))
    Object.prototype.toString.call(instance.handleSelection('test1'))
    Object.prototype.toString.call(instance.handleSelection(undefined))
    Object.prototype.toString.call(instance.handleSelectToggle())
    Object.prototype.toString.call(instance.handleSelectionClear())
    Object.prototype.toString.call(instance.handleFirstClick())
    Object.prototype.toString.call(instance.handleLastClick())
    Object.prototype.toString.call(instance.handleNextClick({}, 1))
    Object.prototype.toString.call(instance.handlePreviousClick({}, 1))
    Object.prototype.toString.call(instance.handlePageInput({}, 1))
    Object.prototype.toString.call(
      instance.handleKeyPress(
        {
          action: 'open_link',
          targetLink: 'https://test',
        },
        {
          key: 'Enter',
        }
      )
    )
    Object.prototype.toString.call(
      instance.handleKeyPress(
        {
          action: 'open_link',
          targetLink: 'https://test',
        },
        {
          key: 'Any',
        }
      )
    )
  })
})
