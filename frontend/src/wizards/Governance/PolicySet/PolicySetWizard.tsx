/* Copyright Contributors to the Open Cluster Management project */
import { Alert } from '@patternfly/react-core'
import get from 'get-value'
import { Fragment, ReactNode, useMemo } from 'react'
import {
  useItem,
  EditMode,
  ItemContext,
  WizItemSelector,
  Section,
  WizSingleSelect,
  Step,
  WizTableSelect,
  WizTextArea,
  WizardCancel,
  WizardSubmit,
  WizTextInput,
  Sync,
} from '@patternfly-labs/react-form-wizard'
import { WizardPage } from '../../WizardPage'
import { NavigationPath } from '../../../NavigationPath'
import { IResource } from '../../common/resources/IResource'
import { IClusterSetBinding } from '../../common/resources/IClusterSetBinding'
import { PlacementBindingKind, PlacementBindingType } from '../../common/resources/IPlacementBinding'
import { PlacementApiGroup, PlacementKind, PlacementType } from '../../common/resources/IPlacement'
import { PolicyApiVersion, PolicyKind } from '../../common/resources/IPolicy'
import { PolicySetApiGroup, PolicySetKind, PolicySetType } from '../../common/resources/IPolicySet'
import { validateKubernetesResourceName } from '../../../lib/validation'
import { PlacementSection } from '../../Placement/PlacementSection'
import { useTranslation } from '../../../lib/acm-i18next'
import { useWizardStrings } from '../../../lib/wizardStrings'

export interface PolicySetWizardProps {
  breadcrumb?: { text: string; to?: string }[]
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
  yamlEditor?: () => ReactNode
}

export function PolicySetWizard(props: PolicySetWizardProps) {
  const policySet = props.resources?.find((resource) => resource.kind === PolicySetKind)
  const { t } = useTranslation()
  const virtualPolicies = useMemo(() => {
    const virtualPolicies = [...props.policies]
    if (policySet) {
      const policies = get(policySet, 'spec.policies') ?? []
      for (const policyName of policies) {
        if (
          !virtualPolicies.find(
            (policy) =>
              policy.metadata?.name === policyName && policy.metadata?.namespace === policySet.metadata?.namespace
          )
        ) {
          virtualPolicies.push({
            apiVersion: PolicyApiVersion,
            kind: PolicyKind,
            metadata: {
              name: policyName,
              namespace: policySet.metadata?.namespace,
            },
          })
        }
      }
    }

    return virtualPolicies
  }, [policySet, props.policies])

  const translatedWizardStrings = useWizardStrings({
    stepsAriaLabel: t('Policy set steps'),
    contentAriaLabel: t('Policy set content'),
  })

  return (
    <WizardPage
      id="policy-set-wizard"
      wizardStrings={translatedWizardStrings}
      title={props.title}
      breadcrumb={props.breadcrumb}
      onSubmit={props.onSubmit}
      onCancel={props.onCancel}
      editMode={props.editMode}
      defaultData={
        props.resources ?? [
          {
            ...PolicySetType,
            metadata: { name: '', namespace: '' },
            spec: { description: '', policies: [] },
          },
          {
            ...PlacementType,
            metadata: { name: '', namespace: '' },
            spec: {},
          },
          {
            ...PlacementBindingType,
            metadata: { name: '', namespace: '' },
            placementRef: { apiGroup: PlacementApiGroup, kind: PlacementKind, name: '' },
            subjects: [{ apiGroup: PolicySetApiGroup, kind: PolicySetKind, name: '' }],
          } as IResource,
        ]
      }
      yamlEditor={props.yamlEditor}
    >
      <Step label={t('Details')} id="details-step">
        {props.editMode !== EditMode.Edit && (
          <Fragment>
            <Sync kind={PolicySetKind} path="metadata.name" suffix="-placement" />
            <Sync kind={PolicySetKind} path="metadata.name" suffix="-placement" />
            <Sync
              kind={PolicySetKind}
              path="metadata.name"
              targetKind={PlacementBindingKind}
              targetPath="subjects.0.name"
            />
          </Fragment>
        )}
        <Sync kind={PolicySetKind} path="metadata.namespace" />
        <Section label={t('Details')}>
          <WizItemSelector selectKey="kind" selectValue={PolicySetKind}>
            <ItemContext.Consumer>
              {(item: IResource) => (
                <Fragment>
                  <WizTextInput
                    label={t('Name')}
                    placeholder={t('Enter the name')}
                    path="metadata.name"
                    id="name"
                    required
                    validation={validateKubernetesResourceName}
                    readonly={item.metadata?.uid !== undefined}
                  />
                  <WizTextArea
                    label={t('Description')}
                    placeholder={t('Enter the description')}
                    path="spec.description"
                  />
                  <WizSingleSelect
                    label={t('Namespace')}
                    placeholder={t('Select the namespace')}
                    path="metadata.namespace"
                    id="namespace"
                    required
                    options={props.namespaces}
                    readonly={item.metadata?.uid !== undefined}
                  />
                </Fragment>
              )}
            </ItemContext.Consumer>
          </WizItemSelector>
        </Section>
      </Step>
      <Step label={t('Policies')} id="policies-step">
        <PoliciesSection policies={virtualPolicies} />
      </Step>
      <Step label={t('Placement')} id="placement-step">
        <PlacementSection
          existingClusterSets={props.clusterSets}
          existingClusterSetBindings={props.clusterSetBindings}
          createClusterSetCallback={() => open(NavigationPath.clusterSets, '_blank')}
          bindingSubjectKind={PolicySetKind}
          bindingSubjectApiGroup={PolicySetApiGroup}
          existingPlacements={props.placements}
          existingPlacementRules={props.placementRules}
          clusters={props.clusters}
          withoutOnlineClusterCondition
        />
      </Step>
    </WizardPage>
  )
}

