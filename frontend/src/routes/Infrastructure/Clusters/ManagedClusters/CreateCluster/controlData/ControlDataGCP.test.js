// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { getControlDataGCP } from './ControlDataGCP'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => i18next.t(key),
    }),
}))

describe('getControlDataGCP', () => {
    it('get control data for GCP - default', () => {
        getControlDataGCP(t)
    })

    it('get control data for GCP - no automation', () => {
        getControlDataGCP(false, false, true, t)
    })

    it('get control data for GCP - include sno cluster', () => {
        getControlDataGCP(true, true, true, t)
    })

    it('get control data for GCP - no klusterletaddon', () => {
        getControlDataGCP(true, true, true, t)
    })
})
