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
    DataList,
    DataListAction,
    DataListCell,
    DataListControl,
    DataListDragButton,
    DataListItem,
    DataListItemCells,
    DataListItemRow,
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
    NumberInput,
    Page,
    PageSection,
    Popover,
    Select,
    SelectGroup,
    SelectOption,
    SelectOptionObject,
    SelectProps,
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
import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon'
import EyeIcon from '@patternfly/react-icons/dist/js/icons/eye-icon'
import EyeSlashIcon from '@patternfly/react-icons/dist/js/icons/eye-slash-icon'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import PasteIcon from '@patternfly/react-icons/dist/js/icons/paste-icon'
import PlusIcon from '@patternfly/react-icons/dist/js/icons/plus-icon'
import TrashIcon from '@patternfly/react-icons/dist/js/icons/trash-icon'
import TimesCircleIcon from '@patternfly/react-icons/dist/js/icons/times-circle-icon'
import useResizeObserver from '@react-hook/resize-observer'
import { Fragment, ReactNode, useRef, useState } from 'react'
import YAML from 'yaml'
import { FormData, Input, InputBase, Section, SectionGroupInput, SelectOptionInput } from './AcmFormData'

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
    if (input.isHidden) return <Fragment />
    if (!inputHasValue(input)) return <Fragment />
    switch (input.type) {
        case 'Text':
        case 'TextArea':
            return (
                <DescriptionListGroup key={input.label}>
                    <DescriptionListTerm>{input.label}</DescriptionListTerm>
                    <DescriptionListDescription>
                        <Split>
                            <SplitItem isFilled>
                                {input.isSecret && !showSecrets
                                    ? '****************'
                                    : input.value.split('\n').map((line) => <div>{line}</div>)}
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
            )
        case 'TextNumber':
        case 'Number':
            return (
                <DescriptionListGroup key={input.label}>
                    <DescriptionListTerm>{input.label}</DescriptionListTerm>
                    <DescriptionListDescription>{input.value}</DescriptionListDescription>
                </DescriptionListGroup>
            )
        case 'Select':
        case 'Tiles': {
            const selectedOption = input.options.find((option) => option.value === input.value)
            if (!selectedOption) return <Fragment>not found</Fragment>
            return (
                <DescriptionListGroup key={input.label}>
                    <DescriptionListTerm>{input.label}</DescriptionListTerm>
                    <DescriptionListDescription>
                        {selectedOption.text ?? selectedOption.value}
                    </DescriptionListDescription>
                </DescriptionListGroup>
            )
        }
        case 'GroupedSelect':
        case 'GroupedTiles': {
            let selectedOption: SelectOptionInput | undefined
            for (const group of input.groups) {
                selectedOption = group.options.find((option) => option.value === input.value)
                if (selectedOption !== undefined) break
            }
            if (!selectedOption) return <Fragment />
            return (
                <DescriptionListGroup key={input.label}>
                    <DescriptionListTerm>{input.label}</DescriptionListTerm>
                    <DescriptionListDescription>
                        {selectedOption.text ?? selectedOption.value}
                    </DescriptionListDescription>
                </DescriptionListGroup>
            )
        }
        case 'Multiselect': {
            const selectedOptions: SelectOptionInput[] = []
            for (const option of input.options) {
                if (input.value.includes(option.value)) {
                    selectedOptions.push(option)
                }
            }
            if (selectedOptions.length === 0) return <Fragment />
            return (
                <DescriptionListGroup key={input.label}>
                    <DescriptionListTerm>{input.label}</DescriptionListTerm>
                    <DescriptionListDescription>
                        {selectedOptions.map((option) => option.text ?? option.value).join(', ')}
                    </DescriptionListDescription>
                </DescriptionListGroup>
            )
        }
        case 'GroupedMultiselect': {
            const selectedOptions: SelectOptionInput[] = []
            for (const group of input.groups) {
                for (const option of group.options) {
                    if (input.value.includes(option.value)) {
                        selectedOptions.push(option)
                    }
                }
            }
            if (selectedOptions.length === 0) return <Fragment />
            return (
                <DescriptionListGroup key={input.label}>
                    <DescriptionListTerm>{input.label}</DescriptionListTerm>
                    <DescriptionListDescription>
                        {selectedOptions.map((option) => option.text ?? option.value).join(', ')}
                    </DescriptionListDescription>
                </DescriptionListGroup>
            )
        }
        case 'OrderedStrings': {
            if (input.value.length === 0) return <Fragment />
            return (
                <DescriptionListGroup key={input.label}>
                    <DescriptionListTerm>{input.label}</DescriptionListTerm>
                    <DescriptionListDescription>
                        <Stack>
                            {input.value.map((value) => (
                                <div>{value}</div>
                            ))}
                        </Stack>
                    </DescriptionListDescription>
                </DescriptionListGroup>
            )
        }
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
                        {!input.isHidden && (
                            <FormGroup
                                id={`${input.id}-form-group`}
                                fieldId={input.id}
                                label={input.label}
                                isRequired={input.isRequired}
                                helperTextInvalid={error}
                                validated={validated}
                                helperText={input.helperText}
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
    const [showSecrets, setShowSecrets] = useState(input.type === 'TextArea' && input.value === '')
    switch (input.type) {
        case 'Text': {
            const value = input.value
            return (
                <InputGroup>
                    <TextInput
                        {...input}
                        validated={validated}
                        isReadOnly={isReadOnly}
                        type={!input.isSecret || showSecrets ? 'text' : 'password'}
                    />
                    {value === '' ? (
                        <PasteInputButton setValue={input.onChange} setShowSecrets={setShowSecrets} />
                    ) : (
                        <Fragment>
                            {input.isSecret && (
                                <ShowSecretsButton showSecrets={showSecrets} setShowSecrets={setShowSecrets} />
                            )}
                            {!isReadOnly && !input.isDisabled && (
                                <ClearInputButton onClick={() => input.onChange('')} />
                            )}
                        </Fragment>
                    )}
                </InputGroup>
            )
        }
        case 'TextNumber': {
            const { onChange, ...inputProps } = input
            return (
                <InputGroup>
                    <TextInput
                        {...inputProps}
                        validated={validated}
                        isReadOnly={isReadOnly}
                        type={'number'}
                        onChange={(value) => {
                            input.onChange(Number(value))
                        }}
                    />
                </InputGroup>
            )
        }
        case 'TextArea': {
            const hideSecretInput = input.value !== '' && input.isSecret === true && !showSecrets
            return (
                <InputGroup>
                    {hideSecretInput ? (
                        <TextInput
                            {...input}
                            value={'**************'}
                            validated={validated}
                            isReadOnly={true}
                            type={'password'}
                        />
                    ) : (
                        <TextArea
                            {...input}
                            validated={validated}
                            isReadOnly={isReadOnly}
                            resizeOrientation="vertical"
                            autoResize={true}
                        />
                    )}

                    {input.value === '' ? (
                        <PasteInputButton setValue={input.onChange} setShowSecrets={setShowSecrets} />
                    ) : (
                        <Fragment>
                            {input.isSecret && (
                                <ShowSecretsButton showSecrets={showSecrets} setShowSecrets={setShowSecrets} />
                            )}
                            {!isReadOnly && !input.isDisabled && (
                                <ClearInputButton onClick={() => input.onChange('')} />
                            )}
                        </Fragment>
                    )}
                </InputGroup>
            )
        }

        case 'Select':
        case 'GroupedSelect':
        case 'Multiselect':
        case 'GroupedMultiselect': {
            const { onChange, placeholder, ...inputProps } = input
            const onSelect = (_event: unknown, selection: string | SelectOptionObject) => {
                switch (input.type) {
                    case 'Select':
                    case 'GroupedSelect':
                        input.onChange(selection as string)
                        break
                    case 'Multiselect':
                    case 'GroupedMultiselect':
                        if (!input.value.includes(selection as string)) {
                            input.onChange([...input.value, ...[selection as string]])
                        } else {
                            input.onChange([...input.value.filter((v) => v !== (selection as string))])
                        }
                        break
                }
            }
            let onClear: (() => void) | undefined = undefined
            if (!isReadOnly && !input.isDisabled) {
                onClear = () => {
                    switch (input.type) {
                        case 'Select':
                        case 'GroupedSelect':
                            input.onChange('')
                            break
                        case 'Multiselect':
                        case 'GroupedMultiselect':
                            input.onChange([])
                            break
                    }
                }
            }
            let selections: string | SelectOptionObject | (string | SelectOptionObject)[] = input.value
            switch (input.type) {
                case 'Select':
                case 'GroupedSelect': {
                    let selectedOption: SelectOptionInput | undefined
                    switch (input.type) {
                        case 'Select':
                            selectedOption = input.options.find((option) => option.value === input.value)
                            break
                        case 'GroupedSelect':
                            for (const group of input.groups) {
                                selectedOption = group.options.find((option) => option.value === input.value)
                                if (selectedOption !== undefined) break
                            }
                            break
                    }
                    if (selectedOption?.icon) {
                        selections = {
                            toString: () => {
                                return (
                                    <Fragment>
                                        <span style={{ paddingRight: '8px' }}>{selectedOption?.icon}</span>
                                        {selectedOption?.text}
                                    </Fragment>
                                ) as unknown as string
                            },
                            compareTo: (option: any) => {
                                return option?.value === selectedOption?.value
                            },
                        }
                    }
                    break
                }
            }
            let hasIcons = false
            switch (input.type) {
                case 'Select':
                case 'Multiselect':
                    for (const option of input.options) {
                        if (option.icon) {
                            hasIcons = true
                            break
                        }
                    }
                    break
                case 'GroupedSelect':
                case 'GroupedMultiselect':
                    for (const group of input.groups) {
                        for (const option of group.options) {
                            if (option.icon) {
                                hasIcons = true
                                break
                            }
                        }
                        if (hasIcons) {
                            break
                        }
                    }
                    break
            }
            let variant = input.variant
            if (!variant) {
                switch (input.type) {
                    case 'Select':
                    case 'GroupedSelect':
                        variant = hasIcons ? 'single' : 'typeahead'
                        break
                    case 'Multiselect':
                    case 'GroupedMultiselect':
                        variant = 'typeaheadmulti'
                        break
                }
            }
            return (
                <SelectWithToggle
                    {...inputProps}
                    selections={selections}
                    onSelect={onSelect}
                    onClear={onClear}
                    isCreatable={false}
                    isDisabled={isReadOnly || input.isDisabled}
                    validated={validated}
                    autoClose={input.type === 'Select' || input.type === 'GroupedSelect'}
                    isGrouped={input.type === 'GroupedSelect' || input.type === 'GroupedMultiselect'}
                    variant={variant}
                    placeholderText={input.placeholder}
                >
                    {input.type === 'Select' || input.type === 'Multiselect'
                        ? input.options.map((option) => {
                              return (
                                  <SelectOption
                                      key={option.value}
                                      value={option.value}
                                      description={option.description}
                                  >
                                      {option.icon !== undefined && (
                                          <span style={{ paddingRight: '8px' }}>{option.icon}</span>
                                      )}
                                      {option.text ?? option.value}
                                  </SelectOption>
                              )
                          })
                        : input.groups.map((group, index) => (
                              <SelectGroup key={index} label={group.group}>
                                  {group.options.map((option) => {
                                      return (
                                          <SelectOption
                                              key={option.value}
                                              value={option.value}
                                              description={option.description}
                                          >
                                              {option.icon !== undefined && (
                                                  <span style={{ paddingRight: '8px' }}>{option.icon}</span>
                                              )}
                                              {option.text ?? option.value}
                                          </SelectOption>
                                      )
                                  })}
                              </SelectGroup>
                          ))}
                </SelectWithToggle>
            )
        }

        case 'Tiles':
            return <SelectOptionsGallery input={input} options={input.options} />

        case 'GroupedTiles':
            return (
                <Stack hasGutter>
                    {input.groups.map((group) => (
                        <Stack hasGutter>
                            <Title headingLevel="h4">{group.group}</Title>
                            <SelectOptionsGallery input={input} options={group.options} />
                        </Stack>
                    ))}
                </Stack>
            )

        case 'Number': {
            const { onChange, ...inputProps } = input
            return (
                <NumberInput
                    {...inputProps}
                    onChange={(event) => onChange(Number((event.target as any).value))}
                    onPlus={() => {
                        const step = input.step ?? 1
                        input.onChange(input.value + step)
                    }}
                    onMinus={() => {
                        const step = input.step ?? 1
                        input.onChange(input.value - step)
                    }}
                />
            )
        }

        case 'OrderedStrings': {
            return <OrderedStringsInput {...input} validated={validated} isReadOnly={isReadOnly} />
        }
    }
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
        if (input.value) {
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

function groupHasErrors(group: SectionGroupInput) {
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

function groupHasRequiredErrors(group: SectionGroupInput) {
    return inputsHaveRequiredErrors(group.inputs)
}

const requiredMessage = 'This is a required field.'

function inputsHaveRequiredErrors(inputs?: Input[]) {
    if (!inputs) return false
    for (const input of inputs) {
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
    if (input.isHidden) return undefined
    if (input.isRequired && !inputHasValue(input)) return requiredMessage
    return input.validation ? input.validation(input.value as never) : undefined
}

function inputHasValue(input: Input): boolean {
    switch (input.type) {
        case 'Multiselect':
        case 'GroupedMultiselect':
        case 'OrderedStrings':
            return input.value.length !== 0
        default:
            return input.value !== '' && input.value !== 0
    }
}

function sectionHidden(section?: Section): boolean {
    if (!section) return true
    if (section.inputs && inputsHidden(section.inputs)) return true
    return false
}

function groupHidden(group?: SectionGroupInput): boolean {
    if (!group) return true
    if (inputsHidden(group.inputs)) return true
    return false
}

function inputsHidden(inputs: Input[]): boolean {
    if (!inputs) return true
    for (const input of inputs) {
        if (!input.isHidden) return false
    }
    return true
}

type selectWithToggleProps = Omit<SelectProps, 'onToggle'> & { autoClose: boolean }
function SelectWithToggle(props: selectWithToggleProps): JSX.Element {
    // TODO support isReadOnly
    const { validated, autoClose: closeOnSelect } = props
    const [open, setOpen] = useState(false)
    return (
        <Select
            {...props}
            isOpen={open}
            onToggle={() => setOpen(!open)}
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

function SelectOptionsGallery(props: { input: InputBase<string>; options: SelectOptionInput[] }) {
    const { input, options } = props
    return (
        <Gallery hasGutter>
            {options.map((option, index) => (
                <Tile
                    {...option}
                    key={index}
                    title={option.text ?? option.value}
                    isStacked
                    isSelected={input.value === option.value}
                    onClick={() => input.onChange(option.value)}
                    isDisabled={option.value !== input.value && input.isDisabled}
                    isDisplayLarge
                >
                    {option.description}
                </Tile>
            ))}
        </Gallery>
    )
}

function PasteInputButton(props: { setValue: (value: string) => void; setShowSecrets?: (value: boolean) => void }) {
    const { setValue, setShowSecrets } = props
    return (
        <Button
            variant="control"
            onClick={() => {
                navigator.clipboard.readText().then((value) => {
                    setValue(value)
                    if (value && setShowSecrets) setShowSecrets(false)
                })
            }}
        >
            <PasteIcon />
        </Button>
    )
}

function ClearInputButton(props: { onClick: () => void }) {
    const { onClick } = props
    return (
        <Button variant="control" onClick={onClick}>
            <TimesCircleIcon />
        </Button>
    )
}

function ShowSecretsButton(props: { showSecrets: boolean; setShowSecrets: (value: boolean) => void }) {
    const { showSecrets, setShowSecrets } = props
    return (
        <Button variant="control" onClick={() => setShowSecrets(!showSecrets)}>
            {showSecrets ? <EyeIcon /> : <EyeSlashIcon />}
        </Button>
    )
}

function OrderedStringsInput(props: {
    value: string[]
    onChange: (value: string[]) => void
    validated: 'error' | undefined
    isReadOnly: boolean
}) {
    const { value, onChange, validated, isReadOnly } = props
    const [text, setText] = useState('')
    return (
        <Fragment>
            <InputGroup>
                <TextInput validated={validated} value={text} onChange={setText} isReadOnly={isReadOnly} />
                {text ? (
                    <Fragment>
                        <ClearInputButton onClick={() => setText('')} />
                        <Button
                            variant="control"
                            aria-label="Action"
                            onClick={() => {
                                if (!value.includes(text)) onChange([...value, ...[text]])
                                setText('')
                            }}
                        >
                            <PlusIcon />
                        </Button>
                    </Fragment>
                ) : (
                    <PasteInputButton setValue={setText} />
                )}
            </InputGroup>
            <DataList
                aria-label="draggable data list example"
                isCompact
                onDragFinish={(itemOrder) => onChange(itemOrder)}
                itemOrder={value}
                style={{ borderTop: '0' }}
            >
                {value.map((v) => (
                    <DataListItem aria-labelledby="simple-item1" id={v} key="1">
                        <DataListItemRow>
                            <DataListControl>
                                <DataListDragButton
                                    aria-label="Reorder"
                                    aria-labelledby="simple-item1"
                                    aria-describedby="Press space or enter to begin dragging, and use the arrow keys to navigate up or down. Press enter to confirm the drag, or any other key to cancel the drag operation."
                                    aria-pressed="false"
                                    isDisabled={isReadOnly}
                                />
                            </DataListControl>
                            <DataListItemCells
                                dataListCells={[
                                    <DataListCell key={v}>
                                        <span id="simple-item1">{v}</span>
                                    </DataListCell>,
                                ]}
                            />
                            <DataListAction
                                aria-labelledby="ex-item1 ex-action1"
                                id="ex-action1"
                                aria-label="Actions"
                                isPlainButtonAction
                            >
                                <Button
                                    variant="plain"
                                    aria-label="Action"
                                    onClick={() => {
                                        onChange(value.filter((value) => value !== v))
                                    }}
                                >
                                    <TrashIcon />
                                </Button>
                            </DataListAction>
                        </DataListItemRow>
                    </DataListItem>
                ))}
            </DataList>
        </Fragment>
    )
}
