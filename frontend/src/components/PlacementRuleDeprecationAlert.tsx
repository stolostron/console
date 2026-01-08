/* Copyright Contributors to the Open Cluster Management project */

import { Alert, Content } from '@patternfly/react-core'
import React from 'react'
import { Trans, useTranslation } from '../lib/acm-i18next'
import { DOC_LINKS, ViewDocumentationLink } from '../lib/doc-util'

const PlacementRuleDeprecationAlert = () => {
  const { t } = useTranslation()
  return (
    <React.Fragment>
      <Alert variant="info" isInline title={t('Placement rule deprecation')} style={{ marginBottom: '10px' }}>
        <Content>{t('PlacementRule resource is deprecated and will not receive updates or fixes.')}</Content>
        <Content style={{ paddingTop: '5px' }}>
          <Trans i18nKey="<bold>Best practice:</bold> Use Placement." components={{ bold: <strong /> }} />
        </Content>
        <ViewDocumentationLink doclink={DOC_LINKS.DEPRECATIONS_ACM} />
      </Alert>
    </React.Fragment>
  )
}

export default PlacementRuleDeprecationAlert
