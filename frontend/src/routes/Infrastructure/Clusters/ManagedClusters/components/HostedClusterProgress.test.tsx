/* Copyright Contributors to the Open Cluster Management project */

import { HostedClusterK8sResource } from 'openshift-assisted-ui-lib/cim'
import { render } from '@testing-library/react'
import { nockIgnoreRBAC } from '../../../../../lib/nock-util'
import { clickByText, waitForText } from '../../../../../lib/test-util'
import HostedClusterProgress from './HostedClusterProgress'
import { RecoilRoot } from 'recoil'

const handleModalToggle = () => {}

const hostedCluster: HostedClusterK8sResource = {
  apiVersion: 'hypershift.openshift.io/v1alpha1',
  kind: 'HostedCluster',
  metadata: {
    annotations: {
      'cluster.open-cluster-management.io/hypershiftdeployment': 'multicluster-engine/feng-hypershift-test',
      'cluster.open-cluster-management.io/managedcluster-name': 'feng-hypershift-test',
    },
    name: 'feng-hypershift-test',
    namespace: 'clusters',
  },
  spec: {
    services: [],
    platform: {
      type: 'AWS',
    },
    autoscaling: {},
    clusterID: '49b5fce0-6556-4bec-aa04-81072382c860',
    controllerAvailabilityPolicy: 'SingleReplica',
    dns: {
      baseDomain: 'dev06.red-chesterfield.com',
      privateZoneID: 'Z05280312TKV05LK210UX',
      publicZoneID: 'Z2KFHRPLWG1H9H',
    },
    etcd: {
      managementType: 'Managed',
    },
    fips: false,
    infraID: 'feng-hypershift-test-mjhpv',
    infrastructureAvailabilityPolicy: 'SingleReplica',
    issuerURL: 'https://feng-hypershift-bucket.s3.us-west-2.amazonaws.com/feng-hypershift-test-mjhpv',
    pullSecret: { name: 'local-cluster-pull-secret' },
    release: { image: 'quay.io/openshift-release-dev/ocp-release:4.10.15-x86_64' },
    sshKey: { name: 'feng-hypershift-test-ssh-key' },
  },
  status: {
    conditions: [
      {
        lastTransitionTime: '2022-09-07T20:30:02Z',
        message: 'Reconciliation completed succesfully',
        observedGeneration: 1564,
        reason: 'ReconciliatonSucceeded',
        status: 'True',
        type: 'ReconciliationSucceeded',
      },
      {
        lastTransitionTime: '2022-08-31T19:07:00Z',
        message: '',
        observedGeneration: 1564,
        reason: 'AsExpected',
        status: 'True',
        type: 'ClusterVersionSucceeding',
      },
      {
        lastTransitionTime: '2022-08-31T18:55:06Z',
        message: 'The hosted control plane is not found',
        observedGeneration: 1564,
        reason: 'ClusterVersionStatusUnknown',
        status: 'Unknown',
        type: 'ClusterVersionUpgradeable',
      },
      {
        lastTransitionTime: '2022-08-31T18:55:06Z',
        message: 'The hosted control plane is not found',
        observedGeneration: 1564,
        reason: 'ClusterVersionStatusUnknown',
        status: 'Unknown',
        type: 'Degraded',
      },
      {
        lastTransitionTime: '2022-08-31T18:57:42Z',
        message: 'The hosted control plane is available',
        observedGeneration: 1564,
        reason: 'HostedClusterAsExpected',
        status: 'False',
        type: 'Available',
      },
      {
        lastTransitionTime: '2022-08-31T18:55:06Z',
        message: 'Configuration passes validation',
        observedGeneration: 1564,
        reason: 'HostedClusterAsExpected',
        status: 'True',
        type: 'ValidConfiguration',
      },
      {
        lastTransitionTime: '2022-08-31T18:55:06Z',
        message: 'HostedCluster is at expected version',
        observedGeneration: 1564,
        reason: 'AsExpected',
        status: 'False',
        type: 'Progressing',
      },
    ],
    kubeadminPassword: { name: 'feng-hypershift-test-kubeadmin-password' },
    kubeconfig: { name: 'feng-hypershift-test-admin-kubeconfig' },
    ignitionEndpoint:
      'ignition-server-clusters-feng-hypershift-test.apps.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com',
  },
}

