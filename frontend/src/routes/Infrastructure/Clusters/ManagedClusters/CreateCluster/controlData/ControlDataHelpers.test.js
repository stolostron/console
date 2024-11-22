// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'
import { ingressVIPsReverse } from './ControlDataHelpers'

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

    ingressVIPsReverse(control, path)
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

    ingressVIPsReverse(control, path)
    expect(control.active.multitextEntries.length).toEqual(1)
    expect(control.controlData.length).toEqual(1)
    expect(control.active.multitextEntries[0]).toEqual('')
    expect(control.controlData[0].active).toEqual('')
  })
})
