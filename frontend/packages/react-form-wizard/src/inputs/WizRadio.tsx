import { DescriptionListDescription, DescriptionListGroup, DescriptionListTerm, Radio as PfRadio } from '@patternfly/react-core'
import { Children, createContext, Fragment, isValidElement, ReactElement, ReactNode, useContext } from 'react'
import { WizHelperText } from '../components/WizHelperText'
import { Indented } from '../components/Indented'
import { DisplayMode } from '../contexts/DisplayModeContext'
import { useRandomID } from '../contexts/useRandomID'
import { InputCommonProps, useInput } from './Input'
import { WizFormGroup } from './WizFormGroup'

export interface IRadioGroupContextState {
    value?: any
    setValue?: (value: any) => void
    readonly?: boolean
    disabled?: boolean
    radioGroup?: string
}

export const RadioGroupContext = createContext<IRadioGroupContextState>({})
RadioGroupContext.displayName = 'RadioGroupContext'

export type WizRadioGroupProps = InputCommonProps & { children?: ReactNode }

export function WizRadioGroup(props: WizRadioGroupProps) {
    const { displayMode: mode, value, setValue, hidden, id } = useInput(props)

    const radioGroup = useRandomID()
    const state: IRadioGroupContextState = {
        value,
        setValue,
        readonly: props.readonly,
        disabled: props.disabled,
        radioGroup,
    }

    if (hidden) return <Fragment />

    if (mode === DisplayMode.Details) {
        if (!state.value) return <Fragment />

        let selectedChild: ReactElement | undefined
        Children.forEach(props.children, (child) => {
            if (isValidElement(child)) {
                const value = child.props.value
                if (value === state.value) {
                    selectedChild = child
                }
            }
        })

        if (!selectedChild) return <Fragment />
        return (
            <Fragment>
                <DescriptionListGroup id={id}>
                    <DescriptionListTerm>{props.label}</DescriptionListTerm>
                    <DescriptionListDescription id={selectedChild.props.id}>{selectedChild.props.label}</DescriptionListDescription>
                </DescriptionListGroup>
                {selectedChild.props?.children && selectedChild.props.children}
            </Fragment>
        )
    }

    return (
        <RadioGroupContext.Provider value={state}>
            <div id={id}>
                <WizFormGroup {...props} id={id} noHelperText>
                    <WizHelperText {...props} />
                    <div style={{ display: 'flex', flexDirection: 'column', rowGap: 12, paddingTop: 8, paddingBottom: 4 }}>
                        {props.children}
                    </div>
                </WizFormGroup>
            </div>
        </RadioGroupContext.Provider>
    )
}

export function Radio(props: {
    id: string
    label: string
    value: string | number | boolean | undefined
    description?: string
    children?: ReactNode
}) {
    const radioGroupContext = useContext(RadioGroupContext)
    return (
        <Fragment>
            <PfRadio
                id={radioGroupContext.radioGroup ? props.id + '-' + radioGroupContext.radioGroup : props.id}
                label={props.label}
                description={props.description}
                isChecked={radioGroupContext.value === props.value || (props.value === undefined && !radioGroupContext.value)}
                onChange={() => radioGroupContext.setValue?.(props.value)}
                isDisabled={radioGroupContext.disabled}
                readOnly={radioGroupContext.readonly}
                name={radioGroupContext.radioGroup ?? ''}
            />
            {radioGroupContext.value === props.value && <Indented paddingBottom={16}>{props.children}</Indented>}
        </Fragment>
    )
}
