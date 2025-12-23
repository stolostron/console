/* Copyright Contributors to the Open Cluster Management project */

import { Fragment, ReactNode, Suspense, useMemo, useState } from 'react'
import { generatePath, Outlet, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom-v5-compat'
import { ErrorPage } from '../../../../components/ErrorPage'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { Policy } from '../../../../resources'
import { ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { AcmActionGroup, AcmButton, AcmPage, AcmPageHeader, AcmSecondaryNav } from '../../../../ui-components'
import { useAddRemediationPolicies } from '../../common/useCustom'
import { getPolicyDetailSourceLabel, getPolicySource } from '../../common/util'
import { PolicyActionDropdown } from '../../components/PolicyActionDropdown'
import { PolicyTableItem } from '../Policies'

export type PolicyDetailsContext = {
  policy: Policy
}

export function PolicyDetailsPage() {
  const location = useLocation()
  const { t } = useTranslation()
  const { channelsState, helmReleaseState, subscriptionsState } = useSharedAtoms()
  const navigate = useNavigate()
  const policies = useAddRemediationPolicies()
  const helmReleases = useRecoilValue(helmReleaseState)
  const subscriptions = useRecoilValue(subscriptionsState)
  const channels = useRecoilValue(channelsState)
  const [modal, setModal] = useState<ReactNode | undefined>()

  const params = useParams()
  const policyNamespace = params.namespace ?? ''
  const policyName = params.name ?? ''

  const isResultsTab = location.pathname.endsWith('/results')

  const detailsUrl = generatePath(NavigationPath.policyDetails, { namespace: policyNamespace, name: policyName })
  const resultsUrl = generatePath(NavigationPath.policyDetailsResults, {
    namespace: policyNamespace,
    name: policyName,
  })

  const selectedPolicy: Policy = useMemo(() => {
    const idx =
      policies.findIndex(
        (policy: Policy) => policy.metadata.namespace === policyNamespace && policy.metadata.name === policyName
      ) ?? 0
    return policies[idx]
  }, [policies, policyName, policyNamespace])

  const policyItem: PolicyTableItem = useMemo(() => {
    return {
      policy: selectedPolicy,
      source: getPolicySource(selectedPolicy, helmReleases, channels, subscriptions, t),
    }
  }, [selectedPolicy, helmReleases, channels, subscriptions, t])

  const policyDetailsContext = useMemo<PolicyDetailsContext>(
    () => ({
      policy: selectedPolicy,
    }),
    [selectedPolicy]
  )

  if (!selectedPolicy) {
    return (
      <ErrorPage
        error={new ResourceError(ResourceErrorCode.NotFound)}
        actions={
          <AcmButton role="link" onClick={() => navigate(NavigationPath.policies)}>
            {t('Back to policies')}
          </AcmButton>
        }
      />
    )
  }

  return (
    <AcmPage
      hasDrawer
      header={
        <AcmPageHeader
          title={policyName ?? 'Policy details'}
          breadcrumb={[
            { text: t('Policies'), to: NavigationPath.policies },
            { text: policyName ?? t('Policy details'), to: '' },
          ]}
          popoverAutoWidth={false}
          popoverPosition="bottom"
          navigation={
            <AcmSecondaryNav
              navItems={[
                {
                  key: 'governance-policies-details',
                  title: t('Details'),
                  isActive: !isResultsTab,
                  to: detailsUrl,
                },
                {
                  key: 'governance-policies-results',
                  title: t('Results'),
                  isActive: isResultsTab,
                  to: resultsUrl,
                },
              ]}
            />
          }
          description={getPolicyDetailSourceLabel(selectedPolicy, helmReleases, channels, subscriptions, t)}
          actions={
            <>
              {modal !== undefined && modal}
              <AcmActionGroup>
                {[
                  <PolicyActionDropdown
                    key={`${selectedPolicy?.metadata.name ?? 'policy'}-actions`}
                    setModal={setModal}
                    item={policyItem}
                    isKebab={false}
                  />,
                ]}
              </AcmActionGroup>
            </>
          }
        />
      }
    >
      <Suspense fallback={<Fragment />}>
        <Outlet context={policyDetailsContext} />
      </Suspense>
    </AcmPage>
  )
}

export function usePolicyDetailsContext() {
  return useOutletContext<PolicyDetailsContext>()
}
