/* Copyright Contributors to the Open Cluster Management project */

import { FeedbackLocale, FeedbackModal } from '@patternfly/react-user-feedback'
import feedbackImage from './feedback_illo.png'
import { useTranslation } from '../lib/acm-i18next'
import { AcmButton } from '../ui-components'
import { OutlinedCommentsIcon } from '@patternfly/react-icons'
import { useState } from 'react'
import { DOC_VERSION } from '../lib/doc-util'

export const AcmFeedbackModal = () => {
  const { t } = useTranslation()
  const i18nStrings = {
    getSupport: t('Get support'),
    cancel: t('Cancel'),
    helpUsImproveHCC: t('Help us improve Red Hat Advanced Cluster Management for Kubernetes.'),
    howIsConsoleExperience: t('What has your console experience been like so far?'),
    openSupportCase: t('Support Case'),
    shareFeedback: t('Share feedback'),
    tellAboutExperience: t('Tell us about your experience'),
  }

  const [toggleOpen, setToggleOpen] = useState<boolean>(false)
  const toggle = () => setToggleOpen(!toggleOpen)

  return (
    <>
      <AcmButton
        style={{
          position: 'fixed',
          left: '100%',
          transformOrigin: '0% 0%',
          transform: 'rotate(-90deg) translateY(-100%)',
          bottom: '2em',
          zIndex: 20000,
          color: 'var(--pf-global--palette--white)',
        }}
        icon={<OutlinedCommentsIcon />}
        iconPosition="left"
        variant="danger"
        id="feedback-trigger-button"
        onClick={toggle}
      >
        {t('Feedback')}
      </AcmButton>
      <FeedbackModal
        feedbackLocale={i18nStrings as unknown as FeedbackLocale}
        email="test@redhat.com"
        onShareFeedback={`https://console.redhat.com/self-managed-feedback-form?source=acm&version=${DOC_VERSION}`}
        onOpenSupportCase="https://access.redhat.com/support/cases/#/case/new/open-case?caseCreate=true"
        isOpen={toggleOpen}
        feedbackImg={feedbackImage}
        onClose={() => setToggleOpen(false)}
      />
    </>
  )
}
