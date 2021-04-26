/* Copyright Contributors to the Open Cluster Management project */

import { AcmSelect } from '@open-cluster-management/ui-components'
import { SelectOption } from '@patternfly/react-core'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BulkActionModel } from '../../../../components/BulkActionModel'
import { ReleaseNotesLink } from './ReleaseNotesLink'
import { Cluster, ClusterStatus } from '../../../../lib/get-cluster'
import { IRequestResult, postRequest } from '../../../../lib/resource-request'
import './style.css'
export const backendUrl = `${process.env.REACT_APP_BACKEND_PATH}`

// compare version
const compareVersion = (a: string, b: string) => {
    // basic sort semvers without preversion
    const aVersion = a.split('.')
    const bVersion = b.split('.')
    for (let i = 0; i < Math.min(aVersion.length, bVersion.length); i++) {
        if (aVersion[i] !== bVersion[i]) {
            return Number(bVersion[i]) - Number(aVersion[i])
        }
    }
    return bVersion.length - aVersion.length
}

const isUpgradeable = (c: Cluster) => {
    const hasAvailableUpgrades =
        !c.distribution?.isManagedOpenShift &&
        c.distribution?.ocp?.availableUpdates &&
        c.distribution?.ocp?.availableUpdates.length > 0
    const isUpgrading = c.distribution?.ocp?.version !== c.distribution?.ocp?.desiredVersion
    const isReady = c.status === ClusterStatus.ready
    return (!!c.name && isReady && hasAvailableUpgrades && !isUpgrading) || false
}

const setLatestVersions = (clusters: Array<Cluster> | undefined): Record<string, string> => {
    const res = {} as Record<string, string>
    clusters?.forEach((cluster: Cluster) => {
        if (cluster.name) {
            const availableUpdates =
                cluster.distribution?.ocp?.availableUpdates &&
                [...cluster.distribution.ocp.availableUpdates].sort(compareVersion)
            const latestVersion = availableUpdates && availableUpdates.length > 0 ? availableUpdates[0] : ''
            res[cluster.name] = res[cluster.name] ? res[cluster.name] : latestVersion
        }
    })
    return res
}

export function BatchUpgradeModal(props: {
    close: () => void
    open: boolean
    clusters: Cluster[] | undefined
}): JSX.Element {
    const { t } = useTranslation(['cluster'])
    const [selectVersions, setSelectVersions] = useState<Record<string, string>>({})
    const [upgradeableClusters, setUpgradeableClusters] = useState<Array<Cluster>>([])

    useEffect(() => {
        // set up latest if not selected
        const newUpgradeableClusters = props.clusters && props.clusters.filter(isUpgradeable)
        setSelectVersions(setLatestVersions(newUpgradeableClusters))
        setUpgradeableClusters(newUpgradeableClusters || [])
    }, [props.clusters, props.open])

    return (
        <BulkActionModel<Cluster>
            open={props.open}
            title={t('bulk.title.upgrade')}
            action={t('upgrade.submit')}
            processing={t('upgrade.submit.processing')}
            resources={upgradeableClusters}
            close={() => {
                props.close()
            }}
            description={t('bulk.message.upgrade')}
            columns={[
                {
                    header: t('upgrade.table.name'),
                    sort: 'displayName',
                    cell: 'displayName',
                },
                {
                    header: t('upgrade.table.currentversion'),
                    cell: (item: Cluster) => {
                        const currentVersion = item?.distribution?.ocp?.version || ''
                        return <span>{currentVersion}</span>
                    },
                },
                {
                    header: t('upgrade.table.newversion'),
                    cell: (cluster: Cluster) => {
                        const availableUpdates =
                            cluster.distribution?.ocp?.availableUpdates &&
                            [...cluster.distribution.ocp.availableUpdates].sort(compareVersion)
                        const hasAvailableUpgrades = availableUpdates && availableUpdates.length > 0
                        return (
                            <div>
                                {hasAvailableUpgrades && (
                                    <>
                                        <AcmSelect
                                            value={selectVersions[cluster.name || ''] || ''}
                                            id={`${cluster.name}-upgrade-selector`}
                                            maxHeight={'6em'}
                                            label=""
                                            isRequired
                                            onChange={(version) => {
                                                if (cluster.name && version) {
                                                    selectVersions[cluster.name] = version
                                                    setSelectVersions({ ...selectVersions })
                                                }
                                            }}
                                        >
                                            {availableUpdates?.map((version) => (
                                                <SelectOption key={`${cluster.name}-${version}`} value={version}>
                                                    {version}
                                                </SelectOption>
                                            ))}
                                        </AcmSelect>
                                        <ReleaseNotesLink version={selectVersions[cluster.name!]} />
                                    </>
                                )}
                            </div>
                        )
                    },
                },
            ]}
            keyFn={(cluster) => cluster.name as string}
            actionFn={(cluster) => {
                if (!cluster.name || !selectVersions[cluster.name]) {
                    const emptyRes: IRequestResult<string> = {
                        promise: new Promise((resolve) => resolve('')),
                        abort: () => {},
                    }
                    return emptyRes
                }
                return postRequest(backendUrl + '/upgrade', {
                    clusterName: cluster.name,
                    version: selectVersions[cluster.name],
                })
            }}
        />
    )
}
