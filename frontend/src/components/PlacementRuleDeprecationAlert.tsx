/* Copyright Contributors to the Open Cluster Management project */

import { Alert } from '@patternfly/react-core'
import React from 'react'
import { useTranslation } from '../lib/acm-i18next'

const PlacementRuleDeprecationAlert = () => {
  const { t } = useTranslation()
  return (
    <React.Fragment>
      <Alert variant="info" isInline title={t('Placement rule deprecation')} style={{ marginBottom: '10px' }}>
        <p>{t('PlacementRule is deprecated and will not receive updates or fixes. Best practice: Use Placement.')}</p>
      </Alert>
    </React.Fragment>
  )
}

export default PlacementRuleDeprecationAlert
