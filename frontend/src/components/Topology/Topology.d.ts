import { ReactNode } from 'react'
export default function Topology(props: {
    title?: string
    elements: {
        nodes: any[]
        links: any[]
    }
    diagramViewer: any
    diagramOptions: any
    searchName?: string
    fetchControl?: {
        isLoaded: boolean | undefined
        isFailed: boolean | undefined
        isReloading: boolean | undefined
    }
    channelControl: {
        allChannels: [] | undefined
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
    setDrawerContent?: (title: string, isInline: boolean, panelContent: React.ReactNode | React.ReactNode[]) => void
    t: (key: any) => string
}): JSX.Element
