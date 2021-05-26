/* Copyright Contributors to the Open Cluster Management project */
import { AcmPageHeader } from '@open-cluster-management/ui-components'
import {
    ActionGroup,
    ActionList,
    ActionListGroup,
    ActionListItem,
    Alert,
    AlertGroup,
    Button,
    ClipboardCopyButton,
    CodeBlock,
    CodeBlockAction,
    CodeBlockCode,
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    Drawer,
    DrawerColorVariant,
    DrawerContent,
    DrawerContentBody,
    DrawerPanelContent,
    Flex,
    Form,
    FormFieldGroupExpandable,
    FormFieldGroupHeader,
    FormGroup,
    FormSection,
    Gallery,
    InputGroup,
    Page,
    PageSection,
    Popover,
    Select,
    SelectGroup,
    SelectOption,
    SelectOptionObject,
    SelectProps,
    SelectVariant,
    Split,
    SplitItem,
    Stack,
    StackItem,
    Switch,
    Text,
    TextArea,
    TextContent,
    TextInput,
    Tile,
    Title,
    Wizard,
    WizardContextConsumer,
    WizardFooter,
    WizardStep,
} from '@patternfly/react-core'
import { ValidatedOptions } from '@patternfly/react-core/dist/js/helpers/constants'
import TimesCircleIcon from '@patternfly/react-icons/dist/js/icons/times-circle-icon'
import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon'
import EyeIcon from '@patternfly/react-icons/dist/js/icons/eye-icon'
import EyeSlashIcon from '@patternfly/react-icons/dist/js/icons/eye-slash-icon'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import PasteIcon from '@patternfly/react-icons/dist/js/icons/paste-icon'
import useResizeObserver from '@react-hook/resize-observer'
import { Fragment, ReactNode, useRef, useState } from 'react'
import YAML from 'yaml'
import { FormData, Group, Input, MultiselectInput, Section, SelectInput, SelectInputOptions } from './AcmFormData'

export interface AcmDataFormProps {
    formData: FormData
    mode?: 'form' | 'wizard' | 'details'
    isHorizontal?: boolean
    edit?: () => void
}

function generalValidationMessage() {
    return <Fragment>You must fix the issues with fields before you can proceed.</Fragment>
}

function requiredValidationMessage() {
    return <Fragment>You must fill out all required fields before you can proceed.</Fragment>
}

const minWizardSize = 1000
const defaultPanelSize = 600

export function AcmDataFormPage(props: AcmDataFormProps): JSX.Element {
    const pageRef = useRef(null)

    const { formData } = props
    const [showFormErrors, setShowFormErrors] = useState(false)
    const mode = props.mode ?? 'form'
    const isHorizontal = props.isHorizontal ?? false
    const [drawerExpanded, setDrawerExpanded] = useState(localStorage.getItem('yaml') === 'true')
    const [drawerInline, setDrawerInline] = useState(true)
    const [drawerMaxSize, setDrawerMaxSize] = useState<string | undefined>('800px')
    const [copyHint, setCopyHint] = useState<ReactNode>(
        <span style={{ wordBreak: 'keep-all' }}>Copy to clipboard</span>
    )

    useResizeObserver(pageRef, (entry) => {
        const inline = entry.contentRect.width > minWizardSize + defaultPanelSize
        setDrawerInline(inline)
        setDrawerMaxSize(inline ? `${entry.contentRect.width - minWizardSize}px` : undefined)
    })

    return (
        <div ref={pageRef} style={{ height: '100%' }}>
            <Page
                additionalGroupedContent={
                    <Fragment>
                        <AcmPageHeader
                            title={formData.title}
                            titleTooltip={formData.titleTooltip}
                            description={formData.description}
                            breadcrumb={formData.breadcrumb}
                            actions={
                                <ActionList>
                                    {mode === 'details' && props.edit !== undefined && (
                                        <ActionListItem>
                                            <Button onClick={props.edit}>Edit</Button>
                                        </ActionListItem>
                                    )}
                                </ActionList>
                            }
                            switches={
                                <Fragment>
                                    {process.env.NODE_ENV === 'development' && (
                                        <Switch
                                            label="YAML"
                                            isChecked={drawerExpanded}
                                            onChange={() => {
                                                localStorage.setItem('yaml', (!drawerExpanded).toString())
                                                setDrawerExpanded(!drawerExpanded)
                                            }}
                                        />
                                    )}
                                </Fragment>
                            }
                        />
                        {showFormErrors && mode === 'form' && formHasErrors(formData) && (
                            <PageSection variant="light" style={{ paddingTop: 0 }}>
                                <AlertGroup>
                                    {formHasRequiredErrors(formData) ? (
                                        <Alert isInline variant="danger" title={requiredValidationMessage()} />
                                    ) : (
                                        <Alert isInline variant="danger" title={generalValidationMessage()} />
                                    )}
                                </AlertGroup>
                            </PageSection>
                        )}
                    </Fragment>
                }
                groupProps={{ sticky: 'top' }}
            >
                <Drawer isExpanded={drawerExpanded} isInline={drawerInline}>
                    <DrawerContent
                        panelContent={
                            <DrawerPanelContent
                                isResizable={true}
                                defaultSize="600px"
                                maxSize={drawerMaxSize}
                                minSize="400px"
                                colorVariant={DrawerColorVariant.light200}
                            >
                                <CodeBlock
                                    actions={
                                        <CodeBlockAction>
                                            <ClipboardCopyButton
                                                id="copy-button"
                                                textId="code-content"
                                                aria-label="Copy to clipboard"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(
                                                        YAML.stringify(formData.stateToData())
                                                    )
                                                    setCopyHint(
                                                        <span style={{ wordBreak: 'keep-all' }}>
                                                            Successfully copied to clipboard!
                                                        </span>
                                                    )
                                                    setTimeout(() => {
                                                        setCopyHint(
                                                            <span style={{ wordBreak: 'keep-all' }}>
                                                                Copy to clipboard
                                                            </span>
                                                        )
                                                    }, 800)
                                                }}
                                                exitDelay={600}
                                                variant="plain"
                                            >
                                                {copyHint}
                                            </ClipboardCopyButton>
                                        </CodeBlockAction>
                                    }
                                >
                                    <CodeBlockCode id="code-content" style={{ fontSize: 'small' }}>
                                        {YAML.stringify(formData.stateToData())}
                                    </CodeBlockCode>
                                </CodeBlock>
                            </DrawerPanelContent>
                        }
                    >
                        <DrawerContentBody>
                            {mode === 'wizard' ? (
                                <PageSection variant="light" isFilled type="wizard" style={{ height: '100%' }}>
                                    <AcmDataForm
                                        {...props}
                                        mode={mode}
                                        showFormErrors={showFormErrors}
                                        setShowFormErrors={setShowFormErrors}
                                        isHorizontal={isHorizontal}
                                    />
                                </PageSection>
                            ) : (
                                <PageSection variant="light" isFilled>
                                    <AcmDataForm
                                        {...props}
                                        mode={mode}
                                        showFormErrors={showFormErrors}
                                        setShowFormErrors={setShowFormErrors}
                                        isHorizontal={isHorizontal}
                                    />
                                </PageSection>
                            )}
                        </DrawerContentBody>
                    </DrawerContent>
                </Drawer>
            </Page>
        </div>
    )
}

