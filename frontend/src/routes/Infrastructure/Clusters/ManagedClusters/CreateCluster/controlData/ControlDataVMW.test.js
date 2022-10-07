// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { getControlDataVMW } from './ControlDataVMW'

describe('getControlDataVMW', () => {
    it('get control data for vsphere - default', () => {
        getControlDataVMW()
    })

    it('get control data for vsphere - no automation', () => {
        getControlDataVMW(false, false, true)
    })

    it('get control data for vsphere - include sno cluster', () => {
        getControlDataVMW(true, true, true)
    })

    it('get control data for vsphere - no klusterletaddon', () => {
        getControlDataVMW(true, true, true)
    })
})
