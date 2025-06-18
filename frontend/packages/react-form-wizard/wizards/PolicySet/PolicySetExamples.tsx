import { useHistory } from 'react-router-dom'
import { EditMode } from '../../src'
import { Catalog } from '../Catalog'
import { IResource } from '../../src/common/resource'
import { PlacementApiGroup, PlacementKind, PlacementType } from '../common/resources/IPlacement'
import { PlacementBindingType } from '../common/resources/IPlacementBinding'
import { PlacementRuleApiGroup, PlacementRuleKind, PlacementRuleType } from '../common/resources/IPlacementRule'
import { PolicySetApiGroup, PolicySetKind, PolicySetType } from '../common/resources/IPolicySet'
import { clusters, clusterSetBindings, clusterSets, namespaces, placementRules, placements, policies } from '../common/test-data'
import { onSubmit } from '../common/utils'
import { RouteE } from '../Routes'
import { PolicySetWizard } from './PolicySetWizard'

export function onCancel(history: { push: (location: string) => void }) {
    history.push(`./${RouteE.PolicySet}`)
}

export function PolicySetExamples() {
    const history = useHistory()
    return (
        <Catalog
            title="Policy Set Wizard Examples"
            breadcrumbs={[{ label: 'Example Wizards', to: RouteE.Wizards }, { label: 'Policy Set Wizard Examples' }]}
            filterGroups={[
                {
                    id: 'placements',
                    label: 'Placement Types',
                    filters: [{ value: 'Placement' }, { value: 'Placement Rule' }],
                },
            ]}
            cards={[
                {
                    title: 'Create policy set',
                    descriptions: ['Create a new policy set.'],
                    // featureGroups: [{ title: 'Features', features: ['Create a new policy set.'] }],
                    labels: ['PlacementRule'],
                    onClick: () => history.push(RouteE.CreatePolicySet),
                },
                {
                    title: 'Edit policy set with single placement',
                    featureGroups: [{ title: 'Features', features: ['Single placement'] }],
                    labels: ['Placement'],
                    onClick: () => history.push(RouteE.EditPolicySet1),
                },
                {
                    title: 'Edit policy set with two placements',
                    featureGroups: [{ title: 'Features', features: ['Two placements'] }],
                    labels: ['Placement'],
                    onClick: () => history.push(RouteE.EditPolicySet2),
                },
                {
                    title: 'Edit policy set with single placement rule',
                    featureGroups: [{ title: 'Features', features: ['Single placement rule'] }],
                    labels: ['Placement Rule'],
                    onClick: () => history.push(RouteE.EditPolicySet3),
                },
                {
                    title: 'Edit policy set with two placement rules',
                    featureGroups: [{ title: 'Features', features: ['Two placements rules'] }],
                    labels: ['Placement Rule'],
                    onClick: () => history.push(RouteE.EditPolicySet4),
                },
                {
                    title: 'Edit policy set with both placement types',
                    featureGroups: [{ title: 'Features', features: ['Two placements', 'Two placement rules'] }],
                    labels: ['Placement', 'Placement Rule'],
                    onClick: () => history.push(RouteE.EditPolicySet5),
                },
                // {
                //     title: 'Edit policy set with placement binding',
                //     featureGroups: [{ title: 'Features', features: ['Placement binding'] }],
                //     labels: ['Placement Binding'],
                //     onClick: () => history.push(RouteE.EditPolicySet6),
                // },
                // {
                //     title: 'Edit policy set with placement rule binding',
                //     featureGroups: [{ title: 'Features', features: ['Placement rule binding'] }],
                //     labels: ['Placement Rule Binding'],
                //     onClick: () => history.push(RouteE.EditPolicySet7),
                // },
                // {
                //     title: 'Edit policy set with both placement bindings',
                //     featureGroups: [{ title: 'Features', features: ['Placement binding', 'Placement rule binding'] }],
                //     labels: ['Placement Binding', 'Placement Rule Binding'],
                //     onClick: () => history.push(RouteE.EditPolicySet8),
                // },
            ]}
            onBack={() => history.push(RouteE.Wizards)}
        />
    )
}

