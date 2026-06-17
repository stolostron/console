// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { render, screen } from '@testing-library/react'
import i18next from 'i18next'
import { Warning } from '../Warning'
import { setAvailableStorageClasses } from './ControlDataHelpers'
import { getControlDataKubeVirt } from './ControlDataKubeVirt'
import { useOperatorCatalog } from '../../../../../../lib/operator-catalog-utils'

jest.mock('../../../../../../lib/operator-catalog-utils')

const mockOcpImages = [
  {
    metadata: { name: 'img-415' },
    spec: { releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.15.36-multi' },
  },
  {
    metadata: { name: 'img-414' },
    spec: { releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.14.10-multi' },
  },
  {
    metadata: { name: 'img-416' },
    spec: { releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.16.0-x86_64' },
  },
  {
    metadata: { name: 'img-415rc' },
    spec: { releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.15-rc.1-multi' },
  },
]

jest.mock('./ControlDataHelpers', () => {
  const actual = jest.requireActual('./ControlDataHelpers')
  return {
    ...actual,
    LOAD_OCP_IMAGES: jest.fn((provider, translate) => {
      const original = actual.LOAD_OCP_IMAGES(provider, translate)
      return {
        ...original,
        query: jest.fn().mockResolvedValue(mockOcpImages),
      }
    }),
  }
})

const t = i18next.t.bind(i18next)
const handleModalToggle = jest.fn()

const findControl = (controlData, id) => controlData.find((control) => control.id === id)

describe('Cluster creation control data for KubeVirt', () => {
  beforeEach(() => {
    useOperatorCatalog.mockReturnValue({
      buildSearchUrl: jest.fn((keyword) => `/catalog/all-namespaces?keyword=${encodeURIComponent(keyword)}`),
      buildCategoryUrl: jest.fn((category) => `/catalog/ns/default?category=${encodeURIComponent(category)}`),
      buildDetailsUrl: jest.fn((operatorId) => `/catalog/all-namespaces?selectedId=${encodeURIComponent(operatorId)}`),
      isLoading: false,
    })
  })

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
    expect(getControlDataKubeVirt(t, handleModalToggle, true, <Warning />, true, {}, [])).toMatchSnapshot()
  })
  it('generates correctly for MCE', () => {
    expect(getControlDataKubeVirt(t, handleModalToggle, true, <Warning />, false, localCluster, [])).toMatchSnapshot()
  })

  it('omits automation controls when includeAutomation is false', () => {
    const controlData = getControlDataKubeVirt(t, handleModalToggle, false, null, true, {}, [])
    expect(findControl(controlData, 'automationStep')).toBeUndefined()
    expect(findControl(controlData, 'templateName')).toBeUndefined()
  })

  it('omits warning control when warning is not provided', () => {
    const controlData = getControlDataKubeVirt(t, handleModalToggle, true, null, true, {}, [])
    expect(findControl(controlData, 'warning')).toBeUndefined()
  })

  it('includes klusterlet addon config when enabled', () => {
    const controlData = getControlDataKubeVirt(t, handleModalToggle, true, null, true, {}, [])
    expect(findControl(controlData, 'includeKlusterletAddonConfig')?.active).toBe(true)
  })

  it('disables klusterlet addon config for MCE', () => {
    const controlData = getControlDataKubeVirt(t, handleModalToggle, true, null, false, localCluster, [])
    expect(findControl(controlData, 'includeKlusterletAddonConfig')?.active).toBe(false)
  })

  it('includes hosted cluster wizard steps and storage mapping groups', () => {
    const controlData = getControlDataKubeVirt(t, handleModalToggle, true, null, true, {}, [])
    expect(findControl(controlData, 'kubevirtDetailStep')?.title).toBe('Cluster details')
    expect(findControl(controlData, 'nodepoolsStep')?.title).toBe('Node pools')
    expect(findControl(controlData, 'storageMappingsStep')?.title).toBe('Storage mapping')
    expect(findControl(controlData, 'storageClassMapping')?.startWithNone).toBe(true)
    expect(findControl(controlData, 'volumeSnapshotClassMapping')?.startWithNone).toBe(true)
    expect(findControl(controlData, 'connection')?.providerId).toBe('kubevirt')
  })

  it('filters release images by hypershift supported versions', async () => {
    const controlData = getControlDataKubeVirt(t, handleModalToggle, true, null, true, {}, ['4.15', '4.16'])
    const releaseImage = findControl(controlData, 'releaseImage')
    const filtered = await releaseImage.fetchAvailable.query()
    expect(filtered.map((image) => image.metadata.name)).toEqual(['img-415', 'img-416'])
  })

  it('returns no release images when hypershift supported versions is empty', async () => {
    const controlData = getControlDataKubeVirt(t, handleModalToggle, true, null, true, {}, [])
    const releaseImage = findControl(controlData, 'releaseImage')
    const filtered = await releaseImage.fetchAvailable.query()
    expect(filtered).toHaveLength(0)
  })

  it('OperatorAlert links to operator catalog when console URL is available', () => {
    const controlData = getControlDataKubeVirt(t, handleModalToggle, true, null, true, localCluster, [])
    const operatorAlert = findControl(controlData, 'kubevirt-operator-alert')
    render(operatorAlert.component)
    expect(screen.getByText('Operator required')).toBeInTheDocument()
    // eslint-disable-next-line prettier/prettier
    expect(screen.getByText('OpenShift Virtualization operator is required to create a cluster.')).toBeInTheDocument()
    const installLink = screen.getByRole('link', { name: /install operator/i })
    expect(installLink).toHaveAttribute(
      'href',
      `${localCluster.consoleURL}/catalog/all-namespaces?keyword=${encodeURIComponent('Openshift Virtualization')}`
    )
  })

  it('OperatorAlert has empty install link when console URL is missing', () => {
    const controlData = getControlDataKubeVirt(t, handleModalToggle, true, null, true, {}, [])
    const operatorAlert = findControl(controlData, 'kubevirt-operator-alert')
    render(operatorAlert.component)
    const installLink = screen.getByRole('link', { name: /install operator/i })
    expect(installLink).toHaveAttribute('href', '')
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
