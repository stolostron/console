/* Copyright Contributors to the Open Cluster Management project */
import {
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Flex,
  FlexItem,
  Label,
  LabelGroup,
  PageSection,
  Stack,
  Text,
  Tooltip,
} from '@patternfly/react-core'
import { ExternalLinkAltIcon, GlobeAmericasIcon, PencilAltIcon, SearchIcon } from '@patternfly/react-icons'
import _ from 'lodash'
import { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { generatePath, Link, useNavigate } from 'react-router-dom-v5-compat'
import { findResourceFieldLineNumber } from '../../../components/YamlEditor'
import { useTranslation } from '../../../lib/acm-i18next'
import { canUser } from '../../../lib/rbac-util'
import { NavigationPath } from '../../../NavigationPath'
import { ConfigMap, OwnerReference } from '../../../resources'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmAlert, AcmButton, AcmLoadingPage, AcmTable, compareStrings } from '../../../ui-components'
import { useAllClusters } from '../../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import { useSearchDetailsContext } from './DetailsPage'
import { PluginContext } from '../../../lib/PluginContext'
import KubevirtPluginWrapper from './KubevirtPluginWrapper'

export function ResourceSearchLink(props: {
  cluster: string
  apiversion: string
  kind: string
  name: string
  namespace?: string
  className?: string
}) {
  const { cluster, kind, name, namespace, apiversion, className } = props
  let searchParams = `?filters={"textsearch":"cluster%3A${cluster}%20kind%3A${kind}%20name%3A${name}`
  if (namespace) {
    searchParams = `${searchParams}%20namespace%3A${namespace}`
  }
  if (apiversion.includes('/')) {
    searchParams = `${searchParams}%20apigroup%3A${apiversion.split('/')[0]}%20apiversion%3A${apiversion.split('/')[1]}`
  } else {
    searchParams = `${searchParams}%20apiversion%3A${apiversion}`
  }
  return (
    <Link
      className={className}
      to={{
        pathname: NavigationPath.search,
        search: searchParams,
      }}
    >
      {name}
    </Link>
  )
}

export function LablesGroup(props: { labels: Record<string, string> }) {
  const { t } = useTranslation()
  const { labels } = props
  if (Object.keys(labels).length === 0) {
    return (
      <LabelGroup
        style={{
          color: 'var(--pf-v5-global--Color--200)',
          fontSize: '14px',
        }}
      >
        {t('No labels')}
      </LabelGroup>
    )
  }
  return (
    <LabelGroup>
      {Object.keys(labels).map((key) => (
        <Label key={key} id={key} color="blue">
          {key}
          {typeof labels[key] === 'string' && labels[key].trim() !== '' && `=${labels[key]}`}
        </Label>
      ))}
    </LabelGroup>
  )
}

export function getDate(timestamp?: string) {
  if (!timestamp) {
    return '-'
  }
  const mdate = new Date(timestamp)
  const localDateTime = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  })
  const utcDateTime = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
    timeZoneName: 'short',
  })
  return (
    <div style={{ display: 'flex', alignItems: 'baseline' }}>
      <GlobeAmericasIcon style={{ marginRight: '5px' }} />
      <Tooltip
        content={[
          <span className="co-nowrap" key="co-timestamp">
            {utcDateTime.format(mdate)}
          </span>,
        ]}
      >
        <span data-test="timestamp">{localDateTime.format(mdate)}</span>
      </Tooltip>
    </div>
  )
}

export function OwnerReferences(props: { ownerReferences?: OwnerReference[]; namespace?: string; cluster: string }) {
  const { ownerReferences, namespace, cluster } = props
  const { t } = useTranslation()
  if (!ownerReferences || ownerReferences.length === 0) {
    return <div>{t('No owners')}</div>
  }
  return (
    <ResourceSearchLink
      cluster={cluster}
      kind={ownerReferences[0].kind}
      name={ownerReferences[0].name}
      namespace={namespace}
      apiversion={ownerReferences[0].apiVersion}
    />
  )
}

