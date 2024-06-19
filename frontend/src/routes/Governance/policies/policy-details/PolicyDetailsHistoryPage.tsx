/* Copyright Contributors to the Open Cluster Management project */

import { AcmPage, AcmPageHeader } from '../../../../ui-components'
import { Fragment, Suspense } from 'react'
import { generatePath, useParams } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { PolicyDetailsHistory } from './PolicyDetailsHistory'

export function PolicyDetailsHistoryPage() {
  const { t } = useTranslation()

  const urlParams = useParams()
  const policyNamespace = urlParams.namespace || ''
  const policyName = urlParams.name || ''
  const clusterName = urlParams.clusterName || ''
  const templateName = urlParams.templateName || ''

  return (
    <AcmPage
      header={
        <AcmPageHeader
          title={t('History')}
          breadcrumb={[
            { text: t('Policies'), to: NavigationPath.policies },
            {
              text: policyName,
              to: generatePath(NavigationPath.policyDetailsResults, { namespace: policyNamespace!, name: policyName }),
            },
            { text: t('History'), to: '' },
          ]}
          popoverAutoWidth={false}
          popoverPosition="bottom"
        />
      }
    >
      <Suspense fallback={<Fragment />}>
        <PolicyDetailsHistory
          policyName={policyName}
          policyNamespace={policyNamespace}
          clusterName={clusterName}
          templateName={templateName}
        />
      </Suspense>
    </AcmPage>
  )
}