export function AcmDataForm(
    props: AcmDataFormProps & {
        showFormErrors: boolean
        setShowFormErrors: (showFormErrors: boolean) => void
    }
): JSX.Element {
    const { formData, isHorizontal, showFormErrors, setShowFormErrors } = props
    switch (props.mode) {
        case 'wizard':
            return (
                <AcmDataFormWizard
                    formData={formData}
                    isHorizontal={isHorizontal ?? false}
                    showFormErrors={showFormErrors}
                    setShowFormErrors={setShowFormErrors}
                />
            )

        case 'details':
            return (
                <Form>
                    <AcmDataFormDetails formData={formData} />
                </Form>
            )

        default:
            return (
                <AcmDataFormDefault
                    formData={formData}
                    isHorizontal={isHorizontal}
                    showFormErrors={showFormErrors}
                    setShowFormErrors={setShowFormErrors}
                />
            )
    }
}

export function AcmDataFormDefault(props: {
    formData: FormData
    isHorizontal?: boolean
    showFormErrors: boolean
    setShowFormErrors: (showFormErrors: boolean) => void
}): JSX.Element {
    const { formData, isHorizontal, showFormErrors, setShowFormErrors } = props
    const [submitText, setSubmitText] = useState(formData.submitText)
    const [submitError, setSubmitError] = useState('')
    const isSubmitting = submitText !== formData.submitText
    return (
        <Form isHorizontal={isHorizontal}>
            {formData.sections.map((section) => {
                if (sectionHidden(section)) return <Fragment />
                return (
                    <FormSection key={section.title}>
                        <Title headingLevel="h2">{section.title}</Title>
                        <AcmDataFormInputs
                            inputs={section.inputs}
                            showFormErrors={showFormErrors}
                            isReadOnly={isSubmitting}
                        />
                        {section.groups?.map((group) => {
                            if (groupHidden(group)) return <Fragment />
                            return (
                                <FormFieldGroupExpandable
                                    key={group.title}
                                    header={
                                        <FormFieldGroupHeader
                                            titleText={{ text: group.title, id: group.title }}
                                            titleDescription={group.description}
                                        />
                                    }
                                >
                                    <AcmDataFormInputs
                                        inputs={group.inputs}
                                        showFormErrors={showFormErrors}
                                        isReadOnly={isSubmitting}
                                    />
                                </FormFieldGroupExpandable>
                            )
                        })}
                    </FormSection>
                )
            })}

            <Stack>
                {submitError && <Alert isInline variant="danger" title={submitError} />}
                <ActionGroup>
                    <ActionList>
                        <ActionListGroup>
                            <ActionListItem>
                                <Button
                                    onClick={() => {
                                        setShowFormErrors(true)
                                        if (!formHasErrors(formData)) {
                                            try {
                                                const result = formData.submit()
                                                if ((result as unknown) instanceof Promise) {
                                                    setSubmitText(formData.submittingText)
                                                    ;(result as unknown as Promise<void>).catch((err) => {
                                                        setSubmitError(err.message)
                                                        setSubmitText(formData.submitText)
                                                    })
                                                }
                                            } catch (err) {
                                                setSubmitError(err.message)
                                            }
                                        }
                                    }}
                                    variant="primary"
                                    isDisabled={(showFormErrors && formHasErrors(formData)) || isSubmitting}
                                    isLoading={isSubmitting}
                                >
                                    {submitText}
                                </Button>
                            </ActionListItem>
                            <ActionListItem>
                                <Button variant="secondary" onClick={formData.cancel} isDisabled={isSubmitting}>
                                    {formData.cancelLabel}
                                </Button>
                            </ActionListItem>
                        </ActionListGroup>
                    </ActionList>
                </ActionGroup>
            </Stack>
        </Form>
    )
}

