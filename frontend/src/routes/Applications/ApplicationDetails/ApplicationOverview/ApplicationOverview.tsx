/* Copyright Contributors to the Open Cluster Management project */

import { AcmAlert, AcmButton, AcmDescriptionList, AcmModal, AcmPageContent, ListItems } from '@stolostron/ui-components'
import { useTranslation } from '../../../../lib/acm-i18next'
import { Button, ButtonVariant PageSection, Skeleton, Spinner, Tooltip } from '@patternfly/react-core'
import {
    FolderIcon,
    GripHorizontalIcon,
    OutlinedClockIcon,
    OutlinedQuestionCircleIcon,
    SyncAltIcon,
} from '@patternfly/react-icons'
import { useRecoilState } from 'recoil'
import { Fragment, useState } from 'react'
import {
    argoApplicationsState,
    channelsState,
    managedClustersState,
    placementRulesState,
    subscriptionsState,
} from '../../../../atoms'
import { createClustersText, getShortDateTime } from '../../helpers/resource-helper'
import { TimeWindowLabels } from '../../components/TimeWindowLabels'
import { getSearchLink } from '../../helpers/resource-helper'
import _ from 'lodash'
import { REQUEST_STATUS } from './actions'
import { Application, ApplicationApiVersion, ApplicationKind, Channel, Subscription } from '../../../../resources'
import ResourceLabels from '../../components/ResourceLabels'
import '../../css/ApplicationOverview.css'
import { TFunction } from 'i18next'
import { getApplicationRepos, getAnnotation } from '../../Overview'
import { ApplicationDataType } from '../ApplicationDetails'
import { NavigationPath } from '../../../../NavigationPath'
import { ISyncResourceModalProps, SyncResourceModal } from '../../components/SyncResourceModal'

let leftItems: ListItems[] = []
let rightItems: ListItems[] = []

function createSyncButton(namespace: string, name: string, setModalProps: any, t: TFunction) {
    // const { mutateStatus } = this.props //TODO: Need to implement openSyncModal
    const mutateStatus = ''
    const syncInProgress = mutateStatus === REQUEST_STATUS.IN_PROGRESS
    return (
        <Fragment>
            <AcmButton
                variant={ButtonVariant.link}
                className={`${syncInProgress ? 'syncInProgress' : ''}`}
                id="sync-app"
                component="a"
                rel="noreferrer"
                icon={<SyncAltIcon />}
                iconPosition="left"
                onClick={() => {
                    setModalProps({
                        open: true,
                        errors: undefined,
                        close: () => {
                            setModalProps({ open: false })
                        },
                        t,
                    })
                }}
            >
                {'Sync'}
                {syncInProgress && <Spinner size="sm" />}
            </AcmButton>
        </Fragment>
    )
}

