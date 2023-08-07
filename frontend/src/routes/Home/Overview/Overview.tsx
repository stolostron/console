/* Copyright Contributors to the Open Cluster Management project */
import { Switch } from '@patternfly/react-core'
import { useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { AcmPage, AcmPageHeader } from '../../../ui-components'
import OverviewClusterLabelSelector from './OverviewClusterLabelSelector'
import OverviewPage from './OverviewPage'
import OverviewPageBeta from './OverviewPageBeta'

export default function OverviewTemp() {
  const [isBetaView, setIsBetaView] = useState<boolean>(localStorage.getItem('overview-isBeta') === 'true')
  const [selectedClusterLabels, setSelectedClusterLabels] = useState<Record<string, string[]>>({})
  const { t } = useTranslation()

  return (
    <AcmPage
      header={
        <div>
          <AcmPageHeader
            title={t('Overview')}
            switches={
              <Switch
                label={t('Beta view')}
                isChecked={isBetaView}
                onChange={() => {
                  setIsBetaView(!isBetaView)
                  localStorage.setItem('overview-isBeta', `${!isBetaView}`) // keep selection
                }}
              />
            }
          />
          {/* Beta view includes a cluster label filter */}
          {isBetaView && (
            <OverviewClusterLabelSelector
              selectedClusterLabels={selectedClusterLabels}
              setSelectedClusterLabels={setSelectedClusterLabels}
            />
          )}
        </div>
      }
    >
      {isBetaView ? <OverviewPageBeta selectedClusterLabels={selectedClusterLabels} /> : <OverviewPage />}
    </AcmPage>
  )
}
