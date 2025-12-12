/* Copyright Contributors to the Open Cluster Management project */
import { useContext, useMemo, useState } from 'react'
import { Link } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../lib/acm-i18next'
import { PluginContext } from '../../../lib/PluginContext'
import { NavigationPath } from '../../../NavigationPath'
import { AcmErrorBoundary, AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '../../../ui-components'
import ReuseableSearchbar from '../../Search/components/ReuseableSearchbar'
import OverviewClusterLabelSelector from './OverviewClusterLabelSelector'
import OverviewPage from './OverviewPage'

const CLUSTERS_TAB: string = 'overview-tab'

export default function Overview() {
  const { t } = useTranslation()
  const [selectedTab, setSelectedTab] = useState<string>(location.pathname.replace(NavigationPath.overview, ''))
  const [selectedClusterLabels, setSelectedClusterLabels] = useState<Record<string, string[]>>({})
  const { acmExtensions } = useContext(PluginContext)
  console.log('selectedTab: ', selectedTab)
  console.log('acmExtensions: ', acmExtensions.overviewTab)
  let content = <OverviewPage selectedClusterLabels={selectedClusterLabels} />
  if (selectedTab) {
    const Component = acmExtensions?.overviewTab?.find((o) => o.uid === selectedTab)?.properties.component
    if (Component) {
      content = (
        <AcmErrorBoundary>
          <Component />
        </AcmErrorBoundary>
      )
    }
  }

  const navItems = useMemo(() => {
    const items: JSX.Element[] = [
      <AcmSecondaryNavItem
        key={CLUSTERS_TAB}
        // isActive={selectedTab === CLUSTERS_TAB}
        isActive={location.pathname === NavigationPath.overview}
        onClick={() => setSelectedTab(CLUSTERS_TAB)}
      >
        <Link to={NavigationPath.overview}>{t('Clusters')}</Link>
      </AcmSecondaryNavItem>,
    ]

    const extTab = acmExtensions?.overviewTab?.map((tabExtension) => (
      <AcmSecondaryNavItem
        key={tabExtension.uid}
        // isActive={selectedTab === tabExtension.uid}
        isActive={location.pathname === `${NavigationPath.overview}/${tabExtension.uid}`}
        onClick={() => setSelectedTab(tabExtension.uid)}
      >
        {/* {tabExtension.properties.tabTitle} */}
        <Link to={`${NavigationPath.overview}/${tabExtension.uid}`}>{tabExtension.properties.tabTitle}</Link>
      </AcmSecondaryNavItem>
    ))

    if (extTab) {
      extTab.forEach((tab) => items.push(tab))
    }

    return items
  }, [acmExtensions?.overviewTab, setSelectedTab, t])

  return (
    <AcmPage
      header={
        <div>
          <AcmPageHeader
            title={t('Overview')}
            searchbar={<ReuseableSearchbar />}
            navigation={<AcmSecondaryNav>{navItems}</AcmSecondaryNav>}
          />
          {/* Fleet view includes a cluster label filter */}
          {selectedTab === CLUSTERS_TAB && (
            <OverviewClusterLabelSelector
              selectedClusterLabels={selectedClusterLabels}
              setSelectedClusterLabels={setSelectedClusterLabels}
            />
          )}
        </div>
      }
    >
      {content}
    </AcmPage>
  )
}
