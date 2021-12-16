import { ReactNode } from 'react'
export default function Topology(props: {
    title?: string

    elements: {
        nodes: any[]
        links: any[]
    }

    searchName?: string
    handleLegendClose?: () => void
    showLegendView?: boolean

    fetchControl?: {
        isLoaded: boolean | undefined
        isFailed: boolean | undefined
        isReloading: boolean | undefined
    }

    channelControl: {
        allChannels: [] | undefined
        activeChannel: string | undefined
        isChangingChannel: boolean | undefined
        changeTheChannel: (fetchChannel: string) => void
    }

    argoAppDetailsContainerControl: {
        argoAppDetailsContainerData: ArgoAppDetailsContainerData
        handleArgoAppDetailsContainerUpdate: React.Dispatch<React.SetStateAction<ArgoAppDetailsContainerData>>
        handleErrorMsg: () => void
    }

    processActionLink?: (resource: any, toggleLoading: boolean) => void

    searchUrl?: string

    t: (key: any) => string
}): JSX.Element
