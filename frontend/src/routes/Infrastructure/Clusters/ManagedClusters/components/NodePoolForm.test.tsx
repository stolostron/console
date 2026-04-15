/* Copyright Contributors to the Open Cluster Management project */

import { HostedClusterK8sResource, OpenshiftVersionOptionType } from '@openshift-assisted/ui-lib/cim'
import { render, screen } from '@testing-library/react'
import { clickByRole, waitForRole } from '../../../../../lib/test-util'
import { Cluster, ClusterStatus, HypershiftCloudPlatformType } from '../../../../../resources/utils'
import { Provider } from '../../../../../ui-components'
import { NodePoolForm } from './NodePoolForm'

jest.mock('@openshift-assisted/ui-lib/cim', () => {
  const actual = jest.requireActual('@openshift-assisted/ui-lib/cim')
  return {
    ...actual,
    getOCPVersions: jest.fn(() => [] as OpenshiftVersionOptionType[]),
  }
})

const { getOCPVersions } = jest.requireMock('@openshift-assisted/ui-lib/cim') as {
  getOCPVersions: jest.Mock
}

function mockCluster(version: string): Cluster {
  return {
    name: 'test-cluster',
    namespace: 'clusters',
    uid: '',
    status: ClusterStatus.ready,
    isHive: false,
    isManaged: true,
    isCurator: false,
    isHostedCluster: true,
    isRegionalHubCluster: false,
    hasAutomationTemplate: false,
    hive: { isHibernatable: false },
    provider: Provider.aws,
    distribution: { ocp: { version } },
    labels: {},
    nodes: { ready: 0, unhealthy: 0, unknown: 0, nodeList: [] },
    isManagedOpenShift: false,
  } as unknown as Cluster
}

function mockHostedCluster(version: string): HostedClusterK8sResource {
  return {
    apiVersion: 'hypershift.openshift.io/v1beta1',
    kind: 'HostedCluster',
    metadata: { name: 'test-cluster', namespace: 'clusters' },
    spec: {
      release: { image: `quay.io/openshift-release-dev/ocp-release:${version}-multi` },
      infraID: 'test-infra-id',
      platform: { type: HypershiftCloudPlatformType.AWS },
    },
  } as unknown as HostedClusterK8sResource
}

function makeImageVersions(versions: string[]): OpenshiftVersionOptionType[] {
  return versions.map((v) => ({
    label: v,
    value: v,
    version: v,
    default: false,
    supportLevel: 'production' as const,
  }))
}

function fakeClusterImageSets(versions: string[]) {
  return versions.map((v) => ({
    apiVersion: 'hive.openshift.io/v1',
    kind: 'ClusterImageSet',
    metadata: { name: `img${v}` },
    spec: { releaseImage: `quay.io/openshift-release-dev/ocp-release:${v}-multi` },
  }))
}

function renderNodePoolForm(clusterVersion: string, imageVersions: string[]) {
  getOCPVersions.mockReturnValue(makeImageVersions(imageVersions))
  return render(
    <NodePoolForm
      cluster={mockCluster(clusterVersion)}
      hostedCluster={mockHostedCluster(clusterVersion)}
      close={jest.fn()}
      clusterImages={fakeClusterImageSets(imageVersions)}
    />
  )
}

async function openVersionDropdown() {
  await waitForRole('combobox', { name: /openshift version/i })
  await clickByRole('combobox', { name: /openshift version/i })
}

function getDropdownOptionTexts(): string[] {
  return screen.getAllByRole('option').map((o) => o.textContent ?? '')
}

describe('NodePoolForm image filtering', () => {
  beforeEach(() => {
    getOCPVersions.mockReset()
  })

  it('should exclude versions greater than the cluster version via compareVersions', async () => {
    renderNodePoolForm('4.14.5', ['4.14.5', '4.14.3', '4.15.0', '4.12.0'])
    await openVersionDropdown()

    const options = getDropdownOptionTexts()
    expect(options).toContain('4.14.5')
    expect(options).toContain('4.14.3')
    expect(options).toContain('4.12.0')
    expect(options).not.toContain('4.15.0')
  })

  it('should include images within 2 minor versions via numeric isWithinTwoVersions', async () => {
    renderNodePoolForm('4.14.0', ['4.14.0', '4.13.0', '4.12.0', '4.11.0'])
    await openVersionDropdown()

    const options = getDropdownOptionTexts()
    expect(options).toContain('4.14.0')
    expect(options).toContain('4.13.0')
    expect(options).toContain('4.12.0')
    expect(options).not.toContain('4.11.0')
  })

  it('should reject images below version 4.11.0 via isValidImage', async () => {
    renderNodePoolForm('4.14.0', ['4.14.0', '4.13.0', '4.10.5', '3.11.0'])
    await openVersionDropdown()

    const options = getDropdownOptionTexts()
    expect(options).toContain('4.14.0')
    expect(options).toContain('4.13.0')
    expect(options).not.toContain('4.10.5')
    expect(options).not.toContain('3.11.0')
  })

  it('should accept 5.x images when cluster is 5.x (isValidImage for major > 4)', async () => {
    renderNodePoolForm('5.0.0', ['5.0.0', '4.17.0'])
    await openVersionDropdown()

    const options = getDropdownOptionTexts()
    expect(options).toContain('5.0.0')
    expect(options).not.toContain('4.17.0')
  })

  it('should exclude images from different major versions via isWithinTwoVersions', async () => {
    renderNodePoolForm('5.0.0', ['5.0.0', '4.17.0', '4.16.0'])
    await openVersionDropdown()

    const options = getDropdownOptionTexts()
    expect(options).toContain('5.0.0')
    expect(options).not.toContain('4.17.0')
    expect(options).not.toContain('4.16.0')
  })
})
