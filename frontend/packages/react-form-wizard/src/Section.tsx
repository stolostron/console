import { DescriptionList, Divider, Icon, Split, SplitItem, Stack, Text, Title } from '@patternfly/react-core'
import { AngleDownIcon, AngleLeftIcon, ExclamationCircleIcon } from '@patternfly/react-icons'
import { Fragment, ReactNode, useEffect, useState } from 'react'
import { LabelHelp } from './components/LabelHelp'
import { DisplayMode, useDisplayMode } from './contexts/DisplayModeContext'
import { HasInputsContext, HasInputsProvider, useSetHasInputs } from './contexts/HasInputsProvider'
import { HasValueContext, HasValueProvider } from './contexts/HasValueProvider'
import { useShowValidation } from './contexts/ShowValidationProvider'
import { useStringContext } from './contexts/StringContext'
import { HasValidationErrorContext, ValidationProvider } from './contexts/ValidationProvider'
import { HiddenFn, useInputHidden } from './inputs/Input'

type SectionProps = {
    id?: string
    label: string
    description?: ReactNode
    prompt?: string
    children?: ReactNode
    defaultExpanded?: boolean
    labelHelpTitle?: string
    labelHelp?: string
    hidden?: HiddenFn
    collapsable?: boolean
    autohide?: boolean
}

export function Section(props: SectionProps) {
    return <SectionInternal {...props} />
}

function SectionInternal(props: SectionProps) {
    const mode = useDisplayMode()
    const id = props.id ?? props.label?.toLowerCase().split(' ').join('-') ?? ''
    const showValidation = useShowValidation()
    const [expanded, setExpanded] = useState(props.defaultExpanded === undefined ? true : props.defaultExpanded)
    const hidden = useInputHidden(props)

    const setHasInputs = useSetHasInputs()
    useEffect(() => {
        if (props.autohide === false) setHasInputs()
    }, [setHasInputs, props.autohide])

    const { expandToFixValidationErrors } = useStringContext()

    if (hidden) return <Fragment />

    if (mode === DisplayMode.Details)
        return (
            <HasValueProvider key={id}>
                <HasValueContext.Consumer>
                    {(hasValue) =>
                        hasValue ? (
                            <Fragment>
                                <Title headingLevel="h2">{props.label}</Title>
                                <DescriptionList id={id} isHorizontal isCompact style={{ padding: 16 }}>
                                    {props.children}
                                </DescriptionList>
                            </Fragment>
                        ) : (
                            <div style={{ display: 'none' }}>{props.children}</div>
                        )
                    }
                </HasValueContext.Consumer>
            </HasValueProvider>
        )

    return (
        <HasInputsProvider key={id}>
            <HasInputsContext.Consumer>
                {(hasInputs) => (
                    <ValidationProvider>
                        <HasValidationErrorContext.Consumer>
                            {(hasValidationError) => (
                                <section
                                    id={id}
                                    className="pf-v5-c-form__section"
                                    role="group"
                                    style={{ display: !hasInputs && props.autohide !== false ? 'none' : undefined }}
                                >
                                    <Split
                                        hasGutter
                                        onClick={() => {
                                            if (props.collapsable) setExpanded(!expanded)
                                        }}
                                    >
                                        <SplitItem isFilled>
                                            <Stack>
                                                <Split hasGutter>
                                                    <div className="pf-v5-c-form__section-title">
                                                        {props.label}
                                                        {props.id && (
                                                            <LabelHelp
                                                                id={props.id}
                                                                labelHelp={props.labelHelp}
                                                                labelHelpTitle={props.labelHelpTitle}
                                                            />
                                                        )}
                                                    </div>
                                                </Split>
                                                {expanded && props.description && (
                                                    <Text component="small" style={{ paddingTop: 8 }}>
                                                        {props.description}
                                                    </Text>
                                                )}
                                            </Stack>
                                        </SplitItem>
                                        {showValidation && !expanded && hasValidationError && (
                                            <SplitItem>
                                                <Split>
                                                    <SplitItem>
                                                        <Icon status="danger">
                                                            <ExclamationCircleIcon />
                                                        </Icon>
                                                    </SplitItem>
                                                    <SplitItem>
                                                        <span className="pf-v5-c-form__helper-text pf-m-error">
                                                            &nbsp; {expandToFixValidationErrors}
                                                        </span>
                                                    </SplitItem>
                                                </Split>
                                            </SplitItem>
                                        )}
                                        {props.collapsable &&
                                            (expanded ? (
                                                <SplitItem>
                                                    <div style={{ marginBottom: -5 }}>
                                                        <AngleDownIcon />
                                                    </div>
                                                </SplitItem>
                                            ) : (
                                                <SplitItem>
                                                    <div style={{ marginBottom: -5 }}>
                                                        <AngleLeftIcon />
                                                    </div>
                                                </SplitItem>
                                            ))}
                                    </Split>
                                    {expanded ? props.children : <div style={{ display: 'none' }}>{props.children}</div>}
                                    {!expanded && <Divider />}
                                </section>
                            )}
                        </HasValidationErrorContext.Consumer>
                    </ValidationProvider>
                )}
            </HasInputsContext.Consumer>
        </HasInputsProvider>
    )
}
