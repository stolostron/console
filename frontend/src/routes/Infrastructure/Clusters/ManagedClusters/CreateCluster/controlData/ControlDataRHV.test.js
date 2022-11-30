// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { getControlDataRHV } from './ControlDataRHV'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => i18next.t(key),
    }),
}))

describe('getControlDataRHV', () => {
    it('get control data for RHV - default', () => {
        getControlDataRHV(t)
    })

    it('get control data for RHV - no automation', () => {
        getControlDataRHV(false, true, t)
    })

    it('get control data for RHV - no klusterletaddon', () => {
        getControlDataRHV(true, false, t)
    })
})
