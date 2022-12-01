// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { getControlDataVMW } from './ControlDataVMW'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)

describe('getControlDataVMW', () => {
    it('get control data for vsphere - default', () => {
        getControlDataVMW(undefined, true, false, true, t)
    })

    it('get control data for vsphere - no automation', () => {
        getControlDataVMW(undefined, false, false, true, t)
    })

    it('get control data for vsphere - include sno cluster', () => {
        getControlDataVMW(undefined, true, true, true, t)
    })

    it('get control data for vsphere - no klusterletaddon', () => {
        getControlDataVMW(undefined, true, true, false, t)
    })
})
