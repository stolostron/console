// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'
import { getControlDataAZR } from './ControlDataAZR'
import { getControlDataAZR as getControlDataAZRClusterPool } from '../../../ClusterPools/CreateClusterPool/controlData/ControlDataAZR'
import { fixupControlsForClusterPool } from '../../../ClusterPools/CreateClusterPool/controlData/ControlDataHelper'
import i18next from 'i18next'

const t = i18next.t.bind(i18next)
const handleModalToggle = jest.fn()

describe('Cluster creation control data for AZR', () => {
    it('generates correctly', () => {
        expect(getControlDataAZR(t, handleModalToggle, true, true, false)).toMatchSnapshot()
    })

    it('generates correctly with SNO enabled', () => {
        expect(getControlDataAZR(t, handleModalToggle, true, true, true)).toMatchSnapshot()
    })

    it('generates correctly for MCE', () => {
        expect(getControlDataAZR(t, handleModalToggle, true, false, false)).toMatchSnapshot()
    })

    it('generates correctly for cluster pools', () => {
        expect(
            fixupControlsForClusterPool(getControlDataAZRClusterPool(t, handleModalToggle, false, false), t)
        ).toMatchSnapshot()
    })
})
