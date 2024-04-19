/* Copyright Contributors to the Open Cluster Management project */

import { AcmPage, AcmPageHeader } from '../../../../ui-components'
import { Fragment, Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { Route, Routes } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { PolicyDetailsHistory } from './PolicyDetailsHistory'

export function PolicyDetailsHistoryPage() {
  const { t } = useTranslation()

  const urlParams = useParams<{ namespace: string; name: string; clusterName: string; templateName: string }>()
  const policyNamespace = urlParams.namespace
  const policyName = urlParams.name
  const clusterName = urlParams.clusterName
  const templateName = urlParams.templateName

  const historyUrl = NavigationPath.policyDetailsHistory
    .replace(':namespace', policyNamespace)
    .replace(':name', policyName)
    .replace(':clusterName', clusterName)
    .replace(':templateName', templateName)

  return (
    <AcmPage
      header={
        <AcmPageHeader
          title={t('History')}
          breadcrumb={[
            { text: t('Policies'), to: NavigationPath.policies },
            {
              text: policyName,
              to: NavigationPath.policyDetailsResults
                .replace(':namespace', policyNamespace as string)
                .replace(':name', policyName as string),
            },
            { text: t('History'), to: '' },
          ]}
          popoverAutoWidth={false}
          popoverPosition="bottom"
        />
      }
    >
      <Suspense fallback={<Fragment />}>
        <Routes>
          <Route
            path={historyUrl}
            element={
              <PolicyDetailsHistory
                policyName={policyName}
                policyNamespace={policyNamespace}
                clusterName={clusterName}
                templateName={templateName}
              />
            }
          />
        </Routes>
      </Suspense>
    </AcmPage>
  )
}
