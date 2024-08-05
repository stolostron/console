/* Copyright Contributors to the Open Cluster Management project */
import { Label, Switch } from '@patternfly/react-core'
import { useContext, useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { PluginContext } from '../../../lib/PluginContext'
import { AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '../../../ui-components'
import ReuseableSearchbar from '../../Search/components/ReuseableSearchbar'
import ClustersTab from './ClustersTab'
import OverviewClusterLabelSelector from './OverviewClusterLabelSelector'

const CLUSTERS_TAB: string = 'clusters-tab'

export default function Overview() {
  const { t } = useTranslation()
  const [selectedTab, setSelectedTab] = useState<string>(CLUSTERS_TAB) // TODO - saved to local storage? Or always come in to clusters tab?
  const [isBetaView, setIsBetaView] = useState<boolean>(localStorage.getItem('overview-isBeta') === 'true')
  const [selectedClusterLabels, setSelectedClusterLabels] = useState<Record<string, string[]>>({})
  const { acmExtensions } = useContext(PluginContext)

  let content = <ClustersTab isBetaView={isBetaView} selectedClusterLabels={selectedClusterLabels} />
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
          <div style={{ borderBottom: '1px solid var(--pf-v5-global--BorderColor--100)' }}>
            <AcmPageHeader
              title={t('Overview')}
              switches={
                selectedTab === CLUSTERS_TAB ? (
                  <div>
                    <Switch // only if clustersTab
                      label={t('Fleet view')}
                      isChecked={isBetaView}
                      onChange={() => {
                        setIsBetaView(!isBetaView)
                        localStorage.setItem('overview-isBeta', `${!isBetaView}`) // keep selection
                      }}
                    />
                    {!isBetaView ? (
                      <Label style={{ marginLeft: '10px' }} color="orange">
                        {t('Deprecated')}
                      </Label>
                    ) : undefined}
                  </div>
                ) : undefined
              }
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
          {selectedTab === CLUSTERS_TAB && isBetaView && (
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
