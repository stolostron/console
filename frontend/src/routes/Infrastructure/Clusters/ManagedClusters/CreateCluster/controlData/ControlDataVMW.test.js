// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { getControlDataVMW } from './ControlDataVMW'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)

describe('getControlDataVMW', () => {
    it('get control data for vsphere - default', () => {
        getControlDataVMW(t, undefined, true, true, false)
    })

    it('get control data for vsphere - no automation', () => {
        getControlDataVMW(t, undefined, false, true, false)
    })

    it('get control data for vsphere - include sno cluster', () => {
        getControlDataVMW(t, undefined, true, true, true)
    })

    it('get control data for vsphere - no klusterletaddon', () => {
        getControlDataVMW(t, undefined, true, false, true)
    })
})
