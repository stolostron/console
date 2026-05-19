/* Copyright Contributors to the Open Cluster Management project */

import { createControllerRevisionChild } from './topologyUtils'
import type { TopologyNode } from '../types'

const vmNode: TopologyNode = {
  name: 'fedora-plum-walrus-98',
  namespace: 'feng-vm',
  type: 'virtualmachine',
  id: 'member--member--deployable--member--clusters----virtualmachine--feng-vm--fedora-plum-walrus-98',
  uid: 'member--member--deployable--member--clusters----virtualmachine--feng-vm--fedora-plum-walrus-98',
  specs: {
    isDesign: false,
    raw: {
      metadata: {
        name: 'fedora-plum-walrus-98',
        namespace: 'feng-vm',
      },
      group: 'kubevirt.io',
      health: {
        message: 'Running',
        status: 'Healthy',
      },
      kind: 'VirtualMachine',
      name: 'fedora-plum-walrus-98',
      namespace: 'feng-vm',
      status: 'OutOfSync',
      version: 'v1',
      cluster: 'local-cluster',
      apiVersion: 'kubevirt.io/v1',
    },
    clustersNames: ['local-cluster'],
    parent: {
      clusterId: 'member--clusters--',
    },
    resourceCount: 1,
  },
}

const expectedGenericChild: TopologyNode = {
  id: 'member--member--deployable--member--clusters----virtualmachine--feng-vm--fedora-plum-walrus-98--controllerrevision--fedora-plum-walrus-98',
  name: 'fedora-plum-walrus-98',
  namespace: 'feng-vm',
  specs: {
    clustersNames: ['local-cluster'],
    isDesign: false,
    parent: {
      parentId: 'member--member--deployable--member--clusters----virtualmachine--feng-vm--fedora-plum-walrus-98',
      parentName: 'fedora-plum-walrus-98',
      parentSpecs: undefined,
      parentType: 'virtualmachine',
      resources: undefined,
    },
    replicaCount: 1,
    resourceCount: 1,
    resources: undefined,
  },
  type: 'controllerrevision',
  uid: 'member--member--deployable--member--clusters----virtualmachine--feng-vm--fedora-plum-walrus-98--controllerrevision--fedora-plum-walrus-98',
}

describe('createControllerRevisionChild', () => {
  it('creates a generic controllerrevision child for a VirtualMachine without vmControllerRevisions', () => {
    expect(createControllerRevisionChild(vmNode, ['local-cluster'], undefined, [], [])).toEqual(expectedGenericChild)
  })

  it('creates named controllerrevision children from vmControllerRevisions map', () => {
    const nodeWithUid: TopologyNode = {
      ...vmNode,
      specs: {
        ...vmNode.specs,
        raw: {
          ...(vmNode.specs as any).raw,
          _uid: 'local-cluster/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        },
      },
    }

    const vmControllerRevisions = new Map<string, string[]>([
      ['aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', ['revision-start-vm-rev-1', 'revision-start-vm-rev-2']],
    ])

    const links: any[] = []
    const nodes: any[] = []
    const result = createControllerRevisionChild(
      nodeWithUid,
      ['local-cluster'],
      undefined,
      links,
      nodes,
      vmControllerRevisions
    )

    expect(nodes).toHaveLength(2)
    expect(nodes[0].name).toBe('revision-start-vm-rev-1')
    expect(nodes[0].type).toBe('controllerrevision')
    expect(nodes[1].name).toBe('revision-start-vm-rev-2')
    expect(nodes[1].type).toBe('controllerrevision')

    expect(links).toHaveLength(2)
    expect(links[0].from.uid).toBe(nodeWithUid.id)
    expect(links[1].from.uid).toBe(nodeWithUid.id)

    expect(result).toEqual(nodes[1])
  })

  it('falls back to generic controllerrevision when vmControllerRevisions has no match', () => {
    const nodeWithUid: TopologyNode = {
      ...vmNode,
      specs: {
        ...vmNode.specs,
        raw: {
          ...(vmNode.specs as any).raw,
          _uid: 'local-cluster/11111111-2222-3333-4444-555555555555',
        },
      },
    }

    const vmControllerRevisions = new Map<string, string[]>([
      ['aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', ['some-revision']],
    ])

    const links: any[] = []
    const nodes: any[] = []
    const result = createControllerRevisionChild(
      nodeWithUid,
      ['local-cluster'],
      undefined,
      links,
      nodes,
      vmControllerRevisions
    )

    expect(nodes).toHaveLength(1)
    expect(nodes[0].name).toBe('fedora-plum-walrus-98')
    expect(nodes[0].type).toBe('controllerrevision')
    expect(result).toEqual(nodes[0])
  })
})
