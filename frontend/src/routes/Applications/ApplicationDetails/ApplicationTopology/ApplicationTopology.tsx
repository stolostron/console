/* Copyright Contributors to the Open Cluster Management project */

import { AcmDrawerContext } from '../../../../ui-components'
import cloneDeep from 'lodash/cloneDeep'
import { useContext, useEffect, useState } from 'react'
import { Topology } from './topology/Topology'
import { useTranslation } from '../../../../lib/acm-i18next'
import { useApplicationDetailsContext } from '../ApplicationDetails'
import { processResourceActionLink } from './helpers/diagram-helpers'
import { getDiagramElements } from './model/topology'
import { DrawerShapes } from './components/DrawerShapes'
import './ApplicationTopology.css'
import './topology/css/Drawer.css'
import { ArgoApp, ClusterDetailsContainerControl } from './types'
import { nodeDetailsProvider } from './model/NodeDetailsProvider'

export type ArgoAppDetailsContainerData = {
  page: number
  startIdx: number
  argoAppSearchToggle: boolean
  expandSectionToggleMap: Set<number>
  selected?: any
  selectedArgoAppList: ArgoApp[]
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
  isSelectOpen?: boolean
}

export function ApplicationTopologyPageContent() {
  const {
    applicationData = {
      refreshTime: undefined,
      application: undefined,
      appData: undefined,
      topology: undefined,
      statuses: undefined,
    },
    channelControl,
    toolbarControl,
  } = useApplicationDetailsContext()
  const { t } = useTranslation()
  const { refreshTime, topology, statuses } = applicationData
  let hubClusterName = ''
  if (topology) {
    hubClusterName = topology.hubClusterName
  }
  const { setDrawerContext } = useContext(AcmDrawerContext)
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

  const [startup, setStartup] = useState(false)

  useEffect(() => {
    setStartup(true)
  }, [])

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

  const clusterDetailsContainerControl: ClusterDetailsContainerControl = {
    clusterDetailsContainerData,
    handleClusterDetailsContainerUpdate: setClusterDetailsContainerData,
  }

  const processActionLink = (resource: any, toggleLoading: () => void, hubClusterName: string) => {
    processResourceActionLink(resource, toggleLoading, t, hubClusterName)
  }

  const canUpdateStatuses = !!statuses
  useEffect(() => {
    if (topology) {
      setElements(cloneDeep(getDiagramElements(cloneDeep(topology), statuses, canUpdateStatuses, t)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startup, refreshTime])

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
        toolbarControl={toolbarControl}
        nodeDetailsProvider={nodeDetailsProvider}
        setDrawerContent={setDrawerContent}
        hubClusterName={hubClusterName}
      />
    </>
  )
}
