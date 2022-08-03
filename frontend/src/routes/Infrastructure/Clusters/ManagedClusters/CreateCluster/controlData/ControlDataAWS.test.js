// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { getControlDataAWS } from './ControlDataAWS'

describe('getControlDataAWS', () => {
    it('get control data for AWS - default', () => {
        getControlDataAWS()
    })

    it('get control data for AWS - no automation', () => {
        getControlDataAWS(false, true, false, true)
    })

    it('get control data for AWS - include sno cluster', () => {
        getControlDataAWS(true, true, true, true)
    })

    it('get control data for AWS - no klusterletaddon', () => {
        getControlDataAWS(true, true, true, true)
    })

    it('get control data for AWS - no awsprivate', () => {
        getControlDataAWS(true, false, true, true)
    })
})
