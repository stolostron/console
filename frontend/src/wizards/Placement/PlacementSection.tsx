/* Copyright Contributors to the Open Cluster Management project */
import {
  Alert,
  Button,
  ButtonVariant,
  Label,
  LabelGroup,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
} from '@patternfly/react-core'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import {
  WizDetailsHidden,
  EditMode,
  WizItemSelector,
  Section,
  WizSingleSelect,
  useData,
  useEditMode,
  useSetHasInputs,
  useItem,
  useValidate,
  Sync,
  useSetFooterContent,
  DisplayMode,
  useDisplayMode,
} from '@patternfly-labs/react-form-wizard'

import { IResource } from '../common/resources/IResource'
import { IClusterSetBinding } from '../common/resources/IClusterSetBinding'
import {
  IPlacement,
  PlacementApiGroup,
  PlacementApiVersion,
  PlacementKind,
  PlacementSpec,
  Toleration,
} from '../common/resources/IPlacement'
import { PlacementBindingKind, PlacementBindingType } from '../common/resources/IPlacementBinding'
import { Placement, Placements } from './Placement'
import { PlacementBindings } from './PlacementBinding'
import { useTranslation } from '../../lib/acm-i18next'
import { NavigationPath } from '../../NavigationPath'
import { usePlacementDebug } from './usePlacementDebug'
import { MatchedClustersModal } from './MatchedClustersModal'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'

