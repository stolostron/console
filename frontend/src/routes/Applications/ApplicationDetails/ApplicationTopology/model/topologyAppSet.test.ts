/* Copyright Contributors to the Open Cluster Management project */

import { nockSearch } from '../../../../../lib/nock-util'
import { openArgoCDEditor } from './topologyAppSet'
import i18next, { TFunction } from 'i18next'

const t: TFunction = i18next.t.bind(i18next)

describe('openArgoCDEditor remote cluster', () => {
  const mockSearchQuery = {
    operationName: 'searchResultItemsAndRelatedItems',
    variables: {
      input: [
        {
          keywords: [],
          filters: [
            { property: 'kind', values: ['route'] },
            { property: 'namespace', values: ['app1-ns'] },
            { property: 'cluster', values: ['cluster1'] },
            { property: 'label', values: ['app.kubernetes.io/part-of=argocd'] },
          ],
          relatedKinds: [],
        },
      ],
    },
    query:
      'query searchResultItemsAndRelatedItems($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n    related {\n      kind\n      items\n      __typename\n    }\n    __typename\n  }\n}',
  }
  beforeEach(async () => {
    nockSearch(mockSearchQuery, { data: {} })
  })
  it('can open link on remote cluster', () => {
    expect(openArgoCDEditor('cluster1', 'app1-ns', 'app1', () => {}, t, 'local-cluster')).toEqual(undefined)
  })
})
