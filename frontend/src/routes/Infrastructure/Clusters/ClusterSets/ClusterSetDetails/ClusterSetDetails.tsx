/* Copyright Contributors to the Open Cluster Management project */

import { Page } from '@patternfly/react-core'
import { AcmButton, AcmPageProcess } from '../../../../../ui-components'
import { Fragment, Suspense, useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Outlet, useOutletContext } from 'react-router-dom-v5-compat'
import { useRecoilValue, useSharedAtoms } from '../../../../../shared-recoil'
import { ErrorPage } from '../../../../../components/ErrorPage'
import { usePrevious } from '../../../../../components/usePrevious'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../../NavigationPath'
import {
  Cluster,
  ClusterDeployment,
  ClusterPool,
  ClusterRoleBinding,
  listClusterRoleBindings,
  ManagedClusterAddOn,
  ManagedClusterSet,
  ManagedClusterSetBinding,
  managedClusterSetLabel,
  ResourceError,
  ResourceErrorCode,
} from '../../../../../resources'
import { useClusterSetBindings } from '../components/ManagedClusterSetBindingModal'
import { useClusters } from '../components/useClusters'
import { useQuery } from '../../../../../lib/useQuery'

export type ClusterSetDetailsContext = {
  readonly clusterSet?: ManagedClusterSet
  readonly clusters: Cluster[]
  readonly clusterPools: ClusterPool[]
  readonly submarinerAddons: ManagedClusterAddOn[]
  readonly clusterSetBindings: ManagedClusterSetBinding[]
  readonly clusterDeployments: ClusterDeployment[]
  readonly clusterRoleBindings: ClusterRoleBinding[]
}

export default function ClusterSetDetails() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const match = { params: { id } }
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

  // instead of searching through clusters for each ManagedClusterAddon (12*3800)
  // loop through clusters once and use a managedClusterAddons map to get the addons for each cluster
  const submarinerAddons = useMemo(() => {
    let submarinerAddons: ManagedClusterAddOn[] = []
    clusters.forEach((cluster) => {
      const addons = managedClusterAddons?.[cluster.namespace ?? ''] || []
      submarinerAddons = [...submarinerAddons, ...addons.filter((mca) => mca.metadata.name === 'submariner')]
    })
    return submarinerAddons
  }, [clusters, managedClusterAddons])

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

  const clusterSetDetailsContext = useMemo<ClusterSetDetailsContext>(
    () => ({
      clusterSet,
      clusters,
      clusterPools: clusterSetClusterPools,
      submarinerAddons,
      clusterSetBindings,
      clusterDeployments,
      clusterRoleBindings: clusterRoleBindingsCache,
    }),
    [
      clusterDeployments,
      clusterRoleBindingsCache,
      clusterSet,
      clusterSetBindings,
      clusterSetClusterPools,
      clusters,
      submarinerAddons,
    ]
  )

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
    <Suspense fallback={<Fragment />}>
      <Outlet context={clusterSetDetailsContext} />
    </Suspense>
  )
}

export function useClusterSetDetailsContext() {
  return useOutletContext<Required<ClusterSetDetailsContext>>()
}
