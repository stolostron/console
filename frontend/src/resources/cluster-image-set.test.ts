/* Copyright Contributors to the Open Cluster Management project */

import {
  ClusterImageSet,
  ClusterImageSetApiVersion,
  ClusterImageSetKind,
  getClusterImageSetVersionWithArch,
  getClusterImageSetVersion,
} from './cluster-image-set'

function makeClusterImageSet(
  overrides: Partial<Pick<ClusterImageSet, 'metadata' | 'spec'>> & { metadata: ClusterImageSet['metadata'] }
): ClusterImageSet {
  return {
    apiVersion: ClusterImageSetApiVersion,
    kind: ClusterImageSetKind,
    ...overrides,
  }
}

describe('getClusterImageSetVersion', () => {
  it('extracts version from releaseTag label (preferred source)', () => {
    const cis = makeClusterImageSet({
      metadata: {
        name: 'img4.21.3-multi-appsub',
        labels: {
          channel: 'fast',
          releaseTag: '4.21.3-multi',
          visible: 'true',
        },
      },
      spec: {
        releaseImage:
          'quay.io/openshift-release-dev/ocp-release@sha256:cfd89ec402bfddc4ab24026f43101aed0e68f7c6908989af0e9693f2736d613a',
      },
    })
    expect(getClusterImageSetVersion(cis)).toBe('4.21.3')
  })

  it('falls back to releaseImage when releaseTag is absent', () => {
    const cis = makeClusterImageSet({
      metadata: { name: 'ocp-release4.15.36' },
      spec: {
        releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.15.36-multi',
      },
    })
    expect(getClusterImageSetVersion(cis)).toBe('4.15.36')
  })

  it('falls back to metadata.name when releaseImage has no parseable version', () => {
    const cis = makeClusterImageSet({
      metadata: { name: 'img4.17.2-multi-appsub' },
      spec: {
        releaseImage: 'quay.io/openshift-release-dev/ocp-release@sha256:abcdef1234567890',
      },
    })
    expect(getClusterImageSetVersion(cis)).toBe('4.17.2')
  })

  it('returns major.minor when only two segments are available', () => {
    const cis = makeClusterImageSet({
      metadata: { name: 'img4.16-appsub' },
      spec: {
        releaseImage: 'quay.io/openshift-release-dev/ocp-release@sha256:abcdef1234567890',
      },
    })
    expect(getClusterImageSetVersion(cis)).toBe('4.16')
  })

  it('strips the suffix from releaseTag (returns numeric-only version)', () => {
    const cis = makeClusterImageSet({
      metadata: {
        name: 'img4.20.8-x86-64-appsub',
        labels: { releaseTag: '4.20.8-x86_64' },
      },
    })
    expect(getClusterImageSetVersion(cis)).toBe('4.20.8')
  })

  it('returns undefined when no version can be parsed', () => {
    const cis = makeClusterImageSet({
      metadata: { name: 'no-version-here' },
      spec: { releaseImage: 'registry.example.com/image@sha256:abc123' },
    })
    expect(getClusterImageSetVersion(cis)).toBeUndefined()
  })

  it('handles missing spec gracefully', () => {
    const cis = makeClusterImageSet({
      metadata: { name: 'img4.18.5-multi-appsub' },
    })
    expect(getClusterImageSetVersion(cis)).toBe('4.18.5')
  })

  it('handles missing labels gracefully', () => {
    const cis = makeClusterImageSet({
      metadata: { name: 'ocp-release4.14.10' },
      spec: {
        releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.14.10-x86_64',
      },
    })
    expect(getClusterImageSetVersion(cis)).toBe('4.14.10')
  })
})

describe('getClusterImageSetVersionWithArch', () => {
  it('extracts full version with suffix from releaseTag label', () => {
    const cis = makeClusterImageSet({
      metadata: {
        name: 'img4.21.3-multi-appsub',
        labels: {
          channel: 'fast',
          releaseTag: '4.21.3-multi',
          visible: 'true',
        },
      },
      spec: {
        releaseImage:
          'quay.io/openshift-release-dev/ocp-release@sha256:cfd89ec402bfddc4ab24026f43101aed0e68f7c6908989af0e9693f2736d613a',
      },
    })
    expect(getClusterImageSetVersionWithArch(cis)).toBe('4.21.3-multi')
  })

  it('extracts full version with architecture suffix from releaseTag', () => {
    const cis = makeClusterImageSet({
      metadata: {
        name: 'img4.20.8-x86-64-appsub',
        labels: { releaseTag: '4.20.8-x86_64' },
      },
    })
    expect(getClusterImageSetVersionWithArch(cis)).toBe('4.20.8-x86_64')
  })

  it('falls back to releaseImage when releaseTag is absent', () => {
    const cis = makeClusterImageSet({
      metadata: { name: 'ocp-release4.15.36' },
      spec: {
        releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.15.36-multi',
      },
    })
    expect(getClusterImageSetVersionWithArch(cis)).toBe('4.15.36-multi')
  })

  it('falls back to metadata.name when releaseImage has no parseable version', () => {
    const cis = makeClusterImageSet({
      metadata: { name: 'img4.17.2-multi-appsub' },
      spec: {
        releaseImage: 'quay.io/openshift-release-dev/ocp-release@sha256:abcdef1234567890',
      },
    })
    expect(getClusterImageSetVersionWithArch(cis)).toBe('4.17.2-multi')
  })

  it('returns version without suffix when none is present', () => {
    const cis = makeClusterImageSet({
      metadata: {
        name: 'img4.19.0-appsub',
        labels: { releaseTag: '4.19.0' },
      },
    })
    expect(getClusterImageSetVersionWithArch(cis)).toBe('4.19.0')
  })

  it('returns undefined when no version can be parsed', () => {
    const cis = makeClusterImageSet({
      metadata: { name: 'no-version-here' },
      spec: { releaseImage: 'registry.example.com/image@sha256:abc123' },
    })
    expect(getClusterImageSetVersionWithArch(cis)).toBeUndefined()
  })

  it('handles missing spec gracefully', () => {
    const cis = makeClusterImageSet({
      metadata: { name: 'img4.18.5-multi-appsub' },
    })
    expect(getClusterImageSetVersionWithArch(cis)).toBe('4.18.5-multi')
  })
})
