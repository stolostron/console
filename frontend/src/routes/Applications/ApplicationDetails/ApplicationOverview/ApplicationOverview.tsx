/* Copyright Contributors to the Open Cluster Management project */

import { AcmButton, AcmDescriptionList, AcmPageContent, ListItems } from '@stolostron/ui-components'
import { useTranslation } from '../../../../lib/acm-i18next'
import { Button, ButtonVariant, Card, CardBody, PageSection, Skeleton, Spinner, Tooltip } from '@patternfly/react-core'
import {
    FolderIcon,
    GripHorizontalIcon,
    OutlinedClockIcon,
    OutlinedQuestionCircleIcon,
    OutlinedWindowRestoreIcon,
    SyncAltIcon,
} from '@patternfly/react-icons'
import { useRecoilState } from 'recoil'
import { Fragment, useState } from 'react'
import {
    applicationSetsState,
    // applicationSetsState,
    applicationsState,
    argoApplicationsState,
    // argoApplicationsState,
    channelsState,
    managedClustersState,
    placementRulesState,
    subscriptionsState,
} from '../../../../atoms'
import { createClustersText, getShortDateTime } from '../../helpers/resource-helper'
import { isSearchAvailable } from '../ApplicationTopology/helpers/search-helper'
import { TimeWindowLabels } from '../../components/TimeWindowLabels'
import { getSearchLink } from '../../helpers/resource-helper'
import _ from 'lodash'
import { REQUEST_STATUS } from './actions'
import { Application, Channel, Subscription } from '../../../../resources'
import ResourceLabels from '../../components/ResourceLabels'
import '../../css/ApplicationOverview.css'
import { TFunction } from 'i18next'
import { getApplicationRepos, getAnnotation } from '../../Overview'
import { ApplicationDataType } from '../ApplicationDetails'

const subscriptionAnnotationStr = 'apps.open-cluster-management.io/subscriptions'

let leftItems: ListItems[] = []
let rightItems: ListItems[] = []

function createSyncButton(namespace: string, name: string) {
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
                // onClick={() => openSyncModal(namespace, name)} //TODO
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
                                            href={''} //TODO: update once edit link is in
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
    debugger
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
    let disableBtn
    let subsList = []

    function renderData(checkData: any, showData: any, width?: string) {
        return checkData !== -1 ? showData : <Skeleton width={width} className="loading-skeleton-text" />
    }

    if (applicationData) {
        const { isArgoApp } = applicationData.appData
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
            const applicationResource = applicationData.appData
            // value not right TODO
            const clusterCountString = createClustersText({
                resource: applicationResource,
                clusterCount,
                clusterList,
                argoApplications,
                placementRules,
                subscriptions,
                localCluster,
            })
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
                                    createSyncButton(namespace, name)
                                ) : (
                                    <Tooltip
                                        content={t(
                                            'You are not authorized to complete this action. See your cluster administrator for role-based access control information.'
                                        )}
                                        isContentLeftAligned
                                        position="right"
                                    >
                                        {createSyncButton(namespace, name)}
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
                    value: clusterCountString,
                },
            ]
        }
    }
    return (
        <AcmPageContent id="overview">
            <PageSection>
                <div className="overview-cards-container">
                    <AcmDescriptionList
                        title={t('Details')}
                        leftItems={leftItems}
                        rightItems={rightItems}
                    ></AcmDescriptionList>
                </div>
                {/* Hide for argo */}
                <div className="overview-cards-subs-section">
                    {showSubCards && !disableBtn
                        ? createSubsCards(subsList, t, applicationData?.appData, channels)
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
            </PageSection>
        </AcmPageContent>
    )
}
