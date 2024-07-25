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

const i18nEnglish = {
  getSupport: 'Get support',
  back: 'Back',
  bugReported: 'Bug Reported',
  cancel: 'Cancel',
  close: 'Close',
  describeBug: 'Describe the bug you encountered. For urgent issues, open a support case instead.',
  describeBugUrgentCases: 'Describe the bug you encountered. For urgent issues, open a support case instead.',
  describeReportBug:
    'Describe the bug you encountered. Include where it is located and what action caused it. If this issue is urgent or blocking your workflow,',
  directInfluence:
    'Your feedback will directly influence the future of Red Hat’s products. Opt in below to hear about future research opportunities via email.',
  email: 'Email',
  enterFeedback: 'Enter your feedback',
  feedback: 'Feedback',
  feedbackSent: 'Feedback Sent',
  helpUsImproveHCC: 'Help us improve Advanced Cluster Security.',
  howIsConsoleExperience: 'What has your consoleexperience been like so far?',
  joinMailingList: 'Join mailing list',
  informDirectionDescription: 'By participating in feedback sessions, usability tests, and interviews with our',
  informDirection: 'Inform the direction of Red Hat',
  learnAboutResearchOpportunities: 'Learn about opportunities to share your feedback with our User Research Team.',
  openSupportCase: 'Support Case',
  problemProcessingRequest:
    'There was a problem processing the request. Try reloading the page. If the problem persists, contact',
  support: 'Red Hat support',
  reportABug: 'Report a bug',
  responseSent: 'Response sent',
  researchOpportunities: 'Yes, I would like to hear about research opportunities',
  shareFeedback: 'Share feedback',
  shareYourFeedback: 'Share your feedback with us!',
  somethingWentWrong: 'Something went wrong',
  submitFeedback: 'Submit feedback',
  teamWillReviewBug: 'We appreciate your feedback and our team will review your report shortly',
  tellAboutExperience: 'Tell us about your experience',
  thankYouForFeedback: 'Thank you, we appreciate your feedback.',
  thankYouForInterest: 'Thank you for your interest in user research. You have been added to our mailing list.',
  userResearchTeam: 'User Research Team',
  weNeverSharePersonalInformation: 'We never share your personal information, and you can opt out at any time.',
}

export const AcmFeedbackModal = (props: FeedbackModalProps) => {
  return (
    <>
      <FeedbackModal
        feedbackLocale={i18nEnglish}
        email="test@redhat.com"
        onShareFeedback={props.onShareFeedback}
        onOpenSupportCase="https://access.redhat.com/support/cases/#/case/new/open-case?caseCreate=true"
        onReportABug={(email: string, bug: string) => {
          console.log(`Email Address: ${email} Bug: ${bug}`)
          return true
        }}
        isOpen={props.isOpen}
        feedbackImg={feedbackImage}
        onClose={props.onClose}
      />
    </>
  )
}
