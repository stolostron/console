/* Copyright Contributors to the Open Cluster Management project */
import {
  EditMode,
  useData,
  useEditMode,
  useItem,
  WizArrayInput,
  WizCheckbox,
  WizKeyValue,
  WizMultiSelect,
  WizNumberInput,
  WizTextInput,
  WizSingleSelect,
  WizLabelSelect,
} from '@patternfly-labs/react-form-wizard'
import { Button, Divider, ExpandableSection, Label } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import get from 'get-value'
import { Fragment, ReactNode, useMemo, useState } from 'react'
import set from 'set-value'
import { useTranslation } from '../../lib/acm-i18next'
import { useValidation } from '../../hooks/useValidation'
import { IClusterSetBinding } from '../common/resources/IClusterSetBinding'
import { IPlacement, PlacementKind, PlacementType, Predicate, Toleration } from '../common/resources/IPlacement'
import { IResource } from '../common/resources/IResource'
import { useLabelValuesMap } from '../common/useLabelValuesMap'
import { MatchExpression, MatchExpressionCollapsed, MatchExpressionSummary } from './MatchExpression'

function TolerationCollapsed() {
  const toleration = useItem() as Toleration
  const { t } = useTranslation()
  const key = toleration?.key ?? ''
  const operator = toleration?.operator === 'Equal' ? t('equal') : t('exists')
  return <Label>{`${key} ${operator}`}</Label>
}

export function Placements(props: {
  clusterSets: IResource[]
  clusterSetBindings: IClusterSetBinding[]
  bindingKind: string
  clusters: IResource[]
  createClusterSetCallback?: () => void
  alertTitle?: string
}) {
  const editMode = useEditMode()
  const resources = useItem() as IResource[]
  const namespaceClusterSetNames = useMemo(() => {
    if (!resources.find) return []
    const source = resources?.find((resource) => resource.kind === props.bindingKind)
    if (!source) return []
    const namespace = source.metadata?.namespace
    if (!namespace) return []
    return (
      props.clusterSetBindings
        ?.filter((clusterSetBinding) => clusterSetBinding.metadata?.namespace === namespace)
        .filter((clusterSetBinding) =>
          props.clusterSets?.find((clusterSet) => clusterSet.metadata?.name === clusterSetBinding.spec?.clusterSet)
        )
        .map((clusterSetBinding) => clusterSetBinding.spec?.clusterSet ?? '') ?? []
    )
  }, [props.bindingKind, props.clusterSetBindings, props.clusterSets, resources])

  const { t } = useTranslation()

  return (
    <WizArrayInput
      id="placements"
      label={t('Placements')}
      helperText={t(
        'A placement selects clusters from the cluster sets which have bindings to the resource namespace.'
      )}
      path={null}
      isSection
      filter={(resource) => resource.kind === PlacementKind}
      placeholder={t('Add placement')}
      collapsedContent="metadata.name"
      collapsedPlaceholder={t('Expand to enter placement')}
      newValue={{ ...PlacementType, metadata: { name: '', namespace: '' }, spec: {} }}
      defaultCollapsed={editMode === EditMode.Edit}
    >
      <Placement
        namespaceClusterSetNames={namespaceClusterSetNames}
        clusters={props.clusters}
        createClusterSetCallback={props.createClusterSetCallback}
        alertTitle={props.alertTitle}
      />
    </WizArrayInput>
  )
}

