// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { Warning } from '../Warning'
import { getControlDataHypershift } from './ControlDataHypershift'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => i18next.t(key),
    }),
}))

describe('getControlDataHypershift', () => {
    it('get control data for Hypershift - default', () => {
        getControlDataHypershift(t)
    })

    it('get control data for RHV - no klusterletaddon', () => {
        getControlDataHypershift(false, <Warning />, t)
    })
})
