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
  const res = GetRowActions('pod', 'kind:Pod', false, () => {}, t)
  expect(res).toMatchSnapshot()
})

test('Correctly return empty row Actions for restricted resource', () => {
  const res = GetRowActions('cluster', 'kind:Cluster', false, () => {}, t)
  expect(res).toMatchSnapshot()
})
