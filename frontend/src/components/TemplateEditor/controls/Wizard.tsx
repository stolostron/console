/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable @typescript-eslint/ban-ts-comment -- wizard step objects are dynamic */
// @ts-nocheck
'use strict'

import React, { useCallback, useState } from 'react'
import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Button,
  Icon,
  Title,
  Stack,
  StackItem,
  WizardFooterWrapper,
  WizardStep,
  Wizard,
} from '@patternfly/react-core'
import { ExclamationCircleIcon } from '@patternfly/react-icons'
import Review from './Review'
import get from 'lodash/get'
import { ControlPanelWizardProps, WizardStepStructure } from '../types'

type WizardNavStep = {
  id?: string
  name?: React.ReactNode
  component?: React.ReactNode
  enabled?: boolean
  steps?: WizardNavStep[]
}

export default function ControlPanelWizard({
  controlClasses,
  renderControlSections,
  renderNotifications,
  isEditing,
  creationStatus,
  backButtonOverride,
  i18n,
  steps: stepsProp,
  controlData,
  handleCreateResource,
  handleCancelCreate,
  setEditorReadOnly,
}: ControlPanelWizardProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingLabel] = useState<string | undefined>(undefined)
  const [, bumpRender] = useState(0)
  const forceUpdate = useCallback(() => bumpRender((v) => v + 1), [])

  let steps = stepsProp
  steps.forEach((step) => {
    step.controls = []
    step.sections.forEach(({ content }) => {
      step.controls = step.controls.concat(content)
      content.forEach((ctrl) => {
        ctrl.step = step
      })
    })
  })

  let validStepIndex: number | undefined
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
    return validStepIndex !== undefined
  })
  validStepIndex = validStepIndex || steps.length + 1

  const renderReview = (details: WizardStepStructure[], lastReviewInx: number, comment?: string) => {
    return (
      <Review
        details={details}
        comment={comment}
        startStep={lastReviewInx}
        renderNotifications={renderNotifications}
        i18n={i18n}
      />
    )
  }

  let lastType = ''
  let lastReviewInx = 0
  steps = steps.map(({ title: control, controls, sections }, inx) => {
    const { id, type, title, comment, exception } = control
    lastType = type
    if (inx - 1 > 0 && steps[inx - 1].title.type === 'review') {
      lastReviewInx = inx - 1
    }

    let hasErrors = exception
    controls.forEach(({ exception: ex }) => {
      if (ex) {
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
              <Title headingLevel="h2" size="2xl">
                {title}
              </Title>
            </StackItem>
            <StackItem>
              {control.type === 'review'
                ? renderReview(stepsProp.slice(lastReviewInx, inx), lastReviewInx, comment)
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
            <StackItem>{renderReview(stepsProp.slice(lastReviewInx), lastReviewInx)}</StackItem>
          </Stack>
        </div>
      ),
      enabled: steps.length + 1 <= validStepIndex,
    })
  }

  const onSave = () => {
    if (lastType !== 'review') {
      handleCreateResource()
    }
  }

  const onClose = () => {
    handleCancelCreate()
  }

  const validateNextStep = (activeStep: { id?: string; index?: number }, onNext: () => void) => {
    const activeControlData = (controlData || []).find((step) => step.id === activeStep.id)
    const { type, mutation, disableEditorOnSuccess, disablePreviousControlsOnSuccess } = activeControlData || {}
    if (type === 'review') {
      if (mutation) {
        setIsProcessing(true)
        setTimeout(() => {
          setIsProcessing(false)
        }, 2000)
        mutation(controlData).then((status) => {
          setIsProcessing(false)
          if (status !== 'ERROR') {
            if (disableEditorOnSuccess) {
              setEditorReadOnly(true)
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
            delete activeControlData.mutation
            forceUpdate()
          }
        })
      } else {
        onNext()
      }
    } else {
      onNext()
    }
  }

  const isWorking = creationStatus === 'IN_PROGRESS' || isProcessing
  const isDisabled = creationStatus === 'DONE' || isWorking

  const CustomFooter = (
    activeStep: WizardStepStructure,
    goToNextStep: () => void,
    goToPrevStep: () => void,
    close: () => void
  ) => {
    const activeStepIndex = steps.findIndex((step) => step.id === activeStep.id)
    return (
      <WizardFooterWrapper>
        <ActionList>
          <ActionListGroup>
            <ActionListItem>
              <Button
                isLoading={isWorking}
                isDisabled={isDisabled}
                variant="primary"
                spinnerAriaValueText={isWorking ? i18n('Processing') : undefined}
                onClick={() => {
                  if (!isWorking) {
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
            </ActionListItem>
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

  void startAtStep

  return (
    <Wizard
      navAriaLabel={i18n('Create wizard steps')}
      title={i18n('Create wizard content')}
      height={'100%'}
      onSave={onSave}
      onClose={onClose}
      footer={CustomFooter}
    >
      {steps.map((step) => renderStep(step))}
    </Wizard>
  )
}

function renderStep(step: WizardNavStep) {
  const { id, name, component, enabled, steps: subSteps } = step
  return (
    <WizardStep id={id} key={id} name={name} isDisabled={!enabled} steps={subSteps?.map((s) => renderStep(s))}>
      {component}
    </WizardStep>
  )
}
