/* Copyright Contributors to the Open Cluster Management project */

import { repositoryTypeToSource } from './SourceSelector'

describe('Source Selector', () => {
  describe('repositoryTypeToSource', () => {
    test('repositoryTypeToSource should render the expected output for git', () => {
      expect(repositoryTypeToSource('Git')).toEqual({
        repoURL: '',
        targetRevision: '',
        path: '',
      })
    })

    test('repositoryTypeToSource should render the expected output for helm', () => {
      expect(repositoryTypeToSource('Helm')).toEqual({
        repoURL: '',
        chart: '',
        targetRevision: '',
      })
    })

    test('repositoryTypeToSource should render the expected output for other values', () => {
      expect(repositoryTypeToSource('any')).toEqual('any')
    })
  })
})
