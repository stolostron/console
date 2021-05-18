/* Copyright Contributors to the Open Cluster Management project */

import { AcmSelect } from '@open-cluster-management/ui-components'
import { SelectOption } from '@patternfly/react-core'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BulkActionModel } from '../../../../components/BulkActionModel'
import { Cluster, ClusterStatus } from '../../../../lib/get-cluster'
import {
    IRequestResult,
    patchResource,
    ResourceError,
    createResource,
    ResourceErrorCode,
} from '../../../../lib/resource-request'
import { ClusterCurator, ClusterCuratorDefinition } from '../../../../resources/cluster-curator'
import './style.css'
export const backendUrl = `${process.env.REACT_APP_BACKEND_PATH}`

const isChannelSelectable = (c: Cluster) => {
    const hasAvailableChannels = c.distribution?.upgradeInfo?.hasAvailableChannels
    const isUpgrading = c.distribution?.upgradeInfo?.isUpgrading
    const isSelectingChannel = c.distribution?.upgradeInfo?.isSelectingChannel
    const isReady = c.status === ClusterStatus.ready
    return (!!c.name && isReady && hasAvailableChannels && !isUpgrading && !isSelectingChannel) || false
}

const setCurrentChannel = (clusters: Array<Cluster> | undefined): Record<string, string> => {
    const res = {} as Record<string, string>
    clusters?.forEach((cluster: Cluster) => {
        if (cluster.name) {
            res[cluster.name] = res[cluster.name] ? res[cluster.name] : cluster.distribution?.upgradeInfo.currentChannel || ''
        }
    })
    return res
}

export function BatchChannelSelectModal(props: {
    close: () => void
    open: boolean
    clusters: Cluster[] | undefined
}): JSX.Element {
    const { t } = useTranslation(['cluster'])
    const [selectChannels, setSelectChannels] = useState<Record<string, string>>({})
    const [channelSelectableClusters, setChannelSelectableClusters] = useState<Array<Cluster>>([])

    useEffect(() => {
        // set up latest if not selected
        const newChannelSelectableClusters = props.clusters && props.clusters.filter(isChannelSelectable)
        setSelectChannels(setCurrentChannel(newChannelSelectableClusters))
        setChannelSelectableClusters(newChannelSelectableClusters || [])
    }, [props.clusters, props.open])

    return (
        <BulkActionModel<Cluster>
            open={props.open}
            title={t('bulk.title.selectChannel')}
            action={t('upgrade.submit')}
            processing={t('upgrade.submit.processing')}
            resources={channelSelectableClusters}
            close={() => {
                props.close()
            }}
            description={t('bulk.message.selectChannel')}
            columns={[
                {
                    header: t('upgrade.table.name'),
                    sort: 'displayName',
                    cell: 'displayName',
                },
                {
                    header: t('upgrade.table.currentchannel'),
                    cell: (item: Cluster) => {
                        const currentChannel = item?.distribution?.upgradeInfo.currentChannel || ''
                        return <span>{currentChannel}</span>
                    },
                },
                {
                    header: t('upgrade.table.newchannel'),
                    cell: (cluster: Cluster) => {
                        const availableChannels = cluster.distribution?.upgradeInfo?.availableChannels || []
                        const hasAvailableChannels = cluster.distribution?.upgradeInfo?.hasAvailableChannels
                        return (
                            <div>
                                {hasAvailableChannels && (
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
                    selectChannels[cluster.name] === cluster.distribution?.upgradeInfo.currentChannel
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
                                    createCuratorResult.promise
                                        .then((data) => resolve(data))
                                        .catch((err) => reject(err))
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