interface ResourceCondition {
  type: string
  status: 'True' | 'False' | 'Unknown'
  lastTransitionTime?: string
  reason?: string
  message?: string
}
export function ResourceConditions(props: { conditions: ResourceCondition[] }) {
  const { conditions } = props
  const { t } = useTranslation()

  const cols = useMemo(
    () => [
      {
        header: t('Type'),
        cell: 'type',
      },
      {
        header: t('Status'),
        cell: 'status',
      },
      {
        header: t('Updated'),
        cell: (item: ResourceCondition) => {
          if (!item.lastTransitionTime) {
            return '-'
          }
          return getDate(item.lastTransitionTime)
        },
      },
      {
        header: t('Reason'),
        cell: (item: ResourceCondition) => {
          if (!item.reason) {
            return '-'
          }
          return item.reason
        },
      },
      {
        header: t('Message'),
        cell: (item: ResourceCondition) => {
          if (!item.message) {
            return '-'
          }
          return item.message
        },
      },
    ],
    [t]
  )

  return (
    <Fragment>
      <Divider />
      <PageSection variant={'light'}>
        <Text style={{ fontSize: '1.25rem', fontFamily: 'RedHatDisplay' }} component={'h2'}>
          {t('Conditions')}
        </Text>
        {conditions.length ? (
          <AcmTable<ResourceCondition>
            items={conditions}
            emptyState={undefined} // only shown when there are conditions
            columns={cols}
            keyFn={() => Math.random().toString(36).substring(7)}
            autoHidePagination={true}
          />
        ) : (
          t('No conditions found')
        )}
      </PageSection>
    </Fragment>
  )
}

