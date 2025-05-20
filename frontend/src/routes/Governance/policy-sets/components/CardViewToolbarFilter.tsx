/* Copyright Contributors to the Open Cluster Management project */

import { Badge, SelectOption, SelectGroup } from '@patternfly/react-core'
import { AcmSelectBase, SelectVariant } from '../../../../components/AcmSelectBase'
import { FilterIcon } from '@patternfly/react-icons'
import { useCallback, useMemo, useState } from 'react'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { NavigationPath } from '../../../../NavigationPath'
import { PolicySet } from '../../../../resources/policy-set'
import { useTranslation } from '../../../../lib/acm-i18next'
import { filterOption, filterOptionBadge } from '../../../../ui-components/AcmTable/filterStyles'

export default function CardViewToolbarFilter(props: {
  preSelectedFilters: string[]
  setViolationFilters: React.Dispatch<React.SetStateAction<string[]>>
}) {
  const { setViolationFilters, preSelectedFilters } = props
  const { policySetsState } = useSharedAtoms()
  const [selectedFilters, setSelectedFilters] = useState<string[]>(preSelectedFilters ?? [])
  const policySets = useRecoilValue(policySetsState)
  const { t } = useTranslation()

  const onFilterSelect = useCallback(
    (selection: string) => {
      window.history.pushState({}, '', NavigationPath.policySets)
      if (selectedFilters.includes(selection)) {
        const newFilters = selectedFilters.filter((filter) => filter !== selection)
        setSelectedFilters(newFilters)
        setViolationFilters(newFilters)
      } else {
        const newFilters = [...selectedFilters, selection]
        setSelectedFilters(newFilters)
        setViolationFilters(newFilters)
      }
    },
    [selectedFilters, setViolationFilters]
  )

  const selectOptions = useMemo(
    () => [
      <SelectGroup key={'violation'} label={t('Violations')}>
        {[
          {
            key: 'violations',
            label: t('Violations'),
            complianceValue: 'NonCompliant',
          },
          {
            key: 'no-violations',
            label: t('No violations'),
            complianceValue: 'Compliant',
          },
          {
            key: 'pending',
            label: t('Pending'),
            complianceValue: 'Pending',
          },
          {
            key: 'no-status',
            label: t('No status'),
            complianceValue: undefined,
          },
        ].map(({ key, label, complianceValue }) => (
          <SelectOption key={key} value={key}>
            <div className={filterOption}>
              {label}
              <Badge className={filterOptionBadge} key={`${key}-count`} isRead>
                {policySets.filter((policySet: PolicySet) => policySet?.status?.compliant === complianceValue).length}
              </Badge>
            </div>
          </SelectOption>
        ))}
      </SelectGroup>,
    ],
    [policySets, t]
  )

  return (
    <AcmSelectBase
      key={'card-view-filter-select-key'}
      variant={SelectVariant.checkbox}
      aria-label={t('Select filter options')}
      onSelect={(selection) => onFilterSelect(selection as string)}
      selections={selectedFilters}
      toggleIcon={<FilterIcon />}
      placeholder={t('Filter')}
    >
      {selectOptions}
    </AcmSelectBase>
  )
}
