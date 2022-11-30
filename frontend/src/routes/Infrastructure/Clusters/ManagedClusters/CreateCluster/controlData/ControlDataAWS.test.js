// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'
import { getControlDataAWS } from './ControlDataAWS'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => i18next.t(key),
    }),
}))

describe('getControlDataAWS', () => {
    it('get control data for AWS - default', () => {
        getControlDataAWS(t)
    })

    it('get control data for AWS - no automation', () => {
        getControlDataAWS(false, true, false, true, t)
    })

    it('get control data for AWS - include sno cluster', () => {
        getControlDataAWS(true, true, true, true, t)
    })

    it('get control data for AWS - no klusterletaddon', () => {
        getControlDataAWS(true, true, true, true, t)
    })

    it('get control data for AWS - no awsprivate', () => {
        getControlDataAWS(true, false, true, true, t)
    })
})
