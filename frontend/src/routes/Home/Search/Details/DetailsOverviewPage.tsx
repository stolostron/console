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
import { GlobeAmericasIcon, PencilAltIcon, SearchIcon } from '@patternfly/react-icons'
import _ from 'lodash'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { generatePath, Link, useHistory } from 'react-router-dom'
import { findResourceFieldLineNumber } from '../../../../components/YamlEditor'
import { useTranslation } from '../../../../lib/acm-i18next'
import { canUser } from '../../../../lib/rbac-util'
import { NavigationPath } from '../../../../NavigationPath'
import { IResource, OwnerReference } from '../../../../resources'
import { AcmAlert, AcmLoadingPage, AcmTable } from '../../../../ui-components'

export function ResourceSearchLink(props: {
  cluster: string
  apiversion: string
  kind: string
  name: string
  namespace?: string
}) {
  const { cluster, kind, name, namespace, apiversion } = props
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
          color: 'var(--pf-global--Color--200)',
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

export default function DetailsOverviewPage(props: {
  cluster: string
  resource: IResource
  loading: boolean
  error: string
  name: string
}) {
  const { cluster, resource, loading, error, name } = props
  const { t } = useTranslation()
  const history = useHistory()
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
      const canDeleteSubscriptionPromise = canUser('update', {
        apiVersion: resource.apiVersion,
        kind: resource.kind,
        metadata: {
          name: resource.metadata?.name ?? '',
          namespace: resource.metadata?.namespace ?? '',
        },
      })
      canDeleteSubscriptionPromise.promise
        .then((result) => setCanEditResource(result.status?.allowed!))
        .catch((err) => console.error(err))
      return () => canDeleteSubscriptionPromise.abort()
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
        .sort()
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
              history.push(`${NavigationPath.search}?filters={"textsearch":"${searchParams}"}`)
            }}
            variant="link"
          >
            {requirements.join(', ')}
          </Button>
        )
      }
    }
  }, [cluster, resource, history])

  const nodeSelectorLink = useMemo(() => {
    if (resource) {
      const requirements: any = []
      const nodeSelectors = _.get(resource, 'spec.template.spec.nodeSelector', {})
      Object.keys(nodeSelectors || {})
        .sort()
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
              history.push(`${NavigationPath.search}?filters={"textsearch":"${searchParams}"}`)
            }}
            variant="link"
          >
            {requirements.join(', ')}
          </Button>
        )
      }
    }
  }, [cluster, resource, history])

  if (error) {
    return (
      <PageSection>
        <AcmAlert
          noClose={true}
          variant={'danger'}
          isInline={true}
          title={`${t('Error querying for resource:')} ${name}`}
          subtitle={error}
        />
      </PageSection>
    )
  } else if (loading) {
    return (
      <PageSection>
        <AcmLoadingPage />
      </PageSection>
    )
  }

  if (resource && !loading && !error) {
    return (
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
                        history.push(
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
                        to={{
                          pathname: NavigationPath.resourceYAML,
                          search: window.location.search,
                          state: { scrollToLine: labelsLineNumber },
                        }}
                      >
                        {t('Edit')}
                        <PencilAltIcon style={{ marginLeft: '.5rem' }} />
                      </Link>
                    </FlexItem>
                  )}
                </Flex>
                <DescriptionListDescription
                  style={{
                    border: '1px solid var(--pf-global--BorderColor--300)',
                    borderRadius: 'var(--pf-c-label-group--m-category--BorderRadius)',
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
                        to={{
                          pathname: NavigationPath.resourceYAML,
                          search: window.location.search,
                          state: { scrollToLine: tolerationsLineNumber },
                        }}
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
                      to={{
                        pathname: NavigationPath.resourceYAML,
                        search: window.location.search,
                        state: { scrollToLine: annotationsLineNumber },
                      }}
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
            </DescriptionList>
          </Stack>
        </PageSection>
        {resource.status?.conditions && <ResourceConditions conditions={resource.status.conditions} />}
      </PageSection>
    )
  }
  return <Fragment />
}
