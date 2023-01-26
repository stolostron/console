// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'
import { getControlDataAWS } from './ControlDataAWS'
import { getControlDataAWS as getControlDataAWSClusterPool } from '../../../ClusterPools/CreateClusterPool/controlData/ControlDataAWS'
import { fixupControlsForClusterPool } from '../../../ClusterPools/CreateClusterPool/controlData/ControlDataHelper'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)
const handleModalToggle = jest.fn()

describe('Cluster creation control data for AWS', () => {
  it('generates correctly', () => {
    expect(getControlDataAWS(t, handleModalToggle, true, false, false, true)).toMatchSnapshot()
  })

  it('generates correctly with SNO enabled', () => {
    expect(getControlDataAWS(t, handleModalToggle, true, false, true, true)).toMatchSnapshot()
  })

  it('generates correctly for MCE', () => {
    expect(getControlDataAWS(t, handleModalToggle, true, false, false, false)).toMatchSnapshot()
  })

  it('generates correctly for cluster pools', () => {
    expect(
      fixupControlsForClusterPool(getControlDataAWSClusterPool(t, handleModalToggle, false, false), t)
    ).toMatchSnapshot()
  })

  it('generates correctly with AWS private', () => {
    expect(getControlDataAWS(t, handleModalToggle, true, true, false, true)).toMatchSnapshot()
  })
})
