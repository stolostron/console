/* Copyright Contributors to the Open Cluster Management project */

import * as yaml from 'js-yaml'
import { createRosaHcpResourceGenerator } from './createRosaHcpResourceGenerator'

describe('createRosaHcpResourceGenerator', () => {
  it('renders valid, schema-passing YAML from representative form values', () => {
    const generator = createRosaHcpResourceGenerator()
    const formValues = {
      name: 'my-cluster',
      cluster_version: '4.17.0',
      region: 'us-east-1',
      billing_account_id: '111111111111',
      cluster_privacy: 'external',
      installer_role_arn: 'arn:aws:iam::111111111111:role/my-cluster-Installer-Role',
      support_role_arn: 'arn:aws:iam::111111111111:role/my-cluster-Support-Role',
      worker_role_arn: 'arn:aws:iam::111111111111:role/my-cluster-Worker-Role',
      network_machine_cidr: '10.0.0.0/16',
      network_service_cidr: '172.30.0.0/16',
      network_pod_cidr: '10.128.0.0/14',
      network_host_prefix: '/23',
      machine_pools_subnets: [{ machine_pool_subnet: 'subnet-12345' }],
      machine_type: 'm5.xlarge',
      compute_root_volume: 300,
      autoscaling: true,
      min_replicas: 2,
      max_replicas: 4,
    }

    const rendered = generator.renderYaml(formValues)
    expect(rendered).not.toBe('')

    const documents = yaml.loadAll(rendered) as Record<string, unknown>[]
    expect(documents.map((d) => d.kind)).toEqual(['ROSAControlPlane', 'ManagedCluster', 'Cluster', 'ROSACluster'])

    const errors = generator.validateYaml(rendered)
    expect(errors).toEqual([])
  })

  it('reports a missing-primary-kind error and schema violations', () => {
    const generator = createRosaHcpResourceGenerator()
    const errors = generator.validateYaml('kind: ManagedCluster\nmetadata:\n  name: foo\n')
    expect(errors.some((e) => e.message === 'Missing ROSAControlPlane document')).toBe(true)
  })
})
