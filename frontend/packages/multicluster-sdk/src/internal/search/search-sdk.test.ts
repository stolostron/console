/* Copyright Contributors to the Open Cluster Management project */

import { MockedProvider } from '@apollo/client/testing'
import { renderHook } from '@testing-library/react-hooks'
import { waitFor } from '@testing-library/react'
import { GraphQLError } from 'graphql'
import React from 'react'
import {
  GetMessagesDocument,
  SearchCompleteDocument,
  SearchResultCountDocument,
  SearchResultItemsAndRelatedItemsDocument,
  SearchResultItemsDocument,
  SearchResultRelatedCountDocument,
  SearchResultRelatedItemsDocument,
  SearchSchemaDocument,
  useGetMessagesQuery,
  useSearchCompleteQuery,
  useSearchResultCountQuery,
  useSearchResultItemsAndRelatedItemsQuery,
  useSearchResultItemsQuery,
  useSearchResultRelatedCountQuery,
  useSearchResultRelatedItemsQuery,
  useSearchSchemaQuery,
  useSearchSchemaLazyQuery,
} from './search-sdk'

// Helper function to create wrapper with MockedProvider
const createWrapper = (mocks: any[] = []) => {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(MockedProvider, { mocks, addTypename: false }, children)
}

describe('search-sdk', () => {
  describe('useSearchSchemaQuery', () => {
    it('should return loading state initially', async () => {
      const mocks = [
        {
          request: {
            query: SearchSchemaDocument,
            variables: {},
          },
          result: {
            data: {
              searchSchema: {
                properties: {
                  kind: { type: 'string' },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
      ]

      const { result } = renderHook(() => useSearchSchemaQuery(), {
        wrapper: createWrapper(mocks),
      })

      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBeUndefined()
      expect(result.current.data).toBeUndefined()

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data?.searchSchema).toBeDefined()
      expect(result.current.error).toBeUndefined()
    })

    it('should handle errors', async () => {
      const mocks = [
        {
          request: {
            query: SearchSchemaDocument,
            variables: {},
          },
          result: {
            errors: [new GraphQLError('Schema error')],
          },
        },
      ]

      const { result } = renderHook(() => useSearchSchemaQuery(), {
        wrapper: createWrapper(mocks),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeDefined()
      expect(result.current.data).toBeUndefined()
    })

    it('should accept query variables', async () => {
      const query = {
        filters: [{ property: 'kind', values: ['Pod'] }],
      }

      const mocks = [
        {
          request: {
            query: SearchSchemaDocument,
            variables: { query },
          },
          result: {
            data: {
              searchSchema: {
                properties: {
                  kind: { type: 'string' },
                },
              },
            },
          },
        },
      ]

      const { result } = renderHook(() => useSearchSchemaQuery({ variables: { query } }), {
        wrapper: createWrapper(mocks),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data?.searchSchema).toBeDefined()
      expect(result.current.error).toBeUndefined()
    })
  })

  describe('useSearchCompleteQuery', () => {
    it('should return completion suggestions', async () => {
      const variables = {
        property: 'name',
        limit: 10,
      }

      const mocks = [
        {
          request: {
            query: SearchCompleteDocument,
            variables,
          },
          result: {
            data: {
              searchComplete: ['nginx', 'redis', 'postgres'],
            },
          },
        },
      ]

      const { result } = renderHook(() => useSearchCompleteQuery({ variables }), {
        wrapper: createWrapper(mocks),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data?.searchComplete).toEqual(['nginx', 'redis', 'postgres'])
      expect(result.current.error).toBeUndefined()
    })

    it('should handle completion errors', async () => {
      const variables = {
        property: 'invalid',
        limit: 10,
      }

      const mocks = [
        {
          request: {
            query: SearchCompleteDocument,
            variables,
          },
          result: {
            errors: [new GraphQLError('Invalid property')],
          },
        },
      ]

      const { result } = renderHook(() => useSearchCompleteQuery({ variables }), {
        wrapper: createWrapper(mocks),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeDefined()
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('useSearchResultItemsQuery', () => {
    it('should return search result items', async () => {
      const variables = {
        input: [
          {
            filters: [{ property: 'kind', values: ['Pod'] }],
            limit: 100,
          },
        ],
      }

      const mockItems = [
        { kind: 'Pod', name: 'nginx-1', namespace: 'default' },
        { kind: 'Pod', name: 'nginx-2', namespace: 'default' },
      ]

      const mocks = [
        {
          request: {
            query: SearchResultItemsDocument,
            variables,
          },
          result: {
            data: {
              searchResult: [
                {
                  items: mockItems,
                },
              ],
            },
          },
        },
      ]

      const { result } = renderHook(() => useSearchResultItemsQuery({ variables }), {
        wrapper: createWrapper(mocks),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data?.searchResult?.[0]?.items).toEqual(mockItems)
      expect(result.current.error).toBeUndefined()
    })
  })

  describe('useSearchResultCountQuery', () => {
    it('should return search result count', async () => {
      const variables = {
        input: [
          {
            filters: [{ property: 'kind', values: ['Pod'] }],
          },
        ],
      }

      const mocks = [
        {
          request: {
            query: SearchResultCountDocument,
            variables,
          },
          result: {
            data: {
              searchResult: [
                {
                  count: 42,
                },
              ],
            },
          },
        },
      ]

      const { result } = renderHook(() => useSearchResultCountQuery({ variables }), {
        wrapper: createWrapper(mocks),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data?.searchResult?.[0]?.count).toBe(42)
      expect(result.current.error).toBeUndefined()
    })
  })

  describe('useSearchResultRelatedCountQuery', () => {
    it('should return related resource counts', async () => {
      const variables = {
        input: [
          {
            filters: [{ property: 'kind', values: ['Deployment'] }],
            relatedKinds: ['Pod', 'ReplicaSet'],
          },
        ],
      }

      const mocks = [
        {
          request: {
            query: SearchResultRelatedCountDocument,
            variables,
          },
          result: {
            data: {
              searchResult: [
                {
                  related: [
                    { kind: 'Pod', count: 3 },
                    { kind: 'ReplicaSet', count: 1 },
                  ],
                },
              ],
            },
          },
        },
      ]

      const { result } = renderHook(() => useSearchResultRelatedCountQuery({ variables }), {
        wrapper: createWrapper(mocks),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const related = result.current.data?.searchResult?.[0]?.related
      expect(related).toHaveLength(2)
      expect(related?.[0]).toEqual({ kind: 'Pod', count: 3 })
      expect(related?.[1]).toEqual({ kind: 'ReplicaSet', count: 1 })
      expect(result.current.error).toBeUndefined()
    })
  })

  describe('useSearchResultItemsAndRelatedItemsQuery', () => {
    it('should return both items and related items', async () => {
      const variables = {
        input: [
          {
            filters: [{ property: 'kind', values: ['Deployment'] }],
            relatedKinds: ['Pod'],
          },
        ],
      }

      const mockItems = [{ kind: 'Deployment', name: 'nginx', namespace: 'default' }]
      const mockRelatedItems = [
        { kind: 'Pod', name: 'nginx-1', namespace: 'default' },
        { kind: 'Pod', name: 'nginx-2', namespace: 'default' },
      ]

      const mocks = [
        {
          request: {
            query: SearchResultItemsAndRelatedItemsDocument,
            variables,
          },
          result: {
            data: {
              searchResult: [
                {
                  items: mockItems,
                  related: [
                    {
                      kind: 'Pod',
                      items: mockRelatedItems,
                    },
                  ],
                },
              ],
            },
          },
        },
      ]

      const { result } = renderHook(() => useSearchResultItemsAndRelatedItemsQuery({ variables }), {
        wrapper: createWrapper(mocks),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const searchResult = result.current.data?.searchResult?.[0]
      expect(searchResult?.items).toEqual(mockItems)
      expect(searchResult?.related?.[0]?.kind).toBe('Pod')
      expect(searchResult?.related?.[0]?.items).toEqual(mockRelatedItems)
      expect(result.current.error).toBeUndefined()
    })
  })

  describe('useSearchResultRelatedItemsQuery', () => {
    it('should return related items only', async () => {
      const variables = {
        input: [
          {
            filters: [{ property: 'kind', values: ['Deployment'] }],
            relatedKinds: ['Pod', 'Service'],
          },
        ],
      }

      const mocks = [
        {
          request: {
            query: SearchResultRelatedItemsDocument,
            variables,
          },
          result: {
            data: {
              searchResult: [
                {
                  related: [
                    {
                      kind: 'Pod',
                      items: [
                        { kind: 'Pod', name: 'nginx-1', namespace: 'default' },
                        { kind: 'Pod', name: 'nginx-2', namespace: 'default' },
                      ],
                    },
                    {
                      kind: 'Service',
                      items: [{ kind: 'Service', name: 'nginx-svc', namespace: 'default' }],
                    },
                  ],
                },
              ],
            },
          },
        },
      ]

      const { result } = renderHook(() => useSearchResultRelatedItemsQuery({ variables }), {
        wrapper: createWrapper(mocks),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const related = result.current.data?.searchResult?.[0]?.related
      expect(related).toHaveLength(2)
      expect(related?.[0]?.kind).toBe('Pod')
      expect(related?.[0]?.items).toHaveLength(2)
      expect(related?.[1]?.kind).toBe('Service')
      expect(related?.[1]?.items).toHaveLength(1)
      expect(result.current.error).toBeUndefined()
    })
  })

  describe('useGetMessagesQuery', () => {
    it('should return messages', async () => {
      const mockMessages = [
        {
          id: 'search-001',
          kind: 'information',
          description: 'Search service is running',
        },
        {
          id: 'search-002',
          kind: 'warning',
          description: 'Some clusters are not responding',
        },
      ]

      const mocks = [
        {
          request: {
            query: GetMessagesDocument,
            variables: {},
          },
          result: {
            data: {
              messages: mockMessages,
            },
          },
        },
      ]

      const { result } = renderHook(() => useGetMessagesQuery(), {
        wrapper: createWrapper(mocks),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data?.messages).toEqual(mockMessages)
      expect(result.current.error).toBeUndefined()
    })

    it('should handle message errors', async () => {
      const mocks = [
        {
          request: {
            query: GetMessagesDocument,
            variables: {},
          },
          result: {
            errors: [new GraphQLError('Failed to retrieve messages')],
          },
        },
      ]

      const { result } = renderHook(() => useGetMessagesQuery(), {
        wrapper: createWrapper(mocks),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeDefined()
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('Lazy query hooks', () => {
    it('should not execute lazy queries immediately', () => {
      const mocks = [
        {
          request: {
            query: SearchSchemaDocument,
            variables: {},
          },
          result: {
            data: {
              searchSchema: { properties: {} },
            },
          },
        },
      ]

      const { result } = renderHook(
        () => {
          const [executeQuery, queryResult] = useSearchSchemaLazyQuery()
          return { executeQuery, queryResult }
        },
        {
          wrapper: createWrapper(mocks),
        }
      )

      // Lazy query should not be called initially
      expect(result.current.queryResult.loading).toBe(false)
      expect(result.current.queryResult.called).toBe(false)
      expect(result.current.queryResult.data).toBeUndefined()
    })
  })

  describe('Error handling', () => {
    it('should handle network errors gracefully', async () => {
      const mocks = [
        {
          request: {
            query: SearchResultItemsDocument,
            variables: { input: [] },
          },
          error: new Error('Network error'),
        },
      ]

      const { result } = renderHook(() => useSearchResultItemsQuery({ variables: { input: [] } }), {
        wrapper: createWrapper(mocks),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeDefined()
      expect(result.current.error?.message).toBe('Network error')
      expect(result.current.data).toBeUndefined()
    })

    it('should handle partial errors with data', async () => {
      const mocks = [
        {
          request: {
            query: SearchResultItemsDocument,
            variables: { input: [] },
          },
          result: {
            data: {
              searchResult: [{ items: [] }],
            },
            errors: [new GraphQLError('Partial error')],
          },
        },
      ]

      const { result } = renderHook(() => useSearchResultItemsQuery({ variables: { input: [] }, errorPolicy: 'all' }), {
        wrapper: createWrapper(mocks),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // With errorPolicy: 'all', Apollo Client should return both data and errors for partial failures
      expect(result.current.data).toBeDefined()
      expect(result.current.error).toBeDefined()
    })
  })
})
