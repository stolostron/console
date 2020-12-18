import React, { useState } from 'react'
import Axios, { AxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import {
    AcmInlineStatus,
    StatusType,
    AcmButton,
    AcmModal,
    AcmForm,
    AcmSubmit,
    AcmSelect,
    AcmAlert,
} from '@open-cluster-management/ui-components'
import {
    ButtonVariant,
    ModalVariant,
    ActionGroup,
    SelectOption,
    Text,
    AlertVariant,
    EmptyState,
    EmptyStateIcon,
    Title,
    Spinner,
} from '@patternfly/react-core'
import { ClusterStatus, DistributionInfo } from '../lib/get-cluster'
export const backendUrl = `${process.env.REACT_APP_BACKEND_HOST}${process.env.REACT_APP_BACKEND_PATH}`

export function StatusField(props: { status: ClusterStatus }) {
    const { t } = useTranslation(['cluster'])
    let type: StatusType
    switch (props.status) {
        case ClusterStatus.ready:
            type = StatusType.healthy
            break
        case ClusterStatus.needsapproval:
            type = StatusType.warning
            break
        case ClusterStatus.failed:
        case ClusterStatus.notaccepted:
        case ClusterStatus.offline:
            type = StatusType.danger
            break
        case ClusterStatus.creating:
        case ClusterStatus.destroying:
        case ClusterStatus.detaching:
            type = StatusType.progress
            break
        case ClusterStatus.pending:
        case ClusterStatus.pendingimport:
        case ClusterStatus.detached:
        default:
            type = StatusType.unknown
    }

    return <AcmInlineStatus type={type} status={t(`status.${props.status}`)} />
}

export function DistributionField(props: { clusterName: string; data: DistributionInfo | undefined }) {
    const { t } = useTranslation(['cluster'])
    const [open, toggleOpen] = useState<boolean>(false)
    const toggle = () => toggleOpen(!open)

    if (!props.data) return <>-</>
    if (props.data.ocp?.upgradeFailed) {
        return <AcmInlineStatus type={StatusType.danger} status={t(`upgrade.upgradefailed`)} />
    } else if (
        props.data.ocp?.desiredVersion &&
        props.data.ocp?.version &&
        props.data.ocp?.desiredVersion !== props.data.ocp?.version
    ) {
        return (
            <AcmInlineStatus
                type={StatusType.progress}
                status={t(`upgrade.upgrading`) + ' ' + props.data.ocp?.desiredVersion}
            />
        )
    } else if (props.data.ocp?.availableUpdates && props.data.ocp?.availableUpdates?.length > 0) {
        return (
            <span>
                {props.data?.displayVersion}{' '}
                <span style={{ whiteSpace: 'nowrap' }}>
                    <AcmButton
                        onClick={toggle}
                        variant={ButtonVariant.link}
                        style={{ padding: 0, margin: 0, fontSize: '14px' }}
                    >
                        {t('upgrade.available')}
                    </AcmButton>
                    <UpgradeModal close={toggle} open={open} clusterName={props.clusterName} data={props.data} />
                </span>
            </span>
        )
    } else {
        return <>{props.data.displayVersion ?? '-'}</>
    }
}

export function UpgradeModal(props: {
    close: () => void
    open: boolean
    clusterName: string
    data: DistributionInfo | undefined
}): JSX.Element {
    const { t } = useTranslation(['cluster'])
    const [selectVersion, setSelectVersion] = useState<string>()
    const [upgradeError, setUpgradeError] = useState<string>()
    const [loading, setLoading] = useState<boolean>(false)
    return (
        <AcmModal
            variant={ModalVariant.small}
            isOpen={props.open}
            onClose={() => {
                setLoading(false)
                setSelectVersion('')
                setUpgradeError('')
                props.close()
            }}
            title={t('upgrade.title') + ' ' + props.clusterName}
        >
            {loading && (
                <EmptyState>
                    <EmptyStateIcon variant="container" component={Spinner} />
                    <Title size="lg" headingLevel="h4">
                        Loading
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
                    <Title headingLevel="h5" size="md">
                        {t('upgrade.current.version')}
                    </Title>
                    <Text>{props.data?.ocp?.version || props.data?.displayVersion}</Text>
                    <AcmSelect
                        id="upgradeVersionSelect"
                        label={t('upgrade.select.label')}
                        maxHeight={'6em'}
                        placeholder={t('upgrade.select.placeholder')}
                        value={selectVersion}
                        onChange={(value) => {
                            setSelectVersion(value)
                            setUpgradeError('')
                        }}
                        isRequired
                    >
                        {props.data?.ocp?.availableUpdates
                            .sort((a: string, b: string) => {
                                // basic sort semvers without preversion
                                const aVersion = a.split('.')
                                const bVersion = b.split('.')
                                for (let i = 0; i < Math.min(aVersion.length, bVersion.length); i++) {
                                    if (aVersion[i] !== bVersion[i]) {
                                        return Number(bVersion[i]) - Number(aVersion[i])
                                    }
                                }
                                return bVersion.length - aVersion.length
                            })
                            .map((version) => (
                                <SelectOption key={version} value={version}>
                                    {version}
                                </SelectOption>
                            ))}
                    </AcmSelect>

                    <ActionGroup>
                        <AcmSubmit
                            onClick={() => {
                                setLoading(true)
                                setUpgradeError('')
                                const url = backendUrl + '/upgrade'
                                Axios.post(
                                    url,
                                    {
                                        clusterName: props.clusterName,
                                        version: selectVersion,
                                    },
                                    { withCredentials: true }
                                )
                                    .then(() => {
                                        setLoading(false)
                                        setSelectVersion('')
                                        props.close()
                                    })
                                    .catch((reason: AxiosError) => {
                                        setLoading(false)
                                        setSelectVersion('')
                                        setUpgradeError(reason.message)
                                    })
                            }}
                        >
                            submit
                        </AcmSubmit>
                        <AcmButton
                            onClick={() => {
                                setLoading(false)
                                setSelectVersion('')
                                setUpgradeError('')
                                props.close()
                            }}
                            variant={ButtonVariant.link}
                        >
                            cancel
                        </AcmButton>
                    </ActionGroup>
                </AcmForm>
            )}
        </AcmModal>
    )
}
