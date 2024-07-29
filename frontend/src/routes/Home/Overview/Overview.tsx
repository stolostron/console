/* Copyright Contributors to the Open Cluster Management project */
import { useContext, useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import ReuseableSearchbar from '../../Search/components/ReuseableSearchbar'
import { AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '../../../ui-components'
import { PluginContext } from '../../../lib/PluginContext'
import ClustersTab from './ClustersTab'

export default function Overview() {
  const { t } = useTranslation()
  const [selectedTab, setSelectedTab] = useState<string>()
  const { acmExtensions } = useContext(PluginContext)

  let content = <ClustersTab />
  if (selectedTab) {
    const Component = acmExtensions?.overviewTab?.find((o) => o.uid === selectedTab)?.properties.component
    if (Component) {
      content = <Component />
    }
  }

  return (
    <AcmPage
      header={
        <div>
          <AcmPageHeader
            title={t('Overview')}
            searchbar={<ReuseableSearchbar />}
            navigation={
              <AcmSecondaryNav>
                <AcmSecondaryNavItem isActive={!selectedTab} onClick={() => setSelectedTab(undefined)}>
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
      }
    >
      {content}
    </AcmPage>
  )
}
