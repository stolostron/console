// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { getControlDataAZR } from './ControlDataAZR'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)

describe('getControlDataAZR', () => {
    it('get control data for Azure - default', () => {
        getControlDataAZR(t, undefined, true, true, false)
    })

    it('get control data for Azure - no automation', () => {
        getControlDataAZR(t, undefined, false, true, false)
    })

    it('get control data for Azure - include sno cluster', () => {
        getControlDataAZR(t, undefined, true, true, true)
    })

    it('get control data for Azure - no klusterletaddon', () => {
        getControlDataAZR(t, undefined, true, false, true)
    })
})
