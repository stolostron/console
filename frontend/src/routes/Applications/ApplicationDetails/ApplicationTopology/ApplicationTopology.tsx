/* Copyright Contributors to the Open Cluster Management project */

import { PageSection, ActionListItem } from '@patternfly/react-core'
import { AcmActionGroup } from '@stolostron/ui-components'
import { useState, useEffect, useContext } from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'
import { useRecoilState } from 'recoil'
import {
    applicationsState,
    applicationSetsState,
    argoApplicationsState,
    ansibleJobState,
    subscriptionsState,
    channelsState,
    placementsState,
    placementRulesState,
    deployablesState,
    managedClustersState,
} from '../../../../atoms'
import { searchClient } from '../../../Home/Search/search-sdk/search-client'
import { useSearchResultRelatedItemsLazyQuery } from '../../../Home/Search/search-sdk/search-sdk'
import './ApplicationTopology.css'
import Topology from '../../../../components/Topology/Topology'
import DiagramViewer from './components/DiagramViewer'
import LegendView from './components/LegendView'
import { getOptions } from './options'
import { useApplicationPageContext } from '../ApplicationDetails'
import { AcmDrawerContext } from '../AcmDrawer'

import { processResourceActionLink } from '../../../../components/Topology/helpers/diagram-helpers'

import { getApplication } from './model/application'
import { getTopology, getDiagramElements } from './model/topology'
import { getApplicationData, getApplicationQuery, getRelatedQuery, getAdditionalQuery } from './model/searchQueries'

export type ArgoAppDetailsContainerData = {
    page: number
    startIdx: number
    argoAppSearchToggle: boolean
    expandSectionToggleMap: Set<number>
    selected: undefined
    selectedArgoAppList: []
    isLoading: boolean
}

