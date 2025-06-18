import { useHistory } from 'react-router-dom'
import { EditMode } from '../../src'
import { Catalog } from '../Catalog'
import { IResource } from '../../src/common/resource'
import { PlacementApiGroup, PlacementKind, PlacementType } from '../common/resources/IPlacement'
import { PlacementBindingApiVersion, PlacementBindingKind, PlacementBindingType } from '../common/resources/IPlacementBinding'
import { PlacementRuleKind, PlacementRuleType } from '../common/resources/IPlacementRule'
import { PolicySetApiGroup, PolicySetKind } from '../common/resources/IPolicySet'
import { clusters, clusterSetBindings, clusterSets, namespaces, placementRules, placements, policies } from '../common/test-data'
import { onSubmit } from '../common/utils'
import { RouteE } from '../Routes'
import { PlacementWizard } from './PlacementWizard'

export function onCancel(history: { push: (location: string) => void }) {
    history.push(`./${RouteE.Placement}`)
}

export function PlacementExamples() {
    const history = useHistory()
    return (
        <Catalog
            title="Placement Examples"
            breadcrumbs={[{ label: 'Example Wizards', to: RouteE.Wizards }, { label: 'Placement Examples' }]}
            cards={[
                {
                    title: 'Create placement',
                    descriptions: ['Create a new placement.'],
                    onClick: () => history.push(RouteE.CreatePlacement),
                },
                {
                    title: 'Create placement rule',
                    descriptions: ['Create a new placement rule.'],
                    onClick: () => history.push(RouteE.CreatePlacementRule),
                },
                {
                    title: 'Edit placement',
                    featureGroups: [{ title: 'Features', features: ['Placement', 'Placement binding'] }],
                    onClick: () => history.push(RouteE.EditPlacement),
                },
                {
                    title: 'Edit placement rule',
                    featureGroups: [{ title: 'Features', features: ['Placement rule', 'Placement binding'] }],
                    onClick: () => history.push(RouteE.EditPlacementRule),
                },
                {
                    title: 'Edit placements and placement rules',
                    featureGroups: [{ title: 'Features', features: ['2 placements', '2 placement rules', '2 placement bindings'] }],
                    onClick: () => history.push(RouteE.EditPlacements),
                },
            ]}
            onBack={() => history.push(RouteE.Wizards)}
        />
    )
}

export function CreatePlacement() {
    const history = useHistory()
    return (
        <PlacementWizard
            title="Create placement"
            namespaces={namespaces}
            policies={policies}
            placements={placements}
            placementRules={placementRules}
            clusterSets={clusterSets}
            clusterSetBindings={clusterSetBindings}
            onSubmit={onSubmit}
            onCancel={() => onCancel(history)}
            defaultPlacementType={PlacementKind}
            bindingSubjectKind={PolicySetKind}
            bindingSubjectApiGroup={PolicySetApiGroup}
            resources={[]}
            clusters={clusters}
        />
    )
}

export function CreatePlacementRule() {
    const history = useHistory()
    return (
        <PlacementWizard
            title="Create placement rule"
            namespaces={namespaces}
            policies={policies}
            placements={placements}
            placementRules={placementRules}
            clusterSets={clusterSets}
            clusterSetBindings={clusterSetBindings}
            onSubmit={onSubmit}
            onCancel={() => onCancel(history)}
            defaultPlacementType={PlacementRuleKind}
            bindingSubjectKind={PolicySetKind}
            bindingSubjectApiGroup={PolicySetApiGroup}
            resources={[{ ...PlacementRuleType, metadata: { name: '', namespace: '' } }]}
            clusters={clusters}
        />
    )
}

export function EditPlacement() {
    const history = useHistory()
    return (
        <PlacementWizard
            namespaces={namespaces}
            policies={policies}
            clusterSets={clusterSets}
            clusterSetBindings={clusterSetBindings}
            placements={placements}
            placementRules={placementRules}
            title="Edit placement"
            onSubmit={onSubmit}
            onCancel={() => onCancel(history)}
            editMode={EditMode.Edit}
            resources={[...placement1Resources]}
            defaultPlacementType={PlacementKind}
            bindingSubjectKind={PolicySetKind}
            bindingSubjectApiGroup={PolicySetApiGroup}
            clusters={clusters}
        />
    )
}

export function EditPlacementRule() {
    const history = useHistory()
    return (
        <PlacementWizard
            namespaces={namespaces}
            policies={policies}
            clusterSets={clusterSets}
            clusterSetBindings={clusterSetBindings}
            placements={placements}
            placementRules={placementRules}
            title="Edit placement rule"
            onSubmit={onSubmit}
            onCancel={() => onCancel(history)}
            editMode={EditMode.Edit}
            resources={[...placementRule1Resources]}
            defaultPlacementType={PlacementRuleKind}
            bindingSubjectKind={PolicySetKind}
            bindingSubjectApiGroup={PolicySetApiGroup}
            clusters={clusters}
        />
    )
}

export function EditPlacements() {
    const history = useHistory()
    return (
        <PlacementWizard
            namespaces={namespaces}
            policies={policies}
            clusterSets={clusterSets}
            clusterSetBindings={clusterSetBindings}
            placements={placements}
            placementRules={placementRules}
            title="Edit placements"
            onSubmit={onSubmit}
            onCancel={() => onCancel(history)}
            editMode={EditMode.Edit}
            resources={[...placement1Resources, ...placement2Resources, ...placementRule1Resources, ...placementRule2Resources]}
            defaultPlacementType={PlacementRuleKind}
            bindingSubjectKind={PolicySetKind}
            bindingSubjectApiGroup={PolicySetApiGroup}
            clusters={clusters}
        />
    )
}

