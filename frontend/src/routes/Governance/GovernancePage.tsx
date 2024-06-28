/* Copyright Contributors to the Open Cluster Management project */

import { AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '../../ui-components'
import { Fragment, ReactNode, Suspense, useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../lib/acm-i18next'
import { NavigationPath } from '../../NavigationPath'
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
            <AcmSecondaryNav>
              <AcmSecondaryNavItem isActive={isOverview}>
                <Link to={NavigationPath.governance}>{t('Overview')}</Link>
              </AcmSecondaryNavItem>
              <AcmSecondaryNavItem isActive={!isOverview && location.pathname.startsWith(NavigationPath.policySets)}>
                <Link to={NavigationPath.policySets}>{t('Policy sets')}</Link>
              </AcmSecondaryNavItem>
              <AcmSecondaryNavItem isActive={!isOverview && location.pathname.startsWith(NavigationPath.policies)}>
                <Link to={NavigationPath.policies}>{t('Policies')}</Link>
              </AcmSecondaryNavItem>
            </AcmSecondaryNav>
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