export function ApplicationTopologyPageContent(props: { name: string; namespace: string }) {
    const { t } = useTranslation()
    const [applications] = useRecoilState(applicationsState)
    const [applicationSets] = useRecoilState(applicationSetsState)
    const [argoApplications] = useRecoilState(argoApplicationsState)
    const [ansibleJob] = useRecoilState(ansibleJobState)
    const [subscriptions] = useRecoilState(subscriptionsState)
    const [channels] = useRecoilState(channelsState)
    const [placements] = useRecoilState(placementsState)
    const [placementRules] = useRecoilState(placementRulesState)
    const [deployables] = useRecoilState(deployablesState)
    const [managedClusters] = useRecoilState(managedClustersState)
    const [allChannels, setAllChannels] = useState<[]>()
    const [activeChannel, setActiveChannel] = useState<string>()
    const [applicationQuery, setApplicationQuery] = useState<any>()
    const [relatedQuery, setRelatedQuery] = useState<any>()
    const [additionalQuery, setAdditionalQuery] = useState<any>()
    const [relatedLoadedOnce, setRelatedLoadedOnce] = useState<boolean>(false)
    const [applicationLoadedOnce, setApplicationLoadedOnce] = useState<boolean>(false)
    const [canUpdateStatuses, setCanUpdateStatuses] = useState<boolean>(false)
    const [shouldRefresh, setShouldRefresh] = useState<boolean>(true)
    const { setDrawerContext } = useContext(AcmDrawerContext)
    const [options] = useState<any>(getOptions())
    const [argoAppDetailsContainerData, setArgoAppDetailsContainerData] = useState<ArgoAppDetailsContainerData>({
        page: 1,
        startIdx: 0,
        argoAppSearchToggle: false,
        expandSectionToggleMap: new Set(),
        selected: undefined,
        selectedArgoAppList: [],
        isLoading: false,
    })
    const [elements, setElements] = useState<{
        nodes: any[]
        links: any[]
    }>({ nodes: [], links: [] })

    const handleErrorMsg = () => {
        //show toast message in parent container
    }

    const setDrawerContent = (title: string, isInline: boolean, panelContent: React.ReactNode | React.ReactNode[]) => {
        setDrawerContext({
            isExpanded: true,
            onCloseClick: () => setDrawerContext(undefined),
            title,
            panelContent,
            isInline,
            panelContentProps: { minSize: '20%' },
        })
    }

    useApplicationPageContext(() => {
        return (
            <AcmActionGroup>
                {[
                    <ActionListItem>
                        <div className="diagram-title">
                            <span
                                className="how-to-read-text"
                                tabIndex={0}
                                onClick={() => setDrawerContent(t('How to read topology'), true, <LegendView t={t} />)}
                                onKeyPress={() => {
                                    // noop function
                                }}
                                role="button"
                            >
                                {t('How to read topology')}
                                <svg className="how-to-read-icon">
                                    <use href={'#diagramIcons_sidecar'} />
                                </svg>
                            </span>
                        </div>
                    </ActionListItem>,
                ]}
            </AcmActionGroup>
        )
    })

    const changeTheChannel = (fetchChannel: string) => {
        setActiveChannel(fetchChannel)
    }

    const channelControl = {
        allChannels,
        activeChannel,
        changeTheChannel,
    }
    const argoAppDetailsContainerControl = {
        argoAppDetailsContainerData,
        handleArgoAppDetailsContainerUpdate: setArgoAppDetailsContainerData,
        handleErrorMsg,
    }

    const processActionLink = (resource: any, toggleLoading: boolean) => {
        processResourceActionLink(resource, toggleLoading, handleErrorMsg)
    }

    // generate diagram every n seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setShouldRefresh(true)
        }, 10000)
        return () => clearInterval(interval)
    }, [])

    // search for related resources after diagram generation
    const [
        fireSearchQuery,
        { called: searchCalled, data: searchRelated, loading: searchLoading, refetch: searchRefetch },
    ] = useSearchResultRelatedItemsLazyQuery({
        client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    })
    useEffect(() => {
        if (relatedQuery && !searchLoading) {
            if (!searchCalled) {
                fireSearchQuery({
                    variables: { input: [relatedQuery] },
                })
            } else {
                searchRefetch && searchRefetch({ input: relatedQuery })
            }
        }
    }, [fireSearchQuery, relatedQuery, searchCalled, searchRefetch])

    // search for resources related to the first search query
    const [
        fireAdditionalQuery,
        { called: additionalCalled, data: additionalRelated, loading: additionalLoading, refetch: additionalRefetch },
    ] = useSearchResultRelatedItemsLazyQuery({
        client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    })
    useEffect(() => {
        if (additionalQuery && !additionalLoading) {
            if (!additionalCalled) {
                fireAdditionalQuery({
                    variables: { input: [additionalQuery] },
                })
            } else {
                additionalRefetch && additionalRefetch({ input: additionalQuery })
            }
        }
    }, [fireAdditionalQuery, additionalQuery, additionalCalled, additionalRefetch])

    // search for application details
    const [
        fireApplicationQuery,
        {
            called: applicationCalled,
            data: applicationRelated,
            loading: applicationLoading,
            refetch: applicationRefetch,
        },
    ] = useSearchResultRelatedItemsLazyQuery({
        client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    })
    useEffect(() => {
        if (applicationQuery && !applicationLoading) {
            if (!applicationCalled) {
                fireApplicationQuery({
                    variables: { input: [applicationQuery] },
                })
            } else {
                applicationRefetch && applicationRefetch({ input: applicationQuery })
            }
        }
    }, [fireApplicationQuery, applicationQuery, applicationCalled, applicationRefetch])

    // determine when statuses on diagram have the searches needed to display
    useEffect(() => {
        if (searchCalled && !searchLoading) {
            setRelatedLoadedOnce(true)
        }
        if (applicationCalled && !applicationLoading) {
            setApplicationLoadedOnce(true)
        }
        const canUpdate =
            (relatedLoadedOnce || (searchCalled && !searchLoading)) &&
            (!applicationQuery || applicationLoadedOnce || (applicationCalled && !applicationLoading))
        setCanUpdateStatuses(canUpdate)
    }, [searchLoading, searchCalled, applicationLoading, applicationCalled, applicationQuery])

    // generate diagram elements
    useEffect(() => {
        const application = getApplication(props.namespace, props.name, activeChannel, {
            applications,
            applicationSets,
            argoApplications,
            ansibleJob,
            subscriptions,
            channels,
            deployables,
            placements,
            placementRules,
        })
        if (application) {
            setActiveChannel(application.activeChannel)
            setAllChannels(application.channels)
            const topology = getTopology(application, managedClusters)
            const appData = getApplicationData(topology.nodes)

            // optionally search for details on app
            setApplicationQuery(getApplicationQuery(application, appData))

            // search for details on other topology resources
            setRelatedQuery(getRelatedQuery(application, appData, topology, applicationRelated))

            // optionally search for additional resource details
            setAdditionalQuery(getAdditionalQuery(appData, searchRelated))

            // create topology elements with statuses provided by searches
            setElements(getDiagramElements(appData, topology, searchRelated, additionalRelated, canUpdateStatuses, t))
        }
        setShouldRefresh(false)
    }, [searchRelated, additionalRelated, applicationRelated, canUpdateStatuses, shouldRefresh, activeChannel])

    return (
        <PageSection>
            <Topology
                diagramViewer={DiagramViewer}
                elements={elements}
                canUpdateStatuses={canUpdateStatuses}
                processActionLink={processActionLink}
                channelControl={channelControl}
                options={options}
                argoAppDetailsContainerControl={argoAppDetailsContainerControl}
                setDrawerContent={setDrawerContent}
                t={t}
            />
        </PageSection>
    )
}
