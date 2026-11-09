/* Copyright Contributors to the Open Cluster Management project */
'use strict'

/**
 * Location labels (zone, datacenter) must be written on both the ClusterDeployment and the ManagedCluster,
 * only when set, on the platforms covered below (AWS, GCP, Azure, vSphere). The vSphere credential `datacenter` variable is unrelated to the
 * location `datacenter` label and must never produce that label.
 */
import Handlebars from 'handlebars'
import jsyaml from 'js-yaml'
import { caseFn, if_eqFn, if_orFn, if_truthyFn, switchFn } from '~/components/TemplateEditor/helpers'
import hiveTemplateHbs from './hive-template.hbs'
import { clusterPath, datastorePath, folderPath, resourcePoolPath } from '../controlData/ControlDataVMW'

const hiveTemplate = Handlebars.compile(hiveTemplateHbs)

// the clusterCurator and endpoints partials are unrelated to labels
const helpers = {
  partials: { clusterCurator: '', endpoints: '' },
  helpers: {
    case: caseFn,
    if_eq: if_eqFn,
    if_or: if_orFn,
    if_truthy: if_truthyFn,
    switch: switchFn,
    clusterPath,
    datastorePath,
    folderPath,
    resourcePoolPath,
    escapeYAML: (value) => jsyaml.dump(Array.isArray(value) ? value[0] : value),
  },
}

const baseData = {
  name: 'test-cluster',
  baseDomain: 'example.com',
  infrastructure: 'AWS',
  region: 'us-east-1',
  networkType: 'OVNKubernetes',
  singleNode: false,
  masterPool: [{ masterType: 'm5.xlarge' }],
  workerPools: [{ workerName: 'worker', computeNodeCount: 3, workerType: 'm5.xlarge' }],
  networks: [
    {
      clusterNetwork: '10.128.0.0/14',
      hostPrefix: 23,
      machineCIDR: '10.0.0.0/16',
      serviceNetwork: '172.30.0.0/16',
    },
  ],
}

const render = (data) => {
  const yaml = hiveTemplate(data, helpers).replaceAll(/\s*##.+$/gm, '')
  const docs = yaml.split(/^---$/m).map((doc) => jsyaml.load(doc))
  return {
    clusterDeployment: docs.find((doc) => doc?.kind === 'ClusterDeployment'),
    managedCluster: docs.find((doc) => doc?.kind === 'ManagedCluster'),
  }
}

describe('hive-template.hbs location labels', () => {
  it.each(['AWS', 'GCP', 'Azure', 'vSphere'])('writes zone and datacenter labels on both resources for %s', (infra) => {
    const { clusterDeployment, managedCluster } = render({
      ...baseData,
      infrastructure: infra,
      zone: 'us-east-1a',
      locationDatacenter: 'dc1',
      // vSphere credential values used by the template
      datacenter: 'vsphere-dc',
      cluster: 'vsphere-cluster',
      defaultDatastore: 'ds',
      vsphereFolder: 'folder',
      vsphereResourcePool: 'pool',
    })
    expect(clusterDeployment.metadata.labels.zone).toBe('us-east-1a')
    expect(clusterDeployment.metadata.labels.datacenter).toBe('dc1')
    expect(managedCluster.metadata.labels.zone).toBe('us-east-1a')
    expect(managedCluster.metadata.labels.datacenter).toBe('dc1')
  })

  it('keeps the region label behavior', () => {
    const { clusterDeployment, managedCluster } = render({ ...baseData, zone: 'us-east-1a' })
    expect(clusterDeployment.metadata.labels.region).toBe('us-east-1')
    expect(managedCluster.metadata.labels.region).toBe('us-east-1')
  })

  it('writes no zone or datacenter labels when unset', () => {
    const { clusterDeployment, managedCluster } = render(baseData)
    for (const labels of [clusterDeployment.metadata.labels, managedCluster.metadata.labels]) {
      expect(labels).not.toHaveProperty('zone')
      expect(labels).not.toHaveProperty('datacenter')
    }
  })

  it('does not turn the vSphere credential datacenter into a datacenter label', () => {
    const { clusterDeployment, managedCluster } = render({
      ...baseData,
      infrastructure: 'vSphere',
      datacenter: 'vsphere-dc',
      cluster: 'vsphere-cluster',
      defaultDatastore: 'ds',
      vsphereFolder: 'folder',
      vsphereResourcePool: 'pool',
    })
    expect(clusterDeployment.metadata.labels).not.toHaveProperty('datacenter')
    expect(managedCluster.metadata.labels).not.toHaveProperty('datacenter')
  })

  it('annotates only the ClusterDeployment labels for editor-to-form sync', () => {
    const raw = hiveTemplate({ ...baseData, zone: 'z1', locationDatacenter: 'dc1' }, helpers)
    // ##<id> markers wire the editor back to form controls; reverse only targets ClusterDeployment[0]
    expect(raw.match(/zone: 'z1'.*##zone/g)).toHaveLength(1)
    expect(raw.match(/datacenter: 'dc1'.*##locationDatacenter/g)).toHaveLength(1)
    expect(raw.match(/zone: 'z1'/g)).toHaveLength(2)
    expect(raw.match(/datacenter: 'dc1'/g)).toHaveLength(2)
  })
})
