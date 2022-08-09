// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { getControlDataRHV } from './ControlDataRHV'

describe('getControlDataRHV', () => {
    it('get control data for RHV - default', () => {
        getControlDataRHV()
    })

    it('get control data for RHV - no automation', () => {
        getControlDataRHV(false, true)
    })

    it('get control data for RHV - no klusterletaddon', () => {
        getControlDataRHV(true, false)
    })
})
