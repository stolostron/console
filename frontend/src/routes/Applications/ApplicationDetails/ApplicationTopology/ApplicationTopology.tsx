/* Copyright Contributors to the Open Cluster Management project */

import { PageSection, ActionListItem } from '@patternfly/react-core'
import { AcmActionGroup } from '@stolostron/ui-components'
import { useState, useEffect, useContext, useRef } from 'react'
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
    subscriptionReportsState,
    managedClustersState,
} from '../../../../atoms'
import {
    applicationState,
} from '../ApplicationDetails'

import './ApplicationTopology.css'
import Topology from '../../../../components/Topology/Topology'
import DiagramViewer from './components/DiagramViewer'
import LegendView from './components/LegendView'
import { getOptions } from './options'
import { useApplicationPageContext } from '../ApplicationDetails'
import { AcmDrawerContext } from '../AcmDrawer'
import { processResourceActionLink } from './helpers/diagram-helpers'
import { getApplication } from './model/application'
import { getTopology, getDiagramElements } from './model/topology'
import { getApplicationData } from './model/utils'
import { getResourceStatuses } from './model/resourceStatuses'

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
    const [subscriptionReports] = useRecoilState(subscriptionReportsState)
    const [managedClusters] = useRecoilState(managedClustersState)

    const [application] = useRecoilState(applicationState)


    const [allChannels, setAllChannels] = useState<[]>()
    const [activeChannel, setActiveChannel] = useState<string>()
    const [canUpdateStatuses, setCanUpdateStatuses] = useState<boolean>(false)
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
    const lastRefreshRef = useRef<any>()

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

    useEffect(()=>{
        const f = application
    }, [application])

    // refresh application the first time and then every n seconds
    useEffect(() => {
        const interval = setInterval(
            (function refresh() {
                // application is refreshed with recoil states and old statues (if any from last pass)
                // if no old statuses, nodes are shown with waiting statuses
                const { application, appData, topology } =
                    refreshApplication(lastRefreshRef.current?.resourceStatuses) || {}
                if (application && appData && topology) {
                    // then application is refreshed with new statuses
                    ;(async () => {
                        const resourceStatuses = await getResourceStatuses(
                            application,
                            appData,
                            topology,
                            lastRefreshRef.current
                        )
                        refreshApplication(resourceStatuses)
                        lastRefreshRef.current = { application, resourceStatuses }
                        setCanUpdateStatuses(true)
                    })()
                }
                return refresh
            })(),
            10000
        )
        return () => clearInterval(interval)
    }, [])

    // generate diagram elements
    const refreshApplication = (resourceStatuses: any) => {
        // use recoil states to get application
        const application = getApplication(props.namespace, props.name, activeChannel, {
            applications,
            applicationSets,
            argoApplications,
            ansibleJob,
            subscriptions,
            channels,
            subscriptionReports,
            placements,
            placementRules,
        })
        if (application) {
            setActiveChannel(application.activeChannel)
            setAllChannels(application.channels)
            const topology = getTopology(application, managedClusters, resourceStatuses?.relatedResources)
            const appData = getApplicationData(topology.nodes)

            // create topology elements with statuses provided by searches
            setElements(
                getDiagramElements(appData, topology, resourceStatuses?.resourceStatuses, !!resourceStatuses, t)
            )
            return { application, appData, topology }
        }
    }

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
