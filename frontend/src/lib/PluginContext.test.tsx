/* Copyright Contributors to the Open Cluster Management project */
import { defaultPlugin, PluginContext } from './PluginContext'

describe('PluginContext', () => {
  test('exposes a default plugin without importing the multicluster SDK at runtime', () => {
    expect(PluginContext).toBeDefined()
    expect(defaultPlugin.isACMAvailable).toBe(true)
    expect(typeof defaultPlugin.multiclusterApi.useFleetK8sWatchResource).toBe('function')
  })

  test('default useFleetK8sWatchResource returns a loaded empty list stub', () => {
    const [data, loaded, error] = defaultPlugin.multiclusterApi.useFleetK8sWatchResource({} as never)

    expect(data).toEqual([])
    expect(loaded).toBe(true)
    expect(error).toBeUndefined()
  })

  test('default useK8sWatchResource returns a loaded empty list stub', () => {
    const [data, loaded, error] = defaultPlugin.ocpApi.useK8sWatchResource({} as never)

    expect(data).toEqual([])
    expect(loaded).toBe(true)
    expect(error).toBeUndefined()
  })
})