export function AcmDataFormWizard(props: {
    formData: FormData
    isHorizontal: boolean
    showFormErrors: boolean
    setShowFormErrors: (showFormErrors: boolean) => void
}): JSX.Element {
    const { formData, isHorizontal, showFormErrors, setShowFormErrors } = props
    const [showSectionErrors, setShowSectionErrors] = useState<Record<string, boolean>>({})
    const [sectionName, setSectionName] = useState('')
    const [submitText, setSubmitText] = useState(formData.submitText)
    const [submitError, setSubmitError] = useState('')
    const isSubmitting = submitText !== formData.submitText

    const steps: WizardStep[] = formData.sections
        .map((section) => {
            if (sectionHidden(section)) return undefined
            const hasError = showFormErrors && sectionHasErrors(section)
            return {
                id: section.title,
                name: (
                    <Split>
                        <SplitItem isFilled>{section.title}</SplitItem>
                        {hasError && (
                            <span style={{ paddingLeft: '8px' }}>
                                <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />
                            </span>
                        )}
                    </Split>
                ),
                component: (
                    <Form isHorizontal={isHorizontal}>
                        {(showFormErrors || showSectionErrors[sectionName]) &&
                            sectionHasErrors(formData.sections.find((section) => section.title === sectionName)) && (
                                <AlertGroup>
                                    {sectionHasRequiredErrors(
                                        formData.sections.find((section) => section.title === sectionName)
                                    ) ? (
                                        <Alert isInline variant="danger" title={requiredValidationMessage()} />
                                    ) : (
                                        <Alert isInline variant="danger" title={generalValidationMessage()} />
                                    )}
                                </AlertGroup>
                            )}
                        <Title headingLevel="h2">{section.wizardTitle ?? section.title}</Title>
                        {section.description && (
                            <TextContent>
                                <Text component="small">{section.description}</Text>
                            </TextContent>
                        )}
                        <AcmDataFormInputs
                            inputs={section.inputs}
                            showFormErrors={showFormErrors || showSectionErrors[section.title]}
                            isReadOnly={isSubmitting}
                            mode="wizard"
                        />
                    </Form>
                ),
                steps: section.groups?.map((group) => ({
                    name: group.title,
                    component: (
                        <Form isHorizontal={isHorizontal}>
                            {(showFormErrors || showSectionErrors[sectionName]) && groupHasErrors(group) && (
                                <AlertGroup>
                                    {groupHasRequiredErrors(group) ? (
                                        <Alert isInline variant="danger" title={requiredValidationMessage()} />
                                    ) : (
                                        <Alert isInline variant="danger" title={generalValidationMessage()} />
                                    )}
                                </AlertGroup>
                            )}
                            <Title headingLevel="h2">{group.title}</Title>
                            {group.description && <Text component="small">{group.description}</Text>}
                            <AcmDataFormInputs
                                inputs={group.inputs}
                                showFormErrors={showFormErrors || showSectionErrors[section.title]}
                                isReadOnly={isSubmitting}
                                mode="wizard"
                            />
                        </Form>
                    ),
                    canJumpTo: !isSubmitting,
                })),
                canJumpTo: !isSubmitting,
            }
        })
        .filter((value) => value !== undefined) as WizardStep[]
    steps.push({
        id: 'review',
        name: 'Review',
        component: (
            <Form>
                {showFormErrors && formHasErrors(formData) && (
                    <AlertGroup>
                        {formHasRequiredErrors(formData) ? (
                            <Alert isInline variant="danger" title={requiredValidationMessage()} />
                        ) : (
                            <Alert isInline variant="danger" title={generalValidationMessage()} />
                        )}
                    </AlertGroup>
                )}
                <AcmDataFormDetails formData={formData} wizardSummary={true} />
            </Form>
        ),
        canJumpTo: !isSubmitting,
    })

    const Footer = (
        <WizardFooter>
            <WizardContextConsumer>
                {({ activeStep, onNext, onBack, onClose }) => {
                    setSectionName(activeStep.id as string)
                    const section = formData.sections.find((section) => section.title === activeStep.id)
                    if (section) {
                        return (
                            <Fragment>
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        if (section) {
                                            setShowSectionErrors((showSectionErrors) => {
                                                if (!showSectionErrors[section.title]) {
                                                    return { ...showSectionErrors, ...{ [section.title]: true } }
                                                }
                                                return showSectionErrors
                                            })
                                            if (sectionHasErrors(section)) return
                                        }
                                        onNext()
                                    }}
                                    isDisabled={
                                        ((showFormErrors || showSectionErrors[section.title]) &&
                                            sectionHasErrors(section)) ||
                                        isSubmitting
                                    }
                                >
                                    {formData.nextLabel}
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={onBack}
                                    isDisabled={activeStep.id === formData.sections[0].title || isSubmitting}
                                >
                                    {formData.backLabel}
                                </Button>
                                <Button variant="link" onClick={onClose} isDisabled={isSubmitting}>
                                    {formData.cancelLabel}
                                </Button>
                            </Fragment>
                        )
                    }

                    setShowFormErrors(true)

                    return (
                        <Stack hasGutter style={{ width: '100%' }}>
                            {submitError && <Alert isInline variant="danger" title={submitError} />}
                            <ActionGroup>
                                <ActionList>
                                    <ActionListGroup>
                                        <ActionListItem>
                                            <Button
                                                onClick={() => {
                                                    if (!formHasErrors(formData)) {
                                                        try {
                                                            const result = formData.submit()
                                                            if ((result as unknown) instanceof Promise) {
                                                                setSubmitText(formData.submittingText)
                                                                ;(result as unknown as Promise<void>).catch((err) => {
                                                                    setSubmitError(err.message)
                                                                    setSubmitText(formData.submitText)
                                                                })
                                                            }
                                                        } catch (err) {
                                                            setSubmitError(err.message)
                                                        }
                                                    }
                                                }}
                                                variant="primary"
                                                isDisabled={(showFormErrors && formHasErrors(formData)) || isSubmitting}
                                                isLoading={isSubmitting}
                                            >
                                                {submitText}
                                            </Button>
                                        </ActionListItem>
                                        <ActionListItem>
                                            <Button variant="secondary" onClick={onBack} isDisabled={isSubmitting}>
                                                {formData.backLabel}
                                            </Button>
                                        </ActionListItem>
                                    </ActionListGroup>
                                    <ActionListGroup>
                                        <ActionListItem>
                                            <Button variant="link" onClick={formData.cancel} isDisabled={isSubmitting}>
                                                {formData.cancelLabel}
                                            </Button>
                                        </ActionListItem>
                                    </ActionListGroup>
                                </ActionList>
                            </ActionGroup>
                        </Stack>
                    )
                }}
            </WizardContextConsumer>
        </WizardFooter>
    )

    return <Wizard steps={steps} footer={Footer} onClose={formData.cancel} />
}

