/* Copyright Contributors to the Open Cluster Management project */

import { Page } from '@patternfly/react-core'
import {
  AcmButton,
  AcmPage,
  AcmPageHeader,
  AcmPageProcess,
  AcmSecondaryNav,
  AcmSecondaryNavItem,
} from '../../../../../ui-components'
import { createContext, Fragment, Suspense, useContext, useEffect, useState } from 'react'
import { Link, Routes, Route, useLocation, useParams, Navigate, useNavigate } from 'react-router-dom-v5-compat'
import { useRecoilValue, useSharedAtoms } from '../../../../../shared-recoil'
import { ErrorPage } from '../../../../../components/ErrorPage'
import { usePrevious } from '../../../../../components/usePrevious'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import { PluginContext } from '../../../../../lib/PluginContext'
import { NavigationPath } from '../../../../../NavigationPath'
import {
  Cluster,
  ClusterDeployment,
  ClusterPool,
  ClusterRoleBinding,
  isGlobalClusterSet,
  listClusterRoleBindings,
  ManagedClusterAddOn,
  ManagedClusterSet,
  ManagedClusterSetBinding,
  managedClusterSetLabel,
  ResourceError,
  ResourceErrorCode,
} from '../../../../../resources'
import { ClusterSetActionDropdown } from '../components/ClusterSetActionDropdown'
import { useClusterSetBindings } from '../components/ManagedClusterSetBindingModal'
import { useClusters } from '../components/useClusters'
import { ClusterSetAccessManagement } from './ClusterSetAccessManagement/ClusterSetAccessManagement'
import { ClusterSetClusterPoolsPageContent } from './ClusterSetClusterPools/ClusterSetClusterPools'
import { ClusterSetClustersPageContent } from './ClusterSetClusters/ClusterSetClusters'
import { InstallSubmarinerFormPage } from './ClusterSetInstallSubmariner/InstallSubmarinerForm'
import { ClusterSetManageResourcesPage } from './ClusterSetManageResources/ClusterSetManageResources'
import { ClusterSetOverviewPageContent } from './ClusterSetOverview/ClusterSetOverview'
import { ClusterSetSubmarinerPageContent } from './ClusterSetSubmariner/ClusterSetSubmariner'
import { useQuery } from '../../../../../lib/useQuery'

export const ClusterSetContext = createContext<{
  readonly clusterSet: ManagedClusterSet | undefined
  readonly clusters: Cluster[] | undefined
  readonly clusterPools: ClusterPool[] | undefined
  readonly submarinerAddons: ManagedClusterAddOn[] | undefined
  readonly clusterSetBindings: ManagedClusterSetBinding[] | undefined
  readonly clusterDeployments: ClusterDeployment[] | undefined
  readonly clusterRoleBindings: ClusterRoleBinding[] | undefined
}>({
  clusterSet: undefined,
  clusters: undefined,
  clusterPools: undefined,
  submarinerAddons: undefined,
  clusterSetBindings: undefined,
  clusterDeployments: undefined,
  clusterRoleBindings: undefined,
})

