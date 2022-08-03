// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { getControlDataOST } from './ControlDataOST'

describe('getControlDataOST', () => {
    it('get control data for openstack - default', () => {
        getControlDataOST()
    })

    it('get control data for openstack - no automation', () => {
        getControlDataOST(false, false, true)
    })

    it('get control data for openstack - include sno cluster', () => {
        getControlDataOST(true, true, true)
    })

    it('get control data for openstack - no klusterletaddon', () => {
        getControlDataOST(true, true, true)
    })
})
