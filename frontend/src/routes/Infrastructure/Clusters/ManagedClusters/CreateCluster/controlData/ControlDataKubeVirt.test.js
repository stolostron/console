// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import i18next from 'i18next'
import { Warning } from '../Warning'
import { setAvailableStorageClasses } from './ControlDataHelpers'
import { getControlDataKubeVirt, onChangeKubeVirtConnection } from './ControlDataKubeVirt'

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
    expect(getControlDataKubeVirt(t, handleModalToggle, <Warning />, true, {})).toMatchSnapshot()
  })

  it('generates correctly for MCE', () => {
    expect(getControlDataKubeVirt(t, handleModalToggle, <Warning />, false, localCluster)).toMatchSnapshot()
  })

  it('Correctly returns onChangeKubeVirtConnection with pull secret & ssh key', () => {
    const control = {
      active: 'kube-virt-cred-test',
      availableMap: {
        'kube-virt-cred-test': {
          replacements: {
            pullSecret: 'pullSecretData',
            'ssh-publickey': 'ssh-publickey TESTING johndoe@email.com',
          },
        },
      },
      available: ['kube-virt-cred-test'],
    }

    onChangeKubeVirtConnection(control)

    expect(control.availableMap['kube-virt-cred-test'].replacements.pullSecret).toEqual('cHVsbFNlY3JldERhdGE=') // notsecret
    expect(control.availableMap['kube-virt-cred-test'].replacements['ssh-publickey']).toEqual(
      'c3NoLXB1YmxpY2tleSBURVNUSU5HIGpvaG5kb2VAZW1haWwuY29t' // notsecret
    )
  })

  it('Correctly returns onChangeKubeVirtConnection without pull secret & ssh key', () => {
    const emptyControl = {
      availableMap: {
        'kube-virt-cred-test': {
          replacements: {
            pullSecret: 'cHVsbFNlY3JldERhdGE=', // notsecret
            'ssh-publickey': 'c3NoLXB1YmxpY2tleSBURVNUSU5HIGpvaG5kb2VAZW1haWwuY29t', // notsecret
            encoded: true,
          },
        },
      },
      available: ['kube-virt-cred-test'],
    }

    onChangeKubeVirtConnection(emptyControl)

    expect(emptyControl.availableMap['kube-virt-cred-test'].replacements.pullSecret).toEqual('cHVsbFNlY3JldERhdGE=') // notsecret
    expect(emptyControl.availableMap['kube-virt-cred-test'].replacements['ssh-publickey']).toEqual(
      'c3NoLXB1YmxpY2tleSBURVNUSU5HIGpvaG5kb2VAZW1haWwuY29t' // notsecret
    )
  })

  it('Correctly sets available storage classes', () => {
    const control = {
      controlId: 'storageClassName',
      isLoading: false,
      isLoaded: true,
      hasReplacements: true,
      availableMap: {
        'gp3-csi': {
          replacements: {
            storageClassName: 'gp3-csi',
          },
        },
      },
      available: [],
    }

    const result = {
      loading: false,
      data: [
        {
          metadata: {
            name: 'storageclass1',
          },
          provisioner: 'test.com',
          parameters: {
            encrypted: 'true',
            type: 'sc1',
          },
          reclaimPolicy: 'Delete',
          allowVolumeExpansion: true,
          volumeBindingMode: 'WaitForFirstConsumer',
          apiVersion: 'storage.k8s.io/v1',
          kind: 'StorageClass',
        },
        {
          metadata: {
            name: 'storageclass2',
            annotations: {
              'storageclass.kubernetes.io/is-default-class': 'true',
            },
          },
          provisioner: 'test.com',
          parameters: {
            encrypted: 'true',
            type: 'sc2',
          },
          reclaimPolicy: 'Delete',
          allowVolumeExpansion: true,
          volumeBindingMode: 'WaitForFirstConsumer',
          apiVersion: 'storage.k8s.io/v1',
          kind: 'StorageClass',
        },
      ],
    }

    setAvailableStorageClasses(control, result)

    expect(control).toMatchSnapshot()
  })
})
