/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react'
import { AcmScrollable } from '../../../ui-components'
import OverviewPageBeta from './OverviewPageBeta'
import OverviewPage from './OverviewPage'
import { Card, CardBody, Flex, FlexItem, PageSection, Switch } from '@patternfly/react-core'
import OverviewClusterLabelSelector from './OverviewClusterLabelSelector'
import { useTranslation } from '../../../lib/acm-i18next'

const ClustersTab = () => {
  const { t } = useTranslation()
  const [selectedClusterLabels, setSelectedClusterLabels] = React.useState<Record<string, string[]>>({})
  const [isBetaView, setIsBetaView] = React.useState<boolean>(localStorage.getItem('overview-isBeta') === 'true')

  return (
    <AcmScrollable>
      <PageSection>
        <Card>
          <CardBody>
            <Flex alignItems={{ default: 'alignItemsBaseline' }} spacer={{ default: 'spacerMd' }}>
              <FlexItem>
                <Switch
                  label={t('Fleet view')}
                  isChecked={isBetaView}
                  onChange={() => {
                    setIsBetaView(!isBetaView)
                    localStorage.setItem('overview-isBeta', `${!isBetaView}`) // keep selection
                  }}
                />
              </FlexItem>
              {isBetaView && (
                <FlexItem>
                  <OverviewClusterLabelSelector
                    selectedClusterLabels={selectedClusterLabels}
                    setSelectedClusterLabels={setSelectedClusterLabels}
                  />
                </FlexItem>
              )}
            </Flex>
          </CardBody>
        </Card>
      </PageSection>
      {isBetaView ? <OverviewPageBeta selectedClusterLabels={selectedClusterLabels} /> : <OverviewPage />}
    </AcmScrollable>
  )
}

export default ClustersTab
