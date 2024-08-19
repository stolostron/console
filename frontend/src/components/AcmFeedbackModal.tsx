/* Copyright Contributors to the Open Cluster Management project */

import { FeedbackLocale, FeedbackModal, FeedbackModalProps } from '@patternfly/react-user-feedback'
import feedbackImage from './feedback_illo.png'
import { createContext, useState, Dispatch } from 'react'
import { useTranslation } from '../lib/acm-i18next'

export const AcmFeedbackModalContext = createContext<{
  isModalOpen?: boolean
  setIsModalOpen?: Dispatch<boolean>
}>({})

export const AcmFeedbackModalProvider = (props: { children: any }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  return (
    <AcmFeedbackModalContext.Provider value={{ isModalOpen, setIsModalOpen }}>
      {props.children}
    </AcmFeedbackModalContext.Provider>
  )
}

export const AcmFeedbackModal = (props: FeedbackModalProps) => {
  const { t } = useTranslation()
  const i18nStrings = {
    getSupport: t('Get support'),
    cancel: t('Cancel'),
    helpUsImproveHCC: t('Help us improve Red Hat Advanced Cluster Management for Kubernetes.'),
    howIsConsoleExperience: t('What has your console experience been like so far?'),
    openSupportCase: t('Support Case'),
    problemProcessingRequest: t(
      'There was a problem processing the request. Try reloading the page. If the problem persists, contact'
    ),
    shareFeedback: t('Share feedback'),
    somethingWentWrong: t('Something went wrong'),
    tellAboutExperience: t('Tell us about your experience'),
  }

  return (
    <>
      <FeedbackModal
        feedbackLocale={i18nStrings as unknown as FeedbackLocale}
        email="test@redhat.com"
        onShareFeedback={props.onShareFeedback}
        onOpenSupportCase="https://access.redhat.com/support/cases/#/case/new/open-case?caseCreate=true"
        isOpen={props.isOpen}
        feedbackImg={feedbackImage}
        onClose={props.onClose}
      />
    </>
  )
}
