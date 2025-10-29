/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useMemo, useEffect } from 'react'
import { AcmMultiSelect } from '../../../ui-components'
import { SelectOption } from '@patternfly/react-core'
import { SelectVariant } from '../../../components/AcmSelectBase'
import { Cluster } from '../RoleAssignments/hook/RoleAssignmentDataHook'

type NamespaceSelectorProps = {
  selectedClusters: string[]
  clusters: Cluster[]
  onChangeNamespaces: (namespaces: string[]) => void
  selectedNamespaces?: string[]
  disabled?: boolean
}

const NamespaceSelector = ({
  selectedClusters,
  clusters,
  onChangeNamespaces,
  selectedNamespaces = [],
  disabled = false,
}: NamespaceSelectorProps) => {
  const namespaceOptions = useMemo(() => {
    if (selectedClusters.length === 0) {
      return []
    }

    const clusterNamespaceGroupings: string[][] = []

    for (const cluster of clusters) {
      const isMatch = selectedClusters.some((selectedCluster) => {
        const selectedStr = selectedCluster?.toString().trim()
        const clusterStr = cluster.name?.toString().trim()
        return selectedStr === clusterStr
      })

      if (isMatch) {
        clusterNamespaceGroupings.push(cluster.namespaces ? [...cluster.namespaces] : [])
      }
    }

    if (clusterNamespaceGroupings.length === 0) {
      return []
    }

    let commonNamespaces: string[] = clusterNamespaceGroupings[0] || []

    for (let i = 1; i < clusterNamespaceGroupings.length; i++) {
      commonNamespaces = commonNamespaces.filter((namespace) => clusterNamespaceGroupings[i].includes(namespace))
    }

    const options = commonNamespaces.toSorted((a, b) => a.localeCompare(b)).map((ns) => ({ id: ns, value: ns }))

    return options
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClusters, clusters])

  const handleNamespaceChange = useCallback(
    (namespaces: string[] | undefined) => {
      if (!disabled) {
        onChangeNamespaces(namespaces || [])
      }
    },
    [onChangeNamespaces, disabled]
  )

  useEffect(() => {
    if (selectedClusters.length === 0 && selectedNamespaces && selectedNamespaces.length > 0) {
      onChangeNamespaces([])
    }
  }, [selectedClusters.length, selectedNamespaces, onChangeNamespaces])

  if (selectedClusters.length === 0) {
    return null
  }

  return (
    <AcmMultiSelect
      id="namespace-selector"
      variant={SelectVariant.typeaheadMulti}
      label="Select shared namespaces"
      placeholder="Select namespaces to target"
      value={selectedNamespaces || []}
      onChange={handleNamespaceChange}
      menuAppendTo="parent"
      maxHeight="18em"
      isDisabled={disabled}
    >
      {namespaceOptions.map((option) => (
        <SelectOption key={option.id} value={option.value}>
          {option.value}
        </SelectOption>
      ))}
    </AcmMultiSelect>
  )
}

export { NamespaceSelector }
