/* Copyright Contributors to the Open Cluster Management project */

import { PageSection, ActionListItem } from '@patternfly/react-core'
import { AcmActionGroup } from '@stolostron/ui-components'
import { useState, useContext } from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'
import { getDiagramElements } from './model/topology'

import './ApplicationTopology.css'
import Topology from '../../../../components/Topology/Topology'
import DiagramViewer from './components/DiagramViewer'
import LegendView from './components/LegendView'
import { getOptions } from './options'
import { useApplicationPageContext, ApplicationDataType } from '../ApplicationDetails'
import { AcmDrawerContext } from '@stolostron/ui-components'
import { processResourceActionLink } from './helpers/diagram-helpers'

import { cloneDeep } from 'lodash'

export type ArgoAppDetailsContainerData = {
    page: number
    startIdx: number
    argoAppSearchToggle: boolean
    expandSectionToggleMap: Set<number>
    selected: undefined
    selectedArgoAppList: []
    isLoading: boolean
}

export function ApplicationTopologyPageContent(props: {
    applicationData: ApplicationDataType | undefined
    setActiveChannel: (channel: string) => void
}) {
    const { t } = useTranslation()
    const {
        applicationData = {
            activeChannel: undefined,
            allChannels: undefined,
            application: undefined,
            appData: undefined,
            topology: undefined,
            statuses: undefined,
        },
    } = props
    const { activeChannel, allChannels, application, appData, topology, statuses } = applicationData
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

    const handleErrorMsg = () => {
        //show toast message in parent container
    }

    const setDrawerContent = (
        title: string,
        isInline: boolean,
        isResizable: boolean,
        disableDrawerHead: boolean,
        drawerPanelBodyHasNoPadding: boolean,
        panelContent: React.ReactNode | React.ReactNode[]
    ) => {
        setDrawerContext({
            isExpanded: true,
            onCloseClick: () => setDrawerContext(undefined),
            title,
            panelContent,
            isInline,
            panelContentProps: { minSize: '20%' },
            isResizable,
            disableDrawerHead,
            drawerPanelBodyHasNoPadding,
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
                                onClick={() =>
                                    setDrawerContent(
                                        t('How to read topology'),
                                        true,
                                        false,
                                        false,
                                        false,
                                        <LegendView t={t} />
                                    )
                                }
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
        props.setActiveChannel(fetchChannel)
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

    let elements: {
        nodes: any[]
        links: any[]
    } = { nodes: [], links: [] }
    const canUpdateStatuses = !!statuses
    if (application && appData && topology) {
        elements = cloneDeep(getDiagramElements(appData, cloneDeep(topology), statuses, canUpdateStatuses, t))
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