export function CreatePolicySet() {
    const history = useHistory()
    return (
        <PolicySetWizard
            breadcrumb={[
                { label: 'Example Wizards', to: RouteE.Wizards },
                { label: 'Policy Set Wizard Examples', to: RouteE.PolicySet },
                { label: 'Create policy set' },
            ]}
            title="Create policy set"
            namespaces={namespaces}
            policies={policies}
            placements={placements}
            placementRules={placementRules}
            clusterSets={clusterSets}
            clusterSetBindings={clusterSetBindings}
            onSubmit={onSubmit}
            onCancel={() => onCancel(history)}
            clusters={clusters}
        />
    )
}

export function EditPolicySet1() {
    const history = useHistory()
    return (
        <PolicySetWizard
            namespaces={namespaces}
            policies={policies}
            clusterSets={clusterSets}
            clusterSetBindings={clusterSetBindings}
            placements={placements}
            placementRules={placementRules}
            title="Edit policy set"
            onSubmit={onSubmit}
            onCancel={() => onCancel(history)}
            editMode={EditMode.Edit}
            resources={policySetWithSinglePlacementResources}
            clusters={clusters}
        />
    )
}

export function EditPolicySet2() {
    const history = useHistory()
    return (
        <PolicySetWizard
            namespaces={namespaces}
            policies={policies}
            clusterSets={clusterSets}
            clusterSetBindings={clusterSetBindings}
            placements={placements}
            placementRules={placementRules}
            title="Edit policy set"
            onSubmit={onSubmit}
            onCancel={() => onCancel(history)}
            editMode={EditMode.Edit}
            resources={policySetWithTwoPlacementResources}
            clusters={clusters}
        />
    )
}

export function EditPolicySet3() {
    const history = useHistory()
    return (
        <PolicySetWizard
            namespaces={namespaces}
            policies={policies}
            clusterSets={clusterSets}
            clusterSetBindings={clusterSetBindings}
            placements={placements}
            placementRules={placementRules}
            title="Edit policy set"
            onSubmit={onSubmit}
            onCancel={() => onCancel(history)}
            editMode={EditMode.Edit}
            resources={policySetWithSinglePlacementRuleResources}
            clusters={clusters}
        />
    )
}

export function EditPolicySet4() {
    const history = useHistory()
    return (
        <PolicySetWizard
            namespaces={namespaces}
            policies={policies}
            clusterSets={clusterSets}
            clusterSetBindings={clusterSetBindings}
            placements={placements}
            placementRules={placementRules}
            title="Edit policy set"
            onSubmit={onSubmit}
            onCancel={() => onCancel(history)}
            editMode={EditMode.Edit}
            resources={policySetWithTwoPlacementRuleResources}
            clusters={clusters}
        />
    )
}

export function EditPolicySet5() {
    const history = useHistory()
    return (
        <PolicySetWizard
            namespaces={namespaces}
            policies={policies}
            clusterSets={clusterSets}
            clusterSetBindings={clusterSetBindings}
            placements={placements}
            placementRules={placementRules}
            title="Edit policy set"
            onSubmit={onSubmit}
            onCancel={() => onCancel(history)}
            editMode={EditMode.Edit}
            resources={policySetWithTwoPlacementAndTwoPlacementRuleResources}
            clusters={clusters}
        />
    )
}

export function EditPolicySet6() {
    const history = useHistory()
    return (
        <PolicySetWizard
            namespaces={namespaces}
            policies={policies}
            clusterSets={clusterSets}
            clusterSetBindings={clusterSetBindings}
            placements={placements}
            placementRules={placementRules}
            title="Edit policy set"
            onSubmit={onSubmit}
            onCancel={() => onCancel(history)}
            editMode={EditMode.Edit}
            resources={policySetWithPlacementBindingResources}
            clusters={clusters}
        />
    )
}

export function EditPolicySet7() {
    const history = useHistory()
    return (
        <PolicySetWizard
            namespaces={namespaces}
            policies={policies}
            clusterSets={clusterSets}
            clusterSetBindings={clusterSetBindings}
            placements={placements}
            placementRules={placementRules}
            title="Edit policy set"
            onSubmit={onSubmit}
            onCancel={() => onCancel(history)}
            editMode={EditMode.Edit}
            resources={policySetWithPlacementRuleBindingResources}
            clusters={clusters}
        />
    )
}

