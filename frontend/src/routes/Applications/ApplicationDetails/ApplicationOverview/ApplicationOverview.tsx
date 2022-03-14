/* Copyright Contributors to the Open Cluster Management project */

import { AcmActionGroup, AcmButton, AcmDescriptionList, AcmPageContent, ListItems } from '@stolostron/ui-components'
import { useTranslation } from '../../../../lib/acm-i18next'
import {
    Button,
    ButtonVariant,
    Card,
    CardBody,
    Label,
    PageSection,
    Skeleton,
    Spinner,
    Tooltip,
} from '@patternfly/react-core'
import {
    FolderIcon,
    GripHorizontalIcon,
    OutlinedClockIcon,
    OutlinedQuestionCircleIcon,
    SyncAltIcon,
} from '@patternfly/react-icons'
import { useRecoilState } from 'recoil'
import { Fragment, useEffect, useState } from 'react'
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
import {
    Application,
    ApplicationKind,
    ApplicationSet,
    Channel,
    IResource,
    listNamespaces,
    NamespaceDefinition,
    Subscription,
} from '../../../../resources'
import ResourceLabels from '../../components/ResourceLabels'
import '../../css/ApplicationOverview.css'
import { TFunction } from 'i18next'
import { getApplicationRepos } from '../../Overview'
import { ApplicationDataType } from '../ApplicationDetails'
import { NavigationPath } from '../../../../NavigationPath'
import { ISyncResourceModalProps, SyncResourceModal } from '../../components/SyncResourceModal'
import { isSearchAvailable } from '../ApplicationTopology/helpers/search-helper'
import { DiagramIcons } from '../../../../components/Topology/shapes/DiagramIcons'
import { getDiagramElements } from '../ApplicationTopology/model/topology'
import { getAuthorizedNamespaces, rbacCreate } from '../../../../lib/rbac-util'

let leftItems: ListItems[] = []
let rightItems: ListItems[] = []

