/* Copyright Contributors to the Open Cluster Management project */
import { Fragment } from 'react'
import { useItem, WizSelect, WizArrayInput, WizTextInput } from '@patternfly-labs/react-form-wizard'
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
import { useTranslation } from '../../lib/acm-i18next'

export function PlacementBindings(props: {
  placementCount: number
  placementRuleCount: number
  placementBindingCount: number
  bindingSubjectKind: string
  bindingSubjectApiGroup?: string
  existingPlacements: IResource[]
  existingPlacementRules: IResource[]
}) {
  const { t } = useTranslation()
  return (
    <WizArrayInput
      id="placement-bindings"
      label={t('Placement bindings')}
      helperText={t(
        'To apply a resource to a cluster, the placement must be bound to the resource using a placement binding.'
      )}
      path={null}
      filter={(resource) => resource.kind === PlacementBindingKind}
      placeholder={t('Add placement binding')}
      collapsedContent="metadata.name"
      collapsedPlaceholder={t('Expand to enter binding')}
      defaultCollapsed
      isSection
      newValue={{
        ...PlacementBindingType,
        metadata: {},
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
  const { t } = useTranslation()
  return (
    <Fragment>
      <WizTextInput
        path="metadata.name"
        label={t('Binding name')}
        readonly={placementBinding.metadata?.uid !== undefined}
        required
        helperText={t('The placement binding name must be unique to the namespace.')}
        validation={validateKubernetesResourceName}
      />
      <WizSelect
        path="placementRef.kind"
        label={t('Placement kind')}
        helperText={t('The placement rule used to select clusters for placement.')}
        required
        options={[
          { label: t('Placement'), value: 'Placement' },
          { label: t('PlacementRule'), value: PlacementRuleKind },
        ]}
      />
      <WizTextInput
        path="placementRef.name"
        label={t('Placement name')}
        required
        hidden={(binding) => binding.placementRef?.kind !== PlacementKind}
        helperText={t('The placement name should match the name of a placement in this namespace..')}
        validation={validateKubernetesResourceName}
      />
      <WizTextInput
        path="placementRef.name"
        label={t('Placement rule name')}
        required
        hidden={(binding) => binding.placementRef?.kind !== PlacementRuleKind}
        helperText={t('The placement rule name should match the name of a placement rule in this namespace.')}
        validation={validateKubernetesResourceName}
      />
      <WizArrayInput
        path="subjects"
        label={t('Subjects')}
        helperText={t('Placement bindings can have multiple subjects which the placement is applied to.')}
        placeholder={t('Add placement subject')}
        collapsedContent="name"
        collapsedPlaceholder={t('Expand to enter subject')}
        newValue={{ apiGroup: props.bindingSubjectApiGroup, kind: props.bindingSubjectKind }}
      >
        <Subject />
      </WizArrayInput>
    </Fragment>
  )
}

function Subject() {
  const subject = useItem() as IPlacementSubject
  const { t } = useTranslation()
  return (
    <Fragment>
      <WizSelect
        path="kind"
        label={t('Subject kind')}
        required
        options={[
          { label: t('PolicySet'), value: 'PolicySet' },
          { label: t('Policy'), value: 'Policy' },
        ]}
        onValueChange={(value) => {
          switch (value) {
            case t('PolicySet'):
              subject.apiGroup = PolicySetApiGroup
              break
            case t('Policy'):
              subject.apiGroup = PolicyApiGroup
              break
          }
        }}
      />
      <WizTextInput
        path="name"
        label={t('Subject name')}
        required
        helperText={t('The subject name should match the name of a policy or policy set in this namespace.')}
        validation={validateKubernetesResourceName}
      />
    </Fragment>
  )
}
