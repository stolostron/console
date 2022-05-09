/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@material-ui/styles'
import { Badge, Select, SelectGroup, SelectOption, SelectOptionObject, SelectVariant } from '@patternfly/react-core'
import { FilterIcon } from '@patternfly/react-icons'
import { useState } from 'react'
import { useRecoilState } from 'recoil'
import { policySetsState } from '../../../../atoms'
import { NavigationPath } from '../../../../NavigationPath'
import { PolicySet } from '../../../../resources/policy-set'

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

const noViolation = 'no-violation'

export default function CardViewToolbarFilter(props: {
    preSelectedFilters: string[]
    setViolationFilters: React.Dispatch<React.SetStateAction<string[]>>
}) {
    const { setViolationFilters, preSelectedFilters } = props
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [selectedFilters, setSelectedFilters] = useState<string[]>(preSelectedFilters ?? [])
    const [policySets] = useRecoilState(policySetsState)
    const classes = useStyles()

    const onFilterSelect = (selection: string) => {
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
    }

    const selectOptions = [
        <SelectGroup key={'violation'} label={'Violations'}>
            <SelectOption
                key={'violation'}
                inputId={'violation'}
                value={'violation'}
                isChecked={selectedFilters.indexOf('violation') > -1}
            >
                <div className={classes.filterOption}>
                    {'With violation'}
                    <Badge className={classes.filterOptionBadge} key={'option.option.value'} isRead>
                        {
                            policySets.filter((policySet: PolicySet) => {
                                if (policySet.status && policySet.status.compliant) {
                                    return policySet.status.compliant === 'NonCompliant'
                                }
                                return false
                            }).length
                        }
                    </Badge>
                </div>
            </SelectOption>
            <SelectOption
                key={noViolation}
                inputId={noViolation}
                value={noViolation}
                isChecked={selectedFilters.indexOf(noViolation) > -1}
            >
                <div className={classes.filterOption}>
                    {'Without violation'}
                    <Badge className={classes.filterOptionBadge} key={'option.option.value'} isRead>
                        {
                            policySets.filter((policySet: PolicySet) => {
                                if (policySet.status && policySet.status.compliant) {
                                    return policySet.status.compliant === 'Compliant'
                                }
                                return false
                            }).length
                        }
                    </Badge>
                </div>
            </SelectOption>
            <SelectOption
                key={'no-status'}
                inputId={'no-status'}
                value={'no-status'}
                isChecked={selectedFilters.indexOf('no-status') > -1}
            >
                <div className={classes.filterOption}>
                    {'No status'}
                    <Badge className={classes.filterOptionBadge} key={'option.option.value'} isRead>
                        {
                            policySets.filter((policySet: PolicySet) => {
                                if (!policySet.status) {
                                    return true
                                }
                                return policySet.status && policySet.status.compliant === undefined
                            }).length
                        }
                    </Badge>
                </div>
            </SelectOption>
        </SelectGroup>,
    ]

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
            isOpen={isFilterOpen}
            placeholderText={
                <div>
                    <FilterIcon className={classes.filterLabelMargin} />
                    {'Filter'}
                </div>
            }
        >
            {selectOptions}
        </Select>
    )
}