export function AcmDataFormDetails(props: { formData: FormData; wizardSummary?: boolean }): JSX.Element {
    const { formData, wizardSummary } = props
    let i = 0
    return (
        <Fragment>
            {wizardSummary && formData.reviewTitle !== undefined && (
                <Fragment>
                    <Title headingLevel="h2">{formData.reviewTitle}</Title>
                    {formData.reviewDescription && <Text component="p">{formData.reviewDescription}</Text>}
                </Fragment>
            )}
            {/* <Divider /> */}
            {formData.sections.map((section) => {
                if (!sectionHasValue(section)) return <Fragment />
                if (sectionHidden(section)) return <Fragment />
                i++
                return (
                    <FormSection key={section.title}>
                        {/* {index !== 0 && <Divider />} */}

                        <Flex alignItems={{ default: 'alignItemsCenter' }}>
                            {wizardSummary && (
                                <span
                                    style={{
                                        backgroundColor: 'var(--pf-c-wizard__nav-link--before--BackgroundColor)',
                                        borderRadius: 'var(--pf-c-wizard__nav-link--before--BorderRadius)',
                                        width: 'var(--pf-c-wizard__nav-link--before--Width)',
                                        height: 'var(--pf-c-wizard__nav-link--before--Height)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 'var(--pf-c-wizard__nav-link--before--FontSize)',
                                    }}
                                >
                                    {i.toString()}
                                </span>
                            )}
                            <Title headingLevel="h3">{section.title}</Title>
                        </Flex>

                        {anyInputHasValue(section.inputs) && (
                            <DescriptionList
                                columnModifier={{ default: '1Col' }}
                                isHorizontal={true}
                                style={{ paddingLeft: wizardSummary ? '64px' : '32px' }}
                            >
                                {section.inputs && section.inputs.map((input) => <AcmInputDescription input={input} />)}
                            </DescriptionList>
                        )}
                        {section.groups && (
                            <Fragment>
                                {section.groups.map((group) => {
                                    if (groupHidden(group)) return <Fragment />
                                    return (
                                        <Fragment key={group.title}>
                                            <Title headingLevel="h3">{group.title}</Title>
                                            {anyInputHasValue(group.inputs) && (
                                                <DescriptionList
                                                    columnModifier={{ default: '1Col' }}
                                                    isHorizontal={true}
                                                >
                                                    {group.inputs &&
                                                        group.inputs.map((input) => (
                                                            <AcmInputDescription input={input} />
                                                        ))}
                                                </DescriptionList>
                                            )}
                                        </Fragment>
                                    )
                                })}
                            </Fragment>
                        )}
                    </FormSection>
                )
            })}
        </Fragment>
    )
}

