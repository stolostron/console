/* Copyright Contributors to the Open Cluster Management project */
import { Button } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import get from 'get-value'
import { Fragment, useMemo } from 'react'
import {
  EditMode,
  useEditMode,
  useItem,
  WizHidden,
  WizKeyValue,
  WizNumberInput,
  WizArrayInput,
  WizTextInput,
  WizMultiSelect,
} from '@patternfly-labs/react-form-wizard'
import { IResource } from '../common/resources/IResource'
import { IClusterSetBinding } from '../common/resources/IClusterSetBinding'
import { IPlacement, PlacementKind, PlacementType, Predicate } from '../common/resources/IPlacement'
import { useLabelValuesMap } from '../common/useLabelValuesMap'
import { validateKubernetesResourceName } from '../../lib/validation'
import { MatchExpression, MatchExpressionCollapsed, MatchExpressionSummary } from './MatchExpression'
import { useTranslation } from '../../lib/acm-i18next'

export function Placements(props: {
  clusterSets: IResource[]
  clusterSetBindings: IClusterSetBinding[]
  bindingKind: string
  clusters: IResource[]
  createClusterSetCallback?: () => void
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
      />
    </WizArrayInput>
  )
}

export function Placement(props: {
  namespaceClusterSetNames: string[]
  clusters: IResource[]
  hideName?: boolean
  createClusterSetCallback?: () => void
}) {
  const editMode = useEditMode()
  const placement = useItem() as IPlacement
  const { t } = useTranslation()

  return (
    <Fragment>
      {!props.hideName && (
        <WizTextInput
          id="name"
          path="metadata.name"
          label={t('Name')}
          required
          readonly={placement.metadata?.uid !== undefined}
          helperText={t(
            'The name of the placement should match the placement name in a placement binding so that it is bound to a policy or policy set. The placement name must be unique to the namespace.'
          )}
          validation={validateKubernetesResourceName}
        />
      )}

      {/* <TextInput label="Placement name" path="metadata.name" required labelHelp="Name needs to be unique to the namespace." /> */}
      <WizMultiSelect
        label={t('Cluster sets')}
        path="spec.clusterSets"
        placeholder={t('Select the cluster sets')}
        labelHelp={t(
          'Select clusters from the cluster sets bound to the namespace. Clusters can then be further selected using cluster labels.'
        )}
        helperText={t(
          'If no cluster sets are selected, all clusters will be selected from the cluster sets bound to the namespace.'
        )}
        footer={
          props.createClusterSetCallback ? (
            <Button icon={<ExternalLinkAltIcon />} isInline variant="link" onClick={props.createClusterSetCallback}>
              {t('Create cluster set')}
            </Button>
          ) : undefined
        }
        options={props.namespaceClusterSetNames}
      />

      <WizHidden
        hidden={(placement) => {
          if (editMode === EditMode.Edit) return true
          if (!placement.spec?.predicates) return false
          if (placement.spec.predicates.length <= 1) return false
          return true
        }}
      >
        <PlacementPredicate rootPath="spec.predicates.0." clusters={props.clusters} />
      </WizHidden>

      <WizArrayInput
        label={t('Cluster selectors')}
        path="spec.predicates"
        placeholder={t('Add cluster selector')}
        collapsedContent={<PredicateSummary />}
        helperText={t(
          'A cluster selector further selects clusters from the clusters in the cluster sets which have bindings to the namespace. Clusters matching any cluster selector will be selected.'
        )}
        defaultCollapsed
        hidden={(placement) => {
          if (editMode === EditMode.Edit) return false
          if (!placement.spec?.predicates) return true
          if (placement.spec.predicates.length <= 1) return true
          return false
        }}
      >
        <PlacementPredicate clusters={props.clusters} />
      </WizArrayInput>
      <WizNumberInput
        label={t('Limit the number of clusters selected')}
        path="spec.numberOfClusters"
        zeroIsUndefined
        hidden={(placement) => placement.spec?.numberOfClusters === undefined}
      />
    </Fragment>
  )
}

export function PlacementPredicate(props: { rootPath?: string; clusters: IResource[] }) {
  const rootPath = props.rootPath ?? ''
  const editMode = useEditMode()
  const labelValuesMap = useLabelValuesMap(props.clusters)
  const { t } = useTranslation()
  return (
    <Fragment>
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
        label={t('Label expressions')}
        path={`${rootPath}requiredClusterSelector.labelSelector.matchExpressions`}
        placeholder={t('Add label expression')}
        labelHelp={t(
          'Select clusters from the clusters in selected cluster sets using cluster labels. For a cluster to be be selected, the cluster must match all label selectors, label expressions, and claim expressions.'
        )}
        collapsedContent={<MatchExpressionCollapsed />}
        newValue={{ key: '', operator: 'In', values: [] }}
        defaultCollapsed={editMode !== EditMode.Create}
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
      >
        <MatchExpression labelValuesMap={labelValuesMap} />
      </WizArrayInput>
    </Fragment>
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
    return <div>{t('Expand to enter details')}</div>
  }

  return (
    <div style={{ display: 'flex', gap: 16, flexDirection: 'column' }}>
      {labelSelectors.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexDirection: 'column' }}>
          <div className="pf-c-form__label pf-c-form__label-text">{t('Label selectors')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {labelSelectors.map((labelSelector) => (
              <span key={labelSelector}>{labelSelector}</span>
            ))}
          </div>
        </div>
      )}
      {labelSelectorExpressions.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexDirection: 'column' }}>
          <div className="pf-c-form__label pf-c-form__label-text">{t('Label expressions')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {labelSelectorExpressions.map((expression, index) => (
              <MatchExpressionSummary key={index} expression={expression} />
            ))}
          </div>
        </div>
      )}
      {claimSelectorExpressions.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexDirection: 'column' }}>
          <div className="pf-c-form__label pf-c-form__label-text">{t('Cluster claim expressions')}</div>
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
