import { ReactNode } from 'react'
export default function Topology(props: {
    type?: string
    title?: string
    controlData: any[]
    wizardClassName?: string
    template: any
    logging?: boolean
    portals?: {
        editBtn: string
        createBtn: string
        cancelBtn: string
    }
    onControlInitialize?: (control: any) => void
    onControlChange?: (control: any) => void
    editorReadOnly?: boolean
    onStepChange?: (step: any, prevStep: any) => void
    ref?: any
    controlProps?: any
}): JSX.Element
