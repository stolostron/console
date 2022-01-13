/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@material-ui/styles'
import {
    Badge,
    Divider,
    Select,
    SelectGroup,
    SelectOption,
    SelectOptionObject,
    SelectVariant,
} from '@patternfly/react-core'
import { FilterIcon } from '@patternfly/react-icons'
import { useState } from 'react'
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

export default function CardViewToolbarFilter(props: {
    policySets: PolicySet[]
    setViolationFilters: React.Dispatch<React.SetStateAction<string[]>>
}) {
    const { policySets, setViolationFilters } = props
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [selectedFilters, setSelectedFilters] = useState<string[]>([])
    const classes = useStyles()

    const onFilterSelect = (selection: string) => {
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
        <SelectGroup key={'cluster-violation'} label={'Cluster violation'}>
            <SelectOption
                key={'cluster-violation'}
                inputId={'cluster-violation'}
                value={'cluster-violation'}
                isChecked={selectedFilters.indexOf('cluster-violation') > -1}
            >
                <div className={classes.filterOption}>
                    {'Violation'}
                    <Badge className={classes.filterOptionBadge} key={'option.option.value'} isRead>
                        {
                            policySets.filter((policySet: PolicySet) => {
                                return (
                                    policySet.status.results.filter((result) =>
                                        result.clusters?.some((cluster) => cluster.compliant === 'NonCompliant')
                                    ).length > 0
                                )
                            }).length
                        }
                    </Badge>
                </div>
            </SelectOption>
            <SelectOption
                key={'cluster-no-violation'}
                inputId={'cluster-no-violation'}
                value={'cluster-no-violation'}
                isChecked={selectedFilters.indexOf('cluster-no-violation') > -1}
            >
                <div className={classes.filterOption}>
                    {'No violation'}
                    <Badge className={classes.filterOptionBadge} key={'option.option.value'} isRead>
                        {
                            policySets.filter((policySet: PolicySet) => {
                                return policySet.status.results.every((result) => {
                                    return (
                                        (result.clusters &&
                                            result.clusters.every((cluster) => cluster.compliant !== 'NonCompliant')) ??
                                        true
                                    )
                                })
                            }).length
                        }
                    </Badge>
                </div>
            </SelectOption>
        </SelectGroup>,
        <Divider component="li" key={'options-divider'} />,
        <SelectGroup key={'policy-violation'} label={'Policy violation'}>
            <SelectOption
                key={'policy-violation'}
                inputId={'policy-violation'}
                value={'policy-violation'}
                isChecked={selectedFilters.indexOf('policy-violation') > -1}
            >
                <div className={classes.filterOption}>
                    {'Violation'}
                    <Badge className={classes.filterOptionBadge} key={'option.option.value'} isRead>
                        {
                            policySets.filter((policySet: PolicySet) => {
                                return (
                                    policySet.status.results.filter((result) => result.compliant === 'NonCompliant')
                                        .length > 0
                                )
                            }).length
                        }
                    </Badge>
                </div>
            </SelectOption>
            <SelectOption
                key={'policy-no-violation'}
                inputId={'policy-no-violation'}
                value={'policy-no-violation'}
                isChecked={selectedFilters.indexOf('policy-no-violation') > -1}
            >
                <div className={classes.filterOption}>
                    {'No violation'}
                    <Badge className={classes.filterOptionBadge} key={'option.option.value'} isRead>
                        {
                            policySets.filter((policySet: PolicySet) => {
                                return policySet.status.results.every((result) => {
                                    return (result && result.compliant !== 'NonCompliant') ?? true
                                })
                            }).length
                        }
                    </Badge>
                </div>
            </SelectOption>
            <SelectOption
                key={'policy-unknown'}
                inputId={'policy-unknown'}
                value={'policy-unknown'}
                isChecked={selectedFilters.indexOf('policy-unknown') > -1}
            >
                <div className={classes.filterOption}>
                    {'Unknown'}
                    <Badge className={classes.filterOptionBadge} key={'option.option.value'} isRead>
                        {
                            policySets.filter((policySet: PolicySet) => {
                                return policySet.status.results.filter((result) => !result.compliant).length > 0
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
