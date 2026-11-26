/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Button,
  Content,
  ContentVariants,
  Icon,
  Title,
  Stack,
  StackItem,
  Tooltip,
  WizardFooterWrapper,
  WizardStep,
  Wizard,
  useWizardContext,
} from '@patternfly/react-core'
import { ExclamationCircleIcon } from '@patternfly/react-icons'
import ControlPanelFinish from './ControlPanelFinish'
import get from 'lodash/get'
import {
  hasIncompleteRequiredControls as _hasIncompleteRequiredControls,
  isRequiredValueMissing as _isRequiredValueMissing,
  getMaxEnabledStepIndex as _getMaxEnabledStepIndex,
} from '../utils/controlPredicates'

// Re-export for backwards compatibility (ControlPanelWizard.test.js imports from here)
export const isRequiredValueMissing = _isRequiredValueMissing
export const hasIncompleteRequiredControls = _hasIncompleteRequiredControls
export const getMaxEnabledStepIndex = _getMaxEnabledStepIndex

/** Internal: flatten all controls from wizard steps (wizard-specific). */
const flattenStepControls = (steps = []) => steps.flatMap(({ controls = [] }) => controls)

/** Bridge class review panel to PatternFly wizard navigation. */
const ReviewFinishWithStepLinks = (props) => {
  const { goToStepById } = useWizardContext()
  return <ControlPanelFinish {...props} onEditStep={goToStepById} />
}

