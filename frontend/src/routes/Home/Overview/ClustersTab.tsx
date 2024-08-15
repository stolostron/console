/* Copyright Contributors to the Open Cluster Management project */
import { Alert, PageSection } from '@patternfly/react-core'
import { useTranslation } from '../../../lib/acm-i18next'
import { AcmScrollable } from '../../../ui-components'
import OverviewPage from './OverviewPage'
import OverviewPageBeta from './OverviewPageBeta'

function ClustersTab(props: { isBetaView: boolean; selectedClusterLabels: Record<string, string[]> }) {
  const { isBetaView, selectedClusterLabels } = props
  const { t } = useTranslation()

  return (
    <AcmScrollable>
      {!isBetaView ? (
        <PageSection>
          <Alert variant="warning" title={t('Feature deprecation')} isInline>
            {t(
              'The layout of this Overview page is deprecated. Enable the Fleet view switch to view the new default overview page.'
            )}
          </Alert>
        </PageSection>
      ) : undefined}
      {isBetaView ? <OverviewPageBeta selectedClusterLabels={selectedClusterLabels} /> : <OverviewPage />}
    </AcmScrollable>
  )
}

export default ClustersTab
