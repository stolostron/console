/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

import { ReactNode } from 'react'

export interface FormData {
    title: string
    titleTooltip: ReactNode
    description?: string
    breadcrumb: { text: string; to?: string }[]
    sections: Section[]
    // toYaml?: () => string
    submit: () => void
    cancel: () => void
    submitText: string
    submittingText: string
    reviewTitle: string
    reviewDescription: string
    cancelLabel: string
    nextLabel: string
    backLabel: string
    stateToData: () => unknown
}

export interface Section {
    title: string
    description?: ReactNode
    wizardTitle?: string
    inputs?: Input[]
    groups?: Group[]
    columns?: 1 | 2
}

export interface Group {
    title: string
    description?: string
    inputs: Input[]
    columns?: 1 | 2
}

export interface InputBase {
    id: string
    isRequired?: boolean | (() => boolean)
    isDisabled?: boolean | (() => boolean)
    isHidden?: boolean | (() => boolean)
    helperText?: string | (() => string)
    placeholder?: string | (() => string)
    labelHelp?: string
    labelHelpTitle?: string
    isSecret?: boolean
}

export interface TextInput extends InputBase {
    type: 'Text'
    label: string
    value: string | (() => string)
    onChange: (value: string) => void
    validation?: (value: string) => string | undefined
}

export interface TextArea extends InputBase {
    type: 'TextArea'
    label: string
    value: string | (() => string)
    onChange: (value: string) => void
    validation?: (value: string) => string | undefined
}

export interface SelectGroup {
    group: string
    options: SelectInputOptions[]
}

export interface SelectInputOptions {
    id: string
    value: string
    icon?: ReactNode
    text?: string
    description?: string
}

export interface SelectInput extends InputBase {
    type: 'Select'
    label: string
    groups?: SelectGroup[]
    options?: SelectInputOptions[] | (() => SelectInputOptions[])
    value: string | (() => string)
    onChange: (value: string) => void
    validation?: (value: string) => string
    mode?: 'default' | 'tiles' | 'icon'
    isDisplayLarge?: boolean
}

export type Input = TextInput | TextArea | SelectInput
