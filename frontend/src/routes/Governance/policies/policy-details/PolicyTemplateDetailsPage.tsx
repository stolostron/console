/* Copyright Contributors to the Open Cluster Management project */

import { AcmAlert, AcmPage, AcmPageHeader } from '../../../../ui-components'
import { Fragment, Suspense, useEffect, useState } from 'react'
import { Route, Routes, useParams } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { fireManagedClusterView } from '../../../../resources'
import { PageSection } from '@patternfly/react-core'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { PolicyTemplateDetails } from './PolicyTemplateDetails'
import { TemplateDetailTitle } from '../../components/TemplateDetailTitle'

export function PolicyTemplateDetailsPage() {
  const { t } = useTranslation()
  const [template, setTemplate] = useState<any>()
  const [templateError, setTemplateError] = useState<string>()
  const { managedClusterAddonsState } = useSharedAtoms()
  const managedClusterAddOns = useRecoilValue(managedClusterAddonsState)

  const urlParams = useParams()
  const policyNamespace = urlParams.namespace || ''
  const policyName = urlParams.name || ''
  const clusterName = urlParams.clusterName || ''
  const apiGroup = urlParams.apiGroup || ''
  const apiVersion = urlParams.apiVersion || ''
  const kind = urlParams.kind || ''
  const templateName = urlParams.templateName || ''

  let templateClusterName = clusterName
  let templateNamespace = clusterName

  // Determine if the policy framework is deployed in hosted mode. If so, the policy template needs to be retrieved
  // from the hosting cluster instead of the managed cluster.
  for (const addon of managedClusterAddOns) {
    if (addon.metadata.namespace !== clusterName) {
      continue
    }

    if (addon.metadata.name !== 'governance-policy-framework') {
      continue
    }

    if (addon.metadata.annotations?.['addon.open-cluster-management.io/hosting-cluster-name']) {
      templateClusterName = addon.metadata.annotations['addon.open-cluster-management.io/hosting-cluster-name']
      // open-cluster-management-agent-addon is the default namespace but it shouldn't be used for hosted mode.
      templateNamespace = addon.spec.installNamespace ?? 'open-cluster-management-agent-addon'
    }

    if (apiGroup.endsWith('gatekeeper.sh')) {
      // Gatekeeper ConstraintTemplates and constraints are cluster-scoped.
      templateNamespace = ''
    }

    break
  }

  useEffect(() => {
    if (kind === 'IamPolicy' && apiGroup === 'policy.open-cluster-management.io') {
      setTemplateError(t('IamPolicy is no longer supported'))

      return
    }

    const version = apiGroup ? `${apiGroup}/${apiVersion}` : apiVersion
    fireManagedClusterView(templateClusterName, kind, version, templateName, templateNamespace)
      .then((viewResponse) => {
        if (viewResponse?.message) {
          setTemplateError(viewResponse.message)
        } else {
          setTemplate(viewResponse.result)
        }
      })
      .catch((err) => {
        console.error('Error getting resource: ', err)
        setTemplateError(err)
      })
  }, [t, clusterName, kind, apiGroup, apiVersion, templateName, templateClusterName, templateNamespace])

  return (
    <AcmPage
      header={
        <AcmPageHeader
          title={
            <TemplateDetailTitle
              policyKind={kind}
              templateName={templateName}
              compliant={template?.status?.compliant}
            />
          }
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
              templateError ? (
                <PageSection style={{ paddingBottom: '0' }}>
                  <AcmAlert variant="danger" title={templateError} isInline noClose />
                </PageSection>
              ) : (
                <PolicyTemplateDetails clusterName={clusterName} template={template} />
              )
            }
          />
        </Routes>
      </Suspense>
    </AcmPage>
  )
}
