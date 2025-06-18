import {
    Alert,
    Button,
    DescriptionList,
    Drawer,
    DrawerContent,
    DrawerContentBody,
    DrawerPanelContent,
    Icon,
    Split,
    SplitItem,
} from '@patternfly/react-core'
import { Wizard as PFWizard, WizardContext, WizardFooter, WizardStep } from '@patternfly/react-core/deprecated'
import { ExclamationCircleIcon } from '@patternfly/react-icons'
import { klona } from 'klona/json'
import { Children, Fragment, isValidElement, ReactElement, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { EditMode } from '.'
import { DataContext } from './contexts/DataContext'
import { DisplayMode, DisplayModeContext } from './contexts/DisplayModeContext'
import { EditModeContext } from './contexts/EditModeContext'
import { ItemContext, useItem } from './contexts/ItemContext'
import { defaultStrings, StringContext, useStringContext, WizardStrings } from './contexts/StringContext'
import { ShowValidationProvider, useSetShowValidation, useShowValidation } from './contexts/ShowValidationProvider'
import { StepHasInputsProvider } from './contexts/StepHasInputsProvider'
import { StepShowValidationProvider, useSetStepShowValidation, useStepShowValidation } from './contexts/StepShowValidationProvider'
import { StepValidationProvider, useStepHasValidationError } from './contexts/StepValidationProvider'
import { useHasValidationError, useEditorValidationStatus, ValidationProvider, EditorValidationStatus } from './contexts/ValidationProvider'
import { Step } from './Step'

export interface WizardProps {
    wizardStrings?: WizardStrings
    title: string
    description?: string
    children: ReactNode
    defaultData?: object
    onSubmit: WizardSubmit
    onCancel: WizardCancel
    hasButtons?: boolean
    editMode?: EditMode
    yamlEditor?: () => ReactNode
    submitButtonText?: string
    submittingButtonText?: string
}

export type WizardSubmit = (data: unknown) => Promise<void>
export type WizardCancel = () => void

export function Wizard(props: WizardProps & { showHeader?: boolean; showYaml?: boolean }) {
    const [data, setData] = useState(props.defaultData ? klona(props.defaultData) : {})
    const update = useCallback((newData: any) => setData((data: unknown) => klona(newData ?? data)), [])
    const [drawerExpanded, setDrawerExpanded] = useState<boolean>(false)
    useEffect(() => {
        if (props.showYaml !== undefined) {
            setDrawerExpanded(props.showYaml)
        }
    }, [props.showYaml])
    const displayMode = DisplayMode.Step
    const isYamlArray = useMemo(() => Array.isArray(props.defaultData), [props.defaultData])
    const { wizardStrings } = props
    return (
        <EditModeContext.Provider value={props.editMode === undefined ? EditMode.Create : props.editMode}>
            <StepHasInputsProvider>
                <StepShowValidationProvider>
                    <StepValidationProvider>
                        <DisplayModeContext.Provider value={displayMode}>
                            <DataContext.Provider value={{ update }}>
                                <ItemContext.Provider value={data}>
                                    <ShowValidationProvider>
                                        <ValidationProvider>
                                            <Drawer isExpanded={drawerExpanded} isInline>
                                                <DrawerContent panelContent={<WizardDrawer yamlEditor={props.yamlEditor} />}>
                                                    <DrawerContentBody>
                                                        <ItemContext.Provider value={data}>
                                                            <StringContext.Provider value={wizardStrings || defaultStrings}>
                                                                <WizardInternal
                                                                    title={props.title}
                                                                    onSubmit={props.onSubmit}
                                                                    onCancel={props.onCancel}
                                                                    hasButtons={props.hasButtons}
                                                                    isYamlArray={isYamlArray}
                                                                    submitButtonText={props.submitButtonText}
                                                                    submittingButtonText={props.submittingButtonText}
                                                                >
                                                                    {props.children}
                                                                </WizardInternal>
                                                            </StringContext.Provider>
                                                        </ItemContext.Provider>
                                                    </DrawerContentBody>
                                                </DrawerContent>
                                            </Drawer>
                                        </ValidationProvider>
                                    </ShowValidationProvider>
                                </ItemContext.Provider>
                            </DataContext.Provider>
                        </DisplayModeContext.Provider>
                    </StepValidationProvider>
                </StepShowValidationProvider>
            </StepHasInputsProvider>
        </EditModeContext.Provider>
    )
}

function WizardInternal(props: {
    title: string
    children: ReactNode
    onSubmit: WizardSubmit
    onCancel: WizardCancel
    hasButtons?: boolean
    isYamlArray: boolean
    submitButtonText?: string
    submittingButtonText?: string
}) {
    const { reviewLabel, stepsAriaLabel, contentAriaLabel } = useStringContext()
    const stepComponents = useMemo(
        () => Children.toArray(props.children).filter((child) => isValidElement(child) && child.type === Step) as ReactElement[],
        [props.children]
    )

    const reviewStep = useMemo<WizardStep>(
        () => ({
            id: 'Review',
            name: reviewLabel,
            component: (
                <Step label={reviewLabel} id="review-step">
                    <DescriptionList isHorizontal isCompact style={{ paddingLeft: 16, paddingBottom: 16, paddingRight: 16 }}>
                        <DisplayModeContext.Provider value={DisplayMode.Details}>{props.children}</DisplayModeContext.Provider>
                    </DescriptionList>
                </Step>
            ),
        }),
        [props.children, reviewLabel]
    )

    const showValidation = useShowValidation()
    const stepHasValidationError = useStepHasValidationError()
    const stepShowValidation = useStepShowValidation()

    const steps: WizardStep[] = useMemo(() => {
        const steps = stepComponents.map(
            (component) =>
                ({
                    id: component.props?.id,
                    name: (
                        <Split hasGutter>
                            <SplitItem isFilled>{component.props?.label}</SplitItem>
                            {(showValidation || stepShowValidation[component.props?.id]) && stepHasValidationError[component.props?.id] && (
                                <SplitItem>
                                    <Icon status="danger">
                                        <ExclamationCircleIcon />
                                    </Icon>
                                </SplitItem>
                            )}
                        </Split>
                    ),
                    component: <Fragment key={component.props?.id}>{component}</Fragment>,
                } as WizardStep)
        )
        steps.push(reviewStep)
        return steps
    }, [reviewStep, showValidation, stepComponents, stepHasValidationError, stepShowValidation])

    return (
        <Fragment>
            <PFWizard
                navAriaLabel={`${stepsAriaLabel}`}
                mainAriaLabel={`${contentAriaLabel}`}
                steps={steps}
                footer={
                    <MyFooter
                        onSubmit={props.onSubmit}
                        steps={steps}
                        stepComponents={stepComponents}
                        submitButtonText={props.submitButtonText}
                        submittingButtonText={props.submittingButtonText}
                    />
                }
                onClose={props.onCancel}
            />
        </Fragment>
    )
}

function MyFooter(props: {
    onSubmit: WizardSubmit
    steps: WizardStep[]
    stepComponents: ReactElement[]
    submitButtonText?: string
    submittingButtonText?: string
}) {
    const wizardContext = useContext(WizardContext)
    const { activeStep, onNext, onBack, onClose } = wizardContext

    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')

    const { onSubmit, submitButtonText, submittingButtonText } = props

    const { unknownError } = useStringContext()

    const onSubmitClickHandler = useCallback(
        (data: object) => {
            async function asyncSubmit() {
                setSubmitError('')
                setSubmitting(true)
                try {
                    await onSubmit(data)
                } catch (err) {
                    if (err instanceof Error) {
                        setSubmitError(err.message)
                        return err.message
                    } else {
                        setSubmitError(unknownError)
                        return unknownError
                    }
                } finally {
                    setSubmitting(false)
                }
                return undefined
            }
            void asyncSubmit()
        },
        [onSubmit, unknownError]
    )
    const data = useItem()
    const onSubmitClick = useCallback(() => {
        onSubmitClickHandler(data)
    }, [data, onSubmitClickHandler])

    const setShowValidation = useSetShowValidation()
    const showWizardValidation = useShowValidation()
    const wizardHasValidationError = useHasValidationError()
    const { editorValidationStatus } = useEditorValidationStatus()

    const firstStep = props.steps[0]
    const lastStep = props.steps[props.steps.length - 1]

    const stepHasValidationError = useStepHasValidationError()
    const activeStepHasValidationError = activeStep.id ? stepHasValidationError[activeStep.id] : false
    const stepShowValidation = useStepShowValidation()
    const activeStepShowValidation = activeStep.id ? stepShowValidation[activeStep.id] : false

    const setStepShowValidation = useSetStepShowValidation()

    const onNextClick = useCallback(() => {
        const stepID = activeStep.id?.toString() ?? ''
        setStepShowValidation(stepID, true)
        if (!activeStepHasValidationError) {
            onNext()
        }
    }, [activeStep.id, activeStepHasValidationError, onNext, setStepShowValidation])

    useEffect(() => {
        if (wizardContext.activeStep.name === lastStep.name) {
            // We are on the review step - show validation for all steps
            setShowValidation(true)
        } else {
            // if not on review step and there was a submit error
            // assume user went back and fixed something
            setSubmitError('')
        }
    }, [lastStep.name, setShowValidation, wizardContext.activeStep.name])

    const {
        fixValidationErrorsMsg,
        fixEditorValidationErrorsMsg,
        waitforEditorValidationErrorsMsg,
        submitText,
        submittingText,
        cancelButtonText,
        backButtonText,
        nextButtonText,
    } = useStringContext()

    if (wizardContext.activeStep.name === lastStep.name) {
        return (
            <div className="pf-v5-u-box-shadow-sm-top">
                {editorValidationStatus === EditorValidationStatus.failure && showWizardValidation && (
                    <Alert title={fixEditorValidationErrorsMsg} isInline variant="danger" />
                )}
                {wizardHasValidationError && showWizardValidation && <Alert title={fixValidationErrorsMsg} isInline variant="danger" />}
                {editorValidationStatus === EditorValidationStatus.pending && showWizardValidation && (
                    <Alert title={waitforEditorValidationErrorsMsg} isInline variant="warning" />
                )}
                {submitError && <Alert title={submitError} isInline variant="danger" />}
                <WizardFooter>
                    <Button
                        onClick={onSubmitClick}
                        isDisabled={
                            ((wizardHasValidationError || editorValidationStatus !== EditorValidationStatus.success) &&
                                showWizardValidation) ||
                            submitting
                        }
                        isLoading={submitting}
                        type="submit"
                    >
                        {!submitButtonText && (submitting ? submittingText : submitText)}
                        {submitting ? submittingButtonText : submitButtonText}
                    </Button>
                    <Button variant="secondary" onClick={onBack}>
                        {backButtonText}
                    </Button>
                    <div className="pf-v5-c-wizard__footer-cancel">
                        <Button variant="link" onClick={onClose}>
                            {cancelButtonText}
                        </Button>
                    </div>
                </WizardFooter>
                <RenderHiddenSteps stepComponents={props.stepComponents} />
            </div>
        )
    }

    return (
        <div className="pf-v5-u-box-shadow-sm-top">
            {activeStepHasValidationError && activeStepShowValidation && <Alert title={fixValidationErrorsMsg} isInline variant="danger" />}
            <WizardFooter>
                <Button
                    variant="primary"
                    onClick={onNextClick}
                    isDisabled={(activeStepHasValidationError && activeStepShowValidation) || submitting}
                >
                    {nextButtonText}
                </Button>
                <Button variant="secondary" onClick={onBack} isDisabled={firstStep.name === activeStep.name}>
                    {backButtonText}
                </Button>
                <div className="pf-v5-c-wizard__footer-cancel">
                    <Button variant="link" onClick={onClose}>
                        {cancelButtonText}
                    </Button>
                </div>
            </WizardFooter>
            <RenderHiddenSteps stepComponents={props.stepComponents} />
        </div>
    )
}

function RenderHiddenSteps(props: { stepComponents: ReactElement[] }) {
    const wizardContext = useContext(WizardContext)
    const { activeStep } = wizardContext
    return (
        <DisplayModeContext.Provider value={DisplayMode.StepsHidden}>
            <div style={{ display: 'none' }}>{props.stepComponents.filter((component) => component.props.id !== activeStep.id)}</div>
        </DisplayModeContext.Provider>
    )
}

function WizardDrawer(props: { yamlEditor?: () => ReactNode }) {
    const [yamlEditor] = useState(props.yamlEditor ?? undefined)
    return (
        <DrawerPanelContent isResizable={true} defaultSize="600px">
            {yamlEditor}
        </DrawerPanelContent>
    )
}

// function getSteps(children: ReactNode | ReactNode[]) {
//     const childArray = Children.toArray(children)
//     let steps = childArray.filter((child) => isValidElement(child) && child.type === Step) as ReactElement[]
//     if (steps.length === 0) {
//         if (childArray.length === 1) {
//             const child = childArray[0]
//             if (isValidElement(child)) {
//                 steps = getSteps(child.props.children)
//             }
//         }
//     }
//     return steps
// }
