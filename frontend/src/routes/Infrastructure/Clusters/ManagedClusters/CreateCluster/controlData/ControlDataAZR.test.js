// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { getControlDataAZR } from './ControlDataAZR'

describe('getControlDataAZR', () => {
    it('get control data for Azure - default', () => {
        getControlDataAZR()
    })

    it('get control data for Azure - no automation', () => {
        getControlDataAZR(false, false, true)
    })

    it('get control data for Azure - include sno cluster', () => {
        getControlDataAZR(true, true, true)
    })

    it('get control data for Azure - no klusterletaddon', () => {
        getControlDataAZR(true, true, true)
    })
})
