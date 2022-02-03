/* Copyright Contributors to the Open Cluster Management project */

import { Chip } from '@patternfly/react-core'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { NavigationPath } from '../../../NavigationPath'
import { PolicySet } from '../../../resources'

export function PolicySetList(props: { policySets: PolicySet[] }) {
    const { policySets } = props
    const [showAll, setShowAll] = useState(policySets.length - 1 > 1 ? false : true)

    let policySetLinks = useMemo(
        () =>
            policySets.map((policySetMatch: PolicySet, idx: number) => {
                const urlSearch = encodeURIComponent(
                    `names=["${policySetMatch.metadata.name}"]&namespaces=["${policySetMatch.metadata.namespace}"]`
                )
                return (
                    <div key={`${idx}-${policySetMatch.metadata.name}`}>
                        <Link
                            to={{
                                pathname: NavigationPath.policySets,
                                search: `?${urlSearch}`,
                                state: {
                                    from: NavigationPath.policies,
                                },
                            }}
                        >
                            {policySetMatch.metadata.name}
                        </Link>
                        {/* separate PolicySet links by comma */}
                        {(showAll && idx === policySets.length - 1) || (!showAll && idx == 1) ? '' : ', '}
                    </div>
                )
            }),
        [policySets]
    )

    if (policySetLinks.length > 2) {
        if (!showAll) {
            policySetLinks = policySetLinks.slice(0, 2)
        }
        policySetLinks.push(
            <Chip key={'overflow-btn'} isOverflowChip component={'button'} onClick={() => setShowAll(!showAll)}>
                {!showAll ? 'more' : 'Show less'}
            </Chip>
        )
    }
    return <div>{policySetLinks}</div>
}