const placement1Resources: IResource[] = [
    {
        ...PlacementType,
        metadata: { name: 'my-placement-1', namespace: 'my-namespace-1' },
        spec: {
            numberOfClusters: 1,
            clusterSets: ['my-cluster-set-1'],
            predicates: [
                {
                    requiredClusterSelector: {
                        labelSelector: {
                            matchLabels: {
                                'local-cluster': 'true',
                            },
                        },
                    },
                },
            ],
        },
    } as IResource,
    {
        ...PlacementBindingType,
        metadata: { name: 'my-placement-1-binding', namespace: 'my-namespace-1' },
        placementRef: { apiGroup: PlacementApiGroup, kind: PlacementKind, name: 'my-placement-1' },
        subjects: [],
    } as IResource,
]

const placement2Resources: IResource[] = [
    {
        ...PlacementType,
        metadata: {
            name: 'my-placement-2',
            namespace: 'my-namespace-1',
        },
        spec: {
            numberOfClusters: 1,
            clusterSets: ['policy-test-cluster-set'],
            predicates: [
                {
                    requiredClusterSelector: {
                        labelSelector: {
                            matchLabels: {
                                'local-cluster': 'true',
                                abc: '123',
                                def: '456',
                                ghi: '789',
                            },
                            matchExpressions: [
                                {
                                    key: 'abc',
                                    operator: 'In',
                                    values: ['123', '456', '789'],
                                },
                                {
                                    key: 'def',
                                    operator: 'NotIn',
                                    values: ['123', '456', '789'],
                                },
                                {
                                    key: 'ghi',
                                    operator: 'Exists',
                                },
                                {
                                    key: 'jkl',
                                    operator: 'DoesNotExist',
                                },
                            ],
                        },
                        claimSelector: {
                            matchExpressions: [
                                {
                                    key: 'abc',
                                    operator: 'In',
                                    values: ['123', '456', '789'],
                                },
                                {
                                    key: 'def',
                                    operator: 'NotIn',
                                    values: ['123', '456', '789'],
                                },
                                {
                                    key: 'ghi',
                                    operator: 'Exists',
                                },
                                {
                                    key: 'jkl',
                                    operator: 'DoesNotExist',
                                },
                            ],
                        },
                    },
                },
                {
                    requiredClusterSelector: {
                        labelSelector: {
                            matchLabels: {
                                'local-cluster': 'true',
                                abc: '123',
                                def: '456',
                                ghi: '789',
                            },
                            matchExpressions: [
                                {
                                    key: 'abc',
                                    operator: 'In',
                                    values: ['123', '456', '789'],
                                },
                                {
                                    key: 'def',
                                    operator: 'NotIn',
                                    values: ['123', '456', '789'],
                                },
                                {
                                    key: 'ghi',
                                    operator: 'Exists',
                                },
                                {
                                    key: 'jkl',
                                    operator: 'DoesNotExist',
                                },
                            ],
                        },
                        claimSelector: {
                            matchExpressions: [
                                {
                                    key: 'abc',
                                    operator: 'In',
                                    values: ['123', '456', '789'],
                                },
                                {
                                    key: 'def',
                                    operator: 'NotIn',
                                    values: ['123', '456', '789'],
                                },
                                {
                                    key: 'ghi',
                                    operator: 'Exists',
                                },
                                {
                                    key: 'jkl',
                                    operator: 'DoesNotExist',
                                },
                            ],
                        },
                    },
                },
            ],
        },
    } as IResource,
    {
        ...PlacementBindingType,
        metadata: { name: 'my-placement-2-binding', namespace: 'my-namespace-1' },
        placementRef: { apiGroup: PlacementApiGroup, kind: PlacementKind, name: 'my-placement-2' },
        subjects: [],
    } as IResource,
]

const placementRule1Resources: IResource[] = [
    {
        ...PlacementRuleType,
        metadata: { name: 'my-placement-rule-1', namespace: 'my-namespace-1' },
        spec: {
            clusterSelector: {
                matchLabels: {
                    'local-cluster': 'true',
                },
            },
        },
    } as IResource,
    {
        apiVersion: PlacementBindingApiVersion,
        kind: PlacementBindingKind,
        metadata: { name: 'my-placement-rule-1-binding', namespace: 'my-namespace-1' },
        placementRef: { apiGroup: PlacementApiGroup, kind: PlacementKind, name: 'my-placement-rule-1' },
        subjects: [],
    } as IResource,
]

const placementRule2Resources: IResource[] = [
    {
        ...PlacementRuleType,
        metadata: { name: 'my-placement-rule-2', namespace: 'my-namespace-1' },
        spec: {
            clusterSelector: {
                matchLabels: { 'local-cluster': 'true' },
                matchExpressions: [
                    {
                        key: 'abc',
                        operator: 'In',
                        values: ['123', '456', '789'],
                    },
                    {
                        key: 'def',
                        operator: 'NotIn',
                        values: ['123', '456', '789'],
                    },
                    {
                        key: 'ghi',
                        operator: 'Exists',
                    },
                    {
                        key: 'jkl',
                        operator: 'DoesNotExist',
                    },
                ],
            },
        },
    } as IResource,
    {
        ...PlacementBindingType,
        metadata: { name: 'my-placement-rule-2-binding', namespace: 'my-namespace-1' },
        placementRef: { apiGroup: PlacementApiGroup, kind: PlacementKind, name: 'my-placement-rule-2' },
        subjects: [],
    } as IResource,
]