export default function ClusterSetDetailsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const match = { params: { id } }
  const { isSubmarinerAvailable } = useContext(PluginContext)
  const { clusterDeploymentsState, clusterPoolsState, managedClusterAddonsState, managedClusterSetsState } =
    useSharedAtoms()

  const managedClusterSets = useRecoilValue(managedClusterSetsState)
  const managedClusterAddons = useRecoilValue(managedClusterAddonsState)

  const clusterDeployments = useRecoilValue(clusterDeploymentsState)

  const clusterSet = managedClusterSets.find((mcs) => mcs.metadata.name === match.params.id)
  const prevClusterSet = usePrevious(clusterSet)

  const clusters = useClusters(clusterSet)
  const clusterPools = useRecoilValue(clusterPoolsState)
  const clusterSetClusterPools = clusterPools.filter(
    (cp) => cp.metadata.labels?.[managedClusterSetLabel] === clusterSet?.metadata.name
  )

  const submarinerAddons = managedClusterAddons.filter(
    (mca) => mca.metadata.name === 'submariner' && clusters?.find((c) => c.namespace === mca.metadata.namespace)
  )

  const clusterSetBindings = useClusterSetBindings(clusterSet)
  const [clusterRoleBindingsCache, setClusterRoleBindingsCache] = useState<ClusterRoleBinding[]>([])
  const { data, startPolling } = useQuery(listClusterRoleBindings)
  useEffect(startPolling, [startPolling])

  const updateRoleBindings = () => {
    if (data && clusterSet?.metadata.name) {
      setClusterRoleBindingsCache(
        data.filter((item) => {
          const role = item.roleRef.name
          return (
            role.startsWith('open-cluster-management:managedclusterset:') &&
            role.endsWith(`:${clusterSet.metadata.name}`)
          )
        })
      )
    }
  }
  useEffect(updateRoleBindings, [data, clusterSet])

  if (prevClusterSet?.metadata?.deletionTimestamp) {
    return (
      <AcmPageProcess
        isLoading={clusterSet !== undefined}
        loadingTitle={t('deleting.managedClusterSet.inprogress', {
          managedClusterSetName: prevClusterSet!.metadata.name,
        })}
        loadingMessage={
          <Trans
            i18nKey="deleting.managedClusterSet.inprogress.message"
            components={{ bold: <strong /> }}
            values={{ managedClusterSetName: prevClusterSet!.metadata.name }}
          />
        }
        successTitle={t('deleting.managedClusterSet.success', {
          managedClusterSetName: prevClusterSet!.metadata.name,
        })}
        successMessage={
          <Trans
            i18nKey="deleting.managedClusterSet.success.message"
            components={{ bold: <strong /> }}
            values={{ managedClusterSetName: prevClusterSet!.metadata.name }}
          />
        }
        loadingPrimaryAction={
          <AcmButton role="link" onClick={() => navigate(NavigationPath.clusterSets)}>
            {t('button.backToClusterSets')}
          </AcmButton>
        }
        primaryAction={
          <AcmButton role="link" onClick={() => navigate(NavigationPath.clusterSets)}>
            {t('button.backToClusterSets')}
          </AcmButton>
        }
      />
    )
  }

  if (clusterSet === undefined) {
    return (
      <Page>
        <ErrorPage
          error={new ResourceError(ResourceErrorCode.NotFound)}
          actions={
            <AcmButton role="link" onClick={() => navigate(NavigationPath.clusterSets)}>
              {t('button.backToClusterSets')}
            </AcmButton>
          }
        />
      </Page>
    )
  }

  return (
    <ClusterSetContext.Provider
      value={{
        clusterSet,
        clusters,
        clusterPools: clusterSetClusterPools,
        submarinerAddons,
        clusterSetBindings,
        clusterDeployments,
        clusterRoleBindings: clusterRoleBindingsCache,
      }}
    >
      <Suspense fallback={<Fragment />}>
        <AcmPage
          hasDrawer
          header={
            <AcmPageHeader
              breadcrumb={[
                { text: t('clusterSets'), to: NavigationPath.clusterSets },
                { text: match.params.id, to: '' },
              ]}
              title={match.params.id}
              actions={<ClusterSetActionDropdown managedClusterSet={clusterSet} isKebab={false} />}
              navigation={
                <AcmSecondaryNav>
                  <AcmSecondaryNavItem
                    isActive={location.pathname === NavigationPath.clusterSetOverview.replace(':id', match.params.id)}
                  >
                    <Link to={NavigationPath.clusterSetOverview.replace(':id', match.params.id)}>
                      {t('tab.overview')}
                    </Link>
                  </AcmSecondaryNavItem>
                  {isSubmarinerAvailable && !isGlobalClusterSet(clusterSet) && (
                    <AcmSecondaryNavItem
                      isActive={
                        location.pathname === NavigationPath.clusterSetSubmariner.replace(':id', match.params.id)
                      }
                    >
                      <Link to={NavigationPath.clusterSetSubmariner.replace(':id', match.params.id)}>
                        {t('tab.submariner')}
                      </Link>
                    </AcmSecondaryNavItem>
                  )}
                  {!isGlobalClusterSet(clusterSet) && (
                    <AcmSecondaryNavItem
                      isActive={location.pathname === NavigationPath.clusterSetClusters.replace(':id', match.params.id)}
                    >
                      <Link to={NavigationPath.clusterSetClusters.replace(':id', match.params.id)}>
                        {t('tab.clusters')}
                      </Link>
                    </AcmSecondaryNavItem>
                  )}
                  {!isGlobalClusterSet(clusterSet) && (
                    <AcmSecondaryNavItem
                      isActive={
                        location.pathname === NavigationPath.clusterSetClusterPools.replace(':id', match.params.id)
                      }
                    >
                      <Link to={NavigationPath.clusterSetClusterPools.replace(':id', match.params.id)}>
                        {t('tab.clusterPools')}
                      </Link>
                    </AcmSecondaryNavItem>
                  )}
                  <AcmSecondaryNavItem
                    isActive={location.pathname === NavigationPath.clusterSetAccess.replace(':id', match.params.id)}
                  >
                    <Link to={NavigationPath.clusterSetAccess.replace(':id', match.params.id)}>
                      {t('tab.userManagement')}
                    </Link>
                  </AcmSecondaryNavItem>
                </AcmSecondaryNav>
              }
            />
          }
        >
          <Routes>
            <Route path="/overview" element={<ClusterSetOverviewPageContent />} />
            {!isGlobalClusterSet(clusterSet) && isSubmarinerAvailable && (
              <Route path="/submariner" element={<ClusterSetSubmarinerPageContent />} />
            )}
            {!isGlobalClusterSet(clusterSet) && <Route path="/clusters" element={<ClusterSetClustersPageContent />} />}
            {!isGlobalClusterSet(clusterSet) && (
              <Route path="/cluster-pools" element={<ClusterSetClusterPoolsPageContent />} />
            )}
            <Route path="/access" element={<ClusterSetAccessManagement />} />
            <Route
              path="*"
              element={<Navigate to={NavigationPath.clusterSetOverview.replace(':id', match.params.id)} replace />}
            />
            {!isGlobalClusterSet(clusterSet) && (
              <Route path="/manage-resources" element={<ClusterSetManageResourcesPage />} />
            )}
            {!isGlobalClusterSet(clusterSet) && isSubmarinerAvailable && (
              <Route path="/install-submariner" element={<InstallSubmarinerFormPage />} />
            )}
          </Routes>
        </AcmPage>
      </Suspense>
    </ClusterSetContext.Provider>
  )
}
