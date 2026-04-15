/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react-hooks'
import { IResource } from '../../resources'
import { useFetchApplicationLabels } from './useFetchApplicationLabels'

jest.mock('./utils', () => ({
  isOCPAppResource: (resource: IResource) => 'label' in resource && typeof (resource as any).label === 'string',
  getLabels: (resource: any): Record<string, string> => {
    if ('label' in resource && typeof resource.label === 'string') {
      const labelStr: string = resource.label
      return (
        labelStr.split(';').reduce(
          (acc: Record<string, string>, label: string) => {
            const trimmed = label.trim()
            const eqIndex = trimmed.indexOf('=')
            return eqIndex === -1
              ? acc
              : { ...acc, [trimmed.slice(0, eqIndex).trim()]: trimmed.slice(eqIndex + 1).trim() }
          },
          {} as Record<string, string>
        ) ?? {}
      )
    }
    return resource.metadata?.labels ?? {}
  },
}))

const createOCPApp = (id: string, label: string): IResource & { id: string; label: string } => ({
  id,
  apiVersion: 'apps/v1',
  kind: 'deployment',
  metadata: { name: id, namespace: 'test-ns' },
  label,
})

describe('useFetchApplicationLabels', () => {
  it('returns undefined labelOptions and labelMap when applicationData is undefined', () => {
    const { result } = renderHook(() => useFetchApplicationLabels(undefined))
    expect(result.current.labelOptions).toBeUndefined()
    expect(result.current.labelMap).toBeUndefined()
  })

  it('returns empty labelOptions and labelMap when applicationData is empty', () => {
    const { result } = renderHook(() => useFetchApplicationLabels([]))
    expect(result.current.labelOptions).toEqual([])
    expect(result.current.labelMap).toEqual({})
  })

  it('processes non-OCP resources using metadata.labels', () => {
    const nonOCP: IResource[] = [
      {
        apiVersion: 'app.k8s.io/v1beta1',
        kind: 'Application',
        metadata: { name: 'app-0', namespace: 'ns-0' },
      },
    ]
    const { result } = renderHook(() => useFetchApplicationLabels(nonOCP))
    expect(result.current.labelOptions).toEqual([])
    expect(result.current.labelMap).toEqual({
      'ns-0/app-0': {
        pairs: {},
        labels: [],
      },
    })
  })

  it('builds labelMap and labelOptions from a single OCP resource', () => {
    const resources = [createOCPApp('res-1', 'app=myapp;tier=frontend')]
    const { result } = renderHook(() => useFetchApplicationLabels(resources))

    expect(result.current.labelMap).toEqual({
      'res-1': {
        pairs: { app: 'myapp', tier: 'frontend' },
        labels: ['app=myapp', 'tier=frontend'],
      },
    })
    expect(result.current.labelOptions).toHaveLength(2)
    expect(result.current.labelOptions).toEqual(
      expect.arrayContaining([
        { label: 'app=myapp', value: 'app=myapp' },
        { label: 'tier=frontend', value: 'tier=frontend' },
      ])
    )
  })

  it('deduplicates label options across multiple OCP resources', () => {
    const resources = [createOCPApp('res-1', 'app=myapp;tier=frontend'), createOCPApp('res-2', 'app=myapp;env=prod')]
    const { result } = renderHook(() => useFetchApplicationLabels(resources))

    expect(result.current.labelMap).toEqual({
      'res-1': {
        pairs: { app: 'myapp', tier: 'frontend' },
        labels: ['app=myapp', 'tier=frontend'],
      },
      'res-2': {
        pairs: { app: 'myapp', env: 'prod' },
        labels: ['app=myapp', 'env=prod'],
      },
    })
    expect(result.current.labelOptions).toHaveLength(3)
    expect(result.current.labelOptions).toEqual(
      expect.arrayContaining([
        { label: 'app=myapp', value: 'app=myapp' },
        { label: 'tier=frontend', value: 'tier=frontend' },
        { label: 'env=prod', value: 'env=prod' },
      ])
    )
  })

  it('trims label segments', () => {
    const resources = [createOCPApp('res-1', '  app = myapp  ;  tier = frontend  ')]
    const { result } = renderHook(() => useFetchApplicationLabels(resources))

    expect(result.current.labelMap).toEqual({
      'res-1': {
        pairs: { app: 'myapp', tier: 'frontend' },
        labels: ['app=myapp', 'tier=frontend'],
      },
    })
    expect(result.current.labelOptions).toHaveLength(2)
  })

  it('handles OCP resource with empty label', () => {
    const resources = [createOCPApp('res-1', '')]
    const { result } = renderHook(() => useFetchApplicationLabels(resources))

    expect(result.current.labelMap).toEqual({
      'res-1': {
        pairs: {},
        labels: [],
      },
    })
    expect(result.current.labelOptions).toEqual([])
  })

  it('updates when applicationData length changes', () => {
    const initial = [createOCPApp('res-1', 'app=one')]
    const { result, rerender } = renderHook((props: { data?: IResource[] }) => useFetchApplicationLabels(props.data), {
      initialProps: { data: initial },
    })

    expect(result.current.labelMap?.['res-1']?.labels).toEqual(['app=one'])

    const updated = [createOCPApp('res-1', 'app=one'), createOCPApp('res-2', 'app=two')]
    rerender({ data: updated })

    expect(result.current.labelMap).toEqual({
      'res-1': { pairs: { app: 'one' }, labels: ['app=one'] },
      'res-2': { pairs: { app: 'two' }, labels: ['app=two'] },
    })
    expect(result.current.labelOptions).toHaveLength(2)
  })

  it('does not update when applicationData reference changes but length is same', () => {
    const first = [createOCPApp('res-1', 'app=one')]
    const { result, rerender } = renderHook((props: { data?: IResource[] }) => useFetchApplicationLabels(props.data), {
      initialProps: { data: first },
    })

    const firstLabelMap = result.current.labelMap
    expect(firstLabelMap).toBeDefined()

    const second = [createOCPApp('res-2', 'app=two')]
    rerender({ data: second })

    expect(result.current.labelMap).toBe(firstLabelMap)
    expect(result.current.labelMap?.['res-1']).toBeDefined()
    expect(result.current.labelMap?.['res-2']).toBeUndefined()
  })
})
