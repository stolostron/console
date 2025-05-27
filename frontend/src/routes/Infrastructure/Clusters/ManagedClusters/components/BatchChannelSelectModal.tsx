/* Copyright Contributors to the Open Cluster Management project */

import { ClusterCurator, ClusterCuratorDefinition } from '../../../../../resources'
import {
  Cluster,
  createResource,
  IRequestResult,
  patchResource,
  ResourceError,
  ResourceErrorCode,
} from '../../../../../resources/utils'
import { AcmEmptyState, AcmSelect } from '../../../../../ui-components'
import { Text, TextContent, TextVariants, SelectOption } from '@patternfly/react-core'
import { useEffect, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { BulkActionModal } from '../../../../../components/BulkActionModal'
import './style.css'
import { ClusterAction, clusterSupportsAction } from '../utils/cluster-actions'

const isChannelSelectable = (c: Cluster) => {
  return clusterSupportsAction(c, ClusterAction.SelectChannel)
}

const setCurrentChannel = (
  clusters: Array<Cluster> | undefined,
  currentMappings: Record<string, string>
): Record<string, string> => {
  const res = {} as Record<string, string>
  clusters?.forEach((cluster: Cluster) => {
    if (cluster.name) {
      const clusterName = cluster.name
      const currentChannel = cluster.distribution?.upgradeInfo?.currentChannel || ''
      const availableChannels = cluster.distribution?.upgradeInfo?.availableChannels || []
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
}): JSX.Element {
  const { t } = useTranslation()
  const [selectChannels, setSelectChannels] = useState<Record<string, string>>({})
  const [channelSelectableClusters, setChannelSelectableClusters] = useState<Array<Cluster>>([])

  useEffect(() => {
    // set up latest if not selected
    const newChannelSelectableClusters = props.clusters && props.clusters.filter(isChannelSelectable)
    setSelectChannels((s) => setCurrentChannel(newChannelSelectableClusters, s))
    setChannelSelectableClusters(newChannelSelectableClusters || [])
  }, [props.clusters, props.open])

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
      description={t('bulk.message.selectChannel')}
      columns={[
        {
          header: t('upgrade.table.name'),
          sort: 'displayName',
          cell: (cluster) => (
            <>
              <span style={{ whiteSpace: 'nowrap' }}>{cluster.displayName}</span>
              {cluster.hive.clusterClaimName && (
                <TextContent>
                  <Text component={TextVariants.small}>{cluster.hive.clusterClaimName}</Text>
                </TextContent>
              )}
            </>
          ),
        },
        {
          header: t('upgrade.table.currentchannel'),
          cell: (item: Cluster) => {
            const currentChannel = item?.distribution?.upgradeInfo?.currentChannel || ''
            return <span>{currentChannel}</span>
          },
        },
        {
          header: t('upgrade.table.newchannel'),
          cell: (cluster: Cluster) => {
            const availableChannels = cluster.distribution?.upgradeInfo?.availableChannels || []
            const isReadySelectChannels = cluster.distribution?.upgradeInfo?.isReadySelectChannels
            return (
              <div>
                {isReadySelectChannels && (
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
