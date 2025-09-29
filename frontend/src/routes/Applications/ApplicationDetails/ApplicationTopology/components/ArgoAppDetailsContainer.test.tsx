// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { render, screen, waitFor } from '@testing-library/react'
import ArgoAppDetailsContainer from './ArgoAppDetailsContainer'
import type { ArgoApp, ArgoAppDetailsContainerControl } from '../types'

const t = (string: string): string => {
  return string
}
window.open = (): Window | null => null // provide an empty implementation for window.open

describe('ArgoAppDetailsContainer with no apps', () => {
  const mockData: {
    argoAppList: ArgoApp[]
    argoAppDetailsContainerControl: ArgoAppDetailsContainerControl
  } = {
    argoAppList: [],
    argoAppDetailsContainerControl: {
      argoAppDetailsContainerData: {
        page: 1,
        startIdx: 0,
        argoAppSearchToggle: false,
        expandSectionToggleMap: new Set<number>(),
        selected: undefined,
        selectedArgoAppList: [],
        isLoading: false,
      },
      handleArgoAppDetailsContainerUpdate: jest.fn(),
      handleErrorMsg: jest.fn(),
    },
  }
  let container: HTMLElement
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

describe('ArgoAppDetailsContainer with apps', () => {
  const mockData: {
    argoAppList: ArgoApp[]
    argoAppDetailsContainerControl: ArgoAppDetailsContainerControl
  } = {
    argoAppList: [
      {
        name: 'test1',
        cluster: 'local-cluster',
        namespace: 'ns1',
        destinationName: 'cluster1',
        destinationNamespace: 'test1-ns',
        healthStatus: 'Healthy',
      },
      {
        name: 'test2',
        cluster: 'local-cluster',
        namespace: 'ns2',
        destinationName: 'cluster2',
        destinationNamespace: 'test2-ns',
        healthStatus: 'Healthy',
      },
    ],
    argoAppDetailsContainerControl: {
      argoAppDetailsContainerData: {
        page: 1,
        startIdx: 0,
        argoAppSearchToggle: false,
        expandSectionToggleMap: new Set<number>(),
        selected: undefined,
        selectedArgoAppList: [],
        isLoading: false,
      },
      handleArgoAppDetailsContainerUpdate: jest.fn(),
      handleErrorMsg: jest.fn(),
    },
  }

  let container: HTMLElement
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
  const mockData: {
    argoAppList: ArgoApp[]
    argoAppDetailsContainerControl: ArgoAppDetailsContainerControl
  } = {
    argoAppList: [
      {
        name: 'test1',
        cluster: 'local-cluster',
        namespace: 'ns1',
        destinationName: 'cluster1',
        destinationNamespace: 'test1-ns',
        healthStatus: 'Healthy',
      },
      {
        name: 'test2',
        cluster: 'local-cluster',
        namespace: 'ns2',
        destinationName: 'cluster2',
        destinationNamespace: 'test2-ns',
        healthStatus: 'Healthy',
      },
    ],
    argoAppDetailsContainerControl: {
      argoAppDetailsContainerData: {
        page: 1,
        startIdx: 0,
        argoAppSearchToggle: false,
        expandSectionToggleMap: new Set<number>(),
        selected: undefined,
        selectedArgoAppList: [],
        isLoading: false,
      },
      handleArgoAppDetailsContainerUpdate: jest.fn(),
      handleErrorMsg: jest.fn(),
    },
  }

  let container: HTMLElement
  let instance: ArgoAppDetailsContainer
  beforeEach(async () => {
    ;({ container } = render(
      <ArgoAppDetailsContainer
        argoAppList={mockData.argoAppList}
        t={t}
        argoAppDetailsContainerControl={mockData.argoAppDetailsContainerControl}
        ref={(node: ArgoAppDetailsContainer | null) => {
          if (node) {
            instance = node
          }
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
