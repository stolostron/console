// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { getControlDataGCP } from './ControlDataGCP'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)

describe('getControlDataGCP', () => {
    it('get control data for GCP - default', () => {
        getControlDataGCP(t, undefined, true, true, false)
    })

    it('get control data for GCP - no automation', () => {
        getControlDataGCP(t, undefined, false, true, false)
    })

    it('get control data for GCP - include sno cluster', () => {
        getControlDataGCP(t, undefined, true, true, true)
    })

    it('get control data for GCP - no klusterletaddon', () => {
        getControlDataGCP(t, undefined, true, false, true)
    })
})
