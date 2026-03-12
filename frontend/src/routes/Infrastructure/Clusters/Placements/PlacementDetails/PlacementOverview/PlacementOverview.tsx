/* Copyright Contributors to the Open Cluster Management project */

import { PageSection } from '@patternfly/react-core'
import { AcmDescriptionList, AcmPageContent } from '../../../../../../ui-components'
import { useTranslation } from '../../../../../../lib/acm-i18next'
import { usePlacementDetailsContext } from '../PlacementDetails'

export default function PlacementOverviewPageContent() {
  const { t } = useTranslation()
  const { placement } = usePlacementDetailsContext()

  const leftItems = [
    { key: t('Name'), value: placement.metadata.name },
    { key: t('Namespace'), value: placement.metadata.namespace },
    { key: t('Cluster sets'), value: placement.spec.clusterSets?.join(', ') },
  ]

  const rightItems = [{ key: t('Selected clusters'), value: placement.status?.numberOfSelectedClusters }]

  return (
    <AcmPageContent id="overview">
      <PageSection hasBodyWrapper={false}>
        <AcmDescriptionList
          title={t('Details')}
          leftItems={leftItems}
          rightItems={rightItems}
          id="placement-overview"
        />
      </PageSection>
    </AcmPageContent>
  )
}
