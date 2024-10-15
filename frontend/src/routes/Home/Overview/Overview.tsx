/* Copyright Contributors to the Open Cluster Management project */
import { useContext, useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { PluginContext } from '../../../lib/PluginContext'
import { AcmErrorBoundary, AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '../../../ui-components'
import ReuseableSearchbar from '../../Search/components/ReuseableSearchbar'
import OverviewClusterLabelSelector from './OverviewClusterLabelSelector'
import OverviewPage from './OverviewPage'

const CLUSTERS_TAB: string = 'overview-tab'

export default function Overview() {
  const { t } = useTranslation()
  const [selectedTab, setSelectedTab] = useState<string>(CLUSTERS_TAB)
  const [selectedClusterLabels, setSelectedClusterLabels] = useState<Record<string, string[]>>({})
  const { acmExtensions } = useContext(PluginContext)

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

  return (
    <AcmPage
      header={
        <div>
          <div style={{ borderBottom: '1px solid var(--pf-v5-global--BorderColor--100)' }}>
            <AcmPageHeader
              title={t('Overview')}
              searchbar={<ReuseableSearchbar />}
              navigation={
                <AcmSecondaryNav>
                  <AcmSecondaryNavItem
                    key={CLUSTERS_TAB}
                    isActive={selectedTab === CLUSTERS_TAB}
                    onClick={() => setSelectedTab(CLUSTERS_TAB)}
                  >
                    {t('Clusters')}
                  </AcmSecondaryNavItem>
                  {acmExtensions?.overviewTab?.map((tabExtension) => (
                    <AcmSecondaryNavItem
                      key={tabExtension.uid}
                      isActive={selectedTab === tabExtension.uid}
                      onClick={() => setSelectedTab(tabExtension.uid)}
                    >
                      {tabExtension.properties.tabTitle}
                    </AcmSecondaryNavItem>
                  ))}
                </AcmSecondaryNav>
              }
            />
          </div>
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
