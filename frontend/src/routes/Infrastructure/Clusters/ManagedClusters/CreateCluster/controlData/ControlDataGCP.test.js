// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { getControlDataGCP } from './ControlDataGCP'

describe('getControlDataGCP', () => {
    it('get control data for GCP - default', () => {
        getControlDataGCP()
    })

    it('get control data for GCP - no automation', () => {
        getControlDataGCP(false, false, true)
    })

    it('get control data for GCP - include sno cluster', () => {
        getControlDataGCP(true, true, true)
    })

    it('get control data for GCP - no klusterletaddon', () => {
        getControlDataGCP(true, true, true)
    })
})
