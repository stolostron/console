/* Copyright Contributors to the Open Cluster Management project */

import { AcmDrawerContext } from '../../../../ui-components'
import cloneDeep from 'lodash/cloneDeep'
import { useContext, useEffect, useState } from 'react'
import { Topology } from './topology/Topology'
import { useTranslation } from '../../../../lib/acm-i18next'
import { ApplicationDataType } from '../ApplicationDetails'
import { processResourceActionLink } from './helpers/diagram-helpers'
import { getDiagramElements } from './model/topology'
import { getOptions } from './options'
import { DrawerShapes } from './components/DrawerShapes'
import './ApplicationTopology.css'
import './components/Drawer.css'
import './components/Toolbar.css'

export type ArgoAppDetailsContainerData = {
  page: number
  startIdx: number
  argoAppSearchToggle: boolean
  expandSectionToggleMap: Set<number>
  selected?: any
  selectedArgoAppList: []
  isLoading: boolean
}

export type ClusterDetailsContainerData = {
  page: number
  startIdx: number
  clusterSearchToggle: boolean
  expandSectionToggleMap: any
  clusterID?: string
  selected?: any
  selectedClusterList: any[]
}

export function ApplicationTopologyPageContent(props: {
  applicationData: ApplicationDataType | undefined
  channelControl: {
    allChannels: string[]
    activeChannel: string | undefined
    setActiveChannel: (channel: string) => void
  }
}) {
  const { t } = useTranslation()
  const {
    applicationData = {
      refreshTime: undefined,
      application: undefined,
      appData: undefined,
      topology: undefined,
      statuses: undefined,
    },
    channelControl,
  } = props
  const { refreshTime, application, appData, topology, statuses } = applicationData

  const { setDrawerContext } = useContext(AcmDrawerContext)
  const [options] = useState<any>(getOptions())
  const [elements, setElements] = useState<{
    nodes: any[]
    links: any[]
  }>({ nodes: [], links: [] })

  const [argoAppDetailsContainerData, setArgoAppDetailsContainerData] = useState<ArgoAppDetailsContainerData>({
    page: 1,
    startIdx: 0,
    argoAppSearchToggle: false,
    expandSectionToggleMap: new Set(),
    selected: undefined,
    selectedArgoAppList: [],
    isLoading: false,
  })

  const [clusterDetailsContainerData, setClusterDetailsContainerData] = useState<ClusterDetailsContainerData>({
    page: 1,
    startIdx: 0,
    clusterSearchToggle: false,
    expandSectionToggleMap: new Set(),
    clusterID: undefined,
    selected: undefined,
    selectedClusterList: [],
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
    panelContent: React.ReactNode | React.ReactNode[],
    closeDrawer: boolean
  ) => {
    if (closeDrawer) {
      setDrawerContext(undefined)
    } else {
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
  }

  const argoAppDetailsContainerControl = {
    argoAppDetailsContainerData,
    handleArgoAppDetailsContainerUpdate: setArgoAppDetailsContainerData,
    handleErrorMsg,
  }

  const clusterDetailsContainerControl = {
    clusterDetailsContainerData,
    handleClusterDetailsContainerUpdate: setClusterDetailsContainerData,
  }

  const processActionLink = (resource: any, toggleLoading: boolean) => {
    processResourceActionLink(resource, toggleLoading, t)
  }

  const canUpdateStatuses = !!statuses
  useEffect(() => {
    if (application && appData && topology) {
      setElements(cloneDeep(getDiagramElements(appData, cloneDeep(topology), statuses, canUpdateStatuses, t)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTime])

  return (
    <>
      <DrawerShapes />
      <Topology
        elements={elements}
        processActionLink={processActionLink}
        canUpdateStatuses={canUpdateStatuses}
        argoAppDetailsContainerControl={argoAppDetailsContainerControl}
        clusterDetailsContainerControl={clusterDetailsContainerControl}
        channelControl={channelControl}
        options={options}
        setDrawerContent={setDrawerContent}
      />
    </>
  )
}
