/* Copyright Contributors to the Open Cluster Management project */

import { AcmPage, AcmPageHeader } from '../../../../ui-components'
import { Fragment, Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { Route, Routes } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { PolicyTemplateDetails } from './PolicyTemplateDetails'

export function PolicyTemplateDetailsPage() {
  const { t } = useTranslation()

  const urlParams = useParams<{
    namespace: string
    name: string
    clusterName: string
    apiGroup: string
    apiVersion: string
    kind: string
    templateName: string
  }>()
  const policyNamespace = urlParams.namespace
  const policyName = urlParams.name
  const clusterName = urlParams.clusterName
  const apiGroup = urlParams.apiGroup
  const apiVersion = urlParams.apiVersion
  const kind = urlParams.kind
  const templateName = urlParams.templateName

  const templateDetailsUrl = NavigationPath.policyTemplateDetails
    .replace(':namespace', policyNamespace)
    .replace(':name', policyName)
    .replace(':clusterName', clusterName)
    .replace(':apiGroup/', apiGroup ? `${apiGroup}/` : '')
    .replace(':apiVersion', apiVersion)
    .replace(':kind', kind)
    .replace(':templateName', templateName)

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
            path={templateDetailsUrl}
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
