// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { getControlDataVMW } from './ControlDataVMW'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => i18next.t(key),
    }),
}))
describe('getControlDataVMW', () => {
    it('get control data for vsphere - default', () => {
        getControlDataVMW(t)
    })

    it('get control data for vsphere - no automation', () => {
        getControlDataVMW(false, false, true, t)
    })

    it('get control data for vsphere - include sno cluster', () => {
        getControlDataVMW(true, true, true, t)
    })

    it('get control data for vsphere - no klusterletaddon', () => {
        getControlDataVMW(true, true, true, t)
    })
})
