/* Copyright Contributors to the Open Cluster Management project */
import { ClusterImageSet, ClusterImageSetApiVersion, ClusterImageSetKind } from '../../../../../../../../resources'
import { getClusterImageVersion, getDefaultNetworkType } from './utils'

const clusterImageSet1: ClusterImageSet = {
    apiVersion: ClusterImageSetApiVersion,
    kind: ClusterImageSetKind,
    metadata: {
        name: 'ocp-release46',
    },
    spec: {
        releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.6.15-x86_64',
    },
}

const clusterImageSet2: ClusterImageSet = {
    apiVersion: ClusterImageSetApiVersion,
    kind: ClusterImageSetKind,
    metadata: {
        name: 'ocp-release411',
    },
    spec: {
        releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.11.15-x86_64',
    },
}
const mockClusterImageSet = [clusterImageSet1, clusterImageSet2]

describe('Hypeshift utility functions', () => {
    test('getDefaultNetworkType', () => {
        expect(getDefaultNetworkType()).toBe('OVNKubernetes')
        expect(getDefaultNetworkType('foo')).toBe('OVNKubernetes')
        expect(getDefaultNetworkType('4.12')).toBe('OVNKubernetes')
        expect(getDefaultNetworkType('4.13')).toBe('OVNKubernetes')
        expect(getDefaultNetworkType('4.13.1')).toBe('OVNKubernetes')
        expect(getDefaultNetworkType('4.11')).toBe('OVNKubernetes')
        expect(getDefaultNetworkType('4.11.5')).toBe('OVNKubernetes')

        expect(getDefaultNetworkType('4.10')).toBe('OpenShiftSDN')
        expect(getDefaultNetworkType('4.10.5')).toBe('OpenShiftSDN')
        expect(getDefaultNetworkType('4.09')).toBe('OpenShiftSDN')
        expect(getDefaultNetworkType('4.10-foo')).toBe('OpenShiftSDN')
    })

    test('getClusterImageVersion', () => {
        expect(getClusterImageVersion([], '4.12')).toBe('4.12')
        expect(getClusterImageVersion(mockClusterImageSet, 'ocp-release411')).toBe('4.11.15')
    })
})
