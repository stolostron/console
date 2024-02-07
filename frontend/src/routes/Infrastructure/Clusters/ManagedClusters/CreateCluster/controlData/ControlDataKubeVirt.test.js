// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import i18next from 'i18next'
import { Warning } from '../Warning'
import { getControlDataKubeVirt } from './ControlDataKubeVirt'

const t = i18next.t.bind(i18next)
const handleModalToggle = jest.fn()

describe('Cluster creation control data for KubeVirt', () => {
  const localCluster = {
    name: 'local-cluster',
    displayName: 'local-cluster',
    namespace: 'local-cluster',
    status: 'ready',
    provider: 'aws',
    labels: {
      cloud: 'Amazon',
      'cluster.open-cluster-management.io/clusterset': 'default',
      clusterID: '68438ab6-ceec-4f2f-9d9e-675b518ab0ef',
      'local-cluster': 'true',
      name: 'local-cluster',
      openshiftVersion: '4.13.23',
      'openshiftVersion-major': '4',
      'openshiftVersion-major-minor': '4.13',
      'velero.io/exclude-from-backup': 'true',
      vendor: 'OpenShift',
    },
    consoleURL: 'https://console-openshift-console.apps.cs-aws-413-j9kqv.dev02.red-chesterfield.com',
    isHive: false,
    isHypershift: false,
    isManaged: true,
    isCurator: false,
    hasAutomationTemplate: false,
    isHostedCluster: false,
    isSNOCluster: false,
    isRegionalHubCluster: false,
    hive: {
      isHibernatable: false,
      secrets: {},
    },
    clusterSet: 'default',
    owner: {},
    creationTimestamp: '2024-01-29T04:31:03Z',
  }

  it('generates correctly', () => {
    expect(getControlDataKubeVirt(t, handleModalToggle, <Warning />, true, true)).toMatchSnapshot()
  })
  it('generates correctly for MCE', () => {
    expect(getControlDataKubeVirt(t, handleModalToggle, <Warning />, false, false)).toMatchSnapshot()
  })
})
