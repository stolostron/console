/* Copyright Contributors to the Open Cluster Management project */

import { summarize, summary } from '.'

const control = {
  active: {
    clusterLabelsList: [{ id: 0, labelName: 'name', labelValue: 'local-cluster', validValue: true }],
    mode: true,
  },
  type: 'custom',
}
const mockSummary: string[] = []

describe('ClusterSelector', () => {
  describe('summarize', () => {
    test('summarize should render the expected strings', () => {
      expect(summarize(control, mockSummary)).toEqual(undefined)
    })
  })
  describe('summary', () => {
    test('summarize should render the expected strings', () => {
      expect(summary(control)).toEqual([{ desc: 'name=local-cluster', term: 'Selector labels' }])
    })
  })
})
