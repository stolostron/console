/* Copyright Contributors to the Open Cluster Management project */
import { Button, Chip, ChipGroup, PageSection, SelectOption } from '@patternfly/react-core'
import { FilterIcon } from '@patternfly/react-icons'
import { Dispatch, SetStateAction, useMemo, useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { Cluster } from '../../../resources/utils'
import { useAllClusters } from '../../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import { AcmSelectBase, SelectVariant } from '../../../components/AcmSelectBase'

export default function OverviewClusterLabelSelector(props: {
  selectedClusterLabels: Record<string, string[]>
  setSelectedClusterLabels: Dispatch<SetStateAction<Record<string, string[]>>>
}) {
  const { t } = useTranslation()
  const { selectedClusterLabels, setSelectedClusterLabels } = props
  const allClusters: Cluster[] = useAllClusters()
  const [selectedClusterLabel, setSelectedClusterLabel] = useState<string>('')

  const allClusterLabels = useMemo(() => {
    const labelValuesMap: Record<string, string[]> = {}
    let needRegionOther = false
    for (const cluster of allClusters) {
      const labels = cluster.labels ?? {}
      // If a cluster does not have region label set then we need Other
      if (!Object.keys(labels).includes('region')) {
        needRegionOther = true
      }
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
    // Only add Other value for region if it is not included in cluster labels
    if (needRegionOther) {
      labelValuesMap['region'] = [...(labelValuesMap['region'] ?? []), 'Other']
    }
    return labelValuesMap
  }, [allClusters])

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
    <PageSection variant={'light'}>
      <div>
        <AcmSelectBase
          id="cluster-label-key"
          key="cluster-label-key"
          aria-label={t('Select cluster label')}
          toggleIcon={<FilterIcon />}
          width={'auto'}
          maxHeight={'400px'}
          variant={SelectVariant.typeahead}
          onSelect={(selection) => {
            if (selectedClusterLabel === selection) {
              setSelectedClusterLabel('')
            } else {
              setSelectedClusterLabel(selection as string)
            }
          }}
          selections={selectedClusterLabel}
          placeholder={t('Select cluster label')}
          aria-labelledby={'cluster-label-key'}
        >
          {Object.keys(allClusterLabels).map((labelKey: string) => (
            <SelectOption key={`cluster-label-key-${labelKey}`} value={labelKey} />
          ))}
        </AcmSelectBase>
        <AcmSelectBase
          id="cluster-label-value"
          aria-label={t('Select cluster label value')}
          width={'auto'}
          maxHeight={'400px'}
          variant={SelectVariant.typeaheadCheckbox}
          onSelect={(selection) => {
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
          placeholderText={t('Select label value')}
          aria-labelledby={'cluster-label-value'}
        >
          {allClusterLabels[selectedClusterLabel ?? '']?.map((label) => <SelectOption key={label} value={label} />)}
        </AcmSelectBase>
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
