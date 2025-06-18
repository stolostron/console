import { EditMode, Step, WizardCancel, WizardPage, WizardSubmit } from '../../src'
import { IResource } from '../../src/common/resource'
import { IClusterSetBinding } from '../common/resources/IClusterSetBinding'
import { PlacementSection } from './PlacementSection'

export function PlacementWizard(props: {
    title: string
    namespaces: string[]
    policies: IResource[]
    placements: IResource[]
    placementRules: IResource[]
    clusters: IResource[]
    clusterSets: IResource[]
    clusterSetBindings: IClusterSetBinding[]
    editMode?: EditMode
    resources?: IResource[]
    onSubmit: WizardSubmit
    onCancel: WizardCancel
    bindingSubjectKind: string
    bindingSubjectApiGroup: string
    defaultPlacementType: 'Placement' | 'PlacementRule'
}) {
    return (
        <WizardPage
            title={props.title}
            onSubmit={props.onSubmit}
            onCancel={props.onCancel}
            editMode={props.editMode}
            defaultData={props.resources ?? []}
        >
            <Step label="Placement" id="placement">
                <PlacementSection
                    existingPlacements={props.placements}
                    existingPlacementRules={props.placementRules}
                    existingClusterSets={props.clusterSets}
                    existingClusterSetBindings={props.clusterSetBindings}
                    bindingSubjectKind={props.bindingSubjectKind}
                    bindingSubjectApiGroup={props.bindingSubjectApiGroup}
                    defaultPlacementKind={props.defaultPlacementType}
                    clusters={props.clusters}
                />
            </Step>
        </WizardPage>
    )
}
