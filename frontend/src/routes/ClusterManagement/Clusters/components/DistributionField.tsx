/* Copyright Contributors to the Open Cluster Management project */

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AcmInlineStatus, StatusType } from '@open-cluster-management/ui-components'
import { ButtonVariant } from '@patternfly/react-core'
import { ArrowCircleUpIcon, ExternalLinkAltIcon } from '@patternfly/react-icons'
import { BatchUpgradeModal } from './BatchUpgradeModal'
import { Cluster, ClusterStatus } from '../../../../lib/get-cluster'
import { getResourceAttributes } from '../../../../lib/rbac-util'
import { ManagedClusterActionDefinition } from '../../../../resources/managedclusteraction'
import { RbacButton } from '../../../../components/Rbac'
export const backendUrl = `${process.env.REACT_APP_BACKEND_HOST}${process.env.REACT_APP_BACKEND_PATH}`

export function DistributionField(props: { cluster?: Cluster }) {
    const { t } = useTranslation(['cluster'])
    const [open, toggleOpen] = useState<boolean>(false)
    const toggle = () => toggleOpen(!open)

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
                    <RbacButton
                        onClick={toggle}
                        icon={<ArrowCircleUpIcon />}
                        variant={ButtonVariant.link}
                        style={{ padding: 0, margin: 0, fontSize: 'inherit' }}
                        rbac={[
                            getResourceAttributes('create', ManagedClusterActionDefinition, props.cluster?.namespace),
                        ]}
                    >
                        {t('upgrade.available')}
                    </RbacButton>
                    <BatchUpgradeModal clusters={[props.cluster]} open={open} close={toggle} />
                </span>
            </>
        )
    } else {
        return <>{props.cluster?.distribution.displayVersion ?? '-'}</>
    }
}
