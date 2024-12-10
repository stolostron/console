/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import i18n from 'i18next'
import { getIPValidator } from '../utils/validation-types'
import { validateMultiTextControl } from './validate-controls'
const t = i18n.t.bind(i18n)

export const returnControl = (activeValue) => ({
  tooltip: 'Add the ingress to be created',
  id: 'ingressVIP',
  type: 'multitext',
  name: 'IngressVIPs',
  placeholder: 'Enter ingressVIP',
  addButtonText: 'Add additional ingressVIP',
  active: {
    multitextEntries: [''],
  },
  controlData: [
    {
      id: 'ingressVIP',
      type: 'multitextMember',
      active: activeValue,
      validation: getIPValidator({ subnet: { groupID: 'settings', controlID: 'cidr' }, optional: false }),
    },
  ],
  exception: '',
  validation: getIPValidator({ subnet: { groupID: 'settings', controlID: 'cidr' }, optional: false }),
})

const cidrValidationMessage = 'Value must be valid IPv4 or IPv6 format.'

describe('validate-control helper validateMultiTextControl', () => {
  it('adds exception for faulty input', () => {
    const control = returnControl('faulty input')
    validateMultiTextControl(control, [control], {}, {}, false, t)
    expect(control.exception).toEqual(cidrValidationMessage)
  })
  it('makes exception undefined for valid input', () => {
    const control = returnControl('10.0.0.1')
    validateMultiTextControl(control, [control], {}, {}, false, t)
    expect(control.exception).toEqual(undefined)
  })
})