export function ApplicationOverviewPageContent(props: { applicationData: ApplicationDataType | undefined }) {
    const { applicationData } = props
    const { t } = useTranslation()
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
    const [hasSyncPermission, setHasSyncPermission] = useState(false)
    const openTabIcon = '#diagramIcons_open-new-tab'
    interface IClusterCountProps {
        localPlacement: boolean
        remoteCount: number
    }
    const clusterCount: IClusterCountProps = {
        localPlacement: false,
        remoteCount: 0,
    }
    let isArgoApp = false
    let isAppSet = false
    let isSubscription = false
    let disableBtn
    let subsList = []

    let getUrl = window.location.href
    getUrl = getUrl.substring(0, getUrl.indexOf('/multicloud/applications/'))

    useEffect(() => {
        const fetchNamespaces = async () => {
            return listNamespaces().promise
        }

        fetchNamespaces().then((ns) => {
            const fetchAuthorizedNamespaces = async () => {
                const authorizedNamespaces = await getAuthorizedNamespaces([rbacCreate(NamespaceDefinition)], ns)
                return {
                    authorizedNamespaces,
                    namespaces: ns,
                }
            }
            fetchAuthorizedNamespaces().then(({ authorizedNamespaces, namespaces }) => {
                // see if the user has access to all namespaces
                if (authorizedNamespaces.length < namespaces.length) {
                    setHasSyncPermission(false)
                } else {
                    setHasSyncPermission(true)
                }
            })
        })
    }, [])

    function renderData(checkData: any, showData: any, width?: string) {
        return checkData !== -1 ? showData : <Skeleton width={width} className="loading-skeleton-text" />
    }

    function getClusterField(searchLink: string, clusterCountString: string, count: IClusterCountProps) {
        if (count.remoteCount && clusterCountString !== 'None') {
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
        isAppSet = applicationData.application.isAppSet
        isSubscription = !isArgoApp && !isAppSet
        const { name, namespace } = applicationData.application.metadata
        const applicationResource = applicationData.application.app
        const appRepos = getApplicationRepos(applicationData.application.app, subscriptions, channels)
        const [apigroup, apiversion] = applicationResource.apiVersion.split('/')
        const searchParams: any = {
            properties: {
                apigroup,
                apiversion,
                kind: applicationResource.kind.toLowerCase(),
                name: applicationResource.metadata?.name,
                namespace: applicationResource.metadata?.namespace,
            },
            showRelated: 'cluster',
        }
        const searchLink = getSearchLink(searchParams)

        const clusterCountString = createClustersText({
            resource: applicationResource,
            clusterCount,
            clusterList: [],
            argoApplications,
            placementRules,
            subscriptions,
            localCluster,
        })

        ////////////////////////////////// argo items ////////////////////////////////////
        if (!isSubscription) {
            let lastSyncedTimeStamp = ''
            if (isArgoApp) {
                lastSyncedTimeStamp = _.get(applicationData, 'application.app.status.reconciledAt', '')
            } else if (isAppSet) {
                applicationData.application.appSetApps.forEach((appSet: ApplicationSet) => {
                    if (!lastSyncedTimeStamp) {
                        lastSyncedTimeStamp = _.get(appSet, 'status.reconciledAt', '')
                    }
                })
            }

            leftItems = [
                {
                    key: t('Name'),
                    value: (
                        <Fragment>
                            <div className="app-name-container">
                                <div className="app-name">{name}</div>
                                {createArgoAppIcon(isArgoApp, isAppSet, t)}
                            </div>
                        </Fragment>
                    ),
                },
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
                    key: t('Created'),
                    value: t(getShortDateTime(applicationData.application.metadata.creationTimestamp)),
                },
                {
                    key: t('Last reconciled'),
                    keyAction: (
                        <Tooltip content={t('Date and time of the most recent reconcile for application resources.')}>
                            <OutlinedQuestionCircleIcon className="help-icon" />
                        </Tooltip>
                    ),
                    value: getShortDateTime(lastSyncedTimeStamp),
                },
            ]
            rightItems = [
                {
                    key: t('Clusters'),
                    value: getClusterField(searchLink, clusterCountString, clusterCount),
                    keyAction: (
                        <Tooltip
                            content={
                                <div>
                                    {t(
                                        "Number of clusters where the grouped Argo applications' resources are deployed."
                                    )}
                                </div>
                            }
                        >
                            <OutlinedQuestionCircleIcon className="help-icon" />
                        </Tooltip>
                    ),
                },
                {
                    key: t('Cluster resource status'),
                    value: createStatusIcons(applicationData, t),
                    keyAction: (
                        <Tooltip content={t('Status represents the subscription selection within Resource topology.')}>
                            <OutlinedQuestionCircleIcon className="help-icon" />
                        </Tooltip>
                    ),
                },
                {
                    key: t('Respository Resource'),
                    value: (
                        <ResourceLabels
                            appRepos={appRepos as any[]}
                            translation={t}
                            isArgoApp={isAppSet || isArgoApp}
                            showSubscriptionAttributes={true}
                        />
                    ),
                },
            ]
        } else {
            /////////////////////////// subscription items //////////////////////////////////////////////
            const allSubscriptions = _.get(applicationData.application, 'allSubscriptions', [])
            subsList = applicationData.application.allSubscriptions
            disableBtn = subsList && subsList.length > 0 ? false : true

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
                                    createSyncButton(applicationData.application.allSubscriptions, setModalProps, t)
                                ) : (
                                    <Tooltip
                                        content={t(
                                            'You are not authorized to complete this action. See your cluster administrator for role-based access control information.'
                                        )}
                                        isContentLeftAligned
                                        position="right"
                                    >
                                        {createSyncButton(
                                            applicationData.application.allSubscriptions,
                                            setModalProps,
                                            t
                                        )}
                                    </Tooltip>
                                )
                            )}
                        </Fragment>
                    ),
                    keyAction: (
                        <Tooltip content={'Date and time of the most recent sync request for application resources.'}>
                            <OutlinedQuestionCircleIcon className="help-icon" />
                        </Tooltip>
                    ),
                },
            ]
            rightItems = [
                {
                    key: t('Clusters'),
                    value: getClusterField(searchLink, clusterCountString, clusterCount),
                },
                {
                    key: t('Cluster resource status'),
                    value: createStatusIcons(applicationData, t),
                    keyAction: (
                        <Tooltip content={t('Status represents the subscription selection within Resource topology.')}>
                            <OutlinedQuestionCircleIcon className="help-icon" />
                        </Tooltip>
                    ),
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
                {renderCardsSection({
                    resource: applicationData?.application?.app,
                    isSubscription,
                    isArgoApp,
                    isAppSet,
                    t,
                    getUrl,
                    openTabIcon,
                })}

                {/* Hide for argo */}
                {isSubscription && (
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

function createSyncButton(resources: IResource[], setModalProps: any, t: TFunction) {
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
                        resources,
                        t,
                    })
                }}
            >
                {t('Sync')}
                {syncInProgress && <Spinner size="sm" />}
            </AcmButton>
        </Fragment>
    )
}

