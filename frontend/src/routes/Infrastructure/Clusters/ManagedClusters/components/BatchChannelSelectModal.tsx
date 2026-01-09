/* Copyright Contributors to the Open Cluster Management project */

import { HostedClusterK8sResource } from '@openshift-assisted/ui-lib/cim'
import {
  ClusterCurator,
  ClusterCuratorDefinition,
  HostedClusterApiVersion,
  HostedClusterKind,
} from '../../../../../resources'
import {
  Cluster,
  createResource,
  IRequestResult,
  patchResource,
  ResourceError,
  ResourceErrorCode,
} from '../../../../../resources/utils'
import { AcmEmptyState, AcmSelect } from '../../../../../ui-components'
import { Content, ContentVariants, SelectOption } from '@patternfly/react-core'
import { useEffect, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { BulkActionModal } from '../../../../../components/BulkActionModal'
import './style.css'
import { ClusterAction, clusterSupportsAction } from '../utils/cluster-actions'
import { getVersionFromReleaseImage } from '../utils/utils'

const isChannelSelectable = (c: Cluster, hostedCluster?: HostedClusterK8sResource) => {
  if (hostedCluster) {
    const hasChannelSet = !!(hostedCluster.spec as { channel?: string } | undefined)?.channel
    const hasAvailableChannels = !!c.distribution?.upgradeInfo?.isReadySelectChannels

    // For hosted clusters without a channel set, allow channel selection (will use fallback)
    if (!hasChannelSet) {
      return true
    }
    // For hosted clusters with a channel set, only allow if MCI has available channels
    return hasAvailableChannels
  }
  return clusterSupportsAction(c, ClusterAction.SelectChannel)
}

/**
 * Compute fallback channel from cluster version when MCI channels not available.
 * Only returns fast-X.Y channel for hosted clusters without channel set.
 * Falls back to parsing version from hostedCluster.spec.release.image if distribution not available.
 */
const getFallbackChannels = (cluster: Cluster, hostedCluster?: HostedClusterK8sResource): string[] => {
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
  hostedCluster?: HostedClusterK8sResource
): Record<string, string> => {
  const res = {} as Record<string, string>
  clusters?.forEach((cluster: Cluster) => {
    if (cluster.name) {
      const clusterName = cluster.name
      const currentChannel = cluster.distribution?.upgradeInfo?.currentChannel || ''
      let availableChannels = cluster.distribution?.upgradeInfo?.availableChannels || []

      // For hosted clusters without channels, use fallback
      if (hostedCluster && availableChannels.length === 0) {
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
  hostedCluster?: HostedClusterK8sResource
  warningMessage?: string
}): JSX.Element {
  const { t } = useTranslation()
  const [selectChannels, setSelectChannels] = useState<Record<string, string>>({})
  const [channelSelectableClusters, setChannelSelectableClusters] = useState<Array<Cluster>>([])

  useEffect(() => {
    // set up latest if not selected
    const newChannelSelectableClusters =
      props.clusters && props.clusters.filter((c) => isChannelSelectable(c, props.hostedCluster))
    setSelectChannels((s) => setCurrentChannel(newChannelSelectableClusters, s, props.hostedCluster))
    setChannelSelectableClusters(newChannelSelectableClusters || [])
  }, [props.clusters, props.open, props.hostedCluster])

  // Compute description - use warning message for hosted clusters without channel, else default
  const modalDescription = props.warningMessage || t('bulk.message.selectChannel')

  return (
    <BulkActionModal<Cluster>
      open={props.open}
      title={t('bulk.title.selectChannel')}
      action={t('upgrade.selectChannel.submit')}
      processing={t('upgrade.selectChannel.submit.processing')}
      items={channelSelectableClusters}
      emptyState={
        <AcmEmptyState
          title={t('No clusters available')}
          message={t('The channel cannot be changed for any of the selected clusters.')}
        />
      }
      close={() => {
        setSelectChannels({})
        props.close()
      }}
      description={modalDescription}
      columns={[
        {
          header: t('upgrade.table.name'),
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
          header: t('upgrade.table.currentchannel'),
          cell: (item: Cluster) => {
            const currentChannel = item?.distribution?.upgradeInfo?.currentChannel
            return <span>{currentChannel || '-'}</span>
          },
        },
        {
          header: t('upgrade.table.newchannel'),
          cell: (cluster: Cluster) => {
            let availableChannels = cluster.distribution?.upgradeInfo?.availableChannels || []
            const isReadySelectChannels = cluster.distribution?.upgradeInfo?.isReadySelectChannels

            // For hosted clusters without channels, use fallback
            const isHostedClusterWithoutChannel =
              props.hostedCluster && !(props.hostedCluster.spec as { channel?: string } | undefined)?.channel
            if (isHostedClusterWithoutChannel && availableChannels.length === 0) {
              availableChannels = getFallbackChannels(cluster, props.hostedCluster)
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

        // For hosted clusters, PATCH HostedCluster.spec.channel directly (this will change when curator support is added)
        if (props.hostedCluster) {
          const hostedClusterResource = {
            apiVersion: HostedClusterApiVersion,
            kind: HostedClusterKind,
            metadata: {
              name: props.hostedCluster.metadata?.name,
              namespace: props.hostedCluster.metadata?.namespace,
            },
          }
          const patchSpec = {
            spec: {
              channel: selectChannels[cluster.name],
            },
          }
          return patchResource(hostedClusterResource, patchSpec)
        }

        // For standalone clusters, use ClusterCurator
        const patchSpec = {
          spec: {
            desiredCuration: 'upgrade',
            upgrade: {
              channel: selectChannels[cluster.name],
              // set channel to empty to make sure we only use channel
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
