/* Copyright Contributors to the Open Cluster Management project */

import { FeedbackModal, FeedbackModalProps } from '@patternfly/react-user-feedback'
import feedbackImage from './feedback_illo.png'
import { createContext, useState, Dispatch } from 'react'

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
  return (
    <>
      <FeedbackModal
        email="test@redhat.com"
        onShareFeedback={props.onShareFeedback}
        onReportABug={(email: string, bug: string) => {
          console.log(`Email Address: ${email} Bug: ${bug}`)
          return true
        }}
        onOpenSupportCase="https://access.redhat.com/support/cases/#/case/new/open-case?caseCreate=true"
        feedbackImg={feedbackImage}
        isOpen={props.isOpen}
        onClose={props.onClose}
      />
    </>
  )
}
