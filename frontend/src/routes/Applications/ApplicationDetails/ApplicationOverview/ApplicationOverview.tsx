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
  ButtonVariant,
  Card,
  CardBody,
  PageSection,
  Spinner,
  Flex,
  FlexItem,
  Text,
  Tooltip,
} from '@patternfly/react-core'
import { OutlinedQuestionCircleIcon, SyncAltIcon } from '@patternfly/react-icons'
import { Fragment, useEffect, useState } from 'react'
import {
  getClusterCount,
  getClusterCountField,
  getClusterCountSearchLink,
  getClusterCountString,
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
import { TFunction } from 'react-i18next'
import { getApplicationRepos } from '../../Overview'
import { ApplicationDataType, useApplicationDetailsContext } from '../ApplicationDetails'
import { NavigationPath } from '../../../../NavigationPath'
import { ISyncResourceModalProps, SyncResourceModal } from '../../components/SyncResourceModal'
import { isSearchAvailable } from '../ApplicationTopology/helpers/search-helper'
import { getDiagramElements } from '../ApplicationTopology/model/topology'
import { getAuthorizedNamespaces, rbacCreate } from '../../../../lib/rbac-util'
import { generatePath, Link } from 'react-router-dom-v5-compat'
import { DrawerShapes } from '../ApplicationTopology/components/DrawerShapes'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import LabelWithPopover from '../../components/LabelWithPopover'
import AcmTimestamp from '../../../../lib/AcmTimestamp'
import { useLocalHubName } from '../../../../hooks/use-local-hub'

const clusterResourceStatusText = (t: TFunction) => t('Cluster resource status')
const clusterResourceStatusTooltipSubscription = (t: TFunction) =>
  t('Status represents the subscription selection within Resource topology.')
const clusterResourceStatusTooltipOther = (t: TFunction) => t('Status of resources within the topology.')

export function ApplicationOverviewPageContent() {
  const { applicationData } = useApplicationDetailsContext()
  const { t } = useTranslation()

  const { channelsState, namespacesState, subscriptionsState } = useSharedAtoms()

  const channels = useRecoilValue(channelsState)
  const subscriptions = useRecoilValue(subscriptionsState)
  const namespaces = useRecoilValue(namespacesState)
  const localCluster = useLocalHubName()
  const [modalProps, setModalProps] = useState<ISyncResourceModalProps | { open: false }>({
    open: false,
  })
  const [hasSyncPermission, setHasSyncPermission] = useState(false)
  const openTabIcon = '#drawerShapes_open-new-tab'

  let isArgoApp = false
  let isAppSet = false
  let isOCPApp = false
  let isFluxApp = false
  let isSubscription = false
  let isPullModel = false
  let subsList = []
  let leftItems: ListItems[] = []
  let rightItems: ListItems[] | undefined = undefined

  useEffect(() => {
    if (namespaces.length) {
      const fetchAuthorizedNamespaces = async () => {
        const authorizedNamespaces = await getAuthorizedNamespaces(
          [await rbacCreate(SubscriptionDefinition)],
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

  if (applicationData) {
    isArgoApp = applicationData.application?.isArgoApp
    isAppSet = applicationData.application?.isAppSet
    isOCPApp = applicationData.application?.isOCPApp
    isFluxApp = applicationData.application?.isFluxApp
    isSubscription = !isArgoApp && !isAppSet && !isOCPApp && !isFluxApp

    if (isAppSet) {
      if (
        applicationData.application?.app?.spec?.template?.metadata?.annotations?.[
          'apps.open-cluster-management.io/ocm-managed-cluster'
        ]
      ) {
        isPullModel = true
      }
    }
    const { name, namespace } = applicationData.application.metadata
    const applicationResource = applicationData.application.app

    const clusterList = applicationData.application?.clusterList ?? []
    const clusterCount = getClusterCount(clusterList, localCluster)
    const clusterCountString = getClusterCountString(t, clusterCount, clusterList, applicationResource)
    const clusterCountSearchLink = getClusterCountSearchLink(applicationResource, clusterCount, clusterList)

    ////////////////////////////////// argo items ////////////////////////////////////
    if (isOCPApp || isFluxApp) {
      const cluster = applicationData.application?.app?.cluster?.name
      leftItems = [
        { key: t('Name'), value: name },
        {
          key: t('Type'),
          value: <Fragment>{getApplicationType(isArgoApp, isAppSet, isOCPApp, isFluxApp, isPullModel, t)}</Fragment>,
        },
        { key: t('Namespace'), value: namespace },
      ]
      rightItems = [
        {
          key: t('Clusters'),
          value: cluster,
        },
        {
          key: clusterResourceStatusText(t),
          value: createStatusIcons(applicationData, t),
          keyAction: (
            <Tooltip content={clusterResourceStatusTooltipOther(t)}>
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
              </div>
            </Fragment>
          ),
        },
        {
          key: t('Type'),
          value: (
            <Fragment>
              {getApplicationType(isArgoApp, isAppSet, isOCPApp, isFluxApp, isPullModel, t)}
              <span style={{ paddingLeft: '10px' }} />
              {createArgoAppIcon(isArgoApp, isAppSet, t)}
            </Fragment>
          ),
        },
        {
          key: t('Namespace'),
          value: namespace,
          keyAction: (
            <Tooltip content={<div>{t('Namespace where the selected Argo application resources are deployed.')}</div>}>
              <OutlinedQuestionCircleIcon className="help-icon" />
            </Tooltip>
          ),
        },
        {
          key: t('Clusters'),
          value: getClusterCountField(clusterCount, clusterCountString, clusterCountSearchLink),
          keyAction: (
            <Tooltip
              content={
                <div>{t("Number of clusters where the grouped Argo applications' resources are deployed.")}</div>
              }
            >
              <OutlinedQuestionCircleIcon className="help-icon" />
            </Tooltip>
          ),
        },
        {
          key: t('Repository'),
          value: createSourceCards(applicationData?.application.app, t, subscriptions, channels),
        },
        {
          key: clusterResourceStatusText(t),
          value: createStatusIcons(applicationData, t),
          keyAction: (
            <Tooltip content={clusterResourceStatusTooltipOther(t)}>
              <OutlinedQuestionCircleIcon className="help-icon" />
            </Tooltip>
          ),
        },
        {
          key: t('Created'),
          value: <AcmTimestamp timestamp={applicationData.application.metadata.creationTimestamp} />,
        },
        {
          key: t('Last reconciled'),
          keyAction: (
            <Tooltip content={t('Date and time of the most recent reconcile for application resources.')}>
              <OutlinedQuestionCircleIcon className="help-icon" />
            </Tooltip>
          ),
          value: <AcmTimestamp timestamp={lastSyncedTimeStamp} />,
        },
      ]
    } else {
      /////////////////////////// subscription items //////////////////////////////////////////////
      const allSubscriptions = _.get(applicationData.application, 'allSubscriptions', [])
      subsList = allSubscriptions

      let lastSynced = ''
      allSubscriptions.forEach((subs: Subscription) => {
        if (!lastSynced) {
          lastSynced = _.get(subs, `metadata.annotations["apps.open-cluster-management.io/manual-refresh-time"]`, '')
        }
      })
      leftItems = [
        { key: t('Name'), value: name },
        {
          key: t('Type'),
          value: <Fragment>{getApplicationType(isArgoApp, isAppSet, isOCPApp, isFluxApp, isPullModel, t)}</Fragment>,
        },
        { key: t('Namespace'), value: namespace },
        {
          key: t('Clusters'),
          value: getClusterCountField(clusterCount, clusterCountString, clusterCountSearchLink),
        },
        {
          key: t('Repository'),
          value: createSubsCards(subsList, t, applicationData?.application?.app, channels),
        },
        {
          key: clusterResourceStatusText(t),
          value: createStatusIcons(applicationData, t),
          keyAction: (
            <Tooltip content={clusterResourceStatusTooltipSubscription(t)}>
              <OutlinedQuestionCircleIcon className="help-icon" />
            </Tooltip>
          ),
        },
        {
          key: t('Created'),
          value: <AcmTimestamp timestamp={applicationData.application.metadata.creationTimestamp} />,
        },
        {
          key: t('Last sync requested'),
          value: (
            <Flex gap={{ default: 'gapNone' }} alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <AcmTimestamp timestamp={lastSynced} />
              </FlexItem>
              <FlexItem>
                {hasSyncPermission ? (
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
                )}
              </FlexItem>
            </Flex>
          ),
          keyAction: (
            <Tooltip content={t('Date and time of the most recent sync request for application resources.')}>
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
      <DrawerShapes />
      <PageSection>
        <div className="overview-cards-container">
          <AcmDescriptionList title={t('Details')} leftItems={leftItems} rightItems={rightItems}></AcmDescriptionList>
        </div>
        {renderCardsSection({
          resource: applicationData?.application?.app,
          isSubscription,
          isArgoApp,
          isAppSet,
          t,
          openTabIcon,
        })}
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
        size="sm"
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
            <Link to={targetLink}>{t('Search resource')}</Link>
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
                      {t('Search resource')}
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

function createSourceCards(
  applicationSet: ApplicationSet,
  t: TFunction,
  subscriptions: Subscription[],
  channels: Channel[]
) {
  const appRepos = getApplicationRepos(applicationSet, subscriptions, channels)
  return appRepos?.map((appRepo) => {
    if (appRepo) {
      return (
        <Card key={appRepo.pathName}>
          <CardBody className="sub-card-container">
            <div className="sub-card-content">
              <ResourceLabels
                appRepos={[appRepo] as any[]}
                translation={t}
                isArgoApp={true}
                showSubscriptionAttributes={true}
              />
            </div>
            <div className="sub-card-content">
              <Text>{appRepo?.pathName}</Text>
            </div>
          </CardBody>
        </Card>
      )
    }
  })
}

function createSubsCards(
  subsList: (Subscription | undefined)[],
  t: TFunction,
  appResource: Application,
  channels: Channel[]
) {
  if (subsList.length) {
    return subsList.map((sub) => {
      const appRepos = getApplicationRepos(appResource, [sub] as Subscription[], channels) ?? []
      if (sub) {
        return (
          <Card key={sub.metadata.name}>
            <CardBody className="sub-card-container">
              <div className="sub-card-content">
                <ResourceLabels
                  appRepos={appRepos}
                  translation={t}
                  isArgoApp={false}
                  showSubscriptionAttributes={true}
                />
              </div>
              <div className="sub-card-content">
                <span>{appRepos[0]?.pathName}</span>
              </div>

              <div className="sub-card-content">
                {!sub.spec.timewindow?.windowtype ? (
                  <Link
                    to={generatePath(NavigationPath.editApplicationSubscription, {
                      name: appResource?.metadata?.name!,
                      namespace: appResource?.metadata?.namespace!,
                    })}
                  >
                    <AcmButton
                      id="set-time-window-link"
                      component="a"
                      variant={ButtonVariant.link}
                      rel="noreferrer"
                      size="sm"
                    >
                      {t('Set time window')}
                    </AcmButton>
                  </Link>
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
            </CardBody>
          </Card>
        )
      }
      return ''
    })
  } else {
    return t('None')
  }
}

function createArgoAppIcon(isArgoApp: boolean, isAppSet: boolean, t: TFunction) {
  return (
    <Fragment>
      {isArgoApp || isAppSet ? (
        <LabelWithPopover key="ArgoCD" labelContent={t('Argo')}>
          <div style={{ padding: '1rem 4rem 1rem 1rem' }}>
            {t(
              'The OpenShift Gitops operator is required on the managed clusters to have an application set pull model type. Make sure the operator is installed on all managed clusters you are targeting.'
            )}
          </div>
        </LabelWithPopover>
      ) : (
        <span />
      )}
    </Fragment>
  )
}

function getApplicationType(
  isArgoApp: boolean,
  isAppSet: boolean,
  isOCPApp: boolean,
  isFluxApp: boolean,
  isPullModel: boolean,
  t: TFunction
) {
  if (isArgoApp) {
    return t('ArgoCD')
  } else if (isAppSet) {
    if (isPullModel) {
      return t('Application set - Pull model')
    } else {
      return t('Application set - Push model')
    }
  } else if (isOCPApp) {
    return t('OpenShift')
  } else if (isFluxApp) {
    return t('Flux')
  }

  return t('Subscription') //default to subscription type
}

function getSearchLinkForArgoApplications(resource: IResource, isArgoApp: boolean, isAppSet: boolean) {
  let sourcePath = ''
  const sourcesPath = 'spec.template.spec.sources'
  let path = ''
  let repoURL = ''
  let chart = ''
  const repoURLList: any[] = []
  const chartList: any[] = []
  const pathList: any[] = []

  if (isArgoApp) {
    sourcePath = 'spec.source'
  } else if (isAppSet) {
    sourcePath = 'spec.template.spec.source'
  }

  const source = _.get(resource, sourcePath)
  const sources = _.get(resource, sourcesPath)

  sources?.forEach((source: { repoURL: string; chart: string; path: string }) => {
    const { repoURL, chart, path } = source
    if (repoURL) {
      repoURLList.push(repoURL)
    }

    if (chart) {
      chartList.push(chart)
    }

    if (path) {
      pathList.push(path)
    }
  })

  if (!sources && source) {
    const sourceObj = _.get(resource, sourcePath)
    path = sourceObj.path
    repoURL = sourceObj.repoURL
    chart = sourceObj.chart
  }

  const [apigroup, apiversion] = resource.apiVersion.split('/')
  return getSearchLink({
    properties: {
      kind: ApplicationKind.toLowerCase(),
      path: path || pathList,
      chart: chart || chartList,
      repoURL: repoURL || repoURLList,
      apigroup,
      apiversion,
    },
  })
}
