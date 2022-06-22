/* Copyright Contributors to the Open Cluster Management project */

import { PageSection } from '@patternfly/react-core'
import '@patternfly/react-core/dist/styles/base.css'
import { Fragment, useMemo, useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AcmAutoRefreshSelect } from '../AcmAutoRefreshSelect/AcmAutoRefreshSelect'
import { AcmPage, AcmPageContent, AcmPageHeader } from '../AcmPage'
import { AcmRefreshTime } from '../AcmRefreshTime/AcmRefreshTime'
import { AcmSecondaryNav, AcmSecondaryNavItem } from '../AcmSecondaryNav/AcmSecondaryNav'
import { AcmSearchbar, DropdownSuggestionsProps } from './AcmSearchbar'
import { convertStringToTags } from './helper'

export default {
    title: 'Searchbar',
    component: AcmSearchbar,
}

export const Searchbar = () => {
    const [currentQuery, setCurrentQuery] = useState('kind:pod namespace:default name:')
    const [secondaryTab, setSecondaryTab] = useState('search')

    const suggestions: DropdownSuggestionsProps[] = useMemo(() => {
        const tags = convertStringToTags(currentQuery)
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
    }, [currentQuery])

    return (
        <MemoryRouter>
            <AcmPage
                header={
                    <AcmPageHeader
                        breadcrumb={[{ text: 'AcmHeader' }, { text: 'AcmPage' }]}
                        title={'Search'}
                        popoverPosition="bottom"
                        popoverAutoWidth={true}
                        label={'args.label'}
                        labelColor={'blue'}
                        description={'args.description'}
                        controls={
                            <Fragment>
                                <AcmAutoRefreshSelect refetch={() => null} />
                                <AcmRefreshTime
                                    timestamp={'Wed Jan 06 2021 00:00:00 GMT+0000 (Coordinated Universal Time)'}
                                    reloading={true}
                                />
                            </Fragment>
                        }
                        navigation={
                            <AcmSecondaryNav>
                                <AcmSecondaryNavItem
                                    isActive={secondaryTab === 'search'}
                                    onClick={() => setSecondaryTab('search')}
                                >
                                    Search
                                </AcmSecondaryNavItem>
                            </AcmSecondaryNav>
                        }
                    />
                }
            >
                {/* Each tab needs it's own AcmPageContent so it has its own ErrorBoundary and AlertGroup */}
                {secondaryTab === 'search' ? (
                    <AcmPageContent id="search">
                        <PageSection>
                            <Fragment>
                                <PageSection>
                                    <div style={{ display: 'flex' }}>
                                        <AcmSearchbar
                                            loadingSuggestions={false}
                                            queryString={currentQuery}
                                            suggestions={suggestions}
                                            currentQueryCallback={(updatedQuery) => {
                                                setCurrentQuery(updatedQuery)
                                            }}
                                            toggleInfoModal={() => null}
                                        />
                                    </div>
                                </PageSection>
                            </Fragment>
                        </PageSection>
                    </AcmPageContent>
                ) : (
                    <div />
                )}
            </AcmPage>
        </MemoryRouter>
    )
}
