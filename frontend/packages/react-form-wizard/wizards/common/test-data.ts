import { IPlacement, PlacementType } from '../common/resources/IPlacement'
import { IPlacementRule, PlacementRuleType } from '../common/resources/IPlacementRule'
import { IResource } from '../../src/common/resource'
import { ClusterSetBindingType, IClusterSetBinding } from './resources/IClusterSetBinding'
import { PolicyType } from './resources/IPolicy'

export const namespaces = ['default', 'my-namespace-1', 'my-namespace-2']

export const policies: IResource[] = [
    { ...PolicyType, metadata: { name: 'my-policy-1', namespace: 'my-namespace-1', uid: '1234' } },
    { ...PolicyType, metadata: { name: 'my-policy-2', namespace: 'my-namespace-1', uid: '1234' } },
    { ...PolicyType, metadata: { name: 'my-policy-3', namespace: 'my-namespace-2', uid: '1234' } },
    {
        ...PolicyType,
        metadata: { name: 'my-policy-4', namespace: 'my-namespace-2', uid: '1234' },
        spec: { 'policy-templates': [{ objectDefinition: { metadata: { name: 'policy-limitclusteradmin' } } }] },
    } as IResource,
]

export const clusterSets: IResource[] = [
    {
        ...ClusterSetBindingType,
        metadata: { name: 'my-cluster-set-1', namespace: 'my-namespace-1' },
    },
    {
        ...ClusterSetBindingType,
        metadata: { name: 'my-cluster-set-2', namespace: 'my-namespace-1' },
    },
    {
        ...ClusterSetBindingType,
        metadata: { name: 'my-cluster-set-3', namespace: 'my-namespace-2' },
    },
    {
        ...ClusterSetBindingType,
        metadata: { name: 'my-cluster-set-4', namespace: 'my-namespace-2' },
    },
    {
        ...ClusterSetBindingType,
        metadata: { name: 'my-cluster-set-5', namespace: 'server-1' },
    },
]

export const clusterSetBindings: IClusterSetBinding[] = [
    {
        ...ClusterSetBindingType,
        metadata: { name: 'my-cluster-set-1-binding', namespace: 'my-namespace-1' },
        spec: { clusterSet: 'my-cluster-set-1' },
    },
    {
        ...ClusterSetBindingType,
        metadata: { name: 'my-cluster-set-2-binding', namespace: 'my-namespace-1' },
        spec: { clusterSet: 'my-cluster-set-2' },
    },
    {
        ...ClusterSetBindingType,
        metadata: { name: 'my-cluster-set-3-binding', namespace: 'my-namespace-2' },
        spec: { clusterSet: 'my-cluster-set-3' },
    },
    {
        ...ClusterSetBindingType,
        metadata: { name: 'my-cluster-set-4-binding', namespace: 'my-namespace-2' },
        spec: { clusterSet: 'my-cluster-set-4' },
    },
    {
        ...ClusterSetBindingType,
        metadata: { name: 'my-cluster-set-5-binding', namespace: 'server-1' },
        spec: { clusterSet: 'my-cluster-set-5' },
    },
]

export const placements: IPlacement[] = [
    { ...PlacementType, metadata: { name: 'my-placement-1', namespace: 'my-namespace-1' } },
    { ...PlacementType, metadata: { name: 'my-placement-2', namespace: 'my-namespace-1' } },
    { ...PlacementType, metadata: { name: 'my-placement-3', namespace: 'my-namespace-2' } },
    { ...PlacementType, metadata: { name: 'my-placement-4', namespace: 'my-namespace-2' } },
    { ...PlacementType, metadata: { name: 'my-placement-5', namespace: 'server-1' } },
    { ...PlacementType, metadata: { name: 'my-placement-6', namespace: 'server-1' } },
]

export const placementRules: IPlacementRule[] = [
    { ...PlacementRuleType, metadata: { name: 'my-placement-rule-1', namespace: 'my-namespace-1' } },
    { ...PlacementRuleType, metadata: { name: 'my-placement-rule-2', namespace: 'my-namespace-1' } },
    { ...PlacementRuleType, metadata: { name: 'my-placement-rule-3', namespace: 'my-namespace-2' } },
    { ...PlacementRuleType, metadata: { name: 'my-placement-rule-4', namespace: 'my-namespace-2' } },
]

const ClusterType = {
    apiVersion: 'TODO',
    kind: 'ManagedCluster',
}
export const clusters: IResource[] = [
    {
        ...ClusterType,
        metadata: {
            name: 'my-cluster-1',
            namespace: 'my-namespace-1',
            labels: { name: 'my-cluster-1', region: 'east', cloud: 'Microsoft', vendor: 'Openshift', environment: 'Production' },
        },
    },
    {
        ...ClusterType,
        metadata: {
            name: 'my-cluster-1',
            namespace: 'my-namespace-1',
            labels: { name: 'my-cluster-1', region: 'us-east-1', cloud: 'Google', vendor: 'Openshift', environment: 'Production' },
        },
    },
    {
        ...ClusterType,
        metadata: {
            name: 'my-cluster-2',
            namespace: 'my-namespace-1',
            labels: { name: 'my-cluster-2', region: 'us-east-2', cloud: 'Amazon', vendor: 'Openshift', environment: 'Development' },
        },
    },
    {
        ...ClusterType,
        metadata: {
            name: 'my-cluster-3',
            namespace: 'my-namespace-2',
            labels: { name: 'my-cluster-3', region: 'us-west1', cloud: 'Google', vendor: 'Openshift', environment: 'Development' },
        },
    },
    {
        ...ClusterType,
        metadata: {
            name: 'my-cluster-4',
            namespace: 'my-namespace-2',
            labels: { name: 'my-cluster-4', region: 'us-west2', cloud: 'Google', vendor: 'Openshift', environment: 'Test' },
        },
    },
]
