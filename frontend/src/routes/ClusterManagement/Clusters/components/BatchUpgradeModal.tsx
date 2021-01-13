import './style.css'
import React, { useState, useEffect } from 'react'
import Axios, { AxiosResponse } from 'axios'
import { useTranslation } from 'react-i18next'
import {
    AcmButton,
    AcmModal,
    AcmForm,
    AcmSubmit,
    AcmSelect,
    AcmTable,
    AcmAlert,
} from '@open-cluster-management/ui-components'
import {
    ButtonVariant,
    ModalVariant,
    ActionGroup,
    SelectOption,
    AlertVariant,
    Text,
    TextVariants,
} from '@patternfly/react-core'
import { Cluster, ClusterStatus } from '../../../../lib/get-cluster'
export const backendUrl = `${process.env.REACT_APP_BACKEND_HOST}${process.env.REACT_APP_BACKEND_PATH}`

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
        c.distribution?.ocp?.availableUpdates && c.distribution?.ocp?.availableUpdates.length > 0
    const isUpgrading = c.distribution?.ocp?.version !== c.distribution?.ocp?.desiredVersion
    const isReady = c.status === ClusterStatus.ready
    return (isReady && hasAvailableUpgrades && !isUpgrading) || false
}

const setLatestVersions = (clusters: Array<Cluster> | undefined): Record<string, string> => {
    const res = {} as Record<string, string>
    clusters?.forEach((c: Cluster) => {
        if (c.name) {
            const availableUpdates = c.distribution?.ocp?.availableUpdates?.sort(compareVersion)
            const latestVersion = availableUpdates && availableUpdates.length > 0 ? availableUpdates[0] : ''
            res[c.name] = res[c.name] ? res[c.name] : latestVersion
        }
    })
    return res
}

