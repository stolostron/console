// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'
import { getControlDataVMW } from './ControlDataVMW'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)
const handleModalToggle = jest.fn()

describe('Cluster creation control data for VMW', () => {
  it('generates correctly', () => {
    expect(getControlDataVMW(t, handleModalToggle, true, true, false)).toMatchSnapshot()
  })

  it('generates correctly with SNO enabled', () => {
    expect(getControlDataVMW(t, handleModalToggle, true, true, true)).toMatchSnapshot()
  })

  it('generates correctly for MCE', () => {
    expect(getControlDataVMW(t, handleModalToggle, true, false, false)).toMatchSnapshot()
  })
})
