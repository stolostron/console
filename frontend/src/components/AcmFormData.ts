/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

import { ReactNode } from 'react'

export interface FormData {
    title: string
    titleTooltip?: ReactNode
    description?: string
    breadcrumb: { text: string; to?: string }[]
    sections: (Section | SectionGroup)[]
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

export interface SectionBase {
    title: string
    description?: ReactNode
}

export interface Section extends SectionBase {
    type: 'Section'
    wizardTitle?: string
    inputs?: Input[]
    alerts?: ReactNode
}

export interface SectionGroup extends SectionBase {
    type: 'SectionGroup'
    sections?: Section[]
}

export enum LinkType {
    external = 'external',
    internalNewTab = 'internalNewTab',
    internalNoNewTab = 'internalNoNewTab',
}

export interface InputBase<T> {
    id: string

    label: string
    placeholder?: string

    value: T
    onChange: (value: T) => void
    validation?: (value: T) => string | undefined

    isRequired?: boolean
    isDisabled?: boolean
    isHidden?: boolean

    helperText?: string
    labelHelp?: string
    labelHelpTitle?: string

    prompt?: { text: string; linkType: LinkType; callback: () => void }
}

export interface TextInput extends InputBase<string> {
    type: 'Text'
    isSecret?: boolean
}

export interface TextNumberInput extends InputBase<number> {
    type: 'TextNumber'
    min?: number
    max?: number
    step?: number
}

export interface TextArea extends InputBase<string> {
    type: 'TextArea'
    isSecret?: boolean
}

export interface SelectGroup {
    group: string
    options: SelectOptionInput[]
}

export interface SelectOptionInput {
    id: string
    value: string
    icon?: ReactNode
    text?: string
    description?: string
}

export interface SelectOptionsBase<T> extends InputBase<T> {
    options: SelectOptionInput[]
}

export interface SelectInput extends SelectOptionsBase<string> {
    type: 'Select'
    variant?: 'single' | 'typeahead'
}

export interface MultiselectInput extends SelectOptionsBase<string[]> {
    type: 'Multiselect'
    variant?: 'checkbox' | 'typeaheadmulti'
}

export interface SelectGroupedBase<T> extends InputBase<T> {
    groups: SelectGroup[]
}

export interface GroupedSelectInput extends SelectGroupedBase<string> {
    type: 'GroupedSelect'
    variant?: 'single' | 'typeahead'
}

export interface GroupedMultiselectInput extends SelectGroupedBase<string[]> {
    type: 'GroupedMultiselect'
    variant?: 'checkbox' | 'typeaheadmulti'
}

export interface TilesInput extends SelectOptionsBase<string> {
    type: 'Tiles'
}

export interface GroupedTilesInput extends SelectGroupedBase<string> {
    type: 'GroupedTiles'
}

export interface NumberInput extends InputBase<number> {
    type: 'Number'
    min?: number
    max?: number
    step?: number
    unit?: ReactNode
}

export interface FormDataOrderedInput<T = any> extends InputBase<T[]> {
    type: 'OrderedItems'
    keyFn: (item: T) => string
    cellsFn: (item: T) => ReactNode[]
    onEdit?: (item: T) => void
    onCreate?: () => void
}

export type Input =
    | TextInput
    | TextNumberInput
    | TextArea
    | SelectInput
    | MultiselectInput
    | GroupedSelectInput
    | GroupedMultiselectInput
    | TilesInput
    | GroupedTilesInput
    | NumberInput
    | FormDataOrderedInput
