/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockSearch } from '~/lib/nock-util'
import { waitForNocks } from '~/lib/test-util'
import { isGlobalHubState, Settings, settingsState } from '../../../atoms'
import HeaderWithNotification from './HeaderWithNotification'

test('renders without search disabled message', async () => {
  const searchIsDisabledMock = nockSearch(
    {
      operationName: 'searchResult',
      variables: {
        input: [
          {
            filters: [
              {
                property: 'kind',
                values: ['Cluster'],
              },
              {
                property: 'addon',
                values: ['search-collector=false'],
              },
              {
                property: 'label',
                values: ['!local-cluster=true'],
              },
            ],
          },
        ],
      },
      query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}',
    },
    {
      data: {
        searchResult: [{ items: [] }],
      },
    }
  )
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <HeaderWithNotification />
      </MemoryRouter>
    </RecoilRoot>
  )
  await waitForNocks([searchIsDisabledMock])
  expect(baseElement).toMatchSnapshot()
})

test('renders with search disabled message', async () => {
  const searchIsNotDisabledMock = nockSearch(
    {
      operationName: 'searchResult',
      variables: {
        input: [
          {
            filters: [
              {
                property: 'kind',
                values: ['Cluster'],
              },
              {
                property: 'addon',
                values: ['search-collector=false'],
              },
              {
                property: 'label',
                values: ['!local-cluster=true'],
              },
            ],
          },
        ],
      },
      query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}',
    },
    {
      data: {
        searchResult: [
          {
            items: [
              {
                _uid: 'test-cluster',
                kind: 'cluster',
                name: 'test-cluster',
                apigroup: 'internal.open-cluster-management.io',
                label:
                  'cloud=Amazon; cluster.open-cluster-management.io/clusterset=hub; clusterID=70ebe797-4791-4958-be17-f088411a0db5; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-work-manager=available; installer.name=multiclusterhub; installer.namespace=open-cluster-management; name=test-cluster; openshiftVersion=4.11.0-fc.3; velero.io/exclude-from-backup=true; vendor=OpenShift',
                ManagedClusterImportSucceeded: 'True',
                HubAcceptedManagedCluster: 'True',
                ManagedClusterConditionAvailable: 'True',
                created: '2022-07-08T13:02:56Z',
                cpu: 36,
                kubernetesVersion: 'v1.24.0+284d62a',
                memory: '144758296Ki',
                ManagedClusterJoined: 'True',
                addon:
                  'application-manager=true; cert-policy-controller=true; policy-controller=true; search-collector=false',
                consoleURL: 'https://console-openshift-console.apps.cs-aws-411-7cwgp.dev02.red-chesterfield.com',
                status: 'OK',
                ClusterCertificateRotated: 'True',
              },
            ],
          },
        ],
      },
    }
  )
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <HeaderWithNotification />
      </MemoryRouter>
    </RecoilRoot>
  )
  await waitForNocks([searchIsNotDisabledMock])
  expect(baseElement).toMatchSnapshot()
})

test('renders with Global Search alert & no message', async () => {
  const mockSettings: Settings = {
    globalSearchFeatureFlag: 'enabled',
  }
  const searchIsNotDisabledMock = nockSearch(
    {
      operationName: 'searchResult',
      variables: {
        input: [
          {
            filters: [
              {
                property: 'kind',
                values: ['Cluster'],
              },
              {
                property: 'addon',
                values: ['search-collector=false'],
              },
              {
                property: 'label',
                values: ['!local-cluster=true'],
              },
            ],
          },
        ],
      },
      query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}',
    },
    {
      data: {
        searchResult: [{ items: [] }],
      },
    }
  )
  const { baseElement } = render(
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(isGlobalHubState, true)
        snapshot.set(settingsState, mockSettings)
      }}
    >
      <MemoryRouter>
        <HeaderWithNotification />
      </MemoryRouter>
    </RecoilRoot>
  )
  await waitForNocks([searchIsNotDisabledMock])
  expect(baseElement).toMatchSnapshot()
})