export function Placement(props: {
  namespaceClusterSetNames: string[]
  clusters: IResource[]
  hideName?: boolean
  createClusterSetCallback?: () => void
  alertTitle?: string
  alertContent?: ReactNode
}) {
  const placement = useItem() as IPlacement
  const editMode = useEditMode()
  const { update } = useData()
  const [isTolerationsExpanded, setIsTolerationsExpanded] = useState(true)

  const { t } = useTranslation()
  const { validateKubernetesResourceName } = useValidation()

  return (
    <Fragment>
      {!props.hideName && (
        <WizTextInput
          id="name"
          path="metadata.name"
          label={t('Name')}
          placeholder={t('Enter the name')}
          required
          readonly={placement.metadata?.uid !== undefined}
          helperText={t(
            'The name of the placement should match the placement name in a placement binding so that it is bound to a policy or policy set. The placement name must be unique to the namespace.'
          )}
          validation={validateKubernetesResourceName}
        />
      )}

      <WizMultiSelect
        label={t('Cluster sets')}
        path="spec.clusterSets"
        placeholder={t('Select the cluster sets')}
        labelHelp={t(
          'Select cluster sets from which to select clusters. If you do not select a cluster set, ' +
            'all clusters are selected from all cluster sets bound to the namespace.'
        )}
        helperText={
          props.namespaceClusterSetNames.length
            ? t(
                'If no cluster sets are selected, all clusters will be selected from the cluster sets bound to the namespace.'
              )
            : t(
                'No cluster sets are bound to the {{namespace}} namespace. To use this namespace for your placement, go to the Cluster sets page to configure a binding.',
                { namespace: placement.metadata?.namespace || '' }
              )
        }
        footer={
          props.createClusterSetCallback ? (
            <Button icon={<ExternalLinkAltIcon />} isInline variant="link" onClick={props.createClusterSetCallback}>
              {t('Add cluster set')}
            </Button>
          ) : undefined
        }
        options={props.namespaceClusterSetNames}
      />

      <PlacementPredicate rootPath="spec.predicates.0." clusters={props.clusters} />

      <ExpandableSection
        toggleContent={<span style={{ color: 'var(--pf-t--global--text--color--regular)' }}>{t('Tolerations')}</span>}
        isExpanded={isTolerationsExpanded}
        onToggle={(_event, expanded) => setIsTolerationsExpanded(expanded)}
        isIndented
      >
        <p style={{ marginBottom: '1rem', color: 'var(--pf-t--global--text--color--subtle)' }}>
          {t(
            'Allows your application to be placed on clusters with specific taints. Example: To deploy on GPU clusters, add a toleration with key=gpu, operator=Equal, value=nvidia, effect=NoSelect'
          )}
        </p>
        {(placement.spec?.tolerations?.length ?? 0) > 0 && <Divider style={{ marginBottom: '1rem' }} />}
        <WizArrayInput
          path="spec.tolerations"
          placeholder={t('Add toleration')}
          collapsedContent={<TolerationCollapsed />}
          newValue={{ key: '', operator: 'Exists' }}
          defaultCollapsed={editMode !== EditMode.Create}
          collapsedPlaceholder={t('Expand to edit')}
        >
          <WizTextInput id="toleration-key" path="key" label={t('Key')} placeholder={t('Enter the key')} required />
          <WizSingleSelect
            id="toleration-operator"
            path="operator"
            label={t('Operator')}
            placeholder={t('Select the operator')}
            options={['Exists', 'Equal']}
            required
          />
          <WizTextInput
            id="toleration-value"
            path="value"
            label={t('Value')}
            placeholder={t('Enter the value')}
            hidden={(toleration) => toleration?.operator !== 'Equal'}
            validation={(value, item: any) => {
              if (item?.operator === 'Equal' && !value) {
                return t('Value is required when operator is Equal')
              }
              return undefined
            }}
          />
          <WizLabelSelect
            id="toleration-effect"
            path="effect"
            label={t('Effect')}
            placeholder={t('Select the effect')}
            options={['NoSelect', 'PreferNoSelect', 'NoSelectIfNew']}
            helperText={t('Leave empty for all effects')}
          />
          <WizNumberInput
            id="toleration-seconds"
            path="tolerationSeconds"
            label={t('Toleration seconds')}
            placeholder={t('Enter toleration seconds')}
            helperText={t('TolerationSeconds represents the period of time the toleration tolerates the taint.')}
          />
        </WizArrayInput>
      </ExpandableSection>

      <WizCheckbox
        id="limit-clusters-checkbox"
        label={t('Set a limit on the number of clusters selected')}
        path="spec.numberOfClusters"
        pathValueToInputValue={(value) => !!value || value === 0}
        onValueChange={(value) => {
          if (value) {
            set(placement, 'spec.numberOfClusters', 1, { preservePaths: false })
          } else {
            set(placement, 'spec.numberOfClusters', undefined, { preservePaths: false })
          }
          update()
        }}
      />
      <WizNumberInput
        hidden={(placement) => placement.spec?.numberOfClusters === undefined}
        label={t('Number of clusters')}
        path="spec.numberOfClusters"
      />
    </Fragment>
  )
}

