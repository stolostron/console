// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'
import { differentiateCuratorSecrets, locationControls, reverseMultitext, secretName } from './ControlDataHelpers'
import { getControlDataAWS } from './ControlDataAWS'
import { getControlDataGCP } from './ControlDataGCP'
import { getControlDataAZR } from './ControlDataAZR'
import { getControlDataVMW } from './ControlDataVMW'
import i18next from 'i18next'

const tFn = i18next.t.bind(i18next)

const controlTemplate = {
  tooltip: 'Add the ingress to be created',
  id: 'ingressVIP',
  type: 'multitext',
  name: 'IngressVIPs',
  placeholder: 'Enter ingressVIP',
  addButtonText: 'Add additional ingressVIP',
  active: {
    multitextEntries: ['10.0.0.0', '10.0.0.9'],
  },
  controlData: [
    {
      id: 'ingressVIP',
      type: 'multitextMember',
      active: '10.0.0.0',
      validation: {
        required: true,
      },
    },
    {
      id: 'ingressVIP',
      type: 'multitextMember',
      active: '10.0.0.9',
      validation: {
        required: true,
      },
    },
  ],
}
const pathTemplate = {
  unknown: [
    {
      $raw: {
        platform: {
          vsphere: {
            ingressVIPs: ['10.0.0.2', '10.0.0.3', '10.0.0.1', '10.0.0.8', '10.0.0.0'],
          },
        },
        pullSecret: '',
      },
      $synced: {
        platform: {
          $r: 35,
          $l: 16,
          $v: {
            vsphere: {
              $r: 36,
              $l: 15,
              $v: {
                ingressVIPs: {
                  $r: 44,
                  $l: 6,
                  $v: [
                    { $v: '10.0.0.2', $r: 45, $l: 1 },
                    { $v: '10.0.0.3', $r: 46, $l: 1 },
                    { $v: '10.0.0.1', $r: 47, $l: 1 },
                    { $v: '10.0.0.8', $r: 48, $l: 1 },
                    { $v: '10.0.0.0', $r: 49, $l: 1 },
                  ],
                },
              },
            },
          },
        },
      },
    },
  ],
}
describe('ControlDataHelper', () => {
  it('Adjusts IngressVIPs active control correctly', () => {
    const control = JSON.parse(JSON.stringify(controlTemplate))
    const path = JSON.parse(JSON.stringify(pathTemplate))
    expect(control.active.multitextEntries.length).toEqual(2)
    expect(control.controlData.length).toEqual(2)
    expect(control.active.multitextEntries[0]).toEqual('10.0.0.0')
    expect(control.controlData[1].active).toEqual('10.0.0.9')

    reverseMultitext('platform.vsphere.ingressVIPs')(control, path)
    expect(control.active.multitextEntries.length).toEqual(5)
    expect(control.controlData.length).toEqual(5)
    expect(control.active.multitextEntries[0]).toEqual('10.0.0.2')
    expect(control.controlData[1].active).toEqual('10.0.0.3')
  })

  it('handles empty active control', () => {
    const control = {
      active: {
        multitextEntries: [''],
      },
      controlData: [
        {
          id: 'ingressVIP',
          type: 'multitextMember',
          active: 'test-1',
          validation: {
            required: true,
          },
        },
        {
          id: 'ingressVIP',
          type: 'multitextMember',
          active: 'test-2',
          validation: {
            required: true,
          },
        },
      ],
    }
    const path = {
      unknown: [
        {
          $raw: {
            platform: {
              vsphere: {
                ingressVIPs: [],
              },
            },
            pullSecret: '',
          },
          $synced: {
            platform: {
              $v: {
                vsphere: {
                  $v: {
                    ingressVIPs: {
                      $v: [],
                    },
                  },
                },
              },
            },
          },
        },
      ],
    }
    expect(control.active.multitextEntries.length).toEqual(1)
    expect(control.controlData.length).toEqual(2)

    reverseMultitext('platform.vsphere.ingressVIPs')(control, path)
    expect(control.active.multitextEntries.length).toEqual(1)
    expect(control.controlData.length).toEqual(1)
    expect(control.active.multitextEntries[0]).toEqual('')
    expect(control.controlData[0].active).toEqual('')
  })
})

