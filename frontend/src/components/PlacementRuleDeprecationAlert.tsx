/* Copyright Contributors to the Open Cluster Management project */

import { Alert, TextContent } from '@patternfly/react-core'
import React from 'react'
import { Trans, useTranslation } from '../lib/acm-i18next'
import { DOC_LINKS, ViewDocumentationLink } from '../lib/doc-util'

const PlacementRuleDeprecationAlert = () => {
  const { t } = useTranslation()
  return (
    <React.Fragment>
      <Alert variant="info" isInline title={t('Placement rule deprecation')} style={{ marginBottom: '10px' }}>
        <TextContent>{t('PlacementRule resource is deprecated and will not receive updates or fixes.')}</TextContent>
        <TextContent style={{ paddingTop: '5px' }}>
          <Trans i18nKey="<bold>Best practice:</bold> Use Placement." components={{ bold: <strong /> }} />
        </TextContent>
        <ViewDocumentationLink doclink={DOC_LINKS.DEPRECATIONS_AND_REMOVALS} />
      </Alert>
    </React.Fragment>
  )
}

export default PlacementRuleDeprecationAlert