function AcmInputDescription(props: { input: Input }): JSX.Element {
    const [showSecrets, setShowSecrets] = useState(false)
    const { input } = props
    if (inputHidden(input)) return <Fragment />
    switch (input.type) {
        case 'Select': {
            const value = inputValue(input)
            return (
                <Fragment>
                    {value && (
                        <DescriptionListGroup key={input.label}>
                            <DescriptionListTerm>{input.label}</DescriptionListTerm>
                            <DescriptionListDescription>
                                {input.isSecret && !showSecrets
                                    ? '****************'
                                    : optionText(selectOptions(input).find((option) => option.value === value))}
                            </DescriptionListDescription>
                        </DescriptionListGroup>
                    )}
                </Fragment>
            )
        }
        case 'Multiselect': {
            const value = multiselectValue(input)
            return (
                <Fragment>
                    {value.length > 0 && (
                        <DescriptionListGroup key={input.label}>
                            <DescriptionListTerm>{input.label}</DescriptionListTerm>
                            <DescriptionListDescription>{value.join(', ')}</DescriptionListDescription>
                        </DescriptionListGroup>
                    )}
                </Fragment>
            )
        }
        default:
            return (
                <Fragment>
                    {inputValue(input) && (
                        <DescriptionListGroup key={input.label} colSpan={input.type === 'TextArea' ? 2 : 1}>
                            <DescriptionListTerm>{input.label}</DescriptionListTerm>
                            <DescriptionListDescription style={{ whiteSpace: 'pre-wrap' }}>
                                <Split>
                                    <SplitItem isFilled>
                                        {input.isSecret && !showSecrets
                                            ? '****************'
                                            : inputValue(input)
                                                  .split('\n')
                                                  .map((line) => <div>{line}</div>)}
                                    </SplitItem>
                                    {input.isSecret && (
                                        <Stack>
                                            <Button
                                                variant="plain"
                                                style={{ marginTop: '-8px' }}
                                                onClick={() => setShowSecrets(!showSecrets)}
                                            >
                                                {showSecrets ? <EyeIcon /> : <EyeSlashIcon />}
                                            </Button>
                                            <StackItem isFilled />
                                        </Stack>
                                    )}
                                </Split>
                            </DescriptionListDescription>
                        </DescriptionListGroup>
                    )}
                </Fragment>
            )
    }
}

export function AcmDataFormInputs(props: {
    inputs?: Input[]
    showFormErrors?: boolean
    isReadOnly: boolean
    mode?: 'form' | 'wizard' | 'details'
}): JSX.Element {
    const { inputs, showFormErrors, isReadOnly } = props
    return (
        <Fragment>
            {inputs?.map((input) => {
                const error: string | undefined = inputError(input)
                const validated = showFormErrors && error !== undefined ? 'error' : undefined
                return (
                    <Fragment key={input.id}>
                        {!inputHidden(input) && (
                            <FormGroup
                                id={`${input.id}-form-group`}
                                fieldId={input.id}
                                label={
                                    props.mode === 'wizard' &&
                                    input.type === 'Select' &&
                                    input.mode === 'tiles' &&
                                    input.groups
                                        ? undefined
                                        : input.label
                                }
                                isRequired={inputRequired(input)}
                                helperTextInvalid={error}
                                validated={validated}
                                helperText={inputHelperText(input)}
                                labelIcon={
                                    <LabelHelp
                                        id={input.id}
                                        labelHelp={input.labelHelp}
                                        labelHelpTitle={input.labelHelpTitle}
                                    />
                                }
                            >
                                <AcmDataFormInput input={input} validated={validated} isReadOnly={isReadOnly} />
                            </FormGroup>
                        )}
                    </Fragment>
                )
            })}
        </Fragment>
    )
}

