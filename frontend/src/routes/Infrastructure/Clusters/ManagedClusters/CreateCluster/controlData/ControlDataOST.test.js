// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { getControlDataOST } from './ControlDataOST'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)

describe('getControlDataOST', () => {
    it('get control data for openstack - default', () => {
        getControlDataOST(t, undefined, true, true, false)
    })

    it('get control data for openstack - no automation', () => {
        getControlDataOST(t, undefined, false, true, false)
    })

    it('get control data for openstack - include sno cluster', () => {
        getControlDataOST(t, undefined, true, true, true)
    })

    it('get control data for openstack - no klusterletaddon', () => {
        getControlDataOST(t, undefined, true, false, true)
    })
})