export function EditPolicySet8() {
    const history = useHistory()
    return (
        <PolicySetWizard
            namespaces={namespaces}
            policies={policies}
            clusterSets={clusterSets}
            clusterSetBindings={clusterSetBindings}
            placements={placements}
            placementRules={placementRules}
            title="Edit policy set"
            onSubmit={onSubmit}
            onCancel={() => onCancel(history)}
            editMode={EditMode.Edit}
            resources={policySetWithBindingsResources}
            clusters={clusters}
        />
    )
}

const policySetResource: IResource = {
    ...PolicySetType,
    metadata: { name: 'my-policy-set', namespace: 'my-namespace-1', uid: '00000000-0000-0000-0000-000000000000' },
    spec: { policies: ['my-policy-1', 'my-policy-2', 'my-policy-1000'] },
} as IResource

const singlePlacementResources: IResource[] = [
    {
        ...PlacementType,
        metadata: { name: 'my-policy-set-placement-1', namespace: 'my-namespace-1', uid: '00000000-0000-0000-0000-000000000000' },
        spec: {
            clusterSets: ['my-cluster-set-1'],
            predicates: [
                {
                    requiredClusterSelector: {
                        labelSelector: {
                            matchExpressions: [
                                { key: 'cloud', operator: 'In', values: ['Microsoft'] },
                                { key: 'vendor', operator: 'In', values: ['OpenShift'] },
                                { key: 'region', operator: 'In', values: ['east', 'west'] },
                                { key: 'environment', operator: 'NotIn', values: ['Production'] },
                            ],
                        },
                    },
                },
            ],
        },
    } as IResource,
    {
        ...PlacementBindingType,
        metadata: { name: 'my-policy-set-placement-1-binding', namespace: 'my-namespace-1', uid: '00000000-0000-0000-0000-000000000000' },
        placementRef: { apiGroup: PlacementApiGroup, kind: PlacementKind, name: 'my-policy-set-placement-1' },
        subjects: [{ apiGroup: PolicySetApiGroup, kind: PolicySetKind, name: 'my-policy-set' }],
    } as IResource,
]

const policySetWithSinglePlacementResources: IResource[] = [policySetResource, ...singlePlacementResources]