function createSubsCards(
    subsList: (Subscription | undefined)[],
    t: TFunction,
    appResource: Application,
    channels: Channel[]
) {
    return (
        subsList.length &&
        subsList.map((sub) => {
            const appRepos = getApplicationRepos(appResource, [sub] as Subscription[], channels)
            if (sub) {
                return (
                    <Fragment key={sub.metadata.name}>
                        <div
                            className="sub-card-container"
                            style={{
                                width: '100%',
                                height: '6.75rem',
                                display: 'grid',
                                marginTop: '16px',
                                fontSize: '14px',
                                backgroundColor: 'white',
                                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
                                gridTemplateColumns: '33% 34% 33%',
                            }}
                        >
                            <div className="sub-card-column add-right-border">
                                <GripHorizontalIcon />
                                <div className="sub-card-content">
                                    <div className="sub-card-title">Subscription</div>
                                    <span>{sub.metadata.name}</span>
                                </div>
                            </div>
                            <div className="sub-card-column add-right-border">
                                <FolderIcon />
                                <div className="sub-card-content">
                                    <div className="sub-card-title">Repository resource</div>
                                    <ResourceLabels
                                        appRepos={appRepos as any[]}
                                        translation={t}
                                        isArgoApp={false}
                                        showSubscriptionAttributes={true}
                                    />
                                </div>
                            </div>
                            <div className="sub-card-column">
                                <OutlinedClockIcon />
                                <div className="sub-card-content">
                                    <div className="sub-card-title">Time window</div>
                                    {!sub.spec.timewindow?.windowtype ? (
                                        <AcmButton
                                            id="set-time-window-link"
                                            target="_blank"
                                            component="a"
                                            href={NavigationPath.editApplicationSubscription
                                                .replace(':namespace', appResource.metadata?.namespace as string)
                                                .replace(':name', appResource.metadata?.name as string)}
                                            variant={ButtonVariant.link}
                                            rel="noreferrer"
                                        >
                                            Set time window
                                        </AcmButton>
                                    ) : (
                                        <TimeWindowLabels
                                            subName={sub.metadata.name as string}
                                            type={sub.spec.timewindow?.windowtype}
                                            days={sub.spec.timewindow?.daysofweek}
                                            timezone={sub.spec.timewindow?.location}
                                            ranges={sub.spec.timewindow?.hours}
                                            missingData={sub.spec.timewindow?.missingData}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </Fragment>
                )
            }
            return ''
        })
    )
}

export function ApplicationOverviewPageContent(props: { applicationData: ApplicationDataType | undefined }) {
    const { applicationData } = props
    const { t } = useTranslation()
    const hasSyncPermission = true //TODO
    const localClusterStr = 'local-cluster'

    const [argoApplications] = useRecoilState(argoApplicationsState)
    const [channels] = useRecoilState(channelsState)
    const [subscriptions] = useRecoilState(subscriptionsState)
    const [placementRules] = useRecoilState(placementRulesState)
    const [managedClusters] = useRecoilState(managedClustersState)
    const localCluster = managedClusters.find((cls) => cls.metadata.name === localClusterStr)
    const [showSubCards, setShowSubCards] = useState(false)
    const [modalProps, setModalProps] = useState<ISyncResourceModalProps | { open: false }>({
        open: false,
    })
    let isArgoApp = false
    let disableBtn
    let subsList = []

    function renderData(checkData: any, showData: any, width?: string) {
        return checkData !== -1 ? showData : <Skeleton width={width} className="loading-skeleton-text" />
    }

    function getClusterField(
        searchLink: string,
        clusterCountString: string,
        clusterCount: { localPlacement: boolean; remoteCount: number }
    ) {
        if (clusterCount.remoteCount && clusterCountString !== 'None') {
            return (
                <a className="cluster-count-link" href={searchLink}>
                    {t(clusterCountString)}
                </a>
            )
        }
        return t(clusterCountString)
    }

    if (applicationData) {
        isArgoApp = applicationData.appData.isArgoApp
        const { name, namespace } = applicationData.application.metadata
        ////////////////////////////////// argo items ////////////////////////////////////
        if (isArgoApp) {
            leftItems = [
                { key: t('Name'), value: name },
                {
                    key: t('Namespace'),
                    value: namespace,
                    keyAction: (
                        <Tooltip
                            content={
                                <div>{t('Namespace where the selected Argo application resources are deployed.')}</div>
                            }
                        >
                            <OutlinedQuestionCircleIcon className="help-icon" />
                        </Tooltip>
                    ),
                },
                {
                    key: t('Server'),
                    value: '', //TODO
                    keyAction: (
                        <Tooltip
                            content={
                                <div>{t('Cluster where the selected Argo application resources are deployed.')}</div>
                            }
                        >
                            <OutlinedQuestionCircleIcon className="help-icon" />
                        </Tooltip>
                    ),
                },
                {
                    key: t('Created'),
                    value: t(getShortDateTime(applicationData.application.metadata.creationTimestamp)),
                },
            ]
            rightItems = [
                {
                    key: t('Clusters'),
                },
            ]
        } else {
            /////////////////////////// subscription items //////////////////////////////////////////////
            const allSubscriptions = _.get(applicationData.application, 'allSubscriptions', [])
            const clusterCount = {
                localPlacement: false,
                remoteCount: 0,
            }
            subsList = applicationData.application.allSubscriptions
            disableBtn = subsList && subsList.length > 0 ? false : true
            const clusterList = applicationData.application.allClusters
            const applicationResource = applicationData.application.app
            const clusterCountString = createClustersText({
                resource: applicationResource,
                clusterCount,
                clusterList,
                argoApplications,
                placementRules,
                subscriptions,
                localCluster,
            })
            const searchParams: any =
                applicationResource.kind === ApplicationKind && applicationResource.apiVersion === ApplicationApiVersion
                    ? {
                          properties: {
                              apigroup: 'app.k8s.io',
                              kind: 'application',
                              name: applicationResource.metadata?.name,
                              namespace: applicationResource.metadata?.namespace,
                          },
                          showRelated: 'cluster',
                      }
                    : {
                          properties: {
                              name: clusterList,
                              kind: 'cluster',
                          },
                      }
            const searchLink = getSearchLink(searchParams)
            let lastSynced = ''
            allSubscriptions.forEach((subs: Subscription) => {
                if (!lastSynced) {
                    lastSynced = _.get(
                        subs,
                        `metadata.annotations["apps.open-cluster-management.io/manual-refresh-time"]`,
                        ''
                    )
                }
            })
            leftItems = [
                { key: 'Name', value: name },
                { key: 'Namespace', value: namespace },
                {
                    key: t('Created'),
                    value: t(getShortDateTime(applicationData.application.metadata.creationTimestamp)),
                },
                {
                    key: t('Last sync requested'),
                    value: (
                        <Fragment>
                            {renderData(t(getShortDateTime(lastSynced)), t(getShortDateTime(lastSynced)), '30%')}
                            {renderData(
                                t(getShortDateTime(lastSynced)),
                                hasSyncPermission ? (
                                    createSyncButton(namespace, name, setModalProps, t)
                                ) : (
                                    <Tooltip
                                        content={t(
                                            'You are not authorized to complete this action. See your cluster administrator for role-based access control information.'
                                        )}
                                        isContentLeftAligned
                                        position="right"
                                    >
                                        {createSyncButton(namespace, name, setModalProps, t)}
                                    </Tooltip>
                                )
                            )}
                        </Fragment>
                    ),
                    keyAction: (
                        <Tooltip content={'Date and time of the most recent sync request for application resources.'}>
                            <OutlinedQuestionCircleIcon
                                style={{ fill: '#0066cc', marginLeft: '4px', cursor: 'pointer' }}
                            />
                        </Tooltip>
                    ),
                },
            ]
            rightItems = [
                {
                    key: t('Clusters'),
                    value: getClusterField(searchLink, clusterCountString, clusterCount),
                },
            ]
        }
    }
    return (
        <AcmPageContent id="overview">
            <SyncResourceModal {...modalProps} />
            <PageSection>
                <div className="overview-cards-container">
                    <AcmDescriptionList
                        title={t('Details')}
                        leftItems={leftItems}
                        rightItems={rightItems}
                    ></AcmDescriptionList>
                </div>
                {/* Hide for argo */}
                {!isArgoApp && (
                    <div className="overview-cards-subs-section">
                        {showSubCards && !disableBtn
                            ? createSubsCards(subsList, t, applicationData?.application?.app, channels)
                            : ''}
                        <Button
                            className="toggle-subs-btn"
                            variant="secondary"
                            isDisabled={disableBtn}
                            data-test-subscription-details={!disableBtn}
                            onClick={() => setShowSubCards(!showSubCards)}
                        >
                            {renderData(
                                subsList,
                                (showSubCards ? 'Hide subscription details' : 'Show subscription details') +
                                    ` (${subsList.length})`,
                                '70%'
                            )}
                        </Button>
                    </div>
                )}
            </PageSection>
        </AcmPageContent>
    )
}
