/* Copyright Contributors to the Open Cluster Management project */

import { Alert, TextContent } from '@patternfly/react-core'
import React from 'react'
import { Trans, useTranslation } from '../lib/acm-i18next'
import { viewDocumentation, DOC_LINKS } from '../lib/doc-util'

const PlacementRuleDeprecationAlert = () => {
  const { t } = useTranslation()
  return (
    <React.Fragment>
      <Alert variant="info" isInline title={t('Placement rule deprecation')} style={{ marginBottom: '10px' }}>
        <TextContent>{t('PlacementRule resource is deprecated and will not receive updates or fixes.')}</TextContent>
        <TextContent style={{ paddingTop: '5px' }}>
          <Trans i18nKey="<bold>Best practice:</bold> Use Placement." components={{ bold: <strong /> }} />
        </TextContent>
        <TextContent>{viewDocumentation(DOC_LINKS.DEPRECATIONS_AND_REMOVALS, t)}</TextContent>
      </Alert>
    </React.Fragment>
  )
}

export default PlacementRuleDeprecationAlert