const twoPlacementResources: IResource[] = [
    ...singlePlacementResources,
    {
        ...PlacementType,
        metadata: { name: 'my-policy-set-placement-2', namespace: 'my-namespace-1', uid: '00000000-0000-0000-0000-000000000000' },
        spec: {
            numberOfClusters: 1,
            clusterSets: ['policy-test-cluster-set'],
            predicates: [
                {
                    requiredClusterSelector: {
                        labelSelector: {
                            matchExpressions: [
                                { key: 'cloud', operator: 'In', values: ['Amazon'] },
                                { key: 'vendor', operator: 'In', values: ['OpenShift'] },
                                { key: 'region', operator: 'In', values: ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2'] },
                                { key: 'environment', operator: 'NotIn', values: ['Production'] },
                            ],
                        },
                    },
                },
                {
                    requiredClusterSelector: {
                        labelSelector: {
                            matchExpressions: [
                                { key: 'cloud', operator: 'In', values: ['Google'] },
                                { key: 'vendor', operator: 'In', values: ['OpenShift'] },
                                { key: 'region', operator: 'In', values: ['us-east1', 'us-east4', 'us-west1', 'us-west2'] },
                                { key: 'environment', operator: 'NotIn', values: ['Production'] },
                            ],
                        },
                    },
                },
            ],
        },
    } as IResource,
    {
        ...PlacementBindingType,
        metadata: { name: 'my-policy-set-placement-2-binding', namespace: 'my-namespace-1', uid: '00000000-0000-0000-0000-000000000000' },
        placementRef: { apiGroup: PlacementApiGroup, kind: PlacementKind, name: 'my-policy-set-placement-2' },
        subjects: [{ apiGroup: PolicySetApiGroup, kind: PolicySetKind, name: 'my-policy-set' }],
    } as IResource,
]

const policySetWithTwoPlacementResources: IResource[] = [policySetResource, ...twoPlacementResources]

const singlePlacementRuleResources: IResource[] = [
    {
        ...PlacementRuleType,
        metadata: { name: 'my-policy-set-placement-rule-1', namespace: 'my-namespace-1', uid: '00000000-0000-0000-0000-000000000000' },
        spec: {
            clusterSelector: {
                matchExpressions: [
                    { key: 'cloud', operator: 'In', values: ['Amazon'] },
                    { key: 'vendor', operator: 'In', values: ['OpenShift'] },
                    { key: 'region', operator: 'In', values: ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2'] },
                    { key: 'environment', operator: 'NotIn', values: ['Production'] },
                ],
            },
        },
    } as IResource,
    {
        ...PlacementBindingType,
        metadata: {
            name: 'my-policy-set-placement-rule-1-binding',
            namespace: 'my-namespace-1',
            uid: '00000000-0000-0000-0000-000000000000',
        },
        placementRef: { apiGroup: PlacementRuleApiGroup, kind: PlacementRuleKind, name: 'my-policy-set-placement-rule-1' },
        subjects: [{ apiGroup: PolicySetApiGroup, kind: PolicySetKind, name: 'my-policy-set' }],
    } as IResource,
]

const policySetWithSinglePlacementRuleResources: IResource[] = [policySetResource, ...singlePlacementRuleResources]

const twoPlacementRuleResources: IResource[] = [
    ...policySetWithSinglePlacementRuleResources,
    {
        ...PlacementRuleType,
        metadata: { name: 'my-policy-set-placement-rule-2', namespace: 'my-namespace-1', uid: '00000000-0000-0000-0000-000000000000' },
        spec: {
            clusterSelector: {
                matchExpressions: [
                    { key: 'cloud', operator: 'In', values: ['Google'] },
                    { key: 'vendor', operator: 'In', values: ['OpenShift'] },
                    { key: 'region', operator: 'In', values: ['us-east1', 'us-east4', 'us-west1', 'us-west2'] },
                    { key: 'environment', operator: 'NotIn', values: ['Production'] },
                ],
            },
        },
    } as IResource,
    {
        ...PlacementBindingType,
        metadata: {
            name: 'my-policy-set-placement-rule-2-binding',
            namespace: 'my-namespace-1',
            uid: '00000000-0000-0000-0000-000000000000',
        },
        placementRef: { apiGroup: PlacementRuleApiGroup, kind: PlacementRuleKind, name: 'my-policy-set-placement-rule-2' },
        subjects: [{ apiGroup: PolicySetApiGroup, kind: PolicySetKind, name: 'my-policy-set' }],
    } as IResource,
]

const policySetWithTwoPlacementRuleResources: IResource[] = [policySetResource, ...twoPlacementRuleResources]

const policySetWithTwoPlacementAndTwoPlacementRuleResources: IResource[] = [
    policySetResource,
    ...twoPlacementResources,
    ...twoPlacementRuleResources,
]

const placementBindingResource: IResource = {
    ...PlacementBindingType,
    metadata: { name: 'my-policy-set-placement-binding', namespace: 'my-namespace-1', uid: '00000000-0000-0000-0000-000000000000' },
    placementRef: { apiGroup: PlacementApiGroup, kind: PlacementKind, name: 'my-placement-1' },
    subjects: [{ apiGroup: PolicySetApiGroup, kind: PolicySetKind, name: 'my-policy-set' }],
} as IResource

const placementRuleBindingResource: IResource = {
    ...PlacementBindingType,
    metadata: { name: 'my-policy-set-placement-rule-binding', namespace: 'my-namespace-1', uid: '00000000-0000-0000-0000-000000000000' },
    placementRef: { apiGroup: PlacementRuleApiGroup, kind: PlacementRuleKind, name: 'my-placement-rule-1' },
    subjects: [{ apiGroup: PolicySetApiGroup, kind: PolicySetKind, name: 'my-policy-set' }],
} as IResource

const policySetWithPlacementBindingResources: IResource[] = [policySetResource, placementBindingResource]
const policySetWithPlacementRuleBindingResources: IResource[] = [policySetResource, placementRuleBindingResource]
const policySetWithBindingsResources: IResource[] = [policySetResource, placementBindingResource, placementRuleBindingResource]
