// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'
import { getControlDataAWS } from './ControlDataAWS'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)

describe('getControlDataAWS', () => {
    it('get control data for AWS - default', () => {
        getControlDataAWS(undefined, false, false, false, true, t)
    })

    it('get control data for AWS - no automation', () => {
        getControlDataAWS(undefined, false, true, true, true, t)
    })

    it('get control data for AWS - include sno cluster', () => {
        getControlDataAWS(undefined, true, true, true, true, t)
    })

    it('get control data for AWS - no klusterletaddon', () => {
        getControlDataAWS(undefined, true, true, true, false, t)
    })

    it('get control data for AWS - no awsprivate', () => {
        getControlDataAWS(undefined, true, false, true, true, t)
    })
})
