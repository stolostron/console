/* Copyright Contributors to the Open Cluster Management project */
import { Fragment } from 'react'
import { useItem, Select, WizArrayInput, WizTextInput } from '@patternfly-labs/react-form-wizard'
import { IResource } from '../common/resources/IResource'
import { PlacementApiGroup, PlacementKind } from '../common/resources/IPlacement'
import {
    IPlacementBinding,
    IPlacementSubject,
    PlacementBindingKind,
    PlacementBindingType,
} from '../common/resources/IPlacementBinding'
import { PlacementRuleKind } from '../common/resources/IPlacementRule'
import { PolicyApiGroup } from '../common/resources/IPolicy'
import { PolicySetApiGroup } from '../common/resources/IPolicySet'
import { validateKubernetesResourceName } from '../../lib/validation'

export function PlacementBindings(props: {
    placementCount: number
    placementRuleCount: number
    placementBindingCount: number
    bindingSubjectKind: string
    bindingSubjectApiGroup?: string
    existingPlacements: IResource[]
    existingPlacementRules: IResource[]
}) {
    return (
        <WizArrayInput
            id="placement-bindings"
            label="Placement bindings"
            helperText="To apply a resource to a cluster, the placement must be bound to the resource using a placement binding."
            path={null}
            filter={(resource) => resource.kind === PlacementBindingKind}
            placeholder="Add placement binding"
            collapsedContent="metadata.name"
            collapsedPlaceholder="Expand to enter binding"
            defaultCollapsed
            isSection
            newValue={{
                ...PlacementBindingType,
                metadata: {},
                // TODO default? - Placement vs PlacementRule
                placementRef: { apiGroup: PlacementApiGroup, kind: PlacementKind, name: '' },
                subjects: [{ apiGroup: props.bindingSubjectApiGroup, kind: props.bindingSubjectKind, name: '' }],
            }}
        >
            <PlacementBinding
                bindingSubjectKind={props.bindingSubjectKind}
                bindingSubjectApiGroup={props.bindingSubjectApiGroup}
            />
        </WizArrayInput>
    )
}

function PlacementBinding(props: { bindingSubjectKind: string; bindingSubjectApiGroup?: string }) {
    const placementBinding: IPlacementBinding = useItem()
    return (
        <Fragment>
            <WizTextInput
                path="metadata.name"
                label="Binding name"
                readonly={placementBinding.metadata?.uid !== undefined}
                required
                helperText="The placement binding name must be unique to the namespace."
                validation={validateKubernetesResourceName}
            />
            <Select
                path="placementRef.kind"
                label="Placement kind"
                helperText="The placement rule used to select clusters for placement."
                required
                options={['Placement', PlacementRuleKind]}
            />
            <WizTextInput
                path="placementRef.name"
                label="Placement name"
                required
                hidden={(binding) => binding.placementRef?.kind !== PlacementKind}
                helperText="The placement name should match the name of a placement in this namespace.."
                validation={validateKubernetesResourceName}
            />
            <WizTextInput
                path="placementRef.name"
                label="Placement rule name"
                required
                hidden={(binding) => binding.placementRef?.kind !== PlacementRuleKind}
                helperText="The placement rule name should match the name of a placement rule in this namespace."
                validation={validateKubernetesResourceName}
            />
            <WizArrayInput
                path="subjects"
                label="Subjects"
                helperText="Placement bindings can have multiple subjects which the placement is applied to."
                placeholder="Add placement subject"
                collapsedContent="name"
                collapsedPlaceholder="Expand to enter subject"
                newValue={{ apiGroup: props.bindingSubjectApiGroup, kind: props.bindingSubjectKind }}
            >
                <Subject />
            </WizArrayInput>
        </Fragment>
    )
}

function Subject() {
    const subject = useItem() as IPlacementSubject
    return (
        <Fragment>
            <Select
                path="kind"
                label="Subject kind"
                required
                options={['PolicySet', 'Policy']}
                onValueChange={(value) => {
                    switch (value) {
                        case 'PolicySet':
                            subject.apiGroup = PolicySetApiGroup
                            break
                        case 'Policy':
                            subject.apiGroup = PolicyApiGroup
                            break
                    }
                }}
            />
            <WizTextInput
                path="name"
                label="Subject name"
                required
                helperText="The subject name should match the name of a policy or policy set in this namespace."
                validation={validateKubernetesResourceName}
            />
        </Fragment>
    )
}