export function BatchUpgradeModal(props: {
    close: () => void
    open: boolean
    clusters: Array<Cluster> | undefined
}): JSX.Element {
    const { t } = useTranslation(['cluster'])
    const [selectVersions, setSelectVersions] = useState<Record<string, string>>({})
    const [upgradeError, setUpgradeError] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    const [upgradeableClusters, setUpgradeableClusters] = useState<Array<Cluster>>([])
    const [upgradeTriggerResults, setUpgradeTriggerResults] = useState<Record<string, boolean>>({}) // map of clustername:isUpgradeTriggered
    useEffect(() => {
        // set up latest if not selected
        const newUpgradeableClusters = props.clusters && props.clusters.filter(isUpgradeable)
        setSelectVersions(setLatestVersions(newUpgradeableClusters))
        setUpgradeableClusters(newUpgradeableClusters || [])
    }, [props.clusters])
    const resetModal = () => {
        setLoading(false)
        setUpgradeError(false)
        setSelectVersions({})
        setUpgradeTriggerResults({})
    }
    const getFailedCount = () => {
        let passedCount = 0
        let total = 0
        for (let k in upgradeTriggerResults) {
            if (upgradeTriggerResults[k] === true) {
                passedCount++
            }
            total++
        }
        return { failedCount: total - passedCount, total }
    }

    return (
        <AcmModal
            variant={ModalVariant.small}
            isOpen={props.open}
            onClose={() => {
                resetModal()
                props.close()
            }}
            title={t('upgrade.multiple.title').replace('{0}', '' + upgradeableClusters.length)}
        >
            <AcmForm>
                {upgradeError && (
                    <AcmAlert
                        title={t('upgrade.multiple.upgradefailed')
                            .replace('{0}', '' + getFailedCount().failedCount)
                            .replace('{1}', '' + getFailedCount().total)}
                        subtitle={t('upgrade.multiple.upgradefailed.details')
                            .replace('{0}', '' + getFailedCount().failedCount)
                            .replace('{1}', '' + getFailedCount().total)}
                        variant={AlertVariant.danger}
                        isInline
                    />
                )}
                <Text component={TextVariants.small}>{t('upgrade.multiple.note')}</Text>
                <div style={{ maxHeight: '18em', overflowY: 'scroll' }}>
                    <AcmTable<Cluster>
                        plural={t('upgrade.table.clusterplural')}
                        items={upgradeableClusters}
                        columns={[
                            {
                                header: t('upgrade.table.name'),
                                sort: 'name',
                                cell: 'name',
                            },
                            {
                                header: t('upgrade.table.currentversion'),
                                cell: (item: Cluster) => {
                                    const isUpgradeTriggered = (item.name && upgradeTriggerResults[item.name]) || false
                                    const currentVersion = item?.distribution?.ocp?.version || ''

                                    return (
                                        <span>
                                            {!isUpgradeTriggered && currentVersion}
                                            {isUpgradeTriggered &&
                                                t('upgrade.istriggered').replace(
                                                    '{0}',
                                                    (item.name && selectVersions[item.name]) || ''
                                                )}
                                        </span>
                                    )
                                },
                            },
                            {
                                header: t('upgrade.table.newversion'),
                                cell: (item: Cluster) => {
                                    const availableUpdates =
                                        item.distribution?.ocp?.availableUpdates &&
                                        item.distribution?.ocp?.availableUpdates.sort(compareVersion)
                                    const hasAvailableUpgrades = availableUpdates && availableUpdates.length > 0
                                    const isUpgradeTriggered = (item.name && upgradeTriggerResults[item.name]) || false

                                    return (
                                        <div>
                                            {!isUpgradeTriggered && hasAvailableUpgrades && (
                                                <AcmSelect
                                                    value={selectVersions[item.name || ''] || ''}
                                                    id={`${item.name}-upgrade-selector`}
                                                    maxHeight={'6em'}
                                                    label=""
                                                    isRequired
                                                    onChange={(version) => {
                                                        if (item.name && version) {
                                                            selectVersions[item.name] = version
                                                            setSelectVersions({ ...selectVersions })
                                                        }
                                                    }}
                                                >
                                                    {availableUpdates?.map((version) => (
                                                        <SelectOption key={`${item.name}-${version}`} value={version}>
                                                            {version}
                                                        </SelectOption>
                                                    ))}
                                                </AcmSelect>
                                            )}
                                        </div>
                                    )
                                },
                            },
                        ]}
                        keyFn={(item: Cluster) => item.name || ''}
                        tableActions={[]}
                        bulkActions={[]}
                        rowActions={[]}
                    />
                </div>
                <ActionGroup>
                    <AcmSubmit
                        label={t('upgrade.submit')}
                        processingLabel={t('upgrade.submit.processing')}
                        isLoading={loading}
                        onClick={() => {
                            if (loading) {
                                return
                            }
                            setLoading(true)
                            setUpgradeError(false)
                            const upgradeRequests: Array<Promise<AxiosResponse>> = []
                            for (const key in selectVersions) {
                                // cluster name should not be nil & should select one version
                                if (!key || !selectVersions[key]) {
                                    continue
                                }
                                // if upgrade is triggered, will not upgrade again
                                if (upgradeTriggerResults[key]) {
                                    continue
                                }
                                const url = backendUrl + '/upgrade'

                                upgradeRequests.push(
                                    new Promise<AxiosResponse>((resolve, reject) => {
                                        Axios.post(
                                            url,
                                            {
                                                clusterName: key,
                                                version: selectVersions[key],
                                            },
                                            { withCredentials: true }
                                        )
                                            .then((res) => {
                                                upgradeTriggerResults[key] = true
                                                setUpgradeTriggerResults({ ...upgradeTriggerResults })
                                                resolve(res)
                                            })
                                            .catch((err) => {
                                                // set modal with an error
                                                upgradeTriggerResults[key] = false
                                                setUpgradeTriggerResults({ ...upgradeTriggerResults })
                                                console.error(`Failed to upgrade ${key}:`, err)
                                                reject(err)
                                            })
                                    })
                                )
                            }

                            return Promise.allSettled(upgradeRequests).then((results) => {
                                setLoading(false)
                                let hasError = false
                                results.forEach((result) => {
                                    if (result.status === 'rejected') {
                                        hasError = true
                                    }
                                })
                                if (hasError) {
                                    setUpgradeError(true)
                                } else {
                                    resetModal()
                                    props.close()
                                }
                            })
                        }}
                    />

                    <AcmButton
                        onClick={() => {
                            resetModal()
                            props.close()
                        }}
                        variant={ButtonVariant.link}
                    >
                        {t('upgrade.cancel')}
                    </AcmButton>
                </ActionGroup>
            </AcmForm>
        </AcmModal>
    )
}