class ControlPanelWizard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      isProcessing: false,
    }
  }

  render() {
    const {
      controlClasses,
      renderControlSections,
      renderNotifications,
      isEditing,
      creationStatus,
      backButtonOverride,
      i18n,
      wizardTitle,
    } = this.props
    let { steps } = this.props
    steps.forEach((step) => {
      step.controls = []
      step.sections.forEach(({ content }) => {
        step.controls = step.controls.concat(content)
        content.forEach((ctrl) => {
          ctrl.step = step
        })
      })
    })

    // Opt-in strict gating when any step/review title sets validateRequiredFields.
    // Default keeps legacy mustValidate-only nav so other wizards are unchanged.
    // Use getMaxEnabledStepIndex — do not use `validStepIndex || …` (index 0 is falsy).
    const validateRequiredFields = steps.some(({ title }) => !!title?.validateRequiredFields)
    const validStepIndex = getMaxEnabledStepIndex(steps, { validateRequiredFields })

    const renderReview = (details, lastReviewInx, reviewControl) => {
      const { comment, commentVariant, header, reviewLayout } = reviewControl || {}
      const headerContent = typeof header === 'function' ? header(this.props.controlData, i18n) : null
      const isStandaloneReview = reviewLayout === 'standalone'
      const FinishPanel = isStandaloneReview ? ReviewFinishWithStepLinks : ControlPanelFinish
      return (
        <Stack hasGutter={!isStandaloneReview}>
          {headerContent && <StackItem>{headerContent}</StackItem>}
          <StackItem>
            <FinishPanel
              details={details}
              comment={comment}
              commentVariant={commentVariant}
              controlData={this.props.controlData}
              startStep={lastReviewInx}
              reviewLayout={reviewLayout}
              renderNotifications={renderNotifications.bind(this)}
              i18n={i18n}
            />
          </StackItem>
        </Stack>
      )
    }

    let lastType = ''
    let lastReviewInx = 0
    steps = steps.map(({ title: control, controls, sections }, inx) => {
      const { id, type, title, description, exception } = control
      lastType = type
      if (inx - 1 > 0 && steps[inx - 1].title.type === 'review') {
        lastReviewInx = inx - 1
      }

      // put error ! on step with errors
      let hasErrors = exception
      controls.forEach(({ exception }) => {
        if (exception) {
          hasErrors = true
        }
      })

      return {
        id,
        index: inx,
        name: (
          <div className="tf--finish-step-button">
            <div>{title}</div>
            {hasErrors && (
              <span style={{ paddingLeft: '8px' }}>
                <Icon status="danger">
                  <ExclamationCircleIcon />
                </Icon>
              </span>
            )}
          </div>
        ),
        control,
        controls,
        enabled: inx <= validStepIndex,
        component: (
          <div key={id} className={controlClasses}>
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h2" size="xl">
                  {title}
                </Title>
                {description && <Content component={ContentVariants.p}>{description}</Content>}
              </StackItem>
              <StackItem>
                {control.type === 'review'
                  ? renderReview(this.props.steps.slice(lastReviewInx, inx), lastReviewInx, control)
                  : renderControlSections(sections)}
              </StackItem>
            </Stack>
          </div>
        ),
      }
    })
    if (lastType !== 'review') {
      steps.push({
        id: 'review',
        name: i18n('Review and create'),
        component: (
          <div className={controlClasses}>
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h2" size="2xl">
                  {i18n('Review')}
                </Title>
              </StackItem>
              <StackItem>{renderReview(this.props.steps.slice(lastReviewInx), lastReviewInx)}</StackItem>
            </Stack>
          </div>
        ),
        enabled: steps.length + 1 <= validStepIndex,
      })
    }

    const onSave = () => {
      // Explicit review steps create via validateNextStep (mutation or handleCreateResource).
      // Auto-appended review steps (lastType !== 'review') create here.
      if (lastType !== 'review') {
        this.props.handleCreateResource()
      }
    }

    const onClose = () => {
      this.props.handleCancelCreate()
    }

    const validateNextStep = (activeStep, onNext) => {
      const activeControlData = (this.props.controlData || []).find((step) => step.id === activeStep.id)
      const { type, mutation, disableEditorOnSuccess, disablePreviousControlsOnSuccess } = activeControlData || {}
      if (type === 'review') {
        if (mutation) {
          this.setState({ isProcessing: true })
          setTimeout(() => {
            this.setState({ isProcessing: false })
          }, 2000)
          mutation(this.props.controlData).then((status) => {
            this.setState({ isProcessing: false })
            if (status !== 'ERROR') {
              if (disableEditorOnSuccess) {
                this.props.setEditorReadOnly(true)
              }
              if (disablePreviousControlsOnSuccess) {
                steps
                  .slice(0, activeStep.index)
                  .reverse()
                  .forEach((step) => {
                    step.controls.forEach((control) => {
                      control.disabled = true
                    })
                  })
              }
              activeControlData.isComplete = true
              // Distinguish completed mutation reviews after mutation is cleared.
              activeControlData.mutationCompleted = true
              delete activeControlData.mutation
              this.forceUpdate()
              onNext()
            }
          })
        } else if (activeControlData?.mutationCompleted) {
          // Mutation already ran — continue wizard instead of submitting again.
          onNext()
        } else {
          // Review without mutation (e.g. kubevirt standalone) — submit create here.
          // onSave skips review steps because mutation-based reviews already created.
          this.props.handleCreateResource()
        }
      } else {
        onNext()
      }
    }

    const { isProcessing, processingLabel } = this.state
    const isWorking = creationStatus === 'IN_PROGRESS' || isProcessing
    const isDisabled = creationStatus === 'DONE' || isWorking

    const allControls = flattenStepControls(steps)
    const CustomFooter = (activeStep, goToNextStep, goToPrevStep, close) => {
      const activeStepIndex = steps.findIndex((step) => step.id === activeStep.id)
      const isReviewStep = activeStep.id === 'review' || activeStep.id === 'reviewSave'
      const isCurrentStepIncomplete =
        validateRequiredFields &&
        !isReviewStep &&
        hasIncompleteRequiredControls(steps[activeStepIndex]?.controls || [], allControls)
      const incompleteHint = i18n('Complete all required fields before continuing')
      const nextButton = (
        <Button
          isLoading={isWorking}
          isDisabled={isDisabled}
          isAriaDisabled={isCurrentStepIncomplete}
          variant="primary"
          spinnerAriaValueText={isWorking ? i18n('Processing') : undefined}
          onClick={() => {
            if (!isWorking && !isCurrentStepIncomplete) {
              validateNextStep(activeStep, goToNextStep)
            }
          }}
        >
          {processingLabel ||
            (activeStep.id === 'reviewSave'
              ? i18n('Save')
              : activeStep.id === 'review'
                ? isEditing
                  ? i18n('Save')
                  : i18n('Create')
                : i18n('Next'))}
        </Button>
      )
      return (
        <WizardFooterWrapper>
          <ActionList>
            <ActionListGroup>
              <ActionListItem>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (activeStepIndex === 0 && backButtonOverride) {
                      backButtonOverride()
                    } else {
                      goToPrevStep()
                    }
                  }}
                  isAriaDisabled={activeStepIndex === 0 && !backButtonOverride}
                >
                  {i18n('Back')}
                </Button>
              </ActionListItem>
              <ActionListItem>
                {isCurrentStepIncomplete ? (
                  <Tooltip content={incompleteHint}>{nextButton}</Tooltip>
                ) : (
                  nextButton
                )}
              </ActionListItem>
            </ActionListGroup>
            <ActionListGroup>
              <ActionListItem>
                <Button variant="link" onClick={close}>
                  {i18n('Cancel')}
                </Button>
              </ActionListItem>
            </ActionListGroup>
          </ActionList>
        </WizardFooterWrapper>
      )
    }

    let startAtStep = get(steps[0], 'control.startAtStep')
    startAtStep = steps.findIndex(({ id }) => id === startAtStep) + 1
    if (startAtStep < 1) startAtStep = 1
    return (
      <Wizard
        navAriaLabel={i18n('Create wizard steps')}
        title={wizardTitle || i18n('Create wizard content')}
        height={'100%'}
        onSave={onSave}
        onClose={onClose}
        footer={CustomFooter}
      >
        {steps.map((step) => renderStep(step))}
      </Wizard>
    )
  }
}

function renderStep(step) {
  const { id, name, component, enabled, steps } = step
  return (
    <WizardStep id={id} key={id} name={name} isDisabled={!enabled} steps={steps?.map((step) => renderStep(step))}>
      {component}
    </WizardStep>
  )
}

ControlPanelWizard.propTypes = {
  controlClasses: PropTypes.string,
  controlData: PropTypes.array,
  creationStatus: PropTypes.string,
  handleCancelCreate: PropTypes.func,
  handleCreateResource: PropTypes.func,
  isEditing: PropTypes.bool,
  renderControlSections: PropTypes.func,
  renderNotifications: PropTypes.func,
  resetStatus: PropTypes.func,
  setEditorReadOnly: PropTypes.func,
  setWizardRef: PropTypes.func,
  steps: PropTypes.array,
  wizardTitle: PropTypes.string,
}

export default ControlPanelWizard
