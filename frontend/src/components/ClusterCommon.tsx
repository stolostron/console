import React, { useState, useEffect } from 'react'
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
    Title,
} from '@patternfly/react-core'
import { ArrowCircleUpIcon, ExternalLinkAltIcon } from '@patternfly/react-icons'
import { Cluster, ClusterStatus } from '../lib/get-cluster'
import { createSubjectAccessReviews, rbacMapping } from '../resources/self-subject-access-review'
export const backendUrl = `${process.env.REACT_APP_BACKEND_HOST}${process.env.REACT_APP_BACKEND_PATH}`

export function DistributionField(props: { cluster?: Cluster }) {
    const { t } = useTranslation(['cluster'])
    const [open, toggleOpen] = useState<boolean>(false)
    const toggle = () => toggleOpen(!open)
    const [hasUpgradePermission, setHasUpgradePermission] = useState<boolean>(false)
    useEffect(() => {
        // if no available upgrades, skipping permission check
        if (
            props.cluster?.distribution?.isManagedOpenShift ||
            !(props.cluster?.distribution?.ocp?.availableUpdates?.length || -1 > 0) || // has no available upgrades
            (props.cluster?.distribution?.ocp?.desiredVersion &&
                props.cluster?.distribution?.ocp?.version &&
                props.cluster?.distribution.ocp?.desiredVersion !== props.cluster?.distribution.ocp?.version) // upgrading
        ) {
            return
        }
        // check if the user is allowed to upgrade the cluster
        const request = createSubjectAccessReviews(
            rbacMapping('cluster.upgrade', props.cluster?.name, props.cluster?.name)
        )
        request.promise
            .then((results) => {
                if (results) {
                    let rbacQueryResults: boolean[] = []
                    results.forEach((result) => {
                        if (result.status === 'fulfilled') {
                            rbacQueryResults.push(result.value.status?.allowed!)
                        }
                    })
                    if (!rbacQueryResults.includes(false)) {
                        setHasUpgradePermission(true)
                    }
                }
            })
            .catch((err) => console.error(err))
    }, [
        props.cluster?.name,
        props.cluster?.distribution?.ocp?.availableUpdates?.length,
        props.cluster?.distribution?.ocp?.version,
        props.cluster?.distribution?.ocp?.desiredVersion,
        props.cluster?.distribution?.isManagedOpenShift,
    ])

    if (!props.cluster?.distribution) return <>-</>
    // use display version directly for non-online clusters
    if (props.cluster?.status !== ClusterStatus.ready) {
        return <>{props.cluster?.distribution.displayVersion ?? '-'}</>
    }
    if (
        props.cluster?.distribution.ocp?.upgradeFailed &&
        props.cluster?.distribution.ocp?.desiredVersion !== props.cluster?.distribution.ocp?.version
    ) {
        return (
            <>
                <div>{props.cluster?.distribution.displayVersion}</div>
                <AcmInlineStatus
                    type={StatusType.danger}
                    status={t('upgrade.upgradefailed', {
                        version: props.cluster?.consoleURL ? '' : props.cluster?.distribution.ocp?.desiredVersion,
                    })}
                    popover={
                        props.cluster?.consoleURL
                            ? {
                                  headerContent: t('upgrade.upgradefailed', {
                                      version: props.cluster?.distribution.ocp?.desiredVersion,
                                  }),
                                  bodyContent: t('upgrade.upgradefailed.message', {
                                      clusterName: props.cluster?.name,
                                      version: props.cluster?.distribution.ocp?.desiredVersion,
                                  }),
                                  footerContent: (
                                      <a
                                          href={`${props.cluster?.consoleURL}/settings/cluster`}
                                          target="_blank"
                                          rel="noreferrer"
                                      >
                                          {t('upgrade.upgrading.link')} <ExternalLinkAltIcon />
                                      </a>
                                  ),
                              }
                            : undefined
                    }
                />
            </>
        )
    } else if (
        props.cluster?.distribution.ocp?.desiredVersion &&
        props.cluster?.distribution.ocp?.version &&
        props.cluster?.distribution.ocp?.desiredVersion !== props.cluster?.distribution.ocp?.version
    ) {
        return (
            <>
                <div>{props.cluster?.distribution.displayVersion}</div>
                <AcmInlineStatus
                    type={StatusType.progress}
                    status={t('upgrade.upgrading.version', {
                        version: props.cluster?.distribution.ocp?.desiredVersion,
                    })}
                    popover={
                        props.cluster?.consoleURL
                            ? {
                                  headerContent: t('upgrade.upgrading', {
                                      version: props.cluster?.distribution.ocp?.desiredVersion,
                                  }),
                                  bodyContent: t('upgrade.upgrading.message', {
                                      clusterName: props.cluster?.name,
                                      version: props.cluster?.distribution.ocp?.desiredVersion,
                                  }),
                                  footerContent: (
                                      <a
                                          href={`${props.cluster?.consoleURL}/settings/cluster`}
                                          target="_blank"
                                          rel="noreferrer"
                                      >
                                          {t('upgrade.upgrading.link')} <ExternalLinkAltIcon />
                                      </a>
                                  ),
                              }
                            : undefined
                    }
                />
            </>
        )
    } else if (
        props.cluster?.distribution.ocp?.availableUpdates &&
        props.cluster?.distribution.ocp?.availableUpdates?.length > 0 &&
        !props.cluster?.distribution.isManagedOpenShift // don't allow upgrade for managed OpenShift
    ) {
        return (
            <>
                <div>{props.cluster?.distribution?.displayVersion}</div>
                <span style={{ whiteSpace: 'nowrap', display: 'block' }}>
                    <AcmButton
                        isDisabled={!hasUpgradePermission}
                        tooltip={t('common:rbac.unauthorized')}
                        onClick={toggle}
                        icon={<ArrowCircleUpIcon />}
                        variant={ButtonVariant.link}
                        style={{ padding: 0, margin: 0, fontSize: 'inherit' }}
                    >
                        {t('upgrade.available')}
                    </AcmButton>
                    <UpgradeModal close={toggle} open={open} cluster={props.cluster} />
                </span>
            </>
        )
    } else {
        return <>{props.cluster?.distribution.displayVersion ?? '-'}</>
    }
}

export function UpgradeModal(props: { close: () => void; open: boolean; cluster: Cluster }): JSX.Element {
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
            title={t('upgrade.title', { clusterName: props.cluster?.name })}
        >
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
                <Text>{props.cluster?.distribution?.ocp?.version || props.cluster?.distribution?.displayVersion}</Text>
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
                    {props.cluster?.distribution?.ocp?.availableUpdates
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
                        label={t('upgrade.submit')}
                        processingLabel={t('upgrade.submit.processing')}
                        isLoading={loading}
                        onClick={() => {
                            if (loading) {
                                return
                            }
                            setLoading(true)
                            setUpgradeError('')
                            const url = backendUrl + '/upgrade'
                            return Axios.post(
                                url,
                                {
                                    clusterName: props.cluster?.name,
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
                        {t('upgrade.submit')}
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
                        {t('upgrade.cancel')}
                    </AcmButton>
                </ActionGroup>
            </AcmForm>
        </AcmModal>
    )
}