function PoliciesSection(props: { policies: IResource[] }) {
  const resources = useItem() as IResource[]
  const { t } = useTranslation()
  const namespacedPolicies = useMemo(() => {
    if (!resources.find) return []
    const policySet = resources?.find((resource) => resource.kind === PolicySetKind)
    if (!policySet) return []
    const namespace = policySet.metadata?.namespace
    if (!namespace) return []
    return props.policies.filter((policy) => policy.metadata?.namespace === namespace)
  }, [props.policies, resources])

  // If at least one selected policy does not have a uid it is "missing" and we need to alert the user.
  const arePoliciesMissing = useMemo(() => {
    const policySet = resources?.find((resource) => resource.kind === PolicySetKind)
    if (policySet) {
      const selectedPolicies: string[] = get(policySet, 'spec.policies') ?? []
      return selectedPolicies.find((policy: string) =>
        namespacedPolicies.find((p: IResource) => p.metadata?.name === policy && !p.metadata?.uid)
      )
    }
    return false
  }, [resources, namespacedPolicies])

  return (
    <Section label={t('Policies')}>
      {arePoliciesMissing && (
        <Alert title={t('One or more selected policies can not be found.')} variant="warning" isInline />
      )}
      <WizItemSelector selectKey="kind" selectValue={PolicySetKind}>
        <WizTableSelect
          id="policies"
          path="spec.policies"
          label=""
          columns={[
            { name: t('Name'), cellFn: (policy: IResource) => policy.metadata?.name },
            { name: t('Namespace'), cellFn: (policy: IResource) => policy.metadata?.namespace },
            { name: '', cellFn: (policy: IResource) => (policy.metadata?.uid ? '' : t('Not found')) },
          ]}
          items={namespacedPolicies}
          itemToValue={(policy: IResource) => policy.metadata?.name}
          valueMatchesItem={(value: unknown, policy: IResource) => value === policy.metadata?.name}
          emptyTitle={t('No policies available for selection.')}
          emptyMessage={t('Select a namespace to be able to select policies in that namespace.')}
        />
      </WizItemSelector>
    </Section>
  )
}
