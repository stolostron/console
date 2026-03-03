/* Copyright Contributors to the Open Cluster Management project */

import { ClusterCurator, ClusterCuratorDefinition } from '../../../../../resources'
import { HostedClusterK8sResourceWithChannel } from '../../../../../resources/hosted-cluster'
import {
  Cluster,
  createResource,
  IRequestResult,
  patchResource,
  ResourceError,
  ResourceErrorCode,
} from '../../../../../resources/utils'
import { AcmAlert, AcmEmptyState, AcmSelect } from '../../../../../ui-components'
import { AlertVariant, Content, ContentVariants, SelectOption } from '@patternfly/react-core'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { BulkActionModal } from '../../../../../components/BulkActionModal'
import './style.css'
import { ClusterAction, clusterSupportsAction } from '../utils/cluster-actions'
import { getVersionFromReleaseImage } from '../utils/utils'

/**
 * Look up the HostedCluster resource for a given cluster from the hostedClusters map.
 * Matching is done by cluster name.
 */
const getHostedClusterForCluster = (
  cluster: Cluster,
  hostedClusters?: Record<string, HostedClusterK8sResourceWithChannel>
): HostedClusterK8sResourceWithChannel | undefined => {
  return cluster.name ? hostedClusters?.[cluster.name] : undefined
}

/**
 * Check if a hosted cluster has a channel set.
 */
const hostedClusterHasChannel = (hostedCluster?: HostedClusterK8sResourceWithChannel): boolean => {
  return !!(hostedCluster?.spec as { channel?: string } | undefined)?.channel
}

const isChannelSelectable = (c: Cluster, hostedClusters?: Record<string, HostedClusterK8sResourceWithChannel>) => {
  const hostedCluster = getHostedClusterForCluster(c, hostedClusters)
  // For hosted clusters without a channel set, allow channel selection
  if (hostedCluster && !hostedClusterHasChannel(hostedCluster)) {
    return true
  }
  return clusterSupportsAction(c, ClusterAction.SelectChannel)
}

/**
 * Compute fallback channel from cluster version when MCI channels not available.
 * Only returns fast-X.Y channel for hosted clusters without channel set.
 * Falls back to parsing version from hostedCluster.spec.release.image if distribution not available.
 */
const getFallbackChannels = (cluster: Cluster, hostedCluster?: HostedClusterK8sResourceWithChannel): string[] => {
  // Try distribution version first
  let version = cluster.distribution?.ocp?.version

  // If no distribution version, try to get from hostedCluster release image
  if (!version && hostedCluster?.spec?.release?.image) {
    version = getVersionFromReleaseImage(hostedCluster.spec.release.image)
  }

  if (!version) return []

  const lastDotIndex = version.lastIndexOf('.')
  if (lastDotIndex > 0) {
    const majorMinor = version.substring(0, lastDotIndex)
    return [`fast-${majorMinor}`]
  }
  return []
}

const setCurrentChannel = (
  clusters: Array<Cluster> | undefined,
  currentMappings: Record<string, string>,
  hostedClusters?: Record<string, HostedClusterK8sResourceWithChannel>
): Record<string, string> => {
  const res = {} as Record<string, string>
  clusters?.forEach((cluster: Cluster) => {
    if (cluster.name) {
      const clusterName = cluster.name
      const currentChannel = cluster.distribution?.upgradeInfo?.currentChannel || ''
      let availableChannels = cluster.distribution?.upgradeInfo?.availableChannels || []

      // For hosted clusters without channels, use fallback
      const hostedCluster = getHostedClusterForCluster(cluster, hostedClusters)
      if (hostedCluster && !hostedClusterHasChannel(hostedCluster) && availableChannels.length === 0) {
        availableChannels = getFallbackChannels(cluster, hostedCluster)
      }

      let defaultChannel = availableChannels.length > 0 ? availableChannels[0] : ''
      if (availableChannels.filter((c) => !!c && c === currentChannel).length > 0) {
        defaultChannel = currentChannel
      }

      const found = availableChannels.find(
        (channel) => currentMappings[clusterName] && channel === currentMappings[clusterName]
      )

      res[clusterName] = found ? found : defaultChannel
    }
  })
  return res
}

