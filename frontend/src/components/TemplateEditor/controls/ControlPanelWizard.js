'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { Button, Wizard, WizardFooter, WizardContextConsumer, Title, Stack, StackItem } from '@patternfly/react-core'
import { ExclamationCircleIcon } from '@patternfly/react-icons'
import ControlPanelFinish from './ControlPanelFinish'
import get from 'lodash/get'
import set from 'lodash/set'
import noop from 'lodash/noop'
import isEmpty from 'lodash/isEmpty'

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
      setWizardRef,
      renderControlSections,
      renderNotifications,
      isEditing,
      creationStatus,
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

    // determine valid last step
    let validStepIndex
    steps.some(({ title: control, controls = [] }, index) => {
      const { isComplete, type = 'step' } = control
      switch (type) {
        case 'step':
          controls.some(({ mustValidate }) => {
            if (mustValidate && !isComplete) {
              validStepIndex = index
              return true
            }
          })
          break
        case 'review':
          if (!isComplete) {
            validStepIndex = index
          }
          break
      }
      return validStepIndex
    })
    validStepIndex = validStepIndex || steps.length + 1

    const renderReview = (details, lastReviewInx, comment) => {
      return (
        <ControlPanelFinish
          details={details}
          comment={comment}
          startStep={lastReviewInx}
          renderNotifications={renderNotifications.bind(this)}
        />
      )
    }

    let lastType
    let lastReviewInx = 0
    steps = steps.map(({ title: control, controls, sections }, inx) => {
      const { id, type, title, comment, exception } = control
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
                <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />
              </span>
            )}
          </div>
        ),
        control,
        controls,
        canJumpTo: inx <= validStepIndex,
        component: (
          <div key={id} className={controlClasses}>
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h2" size="2xl">
                  {title}
                </Title>
              </StackItem>
              <StackItem>
                {control.type === 'review'
                  ? renderReview(this.props.steps.slice(lastReviewInx, inx), lastReviewInx, comment)
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
        name: 'Review',
        control: { nextButtonLabel: isEditing ? 'Save' : 'Create' },
        component: (
          <div className={controlClasses}>
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h2" size="2xl">
                  Review
                </Title>
              </StackItem>
              <StackItem>{renderReview(this.props.steps.slice(lastReviewInx), lastReviewInx)}</StackItem>
            </Stack>
          </div>
        ),
        canJumpTo: steps.length + 1 <= validStepIndex,
      })
    }

    const onMove = (curr, prev) => {
      // if wizard is stopped, remember where it left off
      set(steps[0], 'control.startAtStep', curr.id)

      // custom step change actions
      if (this.props.onStepChange) {
        this.props.onStepChange(
          steps.find(({ id }) => id === curr.id),
          steps.find(({ id }) => id === prev.id)
        )
      }
    }

    const onSave = () => {
      // if last step was a review, it already did  a mutate
      if (lastType !== 'review') {
        this.props.handleCreateResource()
      }
    }

    const onClose = () => {
      this.props.handleCancelCreate()
    }

    const validateNextStep = (activeStep, onNext) => {
      const { type, mutation, disableEditorOnSuccess, disablePreviousControlsOnSuccess } = activeStep.control
      switch (type) {
        case 'step':
          {
            this.props.resetStatus()
            const validateControls = activeStep.controls.filter((control) => control.validate)
            if (validateControls.length > 0) {
              let hasErrors = false
              const promises = validateControls.map((control) => control.validate())
              this.setState({
                isProcessing: true,
                processingLabel: 'Validating...',
              })
              Promise.allSettled(promises).then((results) => {
                this.setState({
                  isProcessing: false,
                  processingLabel: undefined,
                })
                results.some((result) => {
                  hasErrors = !isEmpty(result.value)
                  return hasErrors
                })
                activeStep.control.exception = hasErrors
                if (!hasErrors) {
                  activeStep.control.isComplete = true
                  onNext()
                }
                this.forceUpdate()
              })
            } else {
              onNext()
            }
          }
          break
        case 'review':
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
                activeStep.control.isComplete = true
                delete activeStep.control.mutation
                delete activeStep.control.nextButtonLabel
                onNext()
                this.forceUpdate()
              }
            })
          } else {
            onNext()
          }
          break
        default:
          onNext()
          break
      }
    }

    const { isProcessing, processingLabel } = this.state
    const isWorking = creationStatus === 'IN_PROGRESS' || isProcessing
    const isDisabled = creationStatus === 'DONE' || isWorking
    const CustomFooter = (
      <WizardFooter>
        <WizardContextConsumer>
          {({ activeStep, onNext, onBack, onClose }) => {
            return (
              <React.Fragment>
                <Button
                  isLoading={isWorking}
                  isDisabled={isDisabled}
                  variant="primary"
                  spinnerAriaValueText={isWorking ? 'Processing' : undefined}
                  onClick={!isWorking ? validateNextStep.bind(null, activeStep, onNext) : noop}
                >
                  {processingLabel || activeStep.control.nextButtonLabel || 'Next'}
                </Button>
                <Button variant="secondary" onClick={onBack} isAriaDisabled={activeStep.index === 0}>
                  Back
                </Button>
                <Button variant="link" onClick={onClose}>
                  Cancel
                </Button>
              </React.Fragment>
            )
          }}
        </WizardContextConsumer>
      </WizardFooter>
    )

    const title = 'Create wizard'
    let startAtStep = get(steps[0], 'control.startAtStep')
    startAtStep = steps.findIndex(({ id }) => id === startAtStep) + 1
    if (startAtStep < 1) startAtStep = 1
    return (
      <Wizard
        ref={setWizardRef}
        navAriaLabel={`${title} steps`}
        mainAriaLabel={`${title} content`}
        steps={steps}
        height={'100%'}
        onNext={onMove}
        onBack={onMove}
        onGoToStep={onMove}
        onSave={onSave}
        onClose={onClose}
        startAtStep={startAtStep}
        footer={CustomFooter}
      />
    )
  }
}

ControlPanelWizard.propTypes = {
  controlClasses: PropTypes.string,
  controlData: PropTypes.array,
  creationStatus: PropTypes.string,
  handleCancelCreate: PropTypes.func,
  handleCreateResource: PropTypes.func,
  isEditing: PropTypes.bool,
  onStepChange: PropTypes.func,
  renderControlSections: PropTypes.func,
  renderNotifications: PropTypes.func,
  resetStatus: PropTypes.func,
  setEditorReadOnly: PropTypes.func,
  setWizardRef: PropTypes.func,
  steps: PropTypes.array,
}

export default ControlPanelWizard