export default function DetailsOverviewPage() {
  const { cluster, resource, resourceLoading, resourceError, name } = useSearchDetailsContext()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const allClusters = useAllClusters(true)
  const { useIsObservabilityInstalled, configMapsState, clusterManagementAddonsState } = useSharedAtoms()
  const configMaps = useRecoilValue(configMapsState)
  const clusterManagementAddons = useRecoilValue(clusterManagementAddonsState)
  const isObservabilityInstalled = useIsObservabilityInstalled()
  const [canEditResource, setCanEditResource] = useState<boolean>(false)

  const { labelsLineNumber, annotationsLineNumber, tolerationsLineNumber } = useMemo(() => {
    let tolerationsPath = '/spec/tolerations'
    if (resource) {
      if (resource.kind.toLowerCase() !== 'pod') {
        tolerationsPath = '/spec/template/spec/tolerations'
      }
      const labelsLineNumber = findResourceFieldLineNumber(resource, '/metadata/labels')
      const annotationsLineNumber = findResourceFieldLineNumber(resource, '/metadata/annotations')
      const tolerationsLineNumber = findResourceFieldLineNumber(resource, tolerationsPath)
      return { labelsLineNumber, annotationsLineNumber, tolerationsLineNumber }
    }
    return { labelsLineNumber: -1, annotationsLineNumber: -1, tolerationsLineNumber: -1 }
  }, [resource])

  useEffect(() => {
    if (resource) {
      const canEditResourcePromise = canUser('update', {
        apiVersion: resource.apiVersion,
        kind: resource.kind,
        metadata: {
          name: resource.metadata?.name ?? '',
          namespace: resource.metadata?.namespace ?? '',
        },
      })
      canEditResourcePromise.promise
        .then((result) => setCanEditResource(result.status?.allowed!))
        .catch((err) => console.error(err))
      return () => canEditResourcePromise.abort()
    }
  }, [resource])

  const resourceTolerationsCount: number = useMemo(() => {
    if (resource && resource.kind.toLowerCase() === 'pod') {
      const podTolerations = _.get(resource, 'spec.tolerations', {})
      return podTolerations.length
    }
    const resourceTolerations = _.get(resource, 'spec.template.spec.tolerations', {})
    return resourceTolerations.length
  }, [resource])

  const podSelectorLink = useMemo(() => {
    if (resource) {
      const requirements: any = []
      const podSelectors = _.get(resource, 'spec.selector', {})
      const matchLabels =
        !podSelectors.matchLabels && !podSelectors.matchExpressions ? podSelectors : podSelectors.matchLabels

      Object.keys(matchLabels || {})
        .sort((a: string, b: string) => compareStrings(a, b))
        .forEach(function (k) {
          requirements.push(`${k}=${matchLabels[k]}`)
        })

      if (requirements.length > 0) {
        const searchParams = encodeURIComponent(`cluster:${cluster} kind:Pod label:${requirements.join(',')}`)
        return (
          <Button
            data-test="pod-selector-btn"
            isInline
            icon={<SearchIcon />}
            onClick={() => {
              navigate(`${NavigationPath.search}?filters={"textsearch":"${searchParams}"}`)
            }}
            variant="link"
          >
            {requirements.join(', ')}
          </Button>
        )
      }
    }
  }, [cluster, resource, navigate])

  const nodeSelectorLink = useMemo(() => {
    if (resource) {
      const requirements: any = []
      const nodeSelectors = _.get(resource, 'spec.template.spec.nodeSelector', {})
      Object.keys(nodeSelectors || {})
        .sort((a: string, b: string) => compareStrings(a, b))
        .forEach(function (k) {
          requirements.push(nodeSelectors[k] !== '' ? `${k}=${nodeSelectors[k]}` : k)
        })

      if (requirements.length > 0) {
        const searchParams = encodeURIComponent(`cluster:${cluster} kind:Node label:${requirements.join(',')}`)
        return (
          <Button
            data-test="node-selector-btn"
            isInline
            icon={<SearchIcon />}
            onClick={() => {
              navigate(`${NavigationPath.search}?filters={"textsearch":"${searchParams}"}`)
            }}
            variant="link"
          >
            {requirements.join(', ')}
          </Button>
        )
      }
    }
  }, [cluster, resource, navigate])

  const vmCNVLink = useMemo(() => {
    const clusterURL = allClusters.filter((c) => c.name === cluster)?.[0]?.consoleURL
    if (resource) {
      return `${clusterURL}/k8s/ns/${resource.metadata?.namespace}/kubevirt.io~v1~VirtualMachine/${name}`
    }
    return ''
  }, [allClusters, cluster, resource, name])

  const vmMetricLink = useMemo(() => {
    const obsCont = clusterManagementAddons.filter((cma) => cma.metadata.name === 'observability-controller')
    let grafanaLink = obsCont?.[0]?.metadata?.annotations?.['console.open-cluster-management.io/launch-link']
    if (grafanaLink) {
      grafanaLink = new URL(grafanaLink).origin
    }
    if (isObservabilityInstalled && resource) {
      const vmDashboard = configMaps.filter(
        (cm: ConfigMap) => cm.metadata.name === 'grafana-dashboard-acm-openshift-virtualization-single-vm-view'
      )
      if (vmDashboard.length > 0) {
        const parsedDashboardData = JSON.parse(
          vmDashboard[0].data?.['acm-openshift-virtualization-single-vm-view.json']
        )
        const dashboardId = parsedDashboardData?.uid
        return `${grafanaLink}/d/${dashboardId}/executive-dashboards-single-virtual-machine-view?orgId=1&var-name=${name}&var-namespace=${resource?.metadata?.namespace}&var-cluster=${cluster}`
      }
    }
    return ''
  }, [cluster, clusterManagementAddons, configMaps, name, resource, isObservabilityInstalled])

  const { acmExtensions } = useContext(PluginContext)
  let VirtualMachinesOverviewTab: React.ComponentType<any> | undefined
  if (acmExtensions?.searchDetails && acmExtensions.searchDetails.length) {
    VirtualMachinesOverviewTab = acmExtensions.searchDetails[0].properties.component
  }

  if (resourceError) {
    return (
      <PageSection>
        <AcmAlert
          noClose={true}
          variant={'danger'}
          isInline={true}
          title={`${t('Error querying for resource:')} ${name}`}
          subtitle={resourceError}
        />
      </PageSection>
    )
  } else if (resourceLoading) {
    return (
      <PageSection>
        <AcmLoadingPage />
      </PageSection>
    )
  }

  if (resource && !resourceLoading && !resourceError) {
    return resource.kind === 'VirtualMachine' && VirtualMachinesOverviewTab ? (
      <KubevirtPluginWrapper currentCluster={cluster}>
        <VirtualMachinesOverviewTab obj={resource} />
      </KubevirtPluginWrapper>
    ) : (
      <PageSection>
        <PageSection variant={'light'}>
          <Stack hasGutter>
            <Text style={{ fontSize: '1.25rem', fontFamily: 'RedHatDisplay' }} component={'h2'}>
              {t('search.resource.details', { resource: resource.kind })}
            </Text>
            <DescriptionList
              columnModifier={{
                default: '2Col',
              }}
              style={{ fontSize: '14px' }}
            >
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
                <DescriptionListDescription>{resource.metadata?.name}</DescriptionListDescription>
              </DescriptionListGroup>

              {resource.metadata?.namespace && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Namespace')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Button
                      data-test="namespace-nav-link"
                      type="button"
                      isInline
                      onClick={() => {
                        navigate(
                          `${NavigationPath.resources}?cluster=${cluster}&kind=Namespace&apiversion=v1&name=${resource.metadata?.namespace}`
                        )
                      }}
                      variant="link"
                    >
                      {resource.metadata?.namespace}
                    </Button>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}

              <DescriptionListGroup>
                <DescriptionListTerm>{t('Cluster')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <Link
                    to={{
                      pathname: generatePath(NavigationPath.clusterOverview, {
                        name: cluster,
                        namespace: cluster,
                      }),
                    }}
                  >
                    {cluster}
                  </Link>
                </DescriptionListDescription>
              </DescriptionListGroup>

              <DescriptionListGroup>
                <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                  <FlexItem>
                    <DescriptionListTerm>{t('Labels')}</DescriptionListTerm>
                  </FlexItem>
                  {canEditResource && (
                    <FlexItem>
                      <Link
                        to={NavigationPath.resourceYAML + window.location.search}
                        state={{ scrollToLine: labelsLineNumber }}
                      >
                        {t('Edit')}
                        <PencilAltIcon style={{ marginLeft: '.5rem' }} />
                      </Link>
                    </FlexItem>
                  )}
                </Flex>
                <DescriptionListDescription
                  style={{
                    border: '1px solid var(--pf-v5-global--BorderColor--300)',
                    borderRadius: 'var(--pf-v5-c-label-group--m-category--BorderRadius)',
                    padding: '0.25rem',
                  }}
                >
                  <LablesGroup labels={resource.metadata?.labels ?? {}} />
                </DescriptionListDescription>
              </DescriptionListGroup>

              {podSelectorLink && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Pod selector')}</DescriptionListTerm>
                  <DescriptionListDescription>{podSelectorLink}</DescriptionListDescription>
                </DescriptionListGroup>
              )}

              {nodeSelectorLink && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Node selector')}</DescriptionListTerm>
                  <DescriptionListDescription>{nodeSelectorLink}</DescriptionListDescription>
                </DescriptionListGroup>
              )}

              {resourceTolerationsCount > 0 && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Tolerations')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {canEditResource ? (
                      <Link
                        to={NavigationPath.resourceYAML + window.location.search}
                        state={{ scrollToLine: tolerationsLineNumber }}
                      >
                        {t('tolerations.count', {
                          count: resourceTolerationsCount,
                        })}
                        <PencilAltIcon style={{ marginLeft: '.5rem' }} />
                      </Link>
                    ) : (
                      t('tolerations.count', {
                        count: resourceTolerationsCount,
                      })
                    )}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}

              <DescriptionListGroup>
                <DescriptionListTerm>{t('Annotations')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {canEditResource ? (
                    <Link
                      to={NavigationPath.resourceYAML + window.location.search}
                      state={{ scrollToLine: annotationsLineNumber }}
                    >
                      {t('annotations.count', {
                        count: Object.keys(resource.metadata?.annotations ?? {}).length,
                      })}
                      <PencilAltIcon style={{ marginLeft: '.5rem' }} />
                    </Link>
                  ) : (
                    t('annotations.count', {
                      count: Object.keys(resource.metadata?.annotations ?? {}).length,
                    })
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>

              <DescriptionListGroup>
                <DescriptionListTerm>{t('Created at')}</DescriptionListTerm>
                <DescriptionListDescription>{getDate(resource.metadata?.creationTimestamp)}</DescriptionListDescription>
              </DescriptionListGroup>

              <DescriptionListGroup>
                <DescriptionListTerm>{t('Owner')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <OwnerReferences
                    cluster={cluster}
                    ownerReferences={resource.metadata?.ownerReferences}
                    namespace={resource.metadata?.namespace}
                  />
                </DescriptionListDescription>
              </DescriptionListGroup>

              {resource.kind.toLowerCase() === 'virtualmachine' && (
                <>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Details')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      <AcmButton
                        variant="link"
                        component="a"
                        target="_blank"
                        isInline={true}
                        href={vmCNVLink}
                        icon={<ExternalLinkAltIcon />}
                        iconPosition="right"
                      >
                        {t('Launch')}
                      </AcmButton>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Web console')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      <AcmButton
                        variant="link"
                        component="a"
                        target="_blank"
                        isInline={true}
                        href={`${vmCNVLink}/console`}
                        icon={<ExternalLinkAltIcon />}
                        iconPosition="right"
                      >
                        {t('Launch')}
                      </AcmButton>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  {isObservabilityInstalled && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('Metrics')}</DescriptionListTerm>
                      <DescriptionListDescription>
                        <AcmButton
                          variant="link"
                          component="a"
                          target="_blank"
                          isInline={true}
                          href={vmMetricLink}
                          icon={<ExternalLinkAltIcon />}
                          iconPosition="right"
                        >
                          {t('Launch')}
                        </AcmButton>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                </>
              )}
            </DescriptionList>
          </Stack>
        </PageSection>
        {resource.status?.conditions && <ResourceConditions conditions={resource.status.conditions} />}
      </PageSection>
    )
  }
  return <Fragment />
}
