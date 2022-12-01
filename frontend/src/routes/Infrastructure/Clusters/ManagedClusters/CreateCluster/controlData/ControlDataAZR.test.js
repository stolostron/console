// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { getControlDataAZR } from './ControlDataAZR'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)

describe('getControlDataAZR', () => {
    it('get control data for Azure - default', () => {
        getControlDataAZR(undefined, true, false, true, t)
    })

    it('get control data for Azure - no automation', () => {
        getControlDataAZR(undefined, false, false, true, t)
    })

    it('get control data for Azure - include sno cluster', () => {
        getControlDataAZR(undefined, true, true, true, t)
    })

    it('get control data for Azure - no klusterletaddon', () => {
        getControlDataAZR(undefined, true, true, false, t)
    })
})
