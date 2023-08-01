/* Copyright Contributors to the Open Cluster Management project */

import { repositoryTypeToSource, sourceToRepositoryType } from './SourceSelector'

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
  describe('sourceToRepositoryType', () => {
    test('sourceToRepositoryType should render the expected output for Git', () => {
      expect(
        sourceToRepositoryType({
          repoURL: 'test.com',
          path: 'abc',
          targetRevision: 'efg',
        })
      ).toEqual('Git')
    })
    test('sourceToRepositoryType should render the expected output for Helm', () => {
      expect(
        sourceToRepositoryType({
          repoURL: 'test.com',
          chart: 'abc',
          targetRevision: 'efg',
        })
      ).toEqual('Helm')
    })
    test('sourceToRepositoryType should render the expected output for other values', () => {
      expect(sourceToRepositoryType('any')).toEqual(undefined)
    })
  })
})
