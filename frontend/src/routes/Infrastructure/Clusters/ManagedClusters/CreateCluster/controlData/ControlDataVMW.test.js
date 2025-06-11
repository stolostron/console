// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'
import { clusterPath, datastorePath, folderPath, getControlDataVMW, resourcePoolPath } from './ControlDataVMW'
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

describe('vSphere Handlebars helpers', () => {
  it('clusterPath can generate absolute value', () => {
    expect(clusterPath('cluster-name', 'datacenter-name', {})).toBe('/datacenter-name/host/cluster-name')
  })
  it('clusterPath accepts user-supplied absolute value', () => {
    expect(clusterPath('/custom-datacenter/path/cluster-name', 'datacenter-name', {})).toBe(
      '/custom-datacenter/path/cluster-name'
    )
  })
  it('clusterPath can generate relative value', () => {
    expect(clusterPath('/custom-datacenter/path/cluster-name', 'datacenter-name', true, {})).toBe('cluster-name')
  })
  it('datastorePath can generate absolute value', () => {
    expect(datastorePath(['my-datastore'], ['datacenter-name'], {})).toBe('/datacenter-name/datastore/my-datastore')
  })
  it('folderPath can generate absolute value', () => {
    expect(folderPath(['folder/subfolder'], ['datacenter-name'], {})).toBe('/datacenter-name/vm/folder/subfolder')
  })
  it('resourcePoolPath can generate absolute value', () => {
    expect(resourcePoolPath(['pool'], 'datacenter-name', ['the-cluster'], {})).toBe(
      '/datacenter-name/host/the-cluster/Resources/pool'
    )
  })
})
