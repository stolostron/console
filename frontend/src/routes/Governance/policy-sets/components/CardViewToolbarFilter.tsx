/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@mui/styles'
import { Badge, Select, SelectGroup, SelectOption, SelectOptionObject, SelectVariant } from '@patternfly/react-core'
import { FilterIcon } from '@patternfly/react-icons'
import { useCallback, useMemo, useState } from 'react'
import { useRecoilState, useSharedAtoms } from '../../../../shared-recoil'
import { NavigationPath } from '../../../../NavigationPath'
import { PolicySet } from '../../../../resources/policy-set'
import { useTranslation } from '../../../../lib/acm-i18next'

const useStyles = makeStyles({
  filterLabelMargin: {
    marginRight: '.5rem',
  },
  filterOption: {
    display: 'flex',
    alignItems: 'center',
  },
  filterOptionBadge: {
    marginLeft: '.5rem',
  },
})

export default function CardViewToolbarFilter(props: {
  preSelectedFilters: string[]
  setViolationFilters: React.Dispatch<React.SetStateAction<string[]>>
}) {
  const { setViolationFilters, preSelectedFilters } = props
  const { policySetsState } = useSharedAtoms()
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<string[]>(preSelectedFilters ?? [])
  const [policySets] = useRecoilState(policySetsState)
  const classes = useStyles()
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
            key: 'violation',
            label: t('With violation'),
            filter: (policySet: PolicySet) => {
              if (policySet.status && policySet.status.compliant) {
                return policySet.status.compliant === 'NonCompliant'
              }
              return false
            },
          },
          {
            key: 'no-violation',
            label: t('Without violation'),
            filter: (policySet: PolicySet) => {
              if (policySet.status && policySet.status.compliant) {
                return policySet.status.compliant === 'Compliant'
              }
              return false
            },
          },
          {
            key: 'pending',
            label: t('Pending'),
            filter: (policySet: PolicySet) => {
              if (policySet.status && policySet.status.compliant) {
                return policySet.status.compliant === 'Pending'
              }
              return false
            },
          },
          {
            key: 'no-status',
            label: t('No status'),
            filter: (policySet: PolicySet) => {
              if (!policySet.status) {
                return true
              }
              return policySet.status && policySet.status.compliant === undefined
            },
          },
        ].map(({ key, label, filter }) => (
          <SelectOption key={key} inputId={key} value={key}>
            <div className={classes.filterOption}>
              {label}
              <Badge className={classes.filterOptionBadge} key={`${key}-count`} isRead>
                {policySets.filter(filter).length}
              </Badge>
            </div>
          </SelectOption>
        ))}
      </SelectGroup>,
    ],
    [classes.filterOption, classes.filterOptionBadge, policySets, t]
  )

  return (
    <Select
      key={'card-view-filter-select-key'}
      variant={SelectVariant.checkbox}
      aria-label={'card-view-filter-select-key'}
      onToggle={() => setIsFilterOpen(!isFilterOpen)}
      onSelect={(
        _event: React.MouseEvent<Element, MouseEvent> | React.ChangeEvent<Element>,
        selection: string | SelectOptionObject
      ) => onFilterSelect(selection as string)}
      selections={selectedFilters}
      isGrouped
      isOpen={isFilterOpen}
      placeholderText={
        <div>
          <FilterIcon className={classes.filterLabelMargin} />
          {t('Filter')}
        </div>
      }
    >
      {selectOptions}
    </Select>
  )
}
