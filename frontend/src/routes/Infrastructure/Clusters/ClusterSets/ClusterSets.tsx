/* Copyright Contributors to the Open Cluster Management project */

import { Content, ContentVariants, Flex, FlexItem, PageSection, Stack } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { useContext, useEffect } from 'react'
import { ClusterSetsTable } from '../../../../components/ClusterSets/ClusterSetsTable'
import { useTranslation } from '../../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../../lib/doc-util'
import { PluginContext } from '../../../../lib/PluginContext'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import {
  AcmAlertContext,
  AcmButton,
  AcmExpandableCard,
  AcmPageContent,
  AcmTableStateProvider,
} from '../../../../ui-components'

export default function ClusterSetsPage() {
  const { t } = useTranslation()
  const { isSubmarinerAvailable } = useContext(PluginContext)
  const alertContext = useContext(AcmAlertContext)
  const { managedClusterSetsState } = useSharedAtoms()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => alertContext.clearAlerts, [])

  const managedClusterSets = useRecoilValue(managedClusterSetsState)

  return (
    <AcmPageContent id="clusters">
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter style={{ height: 'unset' }}>
          <AcmExpandableCard title={t('learn.terminology')} id="cluster-sets-learn">
            <Flex style={{ flexWrap: 'inherit' }}>
              <Flex style={{ maxWidth: '50%' }}>
                <FlexItem>
                  <Content>
                    <Content component={ContentVariants.h4}>{t('clusterSets')}</Content>
                    <Content component={ContentVariants.p}>{t('learn.clusterSets')}</Content>
                  </Content>
                </FlexItem>
                <FlexItem align={{ default: 'alignRight' }}>
                  <AcmButton
                    onClick={() => window.open(DOC_LINKS.CLUSTER_SETS, '_blank')}
                    variant="link"
                    role="link"
                    icon={<ExternalLinkAltIcon />}
                    iconPosition="right"
                  >
                    {t('view.documentation')}
                  </AcmButton>
                </FlexItem>
              </Flex>
              {isSubmarinerAvailable && (
                <Flex>
                  <FlexItem>
                    <Content>
                      <Content component={ContentVariants.h4}>{t('submariner')}</Content>
                      <Content component={ContentVariants.p}>{t('learn.submariner')}</Content>
                    </Content>
                  </FlexItem>
                  <FlexItem align={{ default: 'alignRight' }}>
                    <AcmButton
                      onClick={() => window.open(DOC_LINKS.SUBMARINER, '_blank')}
                      variant="link"
                      role="link"
                      icon={<ExternalLinkAltIcon />}
                      iconPosition="right"
                    >
                      {t('view.documentation')}
                    </AcmButton>
                  </FlexItem>
                </Flex>
              )}
            </Flex>
          </AcmExpandableCard>
          <Stack>
            <AcmTableStateProvider localStorageKey={'cluster-sets-table-state'}>
              <ClusterSetsTable managedClusterSets={managedClusterSets} />
            </AcmTableStateProvider>
          </Stack>
        </Stack>
      </PageSection>
    </AcmPageContent>
  )
}
