// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { Warning } from '../Warning'
import { getControlDataCIM } from './ControlDataCIM'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)
const handleModalToggle = jest.fn()

describe('Cluster creation control data for CIM', () => {
  it('generates correctly', () => {
    expect(getControlDataCIM(t, handleModalToggle, <Warning />, true)).toMatchSnapshot()
  })
  it('generates correctly for MCE', () => {
    expect(getControlDataCIM(t, handleModalToggle, <Warning />, false)).toMatchSnapshot()
  })
})
