/* Copyright Contributors to the Open Cluster Management project */
import { EditMode, Step, WizardCancel, WizardPage, WizardSubmit } from '../../src'
import { IResource } from '../../src/common/resource'
import { IClusterSetBinding } from '../common/resources/IClusterSetBinding'
import { PlacementSection } from './PlacementSection'

export function PlacementWizard(props: {
  title: string
  namespaces: string[]
  policies: IResource[]
  placements: IResource[]
  clusters: IResource[]
  clusterSets: IResource[]
  clusterSetBindings: IClusterSetBinding[]
  editMode?: EditMode
  resources?: IResource[]
  onSubmit: WizardSubmit
  onCancel: WizardCancel
  bindingSubjectKind: string
  bindingSubjectApiGroup: string
  defaultPlacementType?: 'Placement'
}) {
  return (
    <WizardPage
      id="placement-wizard"
      title={props.title}
      onSubmit={props.onSubmit}
      onCancel={props.onCancel}
      editMode={props.editMode}
      defaultData={props.resources ?? []}
    >
      <Step label="Placement" id="placement">
        <PlacementSection
          existingPlacements={props.placements}
          existingClusterSets={props.clusterSets}
          existingClusterSetBindings={props.clusterSetBindings}
          bindingSubjectKind={props.bindingSubjectKind}
          bindingSubjectApiGroup={props.bindingSubjectApiGroup}
          clusters={props.clusters}
        />
      </Step>
    </WizardPage>
  )
}