export function AcmDataFormInput(props: { input: Input; validated?: 'error'; isReadOnly: boolean }): JSX.Element {
    const { input, validated, isReadOnly } = props
    const [showSecrets, setShowSecrets] = useState(input.type === 'TextArea' && inputValue(input) === '')
    switch (input.type) {
        case 'Text': {
            const value = inputValue(input)
            const showSecretToggle = input.isSecret === true && value !== ''
            return (
                <InputGroup>
                    <TextInput
                        id={input.id}
                        placeholder={inputPlaceholder(input)}
                        value={value}
                        onChange={input.onChange}
                        validated={validated}
                        isRequired={inputRequired(input)}
                        isDisabled={inputDisabled(input)}
                        isReadOnly={isReadOnly}
                        type={!input.isSecret || showSecrets ? 'text' : 'password'}
                    />
                    {showSecretToggle && (
                        <Button variant="control" onClick={() => setShowSecrets(!showSecrets)}>
                            {showSecrets ? <EyeIcon /> : <EyeSlashIcon />}
                        </Button>
                    )}
                    {value === '' ? (
                        <Button
                            variant="control"
                            onClick={() => {
                                navigator.clipboard.readText().then((value) => {
                                    input.onChange(value)
                                    if (value) {
                                        setShowSecrets(false)
                                    }
                                })
                            }}
                        >
                            <PasteIcon />
                        </Button>
                    ) : (
                        !isReadOnly &&
                        !inputDisabled(input) && (
                            <Button variant="control" onClick={() => input.onChange('')}>
                                <TimesCircleIcon />
                            </Button>
                        )
                    )}
                </InputGroup>
            )
        }
        case 'TextArea': {
            const value = inputValue(input)
            const hideSecretInput = value !== '' && input.isSecret === true && !showSecrets
            const showSecretToggle = value !== '' && input.isSecret === true
            return (
                <InputGroup>
                    {hideSecretInput ? (
                        <TextInput
                            id={input.id}
                            placeholder={inputPlaceholder(input)}
                            value={'**************'}
                            validated={validated}
                            isRequired={inputRequired(input)}
                            isReadOnly={true}
                            type={'password'}
                        />
                    ) : (
                        <TextArea
                            id={input.id}
                            placeholder={inputPlaceholder(input)}
                            value={inputValue(input)}
                            onChange={input.onChange}
                            validated={validated}
                            isRequired={inputRequired(input)}
                            isDisabled={inputDisabled(input)}
                            isReadOnly={isReadOnly}
                            resizeOrientation="vertical"
                            autoResize={true}
                        />
                    )}

                    {showSecretToggle && (
                        <Button variant="control" onClick={() => setShowSecrets(!showSecrets)}>
                            {showSecrets ? <EyeIcon /> : <EyeSlashIcon />}
                        </Button>
                    )}
                    {value === '' ? (
                        <Button
                            variant="control"
                            onClick={() => {
                                navigator.clipboard.readText().then((value) => {
                                    input.onChange(value)
                                    if (value) {
                                        setShowSecrets(false)
                                    }
                                })
                            }}
                        >
                            <PasteIcon />
                        </Button>
                    ) : (
                        !isReadOnly &&
                        !inputDisabled(input) && (
                            <Button variant="control" onClick={() => input.onChange('')}>
                                <TimesCircleIcon />
                            </Button>
                        )
                    )}
                </InputGroup>
            )
        }
        case 'Multiselect': {
            return (
                <SelectWithToggle
                    id={input.id}
                    selections={input.value}
                    variant={SelectVariant.typeaheadMulti}
                    placeholderText={input.value.length === 0 ? inputPlaceholder(input) : undefined}
                    onSelect={(_event, selection) => {
                        if (!input.value.includes(selection as string)) {
                            input.onChange([...input.value, ...[selection as string]])
                        } else {
                            input.onChange([...input.value.filter((v) => v !== (selection as string))])
                        }
                    }}
                    onClear={inputRequired(input) ? undefined : () => input.onChange([])}
                    isCreatable={false}
                    isDisabled={isReadOnly || inputDisabled(input)}
                    validated={validated}
                    closeOnSelect={false}
                >
                    {selectOptions(input).map((option) => {
                        return (
                            <SelectOption key={option.value} value={option.value} description={option.description}>
                                {option.icon !== undefined && (
                                    <span style={{ paddingRight: '8px' }}>{option.icon}</span>
                                )}
                                {option.text ?? option.value}
                            </SelectOption>
                        )
                    })}
                </SelectWithToggle>
            )
        }

        case 'Select': {
            const value = inputValue(input)
            const options = selectOptions(input)
            let selections: string | SelectOptionObject = value
            if (input.mode === 'icon') {
                selections = {
                    toString: () => {
                        const option = options.find((option) => option.value === value)
                        return (
                            <Fragment>
                                {option?.icon && <span style={{ paddingRight: '8px' }}>{option?.icon}</span>}
                                {option?.text}
                            </Fragment>
                        ) as unknown as string
                    },
                    compareTo: (selectOption: any) => {
                        return selectOption?.value === value
                    },
                }
            }
            return (
                <Fragment>
                    {input.mode !== 'tiles' ? (
                        <SelectWithToggle
                            id={input.id}
                            selections={selections}
                            variant={input.mode === 'icon' ? SelectVariant.single : SelectVariant.typeahead}
                            placeholderText={inputPlaceholder(input)}
                            onSelect={(_event, selection) => input.onChange(selection as string)}
                            onClear={inputRequired(input) ? undefined : () => input.onChange('')}
                            isCreatable={false}
                            isDisabled={isReadOnly || inputDisabled(input)}
                            validated={validated}
                            isGrouped={input.groups !== undefined}
                            closeOnSelect={true}
                        >
                            {input.groups !== undefined
                                ? input.groups.map((group, index) => {
                                      return (
                                          <SelectGroup key={index} label={group.group}>
                                              {group.options.map((option, index) => {
                                                  return (
                                                      <SelectOption
                                                          key={index}
                                                          value={option.value}
                                                          description={option.description}
                                                      >
                                                          {input.mode === 'icon' && option.icon !== undefined && (
                                                              <span style={{ paddingRight: '8px' }}>{option.icon}</span>
                                                          )}
                                                          {option.text ?? option.value}
                                                      </SelectOption>
                                                  )
                                              })}
                                          </SelectGroup>
                                      )
                                  })
                                : selectOptions(input).map((option) => {
                                      return (
                                          <SelectOption
                                              key={option.value}
                                              value={option.value}
                                              description={option.description}
                                          >
                                              {input.mode === 'icon' && option.icon !== undefined && (
                                                  <span style={{ paddingRight: '8px' }}>{option.icon}</span>
                                              )}
                                              {option.text ?? option.value}
                                          </SelectOption>
                                      )
                                  })}
                        </SelectWithToggle>
                    ) : input.groups ? (
                        input.groups.map((group, index) => {
                            return (
                                <FormSection key={index}>
                                    <Title headingLevel="h4">{group.group}</Title>
                                    <Gallery hasGutter>
                                        {group.options.map((option, index) => (
                                            <Tile
                                                key={index}
                                                id={option.id}
                                                icon={option.icon}
                                                title={option.text ?? option.value}
                                                isStacked
                                                isDisplayLarge={input.isDisplayLarge}
                                                isSelected={value === option.value}
                                                onClick={() => input.onChange(option.value)}
                                                isDisabled={option.value !== inputValue(input) && inputDisabled(input)}
                                                onKeyPress={(event) => {
                                                    if (event.key === 'Enter') input.onChange(option.value)
                                                }}
                                            >
                                                {option.description}
                                            </Tile>
                                        ))}
                                    </Gallery>
                                </FormSection>
                            )
                        })
                    ) : (
                        <Gallery hasGutter>
                            {selectOptions(input).map((option, index) => (
                                <Tile
                                    key={index}
                                    id={option.id}
                                    icon={option.icon}
                                    title={option.text ?? option.value}
                                    isStacked
                                    isDisplayLarge={input.isDisplayLarge}
                                    isSelected={inputValue(input) === option.value}
                                    onClick={() => input.onChange(option.value)}
                                    isDisabled={option.value !== inputValue(input) && inputDisabled(input)}
                                >
                                    {option.description}
                                </Tile>
                            ))}
                        </Gallery>
                    )}
                </Fragment>
            )
        }
        default:
            return <Fragment />
    }
}

