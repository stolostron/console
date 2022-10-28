/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmActionGroup,
    AcmButton,
    AcmDescriptionList,
    AcmInlineStatusGroup,
    AcmPageContent,
    ListItems,
} from '../../../../ui-components'
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
import { Fragment, useContext, useEffect, useState } from 'react'
import {
    getClusterCount,
    getClusterCountField,
    getClusterCountSearchLink,
    getClusterCountString,
    getClusterList,
    getShortDateTime,
    getSearchLink,
} from '../../helpers/resource-helper'
import { TimeWindowLabels } from '../../components/TimeWindowLabels'
import _ from 'lodash'
import { REQUEST_STATUS } from './actions'
import {
    Application,
    ApplicationKind,
    ApplicationSet,
    Channel,
    IResource,
    Subscription,
    SubscriptionDefinition,
} from '../../../../resources'
import ResourceLabels from '../../components/ResourceLabels'
import '../../css/ApplicationOverview.css'
import { TFunction } from 'i18next'
import { getApplicationRepos } from '../../Overview'
import { ApplicationDataType } from '../ApplicationDetails'
import { NavigationPath } from '../../../../NavigationPath'
import { ISyncResourceModalProps, SyncResourceModal } from '../../components/SyncResourceModal'
import { isSearchAvailable } from '../ApplicationTopology/helpers/search-helper'
import { getDiagramElements } from '../ApplicationTopology/model/topology'
import { getAuthorizedNamespaces, rbacCreate } from '../../../../lib/rbac-util'
import { Link } from 'react-router-dom'
import { useAllClusters } from '../../../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import { DiagramIcons } from '../../../../components/Topology/shapes/DiagramIcons'
import { useRecoilState } from '../../../../shared-recoil'
import { PluginContext } from '../../../../lib/PluginContext'

const clusterResourceStatusText = 'Cluster resource status'
const clusterResourceStatusTooltip = 'Status represents the subscription selection within Resource topology.'
let leftItems: ListItems[] = []
let rightItems: ListItems[] = []

