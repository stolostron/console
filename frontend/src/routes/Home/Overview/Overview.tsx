/* Copyright Contributors to the Open Cluster Management project */
import { Tab, Tabs, TabTitleText } from '@patternfly/react-core'
import { useContext, useMemo, useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { PluginContext } from '../../../lib/PluginContext'
import { AcmErrorBoundary, AcmPage, AcmPageHeader } from '../../../ui-components'
import ReuseableSearchbar from '../../Search/components/ReuseableSearchbar'
import OverviewClusterLabelSelector from './OverviewClusterLabelSelector'
import OverviewPage from './OverviewPage'

const CLUSTERS_TAB: string = 'overview-tab'

export default function Overview() {
  const { t } = useTranslation()
  const [activeTabKey, setActiveTabKey] = useState<string | number>(CLUSTERS_TAB)
  const [selectedClusterLabels, setSelectedClusterLabels] = useState<Record<string, string[]>>({})
  const { acmExtensions } = useContext(PluginContext)
  let content = <OverviewPage selectedClusterLabels={selectedClusterLabels} />
  if (activeTabKey) {
    const Component = acmExtensions?.overviewTab?.find((o) => o.uid === activeTabKey)?.properties.component
    if (Component) {
      content = (
        <AcmErrorBoundary>
          <Component />
        </AcmErrorBoundary>
      )
    }
  }

  const tabItems = useMemo(() => {
    const items = [
      {
        eventKey: CLUSTERS_TAB,
        title: t('Clusters'),
      },
    ]

    acmExtensions?.overviewTab?.forEach((tabExtension) =>
      items.push({
        eventKey: tabExtension.uid,
        title: tabExtension.properties.tabTitle,
      })
    )

    return items
  }, [acmExtensions?.overviewTab, t])

  return (
    <AcmPage header={<AcmPageHeader title={t('Overview')} searchbar={<ReuseableSearchbar />} />}>
      <Tabs
        activeKey={activeTabKey}
        onSelect={(_, tabIndex) => setActiveTabKey(tabIndex)}
        usePageInsets
        aria-label="Tabs in the default example"
        role="region"
        style={{
          // match page section padding inset
          paddingInlineStart:
            'calc(var(--pf-v6-c-page__main-section--PaddingInlineStart) - var(--pf-v6-c-page__main-container--BorderWidth))',
        }}
      >
        {tabItems.map((tab) => (
          <Tab
            key={`tab-item-${tab.eventKey}`}
            eventKey={tab.eventKey}
            title={<TabTitleText>{tab.title}</TabTitleText>}
            aria-label={`tab-item-${tab.title}`}
          />
        ))}
      </Tabs>
      {/* Fleet view includes a cluster label filter */}
      {activeTabKey === CLUSTERS_TAB && (
        <OverviewClusterLabelSelector
          selectedClusterLabels={selectedClusterLabels}
          setSelectedClusterLabels={setSelectedClusterLabels}
        />
      )}
      {content}
    </AcmPage>
  )
}