export function PlacementPredicate(props: { rootPath?: string; clusters: IResource[] }) {
  const rootPath = props.rootPath ?? ''
  const editMode = useEditMode()
  const item = useItem()
  const labelValuesMap = useLabelValuesMap(props.clusters)
  const { t } = useTranslation()
  const [isLabelExpanded, setIsLabelExpanded] = useState(true)
  const hasLabelExpressions =
    (get(item, `${rootPath}requiredClusterSelector.labelSelector.matchExpressions`) as unknown[] | undefined)?.length ??
    0
  return (
    <ExpandableSection
      toggleContent={
        <span style={{ color: 'var(--pf-t--global--text--color--regular)' }}>{t('Label expressions')}</span>
      }
      isExpanded={isLabelExpanded}
      onToggle={(_event, expanded) => setIsLabelExpanded(expanded)}
      isIndented
    >
      <p style={{ marginBottom: '1rem', color: 'var(--pf-t--global--text--color--subtle)' }}>
        {t(
          'Match clusters using label selectors. Multiple expressions are combined using AND logic (all inputs must be true).'
        )}
      </p>
      {hasLabelExpressions > 0 && <Divider style={{ marginBottom: '1rem' }} />}
      <WizKeyValue
        label={t('Label selectors')}
        path={`${rootPath}requiredClusterSelector.labelSelector.matchLabels`}
        labelHelp={t(
          'Select clusters from the clusters in selected cluster sets using cluster labels. For a cluster to be be selected, the cluster must match all label selectors, label expressions, and claim expressions.'
        )}
        placeholder={t('Add cluster label selector')}
        hidden={(item) => get(item, `${rootPath}requiredClusterSelector.labelSelector.matchLabels`) === undefined}
      />
      <WizArrayInput
        path={`${rootPath}requiredClusterSelector.labelSelector.matchExpressions`}
        placeholder={t('Add label expression')}
        collapsedContent={<MatchExpressionCollapsed />}
        newValue={{ key: '', operator: 'In', values: [] }}
        defaultCollapsed={editMode !== EditMode.Create}
        collapsedPlaceholder={t('Define a new label expression')}
      >
        <MatchExpression labelValuesMap={labelValuesMap} />
      </WizArrayInput>
      <WizArrayInput
        label={t('Cluster claim expressions')}
        path={`${rootPath}requiredClusterSelector.claimSelector.matchExpressions`}
        placeholder={t('Add claim expression')}
        labelHelp={t(
          'Select clusters from the clusters in selected cluster sets using cluster claims status. For a cluster to be be selected, the cluster must match all label selectors, label expressions, and claim expressions.'
        )}
        collapsedContent={<MatchExpressionCollapsed />}
        newValue={{ key: '', operator: 'In', values: [] }}
        defaultCollapsed={editMode !== EditMode.Create}
        hidden={(item) => get(item, `${rootPath}requiredClusterSelector.claimSelector.matchExpressions`) === undefined}
        collapsedPlaceholder={t('Expand to edit')}
      >
        <MatchExpression labelValuesMap={labelValuesMap} />
      </WizArrayInput>
    </ExpandableSection>
  )
}

export function PredicateSummary() {
  const predicate = useItem() as Predicate
  const labelSelectorLabels = predicate.requiredClusterSelector?.labelSelector?.matchLabels ?? {}
  const labelSelectorExpressions = predicate.requiredClusterSelector?.labelSelector?.matchExpressions ?? []
  const claimSelectorExpressions = predicate.requiredClusterSelector?.claimSelector?.matchExpressions ?? []
  const { t } = useTranslation()
  const labelSelectors: string[] = []
  for (const matchLabel in labelSelectorLabels) {
    labelSelectors.push(`${matchLabel}=${labelSelectorLabels[matchLabel]}`)
  }

  if (labelSelectors.length === 0 && labelSelectorExpressions.length === 0 && claimSelectorExpressions.length === 0) {
    return <div>{t('Expand to enter expression')}</div>
  }

  return (
    <div style={{ display: 'flex', gap: 16, flexDirection: 'column' }}>
      {labelSelectors.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexDirection: 'column' }}>
          <div className="pf-v6-c-form__label pf-v6-c-form__label-text">{t('Label selectors')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {labelSelectors.map((labelSelector) => (
              <Label key={labelSelector}>{labelSelector}</Label>
            ))}
          </div>
        </div>
      )}
      {labelSelectorExpressions.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexDirection: 'column' }}>
          <div className="pf-v6-c-form__label pf-v6-c-form__label-text">{t('Label expressions')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {labelSelectorExpressions.map((expression, index) => (
              <MatchExpressionSummary key={index} expression={expression} />
            ))}
          </div>
        </div>
      )}
      {claimSelectorExpressions.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexDirection: 'column' }}>
          <div className="pf-v6-c-form__label pf-v6-c-form__label-text">{t('Cluster claim expressions')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {claimSelectorExpressions.map((expression, index) => (
              <MatchExpressionSummary key={index} expression={expression} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
