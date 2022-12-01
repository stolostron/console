// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { getControlDataGCP } from './ControlDataGCP'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)

describe('getControlDataGCP', () => {
    it('get control data for GCP - default', () => {
        getControlDataGCP(undefined, true, false, true, t)
    })

    it('get control data for GCP - no automation', () => {
        getControlDataGCP(undefined, false, false, true, t)
    })

    it('get control data for GCP - include sno cluster', () => {
        getControlDataGCP(undefined, true, true, true, t)
    })

    it('get control data for GCP - no klusterletaddon', () => {
        getControlDataGCP(undefined, true, true, false, t)
    })
})
