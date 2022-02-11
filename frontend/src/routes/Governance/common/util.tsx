/* Copyright Contributors to the Open Cluster Management project */
import {
    Placement,
    PlacementBinding,
    PlacementKind,
    PlacementRule,
    PlacementRuleKind,
    Policy,
    PolicySet,
} from '../../../resources'

export function getPlacementBindingsForResource(resource: Policy | PolicySet, placementBindings: PlacementBinding[]) {
    return placementBindings
        .filter((placementBinding) => placementBinding.metadata.namespace === resource.metadata.namespace)
        .filter((placementBinding) => placementBinding.subjects?.find((subject) => subject.kind === resource.kind))
        .filter((placementBinding) =>
            placementBinding.subjects?.find((subject) => subject.name === resource.metadata.name)
        )
}

export function getPlacementsForResource(
    resource: Policy | PolicySet,
    resourceBindings: PlacementBinding[],
    placements: Placement[]
) {
    return placements
        .filter((placement) => placement.metadata.namespace === resource.metadata.namespace)
        .filter((placement) =>
            resourceBindings.find(
                (placementBinding: PlacementBinding) =>
                    placementBinding.placementRef.kind === PlacementKind &&
                    placementBinding.placementRef.name === placement.metadata.name
            )
        )
}

export function getPlacementRulesForResource(
    resource: Policy | PolicySet,
    resourceBindings: PlacementBinding[],
    placementRules: PlacementRule[]
) {
    return placementRules
        .filter((placementRule) => placementRule.metadata.namespace === resource.metadata.namespace)
        .filter((placementRule) =>
            resourceBindings.find(
                (placementBinding: PlacementBinding) =>
                    placementBinding.placementRef.kind === PlacementRuleKind &&
                    placementBinding.placementRef.name === placementRule.metadata.name
            )
        )
}