export function ApplicationOverviewPageContent(props: { applicationData: ApplicationDataType | undefined }) {
    const { applicationData } = props
    const { t } = useTranslation()
    const localClusterStr = 'local-cluster'

    const { dataContext } = useContext(PluginContext)
    const { atoms } = useContext(dataContext)
    const { argoApplicationsState, channelsState, namespacesState, placementRulesState, subscriptionsState } = atoms

    const [argoApplications] = useRecoilState(argoApplicationsState)
    const [channels] = useRecoilState(channelsState)
    const [subscriptions] = useRecoilState(subscriptionsState)
    const [placementRules] = useRecoilState(placementRulesState)
    const [namespaces] = useRecoilState(namespacesState)

    let managedClusters = useAllClusters()
    managedClusters = managedClusters.filter((cluster) => {
        // don't show clusters in cluster pools in table
        if (cluster.hive.clusterPool) {
            return cluster.hive.clusterClaimName !== undefined
        } else {
            return true
        }
    })
    const localCluster = managedClusters.find((cls) => cls.name === localClusterStr)
    const [showSubCards, setShowSubCards] = useState(false)
    const [modalProps, setModalProps] = useState<ISyncResourceModalProps | { open: false }>({
        open: false,
    })
    const [hasSyncPermission, setHasSyncPermission] = useState(false)
    const openTabIcon = '#diagramIcons_open-new-tab'

    let isArgoApp = false
    let isAppSet = false
    let isOCPApp = false
    let isFluxApp = false
    let isSubscription = false
    let disableBtn
    let subsList = []

    useEffect(() => {
        if (namespaces.length) {
            const fetchAuthorizedNamespaces = async () => {
                const authorizedNamespaces = await getAuthorizedNamespaces(
                    [rbacCreate(SubscriptionDefinition)],
                    namespaces
                )
                return {
                    authorizedNamespaces,
                    namespaces,
                }
            }
            fetchAuthorizedNamespaces().then(({ authorizedNamespaces, namespaces: fetchedNamespaces }) => {
                // see if the user has access to all namespaces
                if (!authorizedNamespaces || authorizedNamespaces?.length < fetchedNamespaces?.length) {
                    setHasSyncPermission(false)
                } else {
                    setHasSyncPermission(true)
                }
            })
        }
    }, [namespaces])

    function renderData(checkData: any, showData: any, width?: string) {
        return checkData !== -1 ? showData : <Skeleton width={width} className="loading-skeleton-text" />
    }

    if (applicationData) {
        isArgoApp = applicationData.application?.isArgoApp
        isAppSet = applicationData.application?.isAppSet
        isOCPApp = applicationData.application?.isOCPApp
        isFluxApp = applicationData.application?.isFluxApp

        isSubscription = !isArgoApp && !isAppSet && !isOCPApp && !isFluxApp
        const { name, namespace } = applicationData.application.metadata
        const applicationResource = applicationData.application.app
        const appRepos = getApplicationRepos(applicationData.application.app, subscriptions, channels)

        const clusterList = getClusterList(
            applicationResource,
            argoApplications,
            placementRules,
            subscriptions,
            localCluster,
            managedClusters
        )
        const clusterCount = getClusterCount(clusterList)
        const clusterCountString = getClusterCountString(t, clusterCount, clusterList, applicationResource)
        const clusterCountSearchLink = getClusterCountSearchLink(applicationResource, clusterCount, clusterList)

        ////////////////////////////////// argo items ////////////////////////////////////
        if (isOCPApp || isFluxApp) {
            const cluster = applicationData.application?.app.cluster.name
            leftItems = [
                { key: 'Name', value: name },
                { key: 'Namespace', value: namespace },
            ]
            rightItems = [
                {
                    key: t('Clusters'),
                    value: cluster,
                },
                {
                    key: t(clusterResourceStatusText),
                    value: createStatusIcons(applicationData, t),
                    keyAction: (
                        <Tooltip content={t(clusterResourceStatusTooltip)}>
                            <OutlinedQuestionCircleIcon className="help-icon" />
                        </Tooltip>
                    ),
                },
            ]
        } else if (!isSubscription) {
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
                    value: getClusterCountField(clusterCount, clusterCountString, clusterCountSearchLink),
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
                    key: t(clusterResourceStatusText),
                    value: createStatusIcons(applicationData, t),
                    keyAction: (
                        <Tooltip content={t(clusterResourceStatusTooltip)}>
                            <OutlinedQuestionCircleIcon className="help-icon" />
                        </Tooltip>
                    ),
                },
                {
                    key: t('Repository Resource'),
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
            subsList = allSubscriptions
            disableBtn = subsList && subsList?.length > 0 ? false : true

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
                    value: getShortDateTime(applicationData.application.metadata.creationTimestamp),
                },
                {
                    key: t('Last sync requested'),
                    value: (
                        <Fragment>
                            {renderData(getShortDateTime(lastSynced), getShortDateTime(lastSynced), '30%')}
                            {renderData(
                                getShortDateTime(lastSynced),
                                hasSyncPermission ? (
                                    createSyncButton(
                                        applicationData.application.allSubscriptions,
                                        setModalProps,
                                        t,
                                        hasSyncPermission,
                                        subscriptions
                                    )
                                ) : (
                                    <Tooltip content={t('rbac.unauthorized')} isContentLeftAligned position="right">
                                        {createSyncButton(
                                            applicationData.application.allSubscriptions,
                                            setModalProps,
                                            t,
                                            hasSyncPermission,
                                            subscriptions
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
                    value: getClusterCountField(clusterCount, clusterCountString, clusterCountSearchLink),
                },
                {
                    key: t(clusterResourceStatusText),
                    value: createStatusIcons(applicationData, t),
                    keyAction: (
                        <Tooltip content={t(clusterResourceStatusTooltip)}>
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
            <DiagramIcons />
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
                                    ` (${subsList?.length})`,
                                '70%'
                            )}
                        </Button>
                    </div>
                )}
            </PageSection>
        </AcmPageContent>
    )
}

function createSyncButton(
    resources: IResource[],
    setModalProps: any,
    t: TFunction,
    hasSyncPermission: boolean,
    subscriptions: Subscription[]
) {
    const mutateStatus = ''
    const syncInProgress = mutateStatus === REQUEST_STATUS.IN_PROGRESS
    return (
        <Fragment>
            <AcmButton
                isDisabled={!hasSyncPermission}
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
                        subscriptions,
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
                if (
                    _.get(node, 'id', '').indexOf('--deployed') !== -1 ||
                    _.get(node, 'id', '').indexOf('--deployable') !== -1
                ) {
                    nodeStatuses[pulse]++
                }
            }
        })
    }

    if (statuses) {
        // render the status of the application
        return (
            <Fragment>
                <AcmInlineStatusGroup
                    healthy={nodeStatuses.green}
                    progress={nodeStatuses.orange}
                    warning={nodeStatuses.yellow}
                    danger={nodeStatuses.red}
                />
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
    openTabIcon: string
}

function renderCardsSection(props: IRenderCardsSectionProps) {
    const { isSubscription, isAppSet, isArgoApp, t, resource, openTabIcon } = props
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
                        <Link to={targetLink}>
                            {t('Search resource')}{' '}
                            <svg className="new-tab-icon">
                                <use href={openTabIcon} />
                            </svg>
                        </Link>
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
                                        <Link id="search-resource" to={targetLink}>
                                            {t('Search resource')}{' '}
                                            <svg className="new-tab-icon">
                                                <use href={openTabIcon} />
                                            </svg>
                                        </Link>
                                        <Link
                                            id="app-search-argo-apps-link"
                                            to={getSearchLinkForArgoApplications(resource, isArgoApp, isAppSet)}
                                        >
                                            {t('Search all related applications')}{' '}
                                            <svg className="new-tab-icon">
                                                <use href={openTabIcon} />
                                            </svg>
                                        </Link>
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
        subsList?.length &&
        subsList.map((sub) => {
            const appRepos = getApplicationRepos(appResource, [sub] as Subscription[], channels)
            if (sub) {
                return (
                    <Card
                        key={sub.metadata.name}
                        style={{
                            marginTop: '16px',
                        }}
                    >
                        <CardBody className="sub-card-container">
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
                        </CardBody>
                    </Card>
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
    const { path, repoURL, chart } = _.get(resource, sourcePath)
    const [apigroup, apiversion] = resource.apiVersion.split('/')
    if (resource) {
        return getSearchLink({
            properties: {
                kind: ApplicationKind.toLowerCase(),
                path,
                chart,
                repoURL,
                apigroup,
                apiversion,
            },
        })
    }
    return ''
}