export function PlacementSection(props: {
  bindingSubjectKind: string
  bindingSubjectApiGroup: string
  existingPlacements: IResource[]
  existingClusterSets: IResource[]
  existingClusterSetBindings: IClusterSetBinding[]
  clusters: IResource[]
  defaultPlacementSpec?: PlacementSpec
  createClusterSetCallback?: () => void
  allowNoPlacement?: boolean
  withoutOnlineClusterCondition?: boolean
}) {
  const { t } = useTranslation()
  const { update } = useData()
  const resources = useItem() as IResource[]
  const editMode = useEditMode()
  const displayMode = useDisplayMode()
  const { settingsState } = useSharedAtoms()
  const settings = useRecoilValue(settingsState)
  const [isMatchedClustersModalOpen, setIsMatchedClustersModalOpen] = useState(false)

  const [placementCount, setPlacementCount] = useState(0)
  const [placementBindingCount, setPlacementBindingCount] = useState(0)
  useEffect(() => {
    setPlacementCount(resources?.filter((resource) => resource.kind === PlacementKind).length)
    setPlacementBindingCount(resources?.filter((resource) => resource.kind === PlacementBindingKind).length)
  }, [resources, setPlacementCount, setPlacementBindingCount])

  const [showPlacementSelector, setShowPlacementSelector] = useState(false)
  const [isAdvanced, setIsAdvanced] = useState(false)
  useEffect(() => {
    let isAdvanced = false
    const placements: IPlacement[] = resources?.filter((resource) => resource.kind === PlacementKind)
    const placementCount = placements.length
    const placementBindingCount = resources?.filter((resource) => resource.kind === PlacementBindingKind).length

    if (placementCount > 1) isAdvanced = true
    if (placementBindingCount > 1) isAdvanced = true

    for (const placement of placements) {
      if (placement?.spec?.predicates && placement.spec.predicates.length > 1) isAdvanced = true
    }

    if (isAdvanced) {
      setIsAdvanced(isAdvanced)
    } else {
      if (editMode === EditMode.Create) {
        // Only in create mode switch back to simple mode
        setIsAdvanced(false)
      } else {
        if (placementCount + placementBindingCount === 0) {
          setIsAdvanced(false)
        }
      }
    }

    if (editMode === EditMode.Create) {
      setShowPlacementSelector(true)
    } else {
      if (placements.filter((placement) => placement.metadata?.uid).length === 0) {
        // Show placement selector if there are no existing resources
        setShowPlacementSelector(true)
      } else {
        setShowPlacementSelector(false)
      }
    }
  }, [setIsAdvanced, setShowPlacementSelector, editMode, resources])

  useEffect(() => {
    const placementCount = resources?.filter((resource) => resource.kind === PlacementKind).length
    const placementBindingCount = resources?.filter((resource) => resource.kind === PlacementBindingKind).length
    if (placementCount === 1 && placementBindingCount === 0) {
      resources.push({
        ...PlacementBindingType,
        metadata: { name: '', namespace: '' },
        placementRef: { apiGroup: PlacementApiGroup, kind: PlacementKind, name: '' },
        subjects: [{ apiGroup: props.bindingSubjectApiGroup, kind: props.bindingSubjectKind, name: '' }],
      } as IResource)
      update()
    }
  }, [props.bindingSubjectApiGroup, props.bindingSubjectKind, resources, update])

  const namespacedPlacements = useMemo(() => {
    if (!resources.find) return props.existingPlacements
    const source = resources?.find((resource) => resource.kind === props.bindingSubjectKind)
    if (!source) return props.existingPlacements
    const namespace = source.metadata?.namespace
    if (!namespace) return props.existingPlacements
    return props.existingPlacements.filter((placement) => placement.metadata?.namespace === namespace)
  }, [props.existingPlacements, props.bindingSubjectKind, resources])

  const namespaceClusterSetNames = useMemo(() => {
    if (!resources.find) return []
    const source = resources?.find((resource) => resource.kind === props.bindingSubjectKind)
    if (!source) return []
    const namespace = source.metadata?.namespace
    if (!namespace) return []
    return (
      props.existingClusterSetBindings
        ?.filter((clusterSetBinding) => clusterSetBinding.metadata?.namespace === namespace)
        .filter((clusterSetBinding) =>
          props.existingClusterSets?.find(
            (clusterSet) => clusterSet.metadata?.name === clusterSetBinding.spec?.clusterSet
          )
        )
        .map((clusterSetBinding) => clusterSetBinding.spec?.clusterSet ?? '') ?? []
    )
  }, [props.bindingSubjectKind, props.existingClusterSetBindings, props.existingClusterSets, resources])

  const setHasInputs = useSetHasInputs()
  useEffect(() => {
    setHasInputs()
  }, [setHasInputs])

  // Calculate matched clusters for the current placement
  const currentPlacement = useMemo(() => {
    return resources?.find((resource) => resource.kind === PlacementKind) as IPlacement | undefined
  }, [resources])

  const debugState = usePlacementDebug(currentPlacement, settings.enhancedPlacement === 'enabled')
  const { matched, notMatched, matchedCount, totalClusters, error } = debugState

  const setFooterContent = useSetFooterContent()
  const openMatchedModal = useCallback(() => setIsMatchedClustersModalOpen(true), [])

  useEffect(() => {
    if (
      settings.enhancedPlacement === 'enabled' &&
      placementCount === 1 &&
      currentPlacement &&
      displayMode === DisplayMode.Step
    ) {
      const matchedLabel =
        matchedCount === undefined
          ? '-'
          : t('{{matched}} of {{total}} clusters', { matched: matchedCount, total: totalClusters })

      setFooterContent(
        <div style={{ padding: '0 1rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span>{t('Matched by Placement')}:</span>{' '}
          {error ? (
            <Tooltip content={error.message || t('An unknown error occurred.')}>
              <Alert variant="warning" isInline isPlain title={t('Unable to determine cluster matches.')} />
            </Tooltip>
          ) : (
            <Button variant={ButtonVariant.link} isInline onClick={openMatchedModal} style={{ padding: 0 }}>
              {matchedLabel}
            </Button>
          )}
        </div>
      )
    } else {
      setFooterContent(undefined)
    }
    return () => setFooterContent(undefined)
  }, [
    settings.enhancedPlacement,
    placementCount,
    currentPlacement,
    displayMode,
    matchedCount,
    totalClusters,
    error,
    setFooterContent,
    openMatchedModal,
    t,
  ])

  if (isAdvanced) {
    return (
      <Fragment>
        {placementCount ? (
          <Placements
            clusterSets={props.existingClusterSets}
            clusterSetBindings={props.existingClusterSetBindings}
            bindingKind={props.bindingSubjectKind}
            clusters={props.clusters}
            showPlacementPreview={settings.enhancedPlacement === 'enabled'}
          />
        ) : null}
        <PlacementBindings
          placementCount={placementCount}
          placementBindingCount={placementBindingCount}
          bindingSubjectKind={props.bindingSubjectKind}
          bindingSubjectApiGroup={props.bindingSubjectApiGroup}
          existingPlacements={namespacedPlacements}
        />
      </Fragment>
    )
  }

  return (
    <Section
      label={t('Placement')}
      description={t(
        'Use Placement resources to select clusters from the cluster sets that you have bound to the ' +
          'resource namespace. An empty Placement returns all available clusters from all bound cluster sets.'
      )}
      autohide={false}
    >
      {showPlacementSelector && (
        <PlacementSelector
          placementCount={placementCount}
          placementBindingCount={placementBindingCount}
          bindingSubjectKind={props.bindingSubjectKind}
          bindingSubjectApiGroup={props.bindingSubjectApiGroup}
          allowNoPlacement={props.allowNoPlacement}
          withoutOnlineClusterCondition={props.withoutOnlineClusterCondition}
          defaultPlacementSpec={props.defaultPlacementSpec}
        />
      )}
      {placementCount === 1 && (
        <Fragment>
          {editMode === EditMode.Create && (
            <Fragment>
              <Sync kind={PlacementKind} path="metadata.name" targetKind={PlacementBindingKind} />
              <Sync
                kind={PlacementKind}
                path="metadata.name"
                targetKind={PlacementBindingKind}
                targetPath="placementRef.name"
              />
            </Fragment>
          )}
          <Sync kind={PlacementKind} path="metadata.namespace" targetKind={PlacementBindingKind} />

          <WizItemSelector selectKey="kind" selectValue={PlacementKind}>
            <Placement
              namespaceClusterSetNames={namespaceClusterSetNames}
              clusters={props.clusters}
              createClusterSetCallback={props.createClusterSetCallback}
              alertTitle={t(
                'ClusterSets failed to load. Verify that there is at least one ClusterSet bound to your selected namespace.'
              )}
              alertContent={
                <Button variant="link" onClick={() => window.open(NavigationPath.clusterSets)} style={{ padding: '0' }}>
                  {t('Add cluster set')}
                </Button>
              }
              showPlacementPreview={settings.enhancedPlacement === 'enabled'}
              placementDebugState={debugState}
            />
          </WizItemSelector>
        </Fragment>
      )}
      {placementCount === 0 && placementBindingCount === 1 && (
        <WizItemSelector selectKey="kind" selectValue={PlacementBindingKind}>
          <WizSingleSelect
            path="placementRef.name"
            label={t('Placement')}
            placeholder={t('Select the placement')}
            required
            options={namespacedPlacements.map((placement) => placement.metadata?.name ?? '')}
          />
        </WizItemSelector>
      )}

      {/* Review step content */}
      {settings.enhancedPlacement === 'enabled' &&
        displayMode !== DisplayMode.Step &&
        placementCount === 1 &&
        currentPlacement && (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Placement info alert */}
            {error ? (
              <Tooltip content={error.message || t('An unknown error occurred.')}>
                <Alert variant="warning" isInline isPlain title={t('Unable to determine cluster matches.')} />
              </Tooltip>
            ) : (
              matchedCount !== undefined && (
                <Alert
                  variant={matchedCount > 0 ? 'info' : 'warning'}
                  isInline
                  title={
                    matchedCount > 0
                      ? t('{{matched}} of {{total}} clusters matched by placement', {
                          matched: matchedCount,
                          total: totalClusters,
                        })
                      : t(
                          'No clusters match the current placement criteria. To identify available clusters, check your label expressions, tolerations, or limits.'
                        )
                  }
                />
              )
            )}

            {/* Label expressions and tolerations */}
            {(currentPlacement.spec?.predicates?.[0]?.requiredClusterSelector?.labelSelector?.matchExpressions
              ?.length ||
              currentPlacement.spec?.tolerations?.length) && (
              <div>
                <h4 style={{ marginBottom: '0.5rem' }}>{t('Label expressions and tolerations')}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Label expressions */}
                  {currentPlacement.spec?.predicates?.[0]?.requiredClusterSelector?.labelSelector?.matchExpressions
                    ?.length && (
                    <div>
                      <strong>{t('Label expressions')}:</strong>
                      <LabelGroup style={{ marginTop: '0.25rem' }}>
                        {currentPlacement.spec.predicates[0].requiredClusterSelector.labelSelector.matchExpressions.map(
                          (expr, idx) => (
                            <Fragment key={idx}>
                              <Label>{`${expr.key} ${expr.operator}`}</Label>
                              {expr.values && expr.values.length > 0 && <Label>{expr.values.join(', ')}</Label>}
                            </Fragment>
                          )
                        )}
                      </LabelGroup>
                    </div>
                  )}

                  {/* Tolerations */}
                  {currentPlacement.spec?.tolerations?.length && (
                    <div>
                      <strong>{t('Tolerations')}:</strong>
                      <LabelGroup style={{ marginTop: '0.25rem' }}>
                        {currentPlacement.spec.tolerations.map((toleration, idx) => (
                          <Fragment key={idx}>
                            <Label>{toleration.key}</Label>
                            <Label>{toleration.operator || t('Exists')}</Label>
                            {toleration.value && <Label>{toleration.value}</Label>}
                            {toleration.effect && <Label>{toleration.effect}</Label>}
                            {toleration.tolerationSeconds != null && (
                              <Label>{`${toleration.tolerationSeconds}s`}</Label>
                            )}
                          </Fragment>
                        ))}
                      </LabelGroup>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      <MatchedClustersModal
        isOpen={isMatchedClustersModalOpen}
        onClose={() => setIsMatchedClustersModalOpen(false)}
        matchedClusters={matched}
        notMatchedClusters={notMatched}
        totalClusters={totalClusters}
      />
    </Section>
  )
}

export function PlacementSelector(props: {
  placementCount: number
  placementBindingCount: number
  bindingSubjectKind: string
  bindingSubjectApiGroup: string
  allowNoPlacement?: boolean
  withoutOnlineClusterCondition?: boolean
  defaultPlacementSpec?: PlacementSpec
}) {
  const resources = useItem() as IResource[]
  const { placementCount, placementBindingCount, bindingSubjectKind } = props
  const { update } = useData()
  const validate = useValidate()
  const { t } = useTranslation()
  return (
    <WizDetailsHidden>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="pf-v6-c-form__label pf-v6-c-form__label-text">{t('How do you want to select clusters?')}</span>
        <ToggleGroup aria-label="Default with single selectable">
          <ToggleGroupItem
            text={t('New placement')}
            isSelected={placementCount === 1}
            onClick={() => {
              const bindingSubject = resources.find((resource) => resource.kind === bindingSubjectKind)
              const newResources = resources
                .filter((resource) => resource.kind !== PlacementKind)
                .filter((resource) => resource.kind !== PlacementBindingKind)

              const placementName = bindingSubject
                ? uniqueResourceName(`${bindingSubject.metadata?.name ?? ''}-placement`, newResources)
                : ''
              const placementBindingName = bindingSubject
                ? uniqueResourceName(`${bindingSubject.metadata?.name ?? ''}-placement-binding`, newResources)
                : ''
              const namespace = bindingSubject?.metadata?.namespace ?? ''

              newResources.push({
                apiVersion: PlacementApiVersion,
                kind: PlacementKind,
                metadata: { name: placementName, namespace },
                spec: {
                  ...props.defaultPlacementSpec,
                  tolerations: deduplicateTolerations([
                    { key: 'cluster.open-cluster-management.io/unreachable', operator: 'Exists' },
                    { key: 'cluster.open-cluster-management.io/unavailable', operator: 'Exists' },
                    ...(props.defaultPlacementSpec?.tolerations ?? []),
                  ]),
                },
              } as IResource)

              newResources.push({
                ...PlacementBindingType,
                metadata: { name: placementBindingName, namespace },
                placementRef: {
                  apiGroup: PlacementApiGroup,
                  kind: PlacementKind,
                  name: placementName,
                },
                subjects: [
                  {
                    apiGroup: props.bindingSubjectApiGroup,
                    kind: bindingSubjectKind,
                    name: bindingSubject?.metadata?.name ?? '',
                  },
                ],
              } as IResource)
              update(newResources)
            }}
          />
          <ToggleGroupItem
            text={t('Existing placement')}
            isSelected={placementCount === 0 && placementBindingCount === 1}
            onClick={() => {
              const bindingSubject = resources.find((resource) => resource.kind === bindingSubjectKind)
              const newResources = resources
                .filter((resource) => resource.kind !== PlacementKind)
                .filter((resource) => resource.kind !== PlacementBindingKind)
              const placementBindingName = bindingSubject
                ? uniqueResourceName(`${bindingSubject.metadata?.name ?? ''}-placement-binding`, newResources)
                : ''
              const namespace = bindingSubject?.metadata?.namespace ?? ''

              newResources.push({
                ...PlacementBindingType,
                metadata: {
                  name: placementBindingName,
                  namespace: namespace,
                },
                placementRef: {
                  apiGroup: PlacementApiGroup,
                  kind: PlacementKind,
                  name: '',
                },
                subjects: [
                  {
                    apiGroup: props.bindingSubjectApiGroup,
                    kind: props.bindingSubjectKind,
                    name: bindingSubject?.metadata?.name ?? '',
                  },
                ],
              } as IResource)
              update(newResources)
            }}
          />
          {props.allowNoPlacement === true ? (
            <ToggleGroupItem
              text={t('No placement')}
              isSelected={placementCount === 0 && placementBindingCount === 0}
              onClick={() => {
                const newResources = resources
                  .filter((resource) => resource.kind !== PlacementKind)
                  .filter((resource) => resource.kind !== PlacementBindingKind)
                update(newResources)
                validate()
              }}
            />
          ) : (
            <Fragment />
          )}
        </ToggleGroup>
      </div>
      {props.allowNoPlacement === true && placementCount === 0 && placementBindingCount === 0 && (
        <p className="pf-v6-c-form__helper-text">
          {t('Do not add a placement if you want to place this policy using policy set placement.')}
        </p>
      )}
    </WizDetailsHidden>
  )
}

function uniqueResourceName(name: string | undefined, resources: IResource[]) {
  if (!name) return ''
  let counter = 1
  let newName = name
  while (resources.find((resource) => resource.metadata?.name === newName)) {
    newName = name + '-' + (counter++).toString()
  }
  return newName
}

function deduplicateTolerations(tolerations: Toleration[]): Toleration[] {
  const seen = new Set<string>()
  return tolerations.filter((t) => {
    const key = `${t.key}::${t.operator ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