function inputValue(input: Input): string {
    if (typeof input.value === undefined) return ''
    if (typeof input.value === 'string') return input.value
    if (typeof input.value === 'function') return input.value()
    return ''
}

function multiselectValue(input: MultiselectInput): string[] {
    if (typeof input.value === undefined) return []
    if (Array.isArray(input.value)) return input.value
    return []
}

function inputDisabled(input: Input) {
    if (typeof input.isDisabled === 'boolean') return input.isDisabled
    if (typeof input.isDisabled === 'function') return input.isDisabled()
    return undefined
}

function inputHelperText(input: Input) {
    if (typeof input.helperText === 'string') return input.helperText
    if (typeof input.helperText === 'function') return input.helperText()
    return undefined
}

function inputPlaceholder(input: Input) {
    if (typeof input.placeholder === 'string') return input.placeholder
    if (typeof input.placeholder === 'function') return input.placeholder()
    return undefined
}

function inputRequired(input: Input) {
    if (typeof input.isRequired === 'boolean') return input.isRequired
    if (typeof input.isRequired === 'function') return input.isRequired()
    return undefined
}

function selectOptions(select: SelectInput | MultiselectInput): SelectInputOptions[] {
    if (select.groups) {
        return select.groups.map((group) => group.options).flat()
    } else {
        if (Array.isArray(select.options)) {
            return select.options
        }
        if (typeof select.options === 'function') return select.options()
    }
    return []
}