const hostedCluster2: HostedClusterK8sResource = {
  apiVersion: 'hypershift.openshift.io/v1alpha1',
  kind: 'HostedCluster',
  metadata: {
    annotations: {
      'cluster.open-cluster-management.io/hypershiftdeployment': 'multicluster-engine/feng-hypershift-test',
      'cluster.open-cluster-management.io/managedcluster-name': 'feng-hypershift-test',
    },
    name: 'feng-hypershift-test',
    namespace: 'clusters',
  },
  spec: {
    services: [],
    autoscaling: {},
    platform: {
      type: 'AWS',
    },
    clusterID: '49b5fce0-6556-4bec-aa04-81072382c860',
    controllerAvailabilityPolicy: 'SingleReplica',
    dns: {
      baseDomain: 'dev06.red-chesterfield.com',
      privateZoneID: 'Z05280312TKV05LK210UX',
      publicZoneID: 'Z2KFHRPLWG1H9H',
    },
    etcd: {
      managementType: 'Managed',
    },
    fips: false,
    infraID: 'feng-hypershift-test-mjhpv',
    infrastructureAvailabilityPolicy: 'SingleReplica',
    issuerURL: 'https://feng-hypershift-bucket.s3.us-west-2.amazonaws.com/feng-hypershift-test-mjhpv',
    pullSecret: { name: 'local-cluster-pull-secret' },
    release: { image: 'quay.io/openshift-release-dev/ocp-release:4.10.15-x86_64' },
    sshKey: { name: 'feng-hypershift-test-ssh-key' },
  },
  status: {
    conditions: [
      {
        lastTransitionTime: '2022-09-07T20:30:02Z',
        message: 'Reconciliation completed succesfully',
        observedGeneration: 1564,
        reason: 'ReconciliatonSucceeded',
        status: 'True',
        type: 'ReconciliationSucceeded',
      },
      {
        lastTransitionTime: '2022-08-31T19:07:00Z',
        message: '',
        observedGeneration: 1564,
        reason: 'AsExpected',
        status: 'True',
        type: 'ClusterVersionSucceeding',
      },
      {
        lastTransitionTime: '2022-08-31T18:55:06Z',
        message: 'The hosted control plane is not found',
        observedGeneration: 1564,
        reason: 'ClusterVersionStatusUnknown',
        status: 'Unknown',
        type: 'ClusterVersionUpgradeable',
      },
      {
        lastTransitionTime: '2022-08-31T18:55:06Z',
        message: 'The hosted control plane is not found',
        observedGeneration: 1564,
        reason: 'ClusterVersionStatusUnknown',
        status: 'Unknown',
        type: 'Degraded',
      },
      {
        lastTransitionTime: '2022-08-31T18:57:42Z',
        message: 'The hosted control plane is available',
        observedGeneration: 1564,
        reason: 'HostedClusterAsExpected',
        status: 'True',
        type: 'Available',
      },
      {
        lastTransitionTime: '2022-08-31T18:55:06Z',
        message: 'Configuration passes validation',
        observedGeneration: 1564,
        reason: 'HostedClusterAsExpected',
        status: 'True',
        type: 'ValidConfiguration',
      },
      {
        lastTransitionTime: '2022-08-31T18:55:06Z',
        message: 'HostedCluster is at expected version',
        observedGeneration: 1564,
        reason: 'AsExpected',
        status: 'False',
        type: 'Progressing',
      },
    ],
    kubeadminPassword: { name: 'feng-hypershift-test-kubeadmin-password' },
    kubeconfig: { name: 'feng-hypershift-test-admin-kubeconfig' },
    ignitionEndpoint:
      'ignition-server-clusters-feng-hypershift-test.apps.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com',
  },
}

describe('HostedClusterProgress', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    render(
      <RecoilRoot>
        <HostedClusterProgress handleModalToggle={handleModalToggle} hostedCluster={hostedCluster} />
      </RecoilRoot>
    )
  })

  it('should render HostedClusterProgress', async () => {
    await waitForText('Reconciliation completed succesfully')
  })
})

describe('HostedClusterProgress click launchToOCP link', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    render(
      <RecoilRoot>
        <HostedClusterProgress handleModalToggle={handleModalToggle} hostedCluster={hostedCluster2} />
      </RecoilRoot>
    )
  })

  it('should render HostedClusterProgress', async () => {
    await waitForText('Reconciliation completed succesfully')
    await clickByText('Control plane pods')
  })
})