describe('automation secret naming (ACM-39253)', () => {
  it('differentiates by cluster name only when the namespace differs from the name', () => {
    expect(secretName('install', 'mycluster', 'clusters')).toEqual('toweraccess-install-mycluster')
    expect(secretName('upgrade', 'mycluster', 'mycluster')).toEqual('toweraccess-upgrade')
    expect(secretName('scale', 'mycluster', undefined)).toEqual('toweraccess-scale')
    expect(secretName('destroy', 'mycluster', '')).toEqual('toweraccess-destroy')
  })

  it('rewrites each ClusterCurator towerAuthSecret to the differentiated Secret name', () => {
    const specYaml =
      'spec:\n  install:\n    towerAuthSecret: toweraccess-install\n  upgrade:\n    towerAuthSecret: toweraccess-upgrade\n'
    const result = differentiateCuratorSecrets(specYaml, 'mycluster', 'clusters')
    expect(result).toContain('towerAuthSecret: toweraccess-install-mycluster')
    expect(result).toContain('towerAuthSecret: toweraccess-upgrade-mycluster')
  })

  it('recomputes from the current cluster name without drift or double-append', () => {
    const staleYaml = 'spec:\n  install:\n    towerAuthSecret: toweraccess-install-oldname\n'
    const renamed = differentiateCuratorSecrets(staleYaml, 'newname', 'clusters')
    expect(renamed).toContain('towerAuthSecret: toweraccess-install-newname')
    expect(renamed).not.toContain('oldname')
    const cleared = differentiateCuratorSecrets(staleYaml, 'oldname', '')
    expect(cleared).toContain('toweraccess-install\n')
    expect(cleared).not.toContain('oldname')
  })

  it('returns an empty spec unchanged when no automation template is selected', () => {
    expect(differentiateCuratorSecrets('', 'mycluster', 'clusters')).toEqual('')
  })
})

describe('location controls', () => {
  it('defines optional zone and locationDatacenter text controls that reverse into labels', () => {
    const [zone, datacenter] = locationControls(tFn)
    expect(zone).toMatchObject({
      id: 'zone',
      type: 'text',
      reverse: 'ClusterDeployment[0].metadata.labels.zone',
    })
    expect(datacenter).toMatchObject({
      id: 'locationDatacenter',
      type: 'text',
      reverse: 'ClusterDeployment[0].metadata.labels.datacenter',
    })
    for (const control of [zone, datacenter]) {
      expect(control.active).toBe('')
      expect(control.validation.required).toBe(false)
      expect(control.validation.tester.test('us-east-1a')).toBe(true)
      expect(control.validation.tester.test('bad value!')).toBe(false)
      expect(control.validation.tester.test('rack.1_a-b')).toBe(true)
      expect(control.validation.tester.test('')).toBe(true)
      // Kubernetes label values must start and end with an alphanumeric character
      expect(control.validation.tester.test('-zone')).toBe(false)
      expect(control.validation.tester.test('zone_')).toBe(false)
      expect(control.validation.tester.test('.zone')).toBe(false)
      // and be at most 63 characters
      expect(control.validation.tester.test('a'.repeat(63))).toBe(true)
      expect(control.validation.tester.test('a'.repeat(64))).toBe(false)
    }
  })

  it.each([
    ['AWS', () => getControlDataAWS(tFn, jest.fn(), true, false, false, true)],
    ['GCP', () => getControlDataGCP(tFn, jest.fn(), true, false, false, true)],
    ['Azure', () => getControlDataAZR(tFn, jest.fn(), true, false, false, true)],
    ['vSphere', () => getControlDataVMW(tFn, jest.fn(), true, true, false)],
  ])('includes zone and locationDatacenter controls for %s', (_name, getControlData) => {
    const ids = getControlData().map((control) => control.id)
    expect(ids).toContain('zone')
    expect(ids).toContain('locationDatacenter')
  })

  it('places the location controls right after region on platforms that have one', () => {
    const ids = getControlDataAWS(tFn, jest.fn(), true, false, false, true).map((control) => control.id)
    const regionIndex = ids.indexOf('region')
    expect(ids.slice(regionIndex + 1, regionIndex + 3)).toEqual(['zone', 'locationDatacenter'])
  })
})