interface INodeStatuses {
    green: number
    yellow: number
    red: number
    orange: number
}
function createStatusIcons(applicationData: ApplicationDataType, t: TFunction) {
    const { application, appData, statuses, topology } = applicationData
    let elements: {
        nodes: any[]
        links: any[]
    } = { nodes: [], links: [] }
    const nodeStatuses: INodeStatuses = { green: 0, yellow: 0, red: 0, orange: 0 }
    const canUpdateStatuses = !!statuses
    if (application && appData && topology) {
        elements = _.cloneDeep(getDiagramElements(appData, _.cloneDeep(topology), statuses, canUpdateStatuses, t))

        elements.nodes.forEach((node) => {
            //get pulse for all objects generated from a deployable
            const pulse: 'green' = _.get(node, 'specs.pulse')

            if (pulse) {
                // Get cluster resource statuses
                nodeStatuses[pulse]++
            }
        })
    }

    if (statuses) {
        // render the status of the application
        return (
            <Fragment>
                <DiagramIcons />
                <div className="status-icon-container green-status" id="green-resources">
                    <svg className="status-icon">
                        <use href={'#diagramIcons_checkmark'} style={{ fill: '#3E8635' }} />
                    </svg>
                    <div className="status-count">{nodeStatuses.green}</div>
                </div>
                <div className="status-icon-container orange-status" id="orange-resources">
                    <svg className="status-icon">
                        <use href={'#diagramIcons_pending'} />
                    </svg>
                    <div className="status-count">{nodeStatuses.orange}</div>
                </div>
                <div className="status-icon-container yellow-status" id="yellow-resources">
                    <svg className="status-icon">
                        <use href={'#diagramIcons_warning'} />
                    </svg>
                    <div className="status-count">{nodeStatuses.yellow}</div>
                </div>
                <div className="status-icon-container red-status" id="red-resources">
                    <svg className="status-icon">
                        <use href={'#diagramIcons_failure'} />
                    </svg>
                    <div className="status-count">{nodeStatuses.red}</div>
                </div>
            </Fragment>
        )
    }

    return <Spinner size="sm" />
}

interface IRenderCardsSectionProps {
    isSubscription: boolean
    isAppSet: boolean
    isArgoApp: boolean
    t: TFunction
    resource: IResource
    getUrl: string
    openTabIcon: string
}

function renderCardsSection(props: IRenderCardsSectionProps) {
    const { isSubscription, isAppSet, isArgoApp, t, resource, getUrl, openTabIcon } = props
    if (resource) {
        const [apigroup, apiversion] = resource.apiVersion.split('/')
        const targetLink = getSearchLink({
            properties: {
                name: resource.metadata?.name,
                namespace: resource.metadata?.namespace,
                kind: resource.kind.toLowerCase(),
                apigroup,
                apiversion,
            },
        })
        if (isSearchAvailable() && isSubscription) {
            return (
                <Card>
                    <CardBody>
                        <AcmButton
                            id="search-resource"
                            target="_blank"
                            component="a"
                            href={getUrl + targetLink}
                            variant={ButtonVariant.link}
                            rel="noreferrer"
                            icon={
                                <svg className="new-tab-icon">
                                    <use href={openTabIcon} />
                                </svg>
                            }
                            iconPosition="right"
                        >
                            {t('Search resource')}
                        </AcmButton>
                    </CardBody>
                </Card>
            )
        } else {
            if (isArgoApp || isAppSet) {
                return (
                    <Card className="argo-links-container">
                        <CardBody>
                            {isSearchAvailable() && (
                                <Fragment>
                                    <AcmActionGroup>
                                        <AcmButton
                                            href={getUrl + targetLink}
                                            variant={ButtonVariant.link}
                                            id="app-search-argo-apps-link"
                                            component="a"
                                            target="_blank"
                                            rel="noreferrer"
                                            icon={
                                                <svg className="new-tab-icon argo-app-link">
                                                    <use href={openTabIcon} />
                                                </svg>
                                            }
                                            iconPosition="right"
                                        >
                                            {t('Search Resource')}
                                        </AcmButton>
                                        <AcmButton
                                            href={
                                                getUrl + getSearchLinkForArgoApplications(resource, isArgoApp, isAppSet)
                                            }
                                            variant={ButtonVariant.link}
                                            id="app-search-argo-apps-link"
                                            component="a"
                                            target="_blank"
                                            rel="noreferrer"
                                            icon={
                                                <svg className="new-tab-icon argo-app-link">
                                                    <use href={openTabIcon} />
                                                </svg>
                                            }
                                            iconPosition="right"
                                        >
                                            {t('Search all related applications')}
                                        </AcmButton>
                                    </AcmActionGroup>
                                </Fragment>
                            )}
                        </CardBody>
                    </Card>
                )
            }
        }
    }

    return null
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

function createArgoAppIcon(isArgoApp: boolean, isAppSet: boolean, t: TFunction) {
    return <Fragment>{isArgoApp || isAppSet ? <Label color="blue">{t('Argo')}</Label> : ''}</Fragment>
}

function getSearchLinkForArgoApplications(resource: IResource, isArgoApp: boolean, isAppSet: boolean) {
    let sourcePath = ''
    if (isArgoApp) {
        sourcePath = 'spec.source'
    } else if (isAppSet) {
        sourcePath = 'spec.template.spec.source'
    }
    const { path, repoURL } = _.get(resource, sourcePath)
    const [apigroup, apiversion] = resource.apiVersion.split('/')
    if (resource) {
        return getSearchLink({
            properties: {
                kind: ApplicationKind.toLowerCase(),
                path,
                repoURL,
                apigroup,
                apiversion,
            },
        })
    }
    return ''
}
