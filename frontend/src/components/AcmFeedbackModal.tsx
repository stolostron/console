/* Copyright Contributors to the Open Cluster Management project */

import { FeedbackLocale, FeedbackModal, FeedbackModalProps } from '@patternfly/react-user-feedback'
import feedbackImage from './feedback_illo.png'
import { useTranslation } from '../lib/acm-i18next'

export const AcmFeedbackModal = (props: FeedbackModalProps) => {
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

  return (
    <FeedbackModal
      feedbackLocale={i18nStrings as unknown as FeedbackLocale}
      email="test@redhat.com"
      onShareFeedback={props.onShareFeedback}
      onOpenSupportCase="https://access.redhat.com/support/cases/#/case/new/open-case?caseCreate=true"
      isOpen={props.isOpen}
      feedbackImg={feedbackImage}
      onClose={props.onClose}
    />
  )
}
