import React, { useState, useEffect } from 'react'
import Axios, { AxiosError, AxiosResponse } from 'axios'
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
    EmptyState,
    EmptyStateIcon,
    Title,
    Spinner,
} from '@patternfly/react-core'
import { Cluster } from '../../../../lib/get-cluster'
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

const setLatestVersions = (clusters: Array<Cluster> | undefined): Record<string, string> => {
    const res = {} as Record<string, string>
    clusters?.forEach((c: Cluster) => {
        if (c.name) {
            const availableUpdates = c.distribution?.ocp?.availableUpdates.sort(compareVersion)
            const latestVersion = availableUpdates && availableUpdates.length > 1 ? availableUpdates[0] : ''
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
    const [upgradeError, setUpgradeError] = useState<string>()
    const [loading, setLoading] = useState<boolean>(false)
    // set up latest if not selected
    useEffect(() => {
        setSelectVersions(setLatestVersions(props.clusters))
    }, [props.clusters])

    return (
        <AcmModal
            variant={ModalVariant.small}
            isOpen={props.open}
            onClose={() => {
                setLoading(false)
                setUpgradeError('')
                setSelectVersions({})
                props.close()
            }}
            title={t('upgrade.multiple.title').replace('{0}', '' + props.clusters?.length)}
        >
            {loading && (
                <EmptyState>
                    <EmptyStateIcon variant="container" component={Spinner} />
                    <Title size="lg" headingLevel="h4">
                        {t('upgrade.loading')}
                    </Title>
                </EmptyState>
            )}
            {!loading && (
                <AcmForm>
                    {upgradeError && (
                        <AcmAlert
                            title={t('upgrade.upgradefailed')}
                            subtitle={upgradeError}
                            variant={AlertVariant.danger}
                            isInline
                        />
                    )}
                    <AcmTable<Cluster>
                        plural={t('upgrade.table.clusterplural')}
                        items={props.clusters}
                        columns={[
                            {
                                header: t('upgrade.table.name'),
                                sort: 'name',
                                //search: 'name',
                                cell: 'name',
                            },
                            {
                                header: t('upgrade.table.currentversion'),
                                cell: 'distribution.ocp.version',
                                //search: 'distribution.ocp.version',
                                sort: 'distribution.ocp.version',
                            },
                            {
                                header: t('upgrade.table.newversion'),
                                cell: (item: Cluster) => {
                                    const availableUpdates = item.distribution?.ocp?.availableUpdates.sort(
                                        compareVersion
                                    )
                                    return (
                                        <AcmSelect
                                            value={selectVersions[item.name || ''] || ''}
                                            id={`${item.name}-upgrade-selector`}
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
                                    )
                                },
                            },
                        ]}
                        keyFn={(item: Cluster) => item.name || ''}
                        tableActions={[]}
                        bulkActions={[]}
                        rowActions={[]}
                    />

                    <ActionGroup>
                        <AcmSubmit
                            onClick={() => {
                                setLoading(true)
                                setUpgradeError('')

                                const upgradeRequests: Array<Promise<AxiosResponse>> = []
                                for (const key in selectVersions) {
                                    if (!key || !selectVersions[key]) {
                                        continue
                                    }
                                    const url = backendUrl + '/upgrade'
                                    upgradeRequests.push(
                                        Axios.post(
                                            url,
                                            {
                                                clusterName: key,
                                                version: selectVersions[key],
                                            },
                                            { withCredentials: true }
                                        )
                                    )
                                }
                                Promise.all(upgradeRequests)
                                    .then(() => {
                                        setLoading(false)
                                        setSelectVersions({})
                                        props.close()
                                    })
                                    .catch((reason: AxiosError) => {
                                        setLoading(false)
                                        setUpgradeError(reason.message)
                                    })
                            }}
                        >
                            {t('upgrade.submit')}
                        </AcmSubmit>
                        <AcmButton
                            onClick={() => {
                                setLoading(false)
                                setUpgradeError('')
                                setSelectVersions({})
                                props.close()
                            }}
                            variant={ButtonVariant.link}
                        >
                            {t('upgrade.cancel')}
                        </AcmButton>
                    </ActionGroup>
                </AcmForm>
            )}
        </AcmModal>
    )
}
