/* Copyright Contributors to the Open Cluster Management project */
import { Button, Chip, ChipGroup, PageSection, Select, SelectOption, SelectVariant } from '@patternfly/react-core'
import { FilterIcon } from '@patternfly/react-icons'
import { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { Cluster } from '../../../resources'
import { useAllClusters } from '../../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'

export default function OverviewHeader(props: {
  selectedClusterLabels: Record<string, string[]>
  setSelectedClusterLabels: Dispatch<SetStateAction<Record<string, string[]>>>
}) {
  const { t } = useTranslation()
  const { selectedClusterLabels, setSelectedClusterLabels } = props
  const allClusters: Cluster[] = useAllClusters()
  const [labelSelectIsOpen, setLabelSelectIsOpen] = useState<boolean>(false)
  const [valuesSelectIsOpen, setValuesSelectIsOpen] = useState<boolean>(false)
  const [selectedClusterLabel, setSelectedClusterLabel] = useState<string>('')

  const allClusterLabels = useMemo(() => {
    const labelValuesMap: Record<string, string[]> = {}
    for (const cluster of allClusters) {
      const labels = cluster.labels ?? {}
      for (const label in labels) {
        let values = labelValuesMap[label]
        if (!values) {
          values = []
          labelValuesMap[label] = values
        }
        const value = labels[label]
        if (value !== undefined) {
          if (!values.includes(value)) {
            values.push(value)
          }
        }
      }
    }
    return labelValuesMap
  }, [allClusters])

  const onFilter = useCallback(
    (_: any, filterValue: string) => {
      if (allClusterLabels[selectedClusterLabel]) {
        return allClusterLabels[selectedClusterLabel]
          .filter((option) => {
            if (typeof option !== 'string') return false
            return option.includes(filterValue)
          })
          .map((option) => <SelectOption key={option} value={option} />)
      }
    },
    [allClusterLabels, selectedClusterLabel]
  )

  const deleteChip = (groupLabel: string, chipLabel: string) => {
    const tempClusterLabels = { ...selectedClusterLabels }
    const copyOfChips = tempClusterLabels[groupLabel]
    const filteredCopy = copyOfChips.filter((chip) => chip !== chipLabel)
    if (filteredCopy.length === 0) {
      // array is empty delete the label key
      delete tempClusterLabels[groupLabel]
    } else {
      tempClusterLabels[groupLabel] = filteredCopy
    }

    setSelectedClusterLabels(tempClusterLabels)
  }

  function deleteChipGroup(groupLabel: string) {
    const tempClusterLabels = { ...selectedClusterLabels }
    delete tempClusterLabels[groupLabel]

    setSelectedClusterLabels(tempClusterLabels)
    setSelectedClusterLabel('')
  }

  function deleteAllChips() {
    setSelectedClusterLabels({})
    setSelectedClusterLabel('')
  }

  return (
    <PageSection style={{ paddingTop: 0 }} variant={'light'}>
      <div>
        <Select
          id="cluster-label-key"
          key="cluster-label-key"
          aria-label="cluster-label-key"
          toggleIcon={<FilterIcon />}
          width={'auto'}
          maxHeight={'400px'}
          variant={SelectVariant.single}
          onToggle={(isExpanded) => setLabelSelectIsOpen(isExpanded)}
          hasInlineFilter
          onSelect={(_, selection) => {
            if (selectedClusterLabel === selection) {
              setSelectedClusterLabel('')
            } else {
              setSelectedClusterLabel(selection as string)
            }
            setLabelSelectIsOpen(false)
          }}
          selections={selectedClusterLabel}
          isOpen={labelSelectIsOpen}
          placeholderText={t('Select cluster label')}
          aria-labelledby={'cluster-label-key'}
        >
          {Object.keys(allClusterLabels).map((labelKey: string) => (
            <SelectOption key={`cluster-label-key-${labelKey}`} value={labelKey} />
          ))}
        </Select>
        <Select
          id="cluster-label-value"
          aria-label="cluster-label-value"
          width={'auto'}
          maxHeight={'400px'}
          variant={SelectVariant.checkbox}
          onToggle={(isExpanded) => setValuesSelectIsOpen(isExpanded)}
          onFilter={onFilter}
          hasInlineFilter
          onSelect={(_, selection) => {
            const tempLabels = { ...selectedClusterLabels }
            const tempValues = tempLabels[selectedClusterLabel ?? ''] ?? []
            if (tempValues?.includes(selection as string)) {
              deleteChip(selectedClusterLabel, selection as string)
            } else {
              tempLabels[selectedClusterLabel ?? ''] = [...tempValues, selection as string]
              setSelectedClusterLabels(tempLabels)
            }
          }}
          selections={selectedClusterLabels[selectedClusterLabel ?? '']}
          isOpen={valuesSelectIsOpen}
          placeholderText={t('Select label value')}
          aria-labelledby={'cluster-label-value'}
        >
          {allClusterLabels[selectedClusterLabel ?? '']?.map((label) => (
            <SelectOption key={label} value={label} />
          ))}
        </Select>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {Object.keys(selectedClusterLabels).map((label) => {
            return (
              <div key={label} style={{ marginTop: '0.5rem', marginRight: '.5rem' }}>
                <ChipGroup key={label} categoryName={label} isClosable onClick={() => deleteChipGroup(label)}>
                  {selectedClusterLabels[label].map((value) => (
                    <Chip key={value} onClick={() => deleteChip(label, value)}>
                      {value}
                    </Chip>
                  ))}
                </ChipGroup>
              </div>
            )
          })}
          {Object.values(selectedClusterLabels).length > 0 && (
            <Button variant={'link'} onClick={() => deleteAllChips()} style={{ marginTop: '0.5rem' }}>
              {t('Clear all labels')}
            </Button>
          )}
        </div>
      </div>
    </PageSection>
  )
}