function sectionHasValue(section: Section) {
    if (section.inputs) {
        if (anyInputHasValue(section.inputs)) {
            return true
        }
    }
    if (section.groups) {
        for (const group of section.groups) {
            if (anyInputHasValue(group.inputs)) {
                return true
            }
        }
    }
    return false
}

function anyInputHasValue(inputs?: Input[]) {
    if (!inputs) return false
    for (const input of inputs) {
        if (inputValue(input)) {
            return true
        }
    }
    return false
}

function formHasErrors(formData: FormData) {
    for (const section of formData.sections) {
        if (sectionHasErrors(section)) return true
    }
    return false
}

function sectionHasErrors(section?: Section) {
    if (!section) return false
    if (inputsHaveErrors(section.inputs)) return true
    if (section.groups) {
        for (const group of section.groups) {
            if (groupHasErrors(group)) return true
        }
    }
    return false
}

function groupHasErrors(group: Group) {
    return inputsHaveErrors(group.inputs)
}

function formHasRequiredErrors(formData: FormData) {
    for (const section of formData.sections) {
        if (sectionHasRequiredErrors(section)) return true
    }
    return false
}

function sectionHasRequiredErrors(section?: Section) {
    if (!section) return false
    if (inputsHaveRequiredErrors(section.inputs)) return true
    if (section.groups) {
        for (const group of section.groups) {
            if (groupHasRequiredErrors(group)) return true
        }
    }
    return false
}

function groupHasRequiredErrors(group: Group) {
    return inputsHaveRequiredErrors(group.inputs)
}

const requiredMessage = 'This is a required field.'

function inputsHaveRequiredErrors(inputs?: Input[]) {
    if (!inputs) return false
    for (const input of inputs) {
        console.log(inputError(input))
        if (inputError(input) === requiredMessage) return true
    }
    return false
}

function inputsHaveErrors(inputs?: Input[]) {
    if (!inputs) return false
    for (const input of inputs) {
        if (inputError(input)) return true
    }
    return false
}

function inputError(input: Input): string | undefined {
    if (inputHidden(input)) return undefined
    switch (input.type) {
        case 'Text': {
            const value = inputValue(input)
            if (inputRequired(input) && !value) return requiredMessage
            return input.validation ? input.validation(value) : undefined
        }
        case 'TextArea': {
            const value = inputValue(input)
            if (inputRequired(input) && !value) return requiredMessage
            return input.validation ? input.validation(value) : undefined
        }
        case 'Select': {
            const value = inputValue(input)
            if (inputRequired(input) && !value) return requiredMessage
            return input.validation ? input.validation(value) : undefined
        }
        case 'Multiselect': {
            const value = multiselectValue(input)
            if (inputRequired(input) && value.length === 0) return requiredMessage
            return input.validation ? input.validation(value) : undefined
        }
    }
}

function sectionHidden(section?: Section): boolean {
    if (!section) return true
    if (section.inputs && inputsHidden(section.inputs)) return true
    if (section.groups) {
        for (const group of section.groups) {
            if (groupHidden(group)) return true
        }
    }
    return false
}

function groupHidden(group?: Group): boolean {
    if (!group) return true
    if (inputsHidden(group.inputs)) return true
    return false
}

function inputsHidden(inputs: Input[]): boolean {
    if (!inputs) return true
    for (const input of inputs) {
        if (!inputHidden(input)) return false
    }
    return true
}

function inputHidden(input: Input): boolean {
    if (typeof input.isHidden === 'boolean') return input.isHidden
    if (typeof input.isHidden === 'function') return input.isHidden()
    return false
}

type selectWithToggleProps = Omit<SelectProps, 'onToggle'> & { closeOnSelect: boolean }
function SelectWithToggle(props: selectWithToggleProps): JSX.Element {
    // TODO support isReadOnly
    const { validated, closeOnSelect } = props
    const [open, setOpen] = useState(false)
    return (
        <Select
            isOpen={open}
            onToggle={() => setOpen(!open)}
            {...props}
            onSelect={(e, v) => {
                props.onSelect?.(e, v)
                if (closeOnSelect) setOpen(false)
            }}
            aria-invalid={validated === ValidatedOptions.error}
        >
            {props.children}
        </Select>
    )
}

function LabelHelp(props: { id: string; labelHelp?: string; labelHelpTitle?: string }): JSX.Element {
    return props.labelHelp ? (
        <Popover
            id={`${props.id}-label-help-popover`}
            headerContent={props.labelHelpTitle}
            bodyContent={props.labelHelp}
        >
            <Button
                variant="plain"
                id={`${props.id}-label-help-button`}
                aria-label="More info"
                onClick={(e) => e.preventDefault()}
                className="pf-c-form__group-label-help"
            >
                <HelpIcon noVerticalAlign />
            </Button>
        </Popover>
    ) : (
        <Fragment />
    )
}

function optionText(option?: SelectInputOptions) {
    if (!option) return ''
    if (option.text) return option.text
    return option.value
}
