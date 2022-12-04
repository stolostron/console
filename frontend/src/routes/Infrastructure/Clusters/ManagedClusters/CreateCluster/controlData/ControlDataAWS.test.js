// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'
import { getControlDataAWS } from './ControlDataAWS'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)

describe('getControlDataAWS', () => {
    it('get control data for AWS - default', () => {
        getControlDataAWS(t, undefined, false, true, false, false)
    })

    it('get control data for AWS - no automation', () => {
        getControlDataAWS(t, undefined, false, true, true, true)
    })

    it('get control data for AWS - include sno cluster', () => {
        getControlDataAWS(t, undefined, true, true, true, true)
    })

    it('get control data for AWS - no klusterletaddon', () => {
        getControlDataAWS(t, undefined, true, false, true, true)
    })

    it('get control data for AWS - no awsprivate', () => {
        getControlDataAWS(t, undefined, true, true, false, true)
    })
})
