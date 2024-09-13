/* Copyright Contributors to the Open Cluster Management project */
import { useParams } from 'react-router-dom-v5-compat'
import { AcmAlert, AcmPage, AcmPageHeader } from '../../../../ui-components'
import { NavigationPath } from '../../../../NavigationPath'
import { useMemo } from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'
import Grid from '@mui/material/Grid'
import { getEngineWithSvg } from '../../common/util'
import { Box } from '@mui/material'
import { useFetchPolicies } from '../useFetchPolicies'
import { EmptyState, EmptyStateIcon, PageSection, Spinner, Title } from '@patternfly/react-core'
import DiscoveredByCluster from './DiscoveredByCluster'

export default function DiscoveredByClusterPage() {
  const params = useParams()
  const policyKind = params.kind ?? ''
  const policyName = params.policyName ?? ''
  const apiGroup = params.apiGroup ?? ''
  const { t } = useTranslation()
  const { isFetching, data, err } = useFetchPolicies(policyName, policyKind, apiGroup)

  const pageContent = useMemo(() => {
    if (isFetching && !data) {
      return (
        <PageSection>
          <EmptyState>
            <EmptyStateIcon variant="container" component={Spinner} />
            <Title size="lg" headingLevel="h4">
              Loading
            </Title>
          </EmptyState>
        </PageSection>
      )
    }

    if (err && !isFetching) {
      return (
        <PageSection>
          <AcmAlert
            data-testid={'fetching-discovered-policies-error'}
            noClose={true}
            variant={'danger'}
            title={<>{err.message}</>}
          />
        </PageSection>
      )
    }

    return <DiscoveredByCluster policies={data?.[0]?.policies || []} {...{ policyKind }} />
  }, [policyKind, isFetching, data, err])

  return (
    <AcmPage
      hasDrawer
      header={
        <AcmPageHeader
          title={
            <Grid container spacing={2} alignItems={'center'}>
              <Grid item>{policyName}</Grid>
              <Grid item>
                <Box fontWeight={300} fontSize={14}>
                  {getEngineWithSvg(policyKind)}{' '}
                </Box>
              </Grid>
            </Grid>
          }
          breadcrumb={[
            { text: t('Discovered policies'), to: `${NavigationPath.discoveredPolicies}` },
            { text: policyName, to: '' },
          ]}
          popoverAutoWidth={false}
          popoverPosition="bottom"
        />
      }
    >
      {pageContent}
    </AcmPage>
  )
}
