/* Copyright Contributors to the Open Cluster Management project */
import { ToggleGroup, ToggleGroupItem } from '@patternfly/react-core'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { WizDetailsHidden, EditMode, WizItemSelector, Section, WizSelect } from '../../src'
import { useData } from '../../src/contexts/DataContext'
import { useEditMode } from '../../src/contexts/EditModeContext'
import { useSetHasInputs } from '../../src/contexts/HasInputsProvider'
import { useItem } from '../../src/contexts/ItemContext'
import { useValidate } from '../../src/contexts/ValidationProvider'
import { IResource } from '../../src/common/resource'
import { IClusterSetBinding } from '../common/resources/IClusterSetBinding'
import { IPlacement, PlacementApiGroup, PlacementApiVersion, PlacementKind } from '../common/resources/IPlacement'
import { PlacementBindingKind, PlacementBindingType } from '../common/resources/IPlacementBinding'
import { Sync } from '../../src/Sync'
import { Placement, Placements } from './Placement'
import { PlacementBindings } from './PlacementBinding'

export function PlacementSection(props: {
  bindingSubjectKind: string
  bindingSubjectApiGroup: string
  existingPlacements: IResource[]
  existingClusterSets: IResource[]
  existingClusterSetBindings: IClusterSetBinding[]
  clusters: IResource[]
  createClusterSetCallback?: () => void
  allowNoPlacement?: boolean
  withoutOnlineClusterCondition?: boolean
}) {
  const { update } = useData()
  const resources = useItem() as IResource[]
  const editMode = useEditMode()

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
            (clusterSet) =>
              clusterSet.metadata?.name === clusterSetBinding.spec?.clusterSet &&
              clusterSet.metadata?.namespace === namespace
          )
        )
        .map((clusterSetBinding) => clusterSetBinding.spec?.clusterSet ?? '') ?? []
    )
  }, [props.bindingSubjectKind, props.existingClusterSetBindings, props.existingClusterSets, resources])

  const setHasInputs = useSetHasInputs()
  useEffect(() => {
    setHasInputs()
  }, [setHasInputs])

  if (isAdvanced) {
    return (
      <Fragment>
        <Placements
          clusterSets={props.existingClusterSets}
          clusterSetBindings={props.existingClusterSetBindings}
          bindingKind={props.bindingSubjectKind}
          clusters={props.clusters}
        />
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
      label="Placement"
      // description="Placement selects clusters from the cluster sets which have bindings to the resource namespace."
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
            <Placement namespaceClusterSetNames={namespaceClusterSetNames} clusters={props.clusters} />
          </WizItemSelector>
        </Fragment>
      )}
      {placementCount === 0 && placementBindingCount === 1 && (
        <WizItemSelector selectKey="kind" selectValue={PlacementBindingKind}>
          <WizSelect
            path="placementRef.name"
            label="Placement"
            required
            options={namespacedPlacements.map((placement) => placement.metadata?.name ?? '')}
          />
        </WizItemSelector>
      )}
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
}) {
  const resources = useItem() as IResource[]
  const { placementCount, placementBindingCount, bindingSubjectKind } = props
  const { update } = useData()
  const validate = useValidate()
  return (
    <WizDetailsHidden>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="pf-v6-c-form__label pf-v6-c-form__label-text">How do you want to select clusters?</span>
        <ToggleGroup aria-label="Default with single selectable">
          <ToggleGroupItem
            text="New placement"
            isSelected={placementCount === 1}
            onClick={() => {
              const bindingSubject = resources.find((resource) => resource.kind === bindingSubjectKind)
              let newResources = [...resources]
              newResources = resources
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
                spec: {},
              } as IResource)

              newResources.push({
                ...PlacementBindingType,
                metadata: { name: placementBindingName, namespace },
                placementRef: { apiGroup: PlacementApiGroup, kind: PlacementKind, name: placementName },
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
            text="Existing placement"
            isSelected={placementCount === 0 && placementBindingCount === 1}
            onClick={() => {
              const bindingSubject = resources.find((resource) => resource.kind === bindingSubjectKind)
              let newResources = [...resources]
              newResources = resources
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
                placementRef: { apiGroup: PlacementApiGroup, kind: PlacementKind, name: '' },
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
              text="No placement"
              isSelected={placementCount === 0 && placementBindingCount === 0}
              onClick={() => {
                let newResources = [...resources]
                newResources = resources
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
          Do not add a placement if you want to place this policy using policy set placement.
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
