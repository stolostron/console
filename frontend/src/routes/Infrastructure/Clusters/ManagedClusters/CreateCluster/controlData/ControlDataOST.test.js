// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'
import { getControlDataOST } from './ControlDataOST'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)
const handleModalToggle = jest.fn()

describe('Cluster creation control data for OST', () => {
  it('generates correctly', () => {
    expect(getControlDataOST(t, handleModalToggle, true, true, false)).toMatchSnapshot()
  })

  it('generates correctly with SNO enabled', () => {
    expect(getControlDataOST(t, handleModalToggle, true, true, true)).toMatchSnapshot()
  })

  it('generates correctly for MCE', () => {
    expect(getControlDataOST(t, handleModalToggle, true, false, false)).toMatchSnapshot()
  })
})
