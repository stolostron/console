/* Copyright Contributors to the Open Cluster Management project */

import {
  getTopologyNodeActionVisibility,
  showApplicationPickerOnAppSet,
  showViewRepoOnNode,
} from './topologyNodeActions'
import type { TopologyNode } from '../types'

describe('topologyNodeActions', () => {
  test('getTopologyNodeActionVisibility', () => {
    expect(getTopologyNodeActionVisibility('pod')).toEqual({ showLogs: true, showEditYaml: true })
    expect(getTopologyNodeActionVisibility('git')).toEqual({ showLogs: false, showEditYaml: false })
    expect(getTopologyNodeActionVisibility('cluster')).toEqual({ showLogs: false, showEditYaml: false })
    expect(getTopologyNodeActionVisibility('application')).toEqual({ showLogs: false, showEditYaml: true })
    expect(getTopologyNodeActionVisibility('deployment', { useArgoApplicationIcon: true })).toEqual({
      showLogs: false,
      showEditYaml: true,
    })
  })

  test('showViewRepoOnNode', () => {
    expect(showViewRepoOnNode('git')).toBe(true)
    expect(showViewRepoOnNode('chart')).toBe(false)
    expect(showViewRepoOnNode('pod')).toBe(false)
    expect(showViewRepoOnNode(undefined)).toBe(false)
  })

  test('showApplicationPickerOnAppSet', () => {
    const node: TopologyNode = {
      id: '1',
      uid: '1',
      name: 'as',
      namespace: 'ns',
      type: 'applicationset',
      specs: { showApplicationPicker: true },
    }
    expect(showApplicationPickerOnAppSet(node)).toBe(true)
  })
})
