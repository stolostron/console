// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'
import { getControlDataGCP } from './ControlDataGCP'
import { getControlDataGCP as getControlDataGCPClusterPool } from '../../../ClusterPools/CreateClusterPool/controlData/ControlDataGCP'
import { fixupControlsForClusterPool } from '../../../ClusterPools/CreateClusterPool/controlData/ControlDataHelper'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)
const handleModalToggle = jest.fn()

describe('Cluster creation control data for GCP', () => {
  it('generates correctly', () => {
    expect(getControlDataGCP(t, handleModalToggle, true, true, false)).toMatchSnapshot()
  })

  it('generates correctly with SNO enabled', () => {
    expect(getControlDataGCP(t, handleModalToggle, true, true, true)).toMatchSnapshot()
  })

  it('generates correctly for MCE', () => {
    expect(getControlDataGCP(t, handleModalToggle, true, false, false)).toMatchSnapshot()
  })

  it('generates correctly for cluster pools', () => {
    expect(
      fixupControlsForClusterPool(getControlDataGCPClusterPool(t, handleModalToggle, false, false), t)
    ).toMatchSnapshot()
  })
})
