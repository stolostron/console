import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AcmInlineProvider } from '@open-cluster-management/ui-components'
import { Cluster, ClusterStatus } from '../../../../lib/get-cluster'
import { createManagedCluster } from '../../../../resources/managed-cluster'
import { createKlusterletAddonConfig } from '../../../../resources/klusterlet-add-on-config'
import { BulkActionModel } from '../../../../components/BulkActionModel'
import { ResourceError, IRequestResult } from '../../../../lib/resource-request'

export function AttachModal(props: { clusters: Cluster[] | undefined; open: boolean; close: () => void }) {
    const { t } = useTranslation(['cluster'])
    const [attachableClusters, setAttachableClusters] = useState<Cluster[]>([])

    useEffect(() => {
        if (props.clusters) {
            const clusters = props.clusters.filter((cluster) => cluster.status === ClusterStatus.detached)
            setAttachableClusters(clusters)
        } else {
            setAttachableClusters([])
        }
    }, [props.clusters])

    return (
        <BulkActionModel<Cluster>
            open={props.open}
            singular={t('cluster')}
            plural= {t('clusters')}
            action={t('attach')}
            processing={t('import.generating')}
            resources={attachableClusters}
            close={() => props.close()}
            description={t('cluster.attach.description')}
            columns={[
                {
                    header: t('upgrade.table.name'),
                    sort: 'name',
                    cell: 'name',
                },
                {
                    header: t('table.provider'),
                    sort: 'provider',
                    cell: (cluster: Cluster) =>
                        cluster?.provider ? <AcmInlineProvider provider={cluster?.provider} /> : '-',
                },
            ]}
            keyFn={(cluster) => cluster.name as string}
            actionFn={(cluster) => {
                const clusterLabels = {
                    cloud: 'auto-detect',
                    vendor: 'auto-detect',
                    name: cluster.name ?? '',
                }
                const calls = [
                    createManagedCluster({ clusterName: cluster.name, clusterLabels }),
                    createKlusterletAddonConfig({ clusterName: cluster.name, clusterLabels }),
                ]
                const attachClusterResult: IRequestResult<PromiseSettledResult<unknown>[]> = {
                    promise: Promise.allSettled(calls.map((result) => result.promise)),
                    abort: () => calls.forEach((call) => call.abort())
                }
                return {
                    promise: new Promise((resolve, reject) => {
                        attachClusterResult.promise.then((result) => {
                            if (result.every((res) => res.status !== 'rejected')) {
                                resolve(result)
                            } else {
                                const mcResult = result[0] as PromiseRejectedResult
                                const kacResult = result[1] as PromiseRejectedResult
                                if (mcResult.status === 'rejected' || kacResult.status === 'rejected') {
                                    const error = mcResult.reason ?? kacResult.reason
                                    if (error instanceof ResourceError) {
                                        reject(mcResult.reason)
                                    }
                                }
                            }
                        })
                    }),
                    abort: attachClusterResult.abort,
                }
            }}
        />
    )
}
