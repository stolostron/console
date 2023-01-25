// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { Warning } from '../Warning'
import { getControlDataHypershift } from './ControlDataHypershift'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)
const handleModalToggle = jest.fn()

describe('Cluster creation control data for Hypershift', () => {
  it('generates correctly', () => {
    expect(getControlDataHypershift(t, handleModalToggle, <Warning />, true, true)).toMatchSnapshot()
  })
  it('generates correctly for MCE', () => {
    expect(getControlDataHypershift(t, handleModalToggle, <Warning />, true, false)).toMatchSnapshot()
  })
})
