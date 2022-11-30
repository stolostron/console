// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { getControlDataOST } from './ControlDataOST'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => i18next.t(key),
    }),
}))

describe('getControlDataOST', () => {
    it('get control data for openstack - default', () => {
        getControlDataOST(t)
    })

    it('get control data for openstack - no automation', () => {
        getControlDataOST(false, false, true, t)
    })

    it('get control data for openstack - include sno cluster', () => {
        getControlDataOST(true, true, true, t)
    })

    it('get control data for openstack - no klusterletaddon', () => {
        getControlDataOST(true, true, true, t)
    })
})
