// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { getControlDataOST } from './ControlDataOST'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)

describe('getControlDataOST', () => {
    it('get control data for openstack - default', () => {
        getControlDataOST(undefined, true, false, true, t)
    })

    it('get control data for openstack - no automation', () => {
        getControlDataOST(undefined, false, false, true, t)
    })

    it('get control data for openstack - include sno cluster', () => {
        getControlDataOST(undefined, true, true, true, t)
    })

    it('get control data for openstack - no klusterletaddon', () => {
        getControlDataOST(undefined, true, true, false, t)
    })
})
