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
    // applicationSetsState,
    applicationsState,
    // argoApplicationsState,
    channelsState,
    subscriptionsState,
} from '../../../../atoms'
import { getShortDateTime } from '../../helpers/resource-helper'
import { isSearchAvailable } from '../ApplicationTopology/helpers/search-helper'
import { TimeWindowLabels } from '../../components/TimeWindowLabels'
import { getSearchLink } from '../../helpers/resource-helper'
import _ from 'lodash'
import { REQUEST_STATUS } from './actions'
import { Subscription } from '../../../../resources'
import ResourceLabels from '../../components/ResourceLabels'
import '../../css/ApplicationOverview.css'
import { TFunction } from 'i18next'
import { getApplicationRepos, getAnnotation } from '../../Overview'

const manualRefreshTimeAnnotationStr = 'apps.open-cluster-management.io/manual-refresh-time'

export function ApplicationOverviewPageContent(props: { name: string; namespace: string }) {
    const { name, namespace } = props
    const [applications] = useRecoilState(applicationsState)
    const [subscriptions] = useRecoilState(subscriptionsState)
    const [channels] = useRecoilState(channelsState)
    // const [applicationSets] = useRecoilState(applicationSetsState)
    // const [argoApplications] = useRecoilState(argoApplicationsState)

    // only works for subscriptions

    const selectedApplication = applications.filter(
        (application) => application.metadata.name === name && application.metadata.namespace === namespace
    )
    const relatedSubscriptions =
        selectedApplication[0].metadata.annotations['apps.open-cluster-management.io/subscriptions']
    const subNamesList = relatedSubscriptions.split(',')

    const subsList: (Subscription | undefined)[] = []
    for (let i = 0; i < subNamesList.length; i++) {
        const [subscriptionNamespace, subscriptionName] = subNamesList[i].split('/')
        if (!subscriptionName.endsWith('-local')) {
            const matchedSubscription = subscriptions.find(
                (element) =>
                    element.metadata.name === subscriptionName && element.metadata.namespace === subscriptionNamespace
            )
            subsList.push(matchedSubscription)
        }
    }

    let getUrl = window.location.href
    getUrl = getUrl.substring(0, getUrl.indexOf('/multicloud/applications/'))

    const [apigroup, apiversion] = selectedApplication[0].apiVersion.split('/')

    const targetLink = getSearchLink({
        properties: {
            name: name,
            namespace: namespace,
            kind: selectedApplication[0].kind.toLowerCase(),
            apigroup,
            apiversion,
        },
    })
    const creationTimestamp = getShortDateTime(_.get(selectedApplication[0], 'metadata.creationTimestamp'))
    const manualSyncTimestamp = getShortDateTime(getAnnotation(subsList[0], manualRefreshTimeAnnotationStr))

    // subscriptions only
    const leftItems: ListItems[] = [
        {
            key: 'Name',
            value: name,
        },
        {
            key: 'Namespace',
            value: namespace,
        },
        {
            key: 'Created',
            value: getShortDateTime(creationTimestamp),
        },
        {
            key: 'Last sync requested',
            value: (
                <Fragment>
                    {/* Need to change to sync timestamp once #19847 is fixed */}
                    {renderData(manualSyncTimestamp, manualSyncTimestamp, '30%')}
                    {renderData(manualSyncTimestamp, createSyncButton(name, namespace), '30%')}
                </Fragment>
            ),
            keyAction: (
                <Tooltip content={'Date and time of the most recent sync request for application resources.'}>
                    <OutlinedQuestionCircleIcon style={{ fill: '#0066cc', marginLeft: '4px', cursor: 'pointer' }} />
                </Tooltip>
            ),
        },
    ]

    const rightItems: ListItems[] = [
        {
            key: 'Clusters',
        },
    ]

    const disableBtn = subsList && subsList.length > 0 ? false : true

    function renderData(checkData: any, showData: any, width: string) {
        return checkData !== -1 ? showData : <Skeleton width={width} className="loading-skeleton-text" />
    }

    function createSyncButton() {
        // name: string, namespace: string
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

    function createSubsCards(subsList: Subscription[], t: TFunction) {
        return subsList.map((sub) => {
            const appRepos = getApplicationRepos(selectedApplication[0], [sub], channels)
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
                                        appRepos={appRepos}
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
                                            subName={sub.metadata.name}
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
    }

    function ApplicationDetails() {
        const { t } = useTranslation()
        const [showSubCards, setShowSubCards] = useState(false)
        return (
            <Fragment>
                <div className="overview-cards-container">
                    <AcmDescriptionList
                        title={t('Details')}
                        leftItems={leftItems}
                        rightItems={rightItems}
                    ></AcmDescriptionList>
                    {isSearchAvailable() && (
                        <Card>
                            <CardBody>
                                <AcmButton
                                    id="search-resource"
                                    target="_blank"
                                    component="a"
                                    href={getUrl + targetLink}
                                    variant={ButtonVariant.link}
                                    rel="noreferrer"
                                    icon={<OutlinedWindowRestoreIcon />}
                                    iconPosition="right"
                                >
                                    Search resource
                                </AcmButton>
                            </CardBody>
                        </Card>
                    )}
                    <div className="overview-cards-subs-section">
                        {showSubCards && !disableBtn ? createSubsCards(subsList, t) : ''}
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
                </div>
            </Fragment>
        )
    }

    return (
        <AcmPageContent id="overview">
            <PageSection>
                <ApplicationDetails />
            </PageSection>
        </AcmPageContent>
    )
}
