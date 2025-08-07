/* Copyright Contributors to the Open Cluster Management project */
import {
  Alert,
  Button,
  DescriptionList,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerPanelContent,
  Icon,
  Wizard as PFWizard,
  Split,
  SplitItem,
  useWizardContext,
  WizardFooterWrapper,
  WizardStep,
} from '@patternfly/react-core'
import { ExclamationCircleIcon } from '@patternfly/react-icons'
import { klona } from 'klona/json'
import {
  Children,
  Fragment,
  isValidElement,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { EditMode } from '.'
import { DataContext } from './contexts/DataContext'
import { DisplayMode, DisplayModeContext } from './contexts/DisplayModeContext'
import { EditModeContext } from './contexts/EditModeContext'
import { ItemContext, useItem } from './contexts/ItemContext'
import { ShowValidationProvider, useSetShowValidation, useShowValidation } from './contexts/ShowValidationProvider'
import { StepHasInputsProvider } from './contexts/StepHasInputsProvider'
import {
  StepShowValidationProvider,
  useSetStepShowValidation,
  useStepShowValidation,
} from './contexts/StepShowValidationProvider'
import { StepValidationProvider, useStepHasValidationError } from './contexts/StepValidationProvider'
import { defaultStrings, StringContext, useStringContext, WizardStrings } from './contexts/StringContext'
import {
  EditorValidationStatus,
  useEditorValidationStatus,
  useHasValidationError,
  ValidationProvider,
} from './contexts/ValidationProvider'
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

type StepComponent = {
  id: string
  name: ReactNode
  component: ReactNode
}

type WizardFooterProps = {
  onSubmit: WizardSubmit
  submitButtonText?: string
  submittingButtonText?: string
  steps: ReactElement[]
}

type WizardInternalProps = Omit<WizardFooterProps, 'steps'> & {
  title: string
  children: ReactNode
  onCancel: WizardCancel
  hasButtons?: boolean
}

function WizardInternal({ children, onSubmit, onCancel, submitButtonText, submittingButtonText }: WizardInternalProps) {
  const { reviewLabel, stepsAriaLabel, contentAriaLabel } = useStringContext()
  const stepComponents = useMemo(
    () => Children.toArray(children).filter((child) => isValidElement(child) && child.type === Step) as ReactElement[],
    [children]
  )

  const reviewStep: StepComponent = useMemo(
    () => ({
      id: 'review-step',
      name: reviewLabel,
      component: (
        <Step label={reviewLabel} id="review">
          <DescriptionList isHorizontal isCompact style={{ paddingLeft: 16, paddingBottom: 16, paddingRight: 16 }}>
            <DisplayModeContext.Provider value={DisplayMode.Details}>{children}</DisplayModeContext.Provider>
          </DescriptionList>
        </Step>
      ),
    }),
    [children, reviewLabel]
  )

  const showValidation = useShowValidation()
  const stepHasValidationError = useStepHasValidationError()
  const stepShowValidation = useStepShowValidation()

  const steps = useMemo(() => {
    const steps: StepComponent[] = stepComponents.map((component) => ({
      id: component.props?.id,
      name: (
        <Split hasGutter>
          <SplitItem isFilled>{component.props?.label}</SplitItem>
          {(showValidation || stepShowValidation[component.props?.id]) &&
            stepHasValidationError[component.props?.id] && (
              <SplitItem>
                <Icon status="danger">
                  <ExclamationCircleIcon />
                </Icon>
              </SplitItem>
            )}
        </Split>
      ),
      component: <Fragment key={component.props?.id}>{component}</Fragment>,
    }))
    steps.push(reviewStep)
    return steps
  }, [reviewStep, showValidation, stepComponents, stepHasValidationError, stepShowValidation])

  return (
    <Fragment>
      <PFWizard
        navAriaLabel={`${stepsAriaLabel}`}
        aria-label={`${contentAriaLabel}`}
        footer={
          <MyFooter
            onSubmit={onSubmit}
            steps={stepComponents}
            submitButtonText={submitButtonText}
            submittingButtonText={submittingButtonText}
          />
        }
        onClose={onCancel}
      >
        {steps.map(({ id, name, component }) => (
          <WizardStep key={id} id={`${id}-step`} name={name}>
            {component}
          </WizardStep>
        ))}
      </PFWizard>
    </Fragment>
  )
}

function MyFooter(props: WizardFooterProps) {
  const { activeStep, goToNextStep: onNext, goToPrevStep: onBack, close: onClose } = useWizardContext()

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

  const isLastStep = activeStep.id === 'review-step-step'
  useEffect(() => {
    if (isLastStep) {
      // We are on the review step - show validation for all steps
      setShowValidation(true)
    } else {
      // if not on review step and there was a submit error
      // assume user went back and fixed something
      setSubmitError('')
    }
  }, [activeStep, setShowValidation])

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

  if (isLastStep) {
    return (
      <div className="pf-v5-u-box-shadow-sm-top">
        {editorValidationStatus === EditorValidationStatus.failure && showWizardValidation && (
          <Alert title={fixEditorValidationErrorsMsg} isInline variant="danger" />
        )}
        {wizardHasValidationError && showWizardValidation && (
          <Alert title={fixValidationErrorsMsg} isInline variant="danger" />
        )}
        {editorValidationStatus === EditorValidationStatus.pending && showWizardValidation && (
          <Alert title={waitforEditorValidationErrorsMsg} isInline variant="warning" />
        )}
        {submitError && <Alert title={submitError} isInline variant="danger" />}
        <WizardFooterWrapper>
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
        </WizardFooterWrapper>
        <RenderHiddenSteps stepComponents={props.steps} />
      </div>
    )
  }

  return (
    <div className="pf-v5-u-box-shadow-sm-top">
      {activeStepHasValidationError && activeStepShowValidation && (
        <Alert title={fixValidationErrorsMsg} isInline variant="danger" />
      )}
      <WizardFooterWrapper>
        <Button
          variant="primary"
          onClick={onNextClick}
          isDisabled={(activeStepHasValidationError && activeStepShowValidation) || submitting}
        >
          {nextButtonText}
        </Button>
        <Button variant="secondary" onClick={onBack} isDisabled={activeStep.index === 1}>
          {backButtonText}
        </Button>
        <div className="pf-v5-c-wizard__footer-cancel">
          <Button variant="link" onClick={onClose}>
            {cancelButtonText}
          </Button>
        </div>
      </WizardFooterWrapper>
      <RenderHiddenSteps stepComponents={props.steps} />
    </div>
  )
}

function RenderHiddenSteps(props: { stepComponents: ReactElement[] }) {
  const { activeStep } = useWizardContext()
  return (
    <DisplayModeContext.Provider value={DisplayMode.StepsHidden}>
      <div style={{ display: 'none' }}>
        {props.stepComponents.filter(
          (component) => component.props.id !== activeStep.id.toString().replace('-step', '')
        )}
      </div>
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
