/* Copyright Contributors to the Open Cluster Management project */
import { Fragment } from 'react'
import {
  EditMode,
  WizKeyValue,
  WizArrayInput,
  WizTextInput,
  useEditMode,
  useItem,
} from '@patternfly-labs/react-form-wizard'
import { IResource } from '../common/resources/IResource'
import { IPlacementRule, PlacementRuleKind, PlacementRuleType } from '../common/resources/IPlacementRule'
import { useLabelValuesMap } from '../common/useLabelValuesMap'
import { validateKubernetesResourceName } from '../../lib/validation'
import { MatchExpression, MatchExpressionCollapsed } from './MatchExpression'
import { useTranslation } from '../../lib/acm-i18next'

export function PlacementRules(props: { clusters: IResource[] }) {
  const editMode = useEditMode()
  const { t } = useTranslation()
  return (
    <WizArrayInput
      id="placement-rules"
      label={t('Placement rules')}
      labelHelp={t('Placement rules determine which clusters a resources will be applied.')}
      path={null}
      isSection
      // hidden={() => !props.placementRuleCount }
      filter={(resource) => resource.kind === PlacementRuleKind}
      placeholder={t('Add placement rule')}
      collapsedContent="metadata.name"
      collapsedPlaceholder={t('Expand to enter placement rule')}
      newValue={{
        ...PlacementRuleType,
        metadata: {},
        spec: { clusterConditions: [{ status: 'True', type: 'ManagedClusterConditionAvailable' }] },
      }}
      defaultCollapsed={editMode !== EditMode.Create}
    >
      <PlacementRule clusters={props.clusters} />
    </WizArrayInput>
  )
}

export function PlacementRule(props: { clusters: IResource[]; hideName?: boolean }) {
  const editMode = useEditMode()
  const labelValuesMap = useLabelValuesMap(props.clusters)
  const placementRule = useItem() as IPlacementRule
  const { t } = useTranslation()
  const inputLabel = t('Label expressions')
  const addLabel = t('Add label expression')
  return (
    <Fragment>
      {!props.hideName && (
        <WizTextInput
          id="name"
          path="metadata.name"
          label={t('Name')}
          placeholder={t('Enter the name')}
          required
          readonly={placementRule.metadata?.uid !== undefined}
          helperText={t(
            'The name of the placement rule should match the placement rule name in a placement binding so that it is bound to a policy or policy set. The placement rule name must be unique to the namespace.'
          )}
          validation={validateKubernetesResourceName}
        />
      )}
      <WizKeyValue
        label={t('Label selectors')}
        path={`spec.clusterSelector.matchLabels`}
        labelHelp={t(
          'A label selector allows selection of clusters using cluster labels. A cluster must match all label selectors and label expressions to be selected.'
        )}
        placeholder={t('Add cluster label selector')}
        hidden={() => placementRule.spec?.clusterSelector?.matchLabels === undefined}
      />
      <WizArrayInput
        id="label-expressions"
        label={inputLabel}
        path="spec.clusterSelector.matchExpressions"
        labelHelp={t(
          'A label expressions allow selection of clusters using cluster labels. A cluster must match all label selectors and label expressions to be selected.'
        )}
        placeholder={addLabel}
        collapsedContent={<MatchExpressionCollapsed />}
        newValue={{ key: '', operator: 'In', values: [] }}
        defaultCollapsed={editMode !== EditMode.Create}
        helperText={t('A placement without any label selectors or label expressions will select all clusters.')}
        collapsedPlaceholder={t('Expand to edit')}
      >
        <MatchExpression labelValuesMap={labelValuesMap} />
      </WizArrayInput>
    </Fragment>
  )
}
