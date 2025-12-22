/* Copyright Contributors to the Open Cluster Management project */

import { Fragment, ReactNode, Suspense, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../lib/acm-i18next'
import { NavigationPath } from '../../NavigationPath'
import { AcmPage, AcmPageHeader, AcmSecondaryNav } from '../../ui-components'
import { PageContext } from '../Infrastructure/Clusters/ClustersPage'

export default function GovernancePage() {
  const [actions, setActions] = useState<undefined | ReactNode>(undefined)
  const location = useLocation()
  const { t } = useTranslation()

  const isOverview = location.pathname == NavigationPath.governance

  return (
    <AcmPage
      hasDrawer
      header={
        <AcmPageHeader
          title={t('Governance')}
          titleTooltip={t(
            'Governance provides an extensible policy framework for enterprises to harden security for software engineering, secure engineering, and resiliency. Enhance your security to meet internal standards by using policies to verify which clusters are at risk'
          )}
          popoverAutoWidth={false}
          popoverPosition="bottom"
          navigation={
            <AcmSecondaryNav
              navItems={[
                {
                  key: 'governance-overview',
                  title: t('Overivew'),
                  isActive: isOverview,
                  to: NavigationPath.governance,
                },
                {
                  key: 'governance-policy-sets',
                  title: t('Policy sets'),
                  isActive: !isOverview && location.pathname.startsWith(NavigationPath.policySets),
                  to: NavigationPath.policySets,
                },
                {
                  key: 'governance-policies',
                  title: t('Policies'),
                  isActive: !isOverview && location.pathname.startsWith(NavigationPath.policies),
                  to: NavigationPath.policies,
                },
                {
                  key: 'governance-discovered-policies',
                  title: t('Discovered policies'),
                  isActive: location.pathname.startsWith(NavigationPath.discoveredPolicies),
                  to: NavigationPath.discoveredPolicies,
                },
              ]}
            />
          }
          actions={actions}
        />
      }
    >
      <PageContext.Provider value={{ actions, setActions }}>
        <Suspense fallback={<Fragment />}>
          <Outlet />
        </Suspense>
      </PageContext.Provider>
    </AcmPage>
  )
}
