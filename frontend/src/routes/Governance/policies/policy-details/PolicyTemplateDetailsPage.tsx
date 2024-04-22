/* Copyright Contributors to the Open Cluster Management project */

import { AcmPage, AcmPageHeader } from '../../../../ui-components'
import { Fragment, Suspense } from 'react'
import { Route, Routes, useParams } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { PolicyTemplateDetails } from './PolicyTemplateDetails'

export function PolicyTemplateDetailsPage() {
  const { t } = useTranslation()

  const urlParams = useParams()
  const policyNamespace = urlParams.namespace || ''
  const policyName = urlParams.name || ''
  const clusterName = urlParams.clusterName || ''
  const apiGroup = urlParams.apiGroup || ''
  const apiVersion = urlParams.apiVersion || ''
  const kind = urlParams.kind || ''
  const templateName = urlParams.templateName || ''

  return (
    <AcmPage
      header={
        <AcmPageHeader
          title={templateName}
          breadcrumb={[
            { text: t('Policies'), to: NavigationPath.policies },
            {
              text: policyName,
              to: NavigationPath.policyDetailsResults
                .replace(':namespace', policyNamespace)
                .replace(':name', policyName),
            },
            { text: templateName, to: '' },
          ]}
          popoverAutoWidth={false}
          popoverPosition="bottom"
        />
      }
    >
      <Suspense fallback={<Fragment />}>
        <Routes>
          <Route
            path="/"
            element={
              <PolicyTemplateDetails
                clusterName={clusterName}
                apiGroup={apiGroup}
                apiVersion={apiVersion}
                kind={kind}
                templateName={templateName}
              />
            }
          />
        </Routes>
      </Suspense>
    </AcmPage>
  )
}
