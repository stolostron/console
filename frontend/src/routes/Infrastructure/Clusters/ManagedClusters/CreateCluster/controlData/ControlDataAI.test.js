// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { getControlDataAI } from './ControlDataAI'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)
const handleModalToggle = jest.fn()

describe('Cluster creation control data for AI', () => {
  it('generates correctly', () => {
    expect(getControlDataAI(t, handleModalToggle, true)).toMatchSnapshot()
  })
  it('generates correctly for MCE', () => {
    expect(getControlDataAI(t, handleModalToggle, false)).toMatchSnapshot()
  })
})
