/* Copyright Contributors to the Open Cluster Management project */
import { ReactNode } from 'react'
export default function Topology(props: {
    title?: string
    elements: {
        nodes: any[]
        links: any[]
    }
    diagramViewer: any
    options?: any
    searchName?: string
    fetchControl?: {
        isLoaded: boolean | undefined
        isFailed: boolean | undefined
        isReloading: boolean | undefined
    }
    channelControl: {
        allChannels: [string] | undefined
        activeChannel: string | undefined
        changeTheChannel: (fetchChannel: string) => void
    }
    argoAppDetailsContainerControl: {
        argoAppDetailsContainerData: ArgoAppDetailsContainerData
        handleArgoAppDetailsContainerUpdate: React.Dispatch<React.SetStateAction<ArgoAppDetailsContainerData>>
        handleErrorMsg: () => void
    }
    canUpdateStatuses?: boolean
    processActionLink?: (resource: any, toggleLoading: boolean) => void
    searchUrl?: string
    setDrawerContent?: (
        title: string,
        isInline: boolean,
        isResizable: boolean,
        disableDrawerHead: boolean,
        drawerPanelBodyHasNoPadding: boolean,
        panelContent: React.ReactNode | React.ReactNode[],
        closeDrawer: boolean
    ) => void
    t: (key: any) => string
}): JSX.Element
