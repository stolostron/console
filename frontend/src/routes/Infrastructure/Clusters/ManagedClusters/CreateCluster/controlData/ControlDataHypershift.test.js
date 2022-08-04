// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { Warning } from '../Warning'
import { getControlDataHypershift } from './ControlDataHypershift'

describe('getControlDataHypershift', () => {
    it('get control data for Hypershift - default', () => {
        getControlDataHypershift()
    })

    it('get control data for RHV - no klusterletaddon', () => {
        getControlDataHypershift(false, <Warning />)
    })
})
