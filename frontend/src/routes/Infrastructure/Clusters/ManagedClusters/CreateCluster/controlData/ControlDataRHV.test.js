// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { getControlDataRHV } from './ControlDataRHV'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)

describe('getControlDataRHV', () => {
    it('get control data for RHV - default', () => {
        getControlDataRHV(undefined, true, true, t)
    })

    it('get control data for RHV - no automation', () => {
        getControlDataRHV(undefined, false, true, t)
    })

    it('get control data for RHV - no klusterletaddon', () => {
        getControlDataRHV(undefined, true, false, t)
    })
})
