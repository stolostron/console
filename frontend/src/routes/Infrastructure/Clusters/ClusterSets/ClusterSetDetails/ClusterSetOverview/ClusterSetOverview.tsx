/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmButton,
    AcmCountCardSection,
    AcmDescriptionList,
    AcmLabels,
    AcmPageContent,
} from '../../../../../../ui-components'
import { PageSection, Popover } from '@patternfly/react-core'
import { OutlinedQuestionCircleIcon, PencilAltIcon } from '@patternfly/react-icons'
import { Fragment, useContext, useState } from 'react'
import { Trans, useTranslation } from '../../../../../../lib/acm-i18next'
import { useHistory } from 'react-router-dom'
import { NavigationPath } from '../../../../../../NavigationPath'
import { clusterDangerStatuses, isGlobalClusterSet } from '../../../../../../resources'
import { MultiClusterNetworkStatus } from '../../components/MultiClusterNetworkStatus'
import { ClusterSetContext } from '../ClusterSetDetails'
import { submarinerHealthCheck, SubmarinerStatus } from '../ClusterSetSubmariner/ClusterSetSubmariner'
import { PluginContext } from '../../../../../../lib/PluginContext'
import { ManagedClusterSetBindingModal } from '../../components/ManagedClusterSetBindingModal'

export function ClusterSetOverviewPageContent() {
    const { t } = useTranslation()
    const { isSubmarinerAvailable } = useContext(PluginContext)
    const { push } = useHistory()
    const { clusterSet, clusters, clusterPools, submarinerAddons, clusterSetBindings, clusterRoleBindings } =
        useContext(ClusterSetContext)

    const unhealthySubmariners = submarinerAddons!.filter(
        (mca) => submarinerHealthCheck(mca) === SubmarinerStatus.degraded
    )

    const navigateToClusterSet = () => {
        if (clusterSet?.metadata?.name) {
            push(NavigationPath.clusterSetClusters.replace(':id', clusterSet.metadata.name))
        }
    }

    const [showManagedClusterSetBindingModal, setShowManagedClusterSetBindingModal] = useState(false)
    let users = 0
    let groups = 0
    clusterRoleBindings?.forEach((binding) => {
        binding.subjects.forEach((subject) => {
            if (subject.kind === 'Group') {
                groups += 1
            }
            if (subject.kind === 'User') {
                users += 1
            }
        })
    })
    let userManagementCount = ''
    if (users === 0 && groups === 0) {
        userManagementCount = t('table.none')
    } else {
        userManagementCount = `${t('table.user', { count: users })} ,   ${t('table.group', { count: groups })}`
    }

    return (
        <AcmPageContent id="overview">
            <PageSection>
                <ManagedClusterSetBindingModal
                    clusterSet={showManagedClusterSetBindingModal ? clusterSet : undefined}
                    onClose={() => setShowManagedClusterSetBindingModal(false)}
                />
                <AcmDescriptionList
                    title={t('table.details')}
                    leftItems={[
                        {
                            key: t('table.name'),
                            value: clusterSet?.metadata.name,
                        },
                        ...(isSubmarinerAvailable && !isGlobalClusterSet(clusterSet)
                            ? [
                                  {
                                      key: t('table.networkStatus'),
                                      value: <MultiClusterNetworkStatus clusterSet={clusterSet!} />,
                                  },
                              ]
                            : []),
                    ]}
                    rightItems={[
                        {
                            key: t('table.clusterSetBinding'),
                            keyAction: (
                                <Fragment>
                                    <Popover
                                        bodyContent={
                                            <Trans
                                                i18nKey="clusterSetBinding.edit.message"
                                                components={{ bold: <strong /> }}
                                            />
                                        }
                                    >
                                        <AcmButton variant="link" style={{ padding: 0, paddingLeft: '6px' }}>
                                            <OutlinedQuestionCircleIcon />
                                        </AcmButton>
                                    </Popover>
                                    <AcmButton
                                        onClick={() => {
                                            setShowManagedClusterSetBindingModal(true)
                                        }}
                                        variant="link"
                                        style={{ padding: 0, paddingLeft: '6px' }}
                                    >
                                        <PencilAltIcon />
                                    </AcmButton>
                                </Fragment>
                            ),
                            value: clusterSetBindings?.length ? (
                                <AcmLabels labels={clusterSetBindings?.map((mcsb) => mcsb.metadata.namespace!)} />
                            ) : (
                                '-'
                            ),
                        },
                        {
                            key: t('table.userManagement'),
                            value: userManagementCount,
                        },
                    ]}
                />
                {!isGlobalClusterSet(clusterSet) && (
                    <div style={{ marginTop: '24px' }}>
                        <AcmCountCardSection
                            id="summary-status"
                            title={t('summary.status')}
                            cards={[
                                ...(isSubmarinerAvailable
                                    ? [
                                          {
                                              id: 'submariners',
                                              count: submarinerAddons!.length,
                                              title: t('submariner.addons'),
                                              linkText: t('summary.submariner.launch'),
                                              onLinkClick: () =>
                                                  push(
                                                      NavigationPath.clusterSetSubmariner.replace(
                                                          ':id',
                                                          clusterSet!.metadata.name!
                                                      )
                                                  ),
                                              countClick: () =>
                                                  push(
                                                      NavigationPath.clusterSetSubmariner.replace(
                                                          ':id',
                                                          clusterSet!.metadata.name!
                                                      )
                                                  ),
                                              isDanger: unhealthySubmariners.length > 0,
                                          },
                                      ]
                                    : []),
                                {
                                    id: 'clusters',
                                    count: clusters!.length,
                                    title: t('Clusters'),
                                    linkText: t('summary.clusters.launch'),
                                    onLinkClick: navigateToClusterSet,
                                    countClick: navigateToClusterSet,
                                    isDanger:
                                        clusters!.filter((cluster) => clusterDangerStatuses.includes(cluster.status))
                                            .length > 0,
                                },
                                {
                                    id: 'clusterPools',
                                    count: clusterPools!.length,
                                    title: t('clusterPools'),
                                    linkText: t('summary.clusterPools.launch'),
                                    onLinkClick: () =>
                                        push(
                                            NavigationPath.clusterSetClusterPools.replace(
                                                ':id',
                                                clusterSet!.metadata.name!
                                            )
                                        ),
                                    countClick: () =>
                                        push(
                                            NavigationPath.clusterSetClusterPools.replace(
                                                ':id',
                                                clusterSet!.metadata.name!
                                            )
                                        ),
                                },
                            ]}
                        />
                    </div>
                )}
            </PageSection>
        </AcmPageContent>
    )
}
