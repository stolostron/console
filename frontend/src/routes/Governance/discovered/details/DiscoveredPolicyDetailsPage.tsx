/* Copyright Contributors to the Open Cluster Management project */

import { Fragment, Suspense, useMemo } from 'react'
import {
  Link,
  useLocation,
  useParams,
  generatePath,
  Outlet,
  useNavigate,
  useOutletContext,
} from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { AcmButton, AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '../../../../ui-components'
import Grid from '@mui/material/Grid'
import { getEngineWithSvg } from '../../common/util'
import { Box } from '@mui/material'
import { DiscoveredPolicyTableItem, useFetchPolicies } from '../useFetchPolicies'
import { ApolloError } from '@apollo/client'
import { ErrorPage } from '../../../../components/ErrorPage'

export type DiscoveredDetailsContext = {
  isFetching: boolean
  policyItems: DiscoveredPolicyTableItem[] | undefined
  relatedResources: any[] | undefined
  err: ApolloError | undefined
  policyKind: string
  apiGroup: string
}

export function DiscoveredPolicyDetailsPage() {
  const location = useLocation()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = useParams()
  const policyKind = params.kind ?? ''
  const policyName = params.policyName ?? ''
  const apiGroup = params.apiGroup ?? ''
  const apiVersion = params.apiVersion ?? ''

  const isResourcesTab = location.pathname.endsWith('/resources')

  const byClusterUrl = generatePath(NavigationPath.discoveredByCluster, {
    apiGroup: apiGroup,
    apiVersion: apiVersion,
    kind: policyKind,
    policyName: policyName,
  })
  const resourcesUrl = generatePath(NavigationPath.discoveredResources, {
    apiGroup: apiGroup,
    apiVersion: apiVersion,
    kind: policyKind,
    policyName: policyName,
  })

  const { isFetching, policyItems, relatedResources, err } = useFetchPolicies(policyName, policyKind, apiGroup)

  const disoveredDetailsContext = useMemo<DiscoveredDetailsContext>(
    () => ({
      isFetching: isFetching,
      policyItems: policyItems,
      relatedResources: relatedResources,
      err: err,
      policyKind: policyKind,
      apiGroup: apiGroup,
    }),
    [isFetching, policyItems, relatedResources, err, policyKind, apiGroup]
  )

  if (err && !isFetching) {
    return (
      <ErrorPage
        error={err}
        actions={
          <AcmButton role="link" onClick={() => navigate(NavigationPath.discoveredPolicies)}>
            {t('Back to discovered policies')}
          </AcmButton>
        }
      />
    )
  }

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
                  {getEngineWithSvg(apiGroup)}{' '}
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
          navigation={
            <AcmSecondaryNav>
              <AcmSecondaryNavItem isActive={isResourcesTab}>
                <Link to={resourcesUrl}>{t('Related resources')}</Link>
              </AcmSecondaryNavItem>
              <AcmSecondaryNavItem isActive={!isResourcesTab}>
                <Link to={byClusterUrl}>{t('Clusters')}</Link>
              </AcmSecondaryNavItem>
            </AcmSecondaryNav>
          }
        />
      }
    >
      <Suspense fallback={<Fragment />}>
        <Outlet context={disoveredDetailsContext} />
      </Suspense>
    </AcmPage>
  )
}

export function useDiscoveredDetailsContext() {
  return useOutletContext<DiscoveredDetailsContext>()
}
