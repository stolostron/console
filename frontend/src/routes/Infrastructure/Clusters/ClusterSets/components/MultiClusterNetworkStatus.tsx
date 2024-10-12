/* Copyright Contributors to the Open Cluster Management project */

import { ManagedClusterAddOn, ManagedClusterSet } from '../../../../../resources'
import { AcmButton, AcmInlineStatus, StatusType } from '../../../../../ui-components'
import { Popover } from '@patternfly/react-core'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { Link, generatePath } from 'react-router-dom-v5-compat'
import { useRecoilValue, useSharedAtoms } from '../../../../../shared-recoil'
import { NavigationPath } from '../../../../../NavigationPath'
import { submarinerHealthCheck, SubmarinerStatus } from '../ClusterSetDetails/ClusterSetSubmariner/ClusterSetSubmariner'
import { useClusters } from './useClusters'
import { useMemo } from 'react'

export function MultiClusterNetworkStatus(props: { clusterSet: ManagedClusterSet }) {
  const { t } = useTranslation()
  const { clusterSet } = props
  const { managedClusterAddonsState } = useSharedAtoms()
  const managedClusterAddons = useRecoilValue(managedClusterAddonsState)

  const clusters = useClusters({ managedClusterSet: clusterSet })
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

  let type: StatusType = StatusType.pending
  let status = ''
  let message = ''
  let path = generatePath(NavigationPath.clusterSetSubmariner, { id: clusterSet!.metadata.name! })
  let linkText = t('view.submariner')

  if (clusters.length < 2 || submarinerAddons.length < 2) {
    if (clusters.length < 2) {
      status = t('status.submariner.network.insufficientClusters')
      message = t('status.submariner.network.insufficientClusters.message')
      path = generatePath(NavigationPath.clusterSetManage, { id: clusterSet!.metadata.name! })
      linkText = t('page.header.cluster-set.manage-assignments')
    } else {
      status = t('status.submariner.network.insufficientSubmariners')
      message = t('status.submariner.network.insufficientSubmariners.message')
      path = generatePath(NavigationPath.clusterSetSubmariner, { id: clusterSet!.metadata.name! })
      linkText = t('summary.submariner.launch')
    }

    return (
      <Popover bodyContent={message} footerContent={<Link to={path}>{linkText}</Link>}>
        <AcmButton variant="link" style={{ fontSize: 'inherit', padding: 0 }}>
          {status}
        </AcmButton>
      </Popover>
    )
  } else {
    const unhealthySubmariners = submarinerAddons!.filter(
      (mca) => submarinerHealthCheck(mca) === SubmarinerStatus.degraded
    )
    if (unhealthySubmariners.length > 0) {
      type = StatusType.danger
      status = t('status.submariner.network.degraded')
      message = t('status.submariner.network.degraded.message')
    } else {
      const hasProgressingSubmariners = submarinerAddons!.filter(
        (mca) => submarinerHealthCheck(mca) === SubmarinerStatus.progressing
      )
      if (hasProgressingSubmariners.length > 0) {
        type = StatusType.progress
        status = t('status.submariner.network.progressing')
        message = t('status.submariner.network.progressing.message')
      } else {
        // healthy
        type = StatusType.healthy
        status = t('status.submariner.network.healthy')
        message = t('status.submariner.network.healthy.message')
      }
    }

    return (
      <AcmInlineStatus
        type={type}
        status={status}
        popover={{ bodyContent: message, footerContent: <Link to={path}>{linkText}</Link> }}
      />
    )
  }
}
