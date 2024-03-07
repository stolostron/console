// Copyright (c) 2023 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import i18next from 'i18next'
import { GetRowActions } from './utils'

const mockHistoryPush = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}))

const t = i18next.t.bind(i18next)

test('Correctly return row Actions', () => {
  const res = GetRowActions('Pod', 'kind:Pod', false, () => {}, t)
  res[0].click({ kind: 'Pod' }) // edit resource
  res[1].click({ kind: 'Pod' }) // view related resources
  res[2].click({ kind: 'Pod' }) // delete resource
  expect(res).toMatchSnapshot()
})

test('Correctly return empty row Actions for restricted resource', () => {
  const res = GetRowActions('Cluster', 'kind:Cluster', false, () => {}, t)
  expect(res).toMatchSnapshot()
})

test('Correctly return empty row Actions for Application', () => {
  const res = GetRowActions('Application', 'kind:Application', false, () => {}, t)
  res[0].click({
    apigroup: 'app.k8s.io',
    kind: 'Application',
    cluster: 'local-cluster',
    name: 'testApp',
    namespace: 'testAppNs',
  }) // edit app
  res[1].click({
    apigroup: 'app.k8s.io',
    kind: 'Application',
    cluster: 'local-cluster',
    name: 'testApp',
    namespace: 'testAppNs',
  }) // view app topology
  expect(res).toMatchSnapshot()
})
