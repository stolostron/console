/* Copyright Contributors to the Open Cluster Management project */

import { useState } from 'react'
import { AcmSearchbar, DropdownSuggestionsProps } from './AcmSearchbar'
import { convertStringToTags } from './helper'

export default {
    title: 'Searchbar',
    component: AcmSearchbar,
}

function getSuggestions(query: string): DropdownSuggestionsProps[] {
    const tags = convertStringToTags(query)
    const lastTag = tags[tags.length - 1]
    if (!lastTag || !lastTag.name.endsWith(':')) {
        return [
            { id: '1', name: 'Filters', kind: 'label', disabled: true },
            { id: '2', name: 'kind', kind: 'filter' },
            { id: '3', name: 'name', kind: 'filter' },
            { id: '4', name: 'namespace', kind: 'filter' },
        ]
    }
    if (lastTag && lastTag.name.includes('kind:')) {
        return [
            { id: '1', name: 'Values', kind: 'label', disabled: true },
            { id: '2', name: 'pod', kind: 'value' },
            { id: '3', name: 'deployment', kind: 'value' },
            { id: '4', name: 'cluster', kind: 'value' },
            { id: '5', name: 'apiservice', kind: 'value' },
            { id: '6', name: 'deployable', kind: 'value' },
            { id: '7', name: 'application', kind: 'value' },
            { id: '8', name: 'subscription', kind: 'value' },
            { id: '9', name: 'service', kind: 'value' },
            { id: '10', name: 'ingress', kind: 'value' },
            { id: '11', name: 'secret', kind: 'value' },
            { id: '12', name: 'node', kind: 'value' },
            { id: '13', name: 'replicaset', kind: 'value' },
        ]
    } else if (lastTag && lastTag.name.includes('name:')) {
        return [
            { id: '1', name: 'Values', kind: 'label', disabled: true },
            { id: '2', name: 'name1', kind: 'value' },
            { id: '3', name: 'name2', kind: 'value' },
            { id: '4', name: 'name3', kind: 'value' },
        ]
    } else if (lastTag && lastTag.name.includes('namespace:')) {
        return [
            { id: '1', name: 'Values', kind: 'label', disabled: true },
            { id: '2', name: 'namespace1', kind: 'value' },
            { id: '3', name: 'namespace2', kind: 'value' },
            { id: '4', name: 'namespace3', kind: 'value' },
        ]
    }
    return [{ id: '1', name: 'No filters', kind: 'label', disabled: true }]
}

export const Searchbar = () => {
    const [currentQuery, setCurrentQuery] = useState('kind:pod namespace:default name:')
    return (
        <div style={{ display: 'flex', margin: '50px 50px 0px 50px' }}>
            <AcmSearchbar
                loadingSuggestions={false}
                queryString={currentQuery}
                suggestions={getSuggestions(currentQuery)}
                currentQueryCallback={(updatedQuery) => {
                    setCurrentQuery(updatedQuery)
                }}
                toggleInfoModal={() => null}
            />
        </div>
    )
}