export function BatchChannelSelectModal(props: {
  close: () => void
  open: boolean
  clusters: Cluster[] | undefined
  hostedClusters?: Record<string, HostedClusterK8sResourceWithChannel>
  onSuccess?: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const [selectChannels, setSelectChannels] = useState<Record<string, string>>({})
  const [channelSelectableClusters, setChannelSelectableClusters] = useState<Array<Cluster>>([])

  useEffect(() => {
    // set up latest if not selected
    const newChannelSelectableClusters =
      props.clusters && props.clusters.filter((c) => isChannelSelectable(c, props.hostedClusters))
    setSelectChannels((s) => setCurrentChannel(newChannelSelectableClusters, s, props.hostedClusters))
    setChannelSelectableClusters(newChannelSelectableClusters || [])
  }, [props.clusters, props.open, props.hostedClusters])

  // Check if any cluster has no current channel configured
  const hasClustersWithoutChannel = useMemo(() => {
    return channelSelectableClusters.some((cluster) => !cluster.distribution?.upgradeInfo?.currentChannel)
  }, [channelSelectableClusters])

  return (
    <BulkActionModal<Cluster>
      open={props.open}
      title={t('bulk.title.selectChannel')}
      action={t('update.selectChannel.submit')}
      processing={t('update.selectChannel.submit.processing')}
      items={channelSelectableClusters}
      emptyState={
        <AcmEmptyState
          title={t('No clusters available')}
          message={t('The channel cannot be changed for any of the selected clusters.')}
        />
      }
      close={() => {
        setSelectChannels({})
        props.onSuccess?.()
        props.close()
      }}
      onCancel={() => {
        setSelectChannels({})
        props.close()
      }}
      description={t('bulk.message.selectChannel')}
      alert={
        hasClustersWithoutChannel ? (
          <div style={{ paddingTop: '16px' }}>
            <AcmAlert
              isInline
              noClose
              variant={AlertVariant.warning}
              title={t('update.selectChannel.alert.noChannel')}
            />
          </div>
        ) : undefined
      }
      columns={[
        {
          header: t('update.table.name'),
          sort: 'displayName',
          cell: (cluster) => (
            <>
              <span style={{ whiteSpace: 'nowrap' }}>{cluster.displayName}</span>
              {cluster.hive.clusterClaimName && (
                <Content>
                  <Content component={ContentVariants.small}>{cluster.hive.clusterClaimName}</Content>
                </Content>
              )}
            </>
          ),
        },
        {
          header: t('update.table.currentchannel'),
          cell: (item: Cluster) => {
            const currentChannel = item?.distribution?.upgradeInfo?.currentChannel
            return <span>{currentChannel || '-'}</span>
          },
        },
        {
          header: t('update.table.newchannel'),
          cell: (cluster: Cluster) => {
            let availableChannels = cluster.distribution?.upgradeInfo?.availableChannels || []
            const isReadySelectChannels = cluster.distribution?.upgradeInfo?.isReadySelectChannels

            // For hosted clusters without channels, use fallback
            const hostedCluster = getHostedClusterForCluster(cluster, props.hostedClusters)
            const isHostedClusterWithoutChannel = hostedCluster && !hostedClusterHasChannel(hostedCluster)
            if (isHostedClusterWithoutChannel && availableChannels.length === 0) {
              availableChannels = getFallbackChannels(cluster, hostedCluster)
            }

            // Show channel selector for: standard clusters with isReadySelectChannels OR hosted clusters without channel
            const showChannelSelector = isReadySelectChannels || isHostedClusterWithoutChannel

            return (
              <div>
                {showChannelSelector && availableChannels.length > 0 && (
                  <>
                    <AcmSelect
                      value={selectChannels[cluster.name || ''] || ''}
                      id={`${cluster.name}-upgrade-selector`}
                      maxHeight={'6em'}
                      label=""
                      isRequired
                      onChange={(channel) => {
                        if (cluster.name && channel) {
                          selectChannels[cluster.name] = channel
                          setSelectChannels({ ...selectChannels })
                        }
                      }}
                    >
                      {availableChannels?.map((channel) => (
                        <SelectOption key={`${cluster.name}-${channel}`} value={channel}>
                          {channel}
                        </SelectOption>
                      ))}
                    </AcmSelect>
                  </>
                )}
              </div>
            )
          },
        },
      ]}
      keyFn={(cluster) => cluster.name as string}
      actionFn={(cluster) => {
        if (
          !cluster.name ||
          !selectChannels[cluster.name] ||
          selectChannels[cluster.name] === cluster.distribution?.upgradeInfo?.currentChannel
        ) {
          const emptyRes: IRequestResult<string> = {
            promise: new Promise((resolve) => resolve('')),
            abort: () => {},
          }
          return emptyRes
        }

        // Use ClusterCurator for all clusters (both standalone and hosted)
        const patchSpec = {
          spec: {
            desiredCuration: 'upgrade',
            upgrade: {
              channel: selectChannels[cluster.name],
              // set desiredUpdate to empty to make sure we only set channel
              desiredUpdate: '',
            },
          },
        }
        const clusterCurator = {
          apiVersion: ClusterCuratorDefinition.apiVersion,
          kind: ClusterCuratorDefinition.kind,
          metadata: {
            name: cluster.name,
            namespace: cluster.namespace,
          },
        } as ClusterCurator

        const patchCuratorResult = patchResource(clusterCurator, patchSpec)
        let createCuratorResult: IRequestResult<ClusterCurator> | undefined = undefined
        return {
          promise: new Promise((resolve, reject) => {
            patchCuratorResult.promise
              .then((data) => {
                return resolve(data)
              })
              .catch((err: ResourceError) => {
                if (err.code === ResourceErrorCode.NotFound) {
                  // TODO: remove this creation logic when we can make sure clustercurator always exists
                  createCuratorResult = createResource({ ...clusterCurator, ...patchSpec })
                  createCuratorResult.promise.then((data) => resolve(data)).catch((err) => reject(err))
                } else {
                  reject(err)
                }
              })
          }),
          abort: () => {
            patchCuratorResult.abort()
            if (createCuratorResult) {
              createCuratorResult.abort()
            }
          },
        }
      }}
    />
  )
}
