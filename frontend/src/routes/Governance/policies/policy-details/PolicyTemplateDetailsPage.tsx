/* Copyright Contributors to the Open Cluster Management project */
import { AcmAlert, AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '../../../../ui-components'
import { Fragment, Suspense, useEffect, useMemo, useState } from 'react'
import { generatePath, Link, Outlet, useOutletContext, useParams } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { fireManagedClusterView } from '../../../../resources'
import { PageSection } from '@patternfly/react-core'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { TemplateDetailTitle } from '../../components/TemplateDetailTitle'

export type TemplateDetailsContext = {
  clusterName: string
  template: any
  templateLoading: boolean
}

export function PolicyTemplateDetailsPage() {
  const { t } = useTranslation()
  const [template, setTemplate] = useState<any>()
  const [templateLoading, setTemplateLoading] = useState<boolean>(true)
  const [templateError, setTemplateError] = useState<string>()
  const { managedClusterAddonsState } = useSharedAtoms()
  const managedClusterAddOns = useRecoilValue(managedClusterAddonsState)

  const urlParams = useParams()
  const policyNamespace = urlParams.namespace ?? ''
  const policyName = urlParams.name ?? ''
  const clusterName = urlParams.clusterName ?? ''
  const apiGroup = urlParams.apiGroup ?? ''
  const apiVersion = urlParams.apiVersion ?? ''
  const kind = urlParams.kind ?? ''
  const templateName = urlParams.templateName ?? ''
  const isYamlTab = location.pathname.endsWith('/yaml')
  const hasParentPolicy = policyNamespace && policyName
  const detailsUrl = hasParentPolicy
    ? generatePath(NavigationPath.policyTemplateDetails, {
        namespace: policyNamespace,
        name: policyName,
        clusterName,
        apiGroup,
        apiVersion,
        kind,
        templateName,
      })
    : generatePath(NavigationPath.discoveredPolicyDetails, {
        clusterName,
        apiGroup,
        apiVersion,
        kind,
        // discovered policy name
        templateName,
        templateNamespace: urlParams.templateNamespace ?? '',
      })
  const yamlUrl = hasParentPolicy
    ? generatePath(NavigationPath.policyTemplateYaml, {
        namespace: policyNamespace,
        name: policyName,
        clusterName,
        apiGroup,
        apiVersion,
        kind,
        templateName,
      })
    : generatePath(NavigationPath.discoveredPolicyYaml, {
        clusterName,
        apiGroup,
        apiVersion,
        kind,
        // discovered policy name
        templateName,
        templateNamespace: urlParams.templateNamespace ?? '',
      })

  let templateClusterName = clusterName
  let templateNamespace = clusterName

  // Determine if the policy framework is deployed in hosted mode. If so, the policy template needs to be retrieved
  // from the hosting cluster instead of the managed cluster.
  const addons = managedClusterAddOns?.[clusterName] || []
  for (const addon of addons) {
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
    } else if (!hasParentPolicy) {
      // For discovered Policies
      templateNamespace = urlParams.templateNamespace || clusterName
    }

    break
  }

  useEffect(() => {
    if (kind === 'IamPolicy' && apiGroup === 'policy.open-cluster-management.io') {
      setTemplateError(t('IamPolicy is no longer supported'))

      return
    }

    let namespace = templateNamespace
    // Apply both to ValidatingAdmissionPolicy and ValidatingAdmissionPolicyBinding
    if (kind.startsWith('ValidatingAdmissionPolicy')) {
      namespace = ''
    }

    // This condition is added to enhance performance and reduce ManagedClusterView errors.
    if (templateClusterName && kind && templateName && apiVersion) {
      setTemplateLoading(true)
      const version = apiGroup ? `${apiGroup}/${apiVersion}` : apiVersion
      fireManagedClusterView(templateClusterName, kind, version, templateName, namespace)
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
      setTemplateLoading(false)
    }
  }, [t, clusterName, kind, apiGroup, apiVersion, templateName, templateClusterName, templateNamespace])

  const templateDetailsContext = useMemo<TemplateDetailsContext>(
    () => ({
      template,
      clusterName,
      templateLoading,
    }),
    [template, clusterName, templateLoading]
  )

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
          breadcrumb={
            hasParentPolicy
              ? [
                  { text: t('Policies'), to: NavigationPath.policies },
                  {
                    text: policyName,
                    to: generatePath(NavigationPath.policyDetailsResults, {
                      namespace: policyNamespace,
                      name: policyName,
                    }),
                  },
                  { text: templateName, to: '' },
                ]
              : [
                  {
                    text: t('Discovered policies'),
                    to: NavigationPath.discoveredPolicies,
                  },
                  {
                    text: templateName,
                    to: generatePath(NavigationPath.discoveredByCluster, {
                      kind,
                      apiGroup,
                      apiVersion,
                      policyName: templateName,
                    }),
                  },
                  { text: clusterName, to: '' },
                ]
          }
          popoverAutoWidth={false}
          popoverPosition="bottom"
          navigation={
            <AcmSecondaryNav>
              <AcmSecondaryNavItem isActive={!isYamlTab}>
                <Link to={detailsUrl}>{t('Details')}</Link>
              </AcmSecondaryNavItem>
              <AcmSecondaryNavItem isActive={isYamlTab}>
                <Link to={yamlUrl}>{t('YAML')}</Link>
              </AcmSecondaryNavItem>
            </AcmSecondaryNav>
          }
        />
      }
    >
      <Suspense fallback={<Fragment />}>
        {templateError ? (
          <PageSection style={{ paddingBottom: '0' }}>
            <AcmAlert variant="danger" title={templateError} isInline noClose />
          </PageSection>
        ) : (
          <Outlet context={templateDetailsContext} />
        )}
      </Suspense>
    </AcmPage>
  )
}

export function useTemplateDetailsContext() {
  return useOutletContext<TemplateDetailsContext>()
}
