/* Copyright Contributors to the Open Cluster Management project */

import { useTranslation } from '../lib/acm-i18next'
import { AcmButton } from '../ui-components'
import { OutlinedCommentsIcon, ExternalLinkAltIcon } from '@patternfly/react-icons'
import { useState } from 'react'
import { DOC_VERSION } from '../lib/doc-util'
import feedbackImage from './feedback_illo.png'
import {
  Modal,
  ModalVariant,
  Button,
  Card,
  CardTitle,
  CardBody,
  TextContent,
  Text,
  TextVariants,
  Grid,
  GridItem,
} from '@patternfly/react-core'

export const AcmFeedbackModal = () => {
  const { t } = useTranslation()
  const [toggleOpen, setToggleOpen] = useState<boolean>(false)
  const toggle = () => setToggleOpen(!toggleOpen)

  const handleShareFeedback = () => {
    window.open(`https://console.redhat.com/self-managed-feedback-form?source=acm&version=${DOC_VERSION}`, '_blank')
    setToggleOpen(false)
  }

  const handleOpenSupportCase = () => {
    window.open('https://access.redhat.com/support/cases/#/case/new/open-case?caseCreate=true', '_blank')
    setToggleOpen(false)
  }

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

      <Modal
        variant={ModalVariant.medium}
        title={t('Tell us about your experience')}
        isOpen={toggleOpen}
        onClose={() => setToggleOpen(false)}
        actions={[
          <Button key="cancel" variant="link" onClick={() => setToggleOpen(false)}>
            {t('Cancel') || 'Cancel'}
          </Button>,
        ]}
      >
        <Grid hasGutter>
          <GridItem span={8}>
            <TextContent>
              <Text component={TextVariants.p}>
                {t('Help us improve Red Hat Advanced Cluster Management for Kubernetes.')}
              </Text>
              <Text component={TextVariants.p}>{t('What has your console experience been like so far?')}</Text>
            </TextContent>

            <div style={{ marginTop: '1rem' }}>
              <Card
                isSelectableRaised
                isCompact
                onClick={handleShareFeedback}
                style={{ cursor: 'pointer', marginBottom: '1rem' }}
              >
                <CardTitle>
                  {t('Share feedback')} <ExternalLinkAltIcon />
                </CardTitle>
                <CardBody>{t('What has your console experience been like so far?')}</CardBody>
              </Card>

              <Card isSelectableRaised isCompact onClick={handleOpenSupportCase} style={{ cursor: 'pointer' }}>
                <CardTitle>
                  {t('Support Case')} <ExternalLinkAltIcon />
                </CardTitle>
                <CardBody>{t('Get support')}</CardBody>
              </Card>
            </div>
          </GridItem>

          <GridItem span={4} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img alt="feedback illustration" src={feedbackImage} style={{ maxWidth: '100%', height: 'auto' }} />
          </GridItem>
        </Grid>
      </Modal>
    </>
  )
}
