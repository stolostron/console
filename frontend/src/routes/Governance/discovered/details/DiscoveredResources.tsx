/* Copyright Contributors to the Open Cluster Management project */
import { Button, Card, CardBody, CardTitle, Icon, PageSection, Skeleton, Tooltip } from '@patternfly/react-core'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  ExternalLinkAltIcon,
  HelpIcon,
} from '@patternfly/react-icons'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { generatePath, Link } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { AcmTable, AcmTableStateProvider, compareStrings, IAcmTableColumn } from '../../../../ui-components'
import { DiffModal } from '../../components/DiffModal'

import { fleetResourceRequest } from '../../../../resources/utils/fleet-resource-request'
import { emptyResources } from '../../common/util'
import { flexKyvernoMessages } from '../../policies/policy-details/PolicyTemplateDetail/KyvernoTable'
import { useDiscoveredDetailsContext } from './DiscoveredPolicyDetailsPage'

const extractRelatedObjectReasons = (viewResponse: any, tmpl: any) => {
  return viewResponse?.status?.relatedObjects?.reduce((acc: any, relObj: any) => {
    const key =
      `${tmpl.clusterName}:${relObj?.object?.kind}:${relObj?.object?.apiVersion}` +
      `:${relObj?.object?.metadata?.namespace}:${relObj?.object?.metadata?.name}`
    return {
      ...acc,
      [key]: {
        reason: relObj?.reason,
        diff: relObj?.properties?.diff,
      },
    }
  }, {})
}

const extractGKViolationReasons = (viewResponse: any, tmpl: any) => {
  return viewResponse?.status?.violations?.reduce((acc: any, violation: any) => {
    const key =
      `${tmpl.clusterName}:${violation?.kind}:${violation?.group ? violation.group + '/' + violation?.version : violation?.version}` +
      `:${violation?.namespace}:${violation?.name}`
    return {
      ...acc,
      [key]: {
        reason: violation?.message,
      },
    }
  }, {})
}

const mapKyvernoResults = (r: any) => {
  return { ruleName: r.rule, message: r.message }
}

export function DiscoveredResources() {
  const { policyKind, apiGroup, isFetching, relatedResources, policyItems } = useDiscoveredDetailsContext()
  const { t } = useTranslation()
  const [relatedObjects, setRelatedObjects] = useState<any>(undefined)
  const isVAPB = apiGroup === 'admissionregistration.k8s.io' && policyKind === 'ValidatingAdmissionPolicyBinding'
  const isGatekeeperMutation = apiGroup === 'mutations.gatekeeper.sh'

  const totalViolations = useMemo(() => {
    // Only calculate for Gatekeeper constraints
    if (apiGroup !== 'constraints.gatekeeper.sh') return 0

    const policies = policyItems?.[0]?.policies
    if (!policies) return 0

    // Sum up violations across all clusters for this policy
    return policies.reduce((sum, policy) => {
      const violations = policy.totalViolations ?? 0
      return sum + violations
    }, 0)
  }, [policyItems, apiGroup])

  useEffect(() => {
    if (!isFetching) {
      if (!relatedResources || relatedResources.length === 0) {
        setRelatedObjects([])
      } else {
        setRelatedObjects(relatedResources)
      }
    }
  }, [relatedResources, isFetching])

  const violationColumn: IAcmTableColumn<any> = useMemo(() => {
    return {
      header: t('Violations'),
      sort: 'compliant',
      cell: (item: any) => {
        let violationCell = (
          <div>
            <Icon status="warning">
              <ExclamationTriangleIcon />
            </Icon>{' '}
            {t('No status')}
          </div>
        )
        if (item?.compliant === 'noncompliant') {
          violationCell = (
            <div>
              <Icon status="danger">
                <ExclamationCircleIcon />
              </Icon>{' '}
              {t('Violations')}{' '}
            </div>
          )
        } else if (item?.compliant === 'compliant') {
          violationCell = (
            <div>
              <Icon status="success">
                <CheckCircleIcon />
              </Icon>{' '}
              {t('No violations')}
            </div>
          )
        }

        let policyReportLink: ReactNode = <></>
        if (item.policyReport) {
          const { cluster, kind, name, namespace, apigroup, apiversion, _hubClusterResource } = item.policyReport
          const namespaceArg = namespace ? `&namespace=${namespace}` : ''
          const apigroupArg = apigroup ? `${apigroup}%2F` : ''
          const hubArg = _hubClusterResource ? `&_hubClusterResource=true` : ''
          policyReportLink = (
            <div>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={`${NavigationPath.resourceYAML}?cluster=${cluster}&kind=${kind}&apiversion=${apigroupArg}${apiversion}&name=${name}${namespaceArg}${hubArg}`}
              >
                {t('View report')}
                <ExternalLinkAltIcon style={{ verticalAlign: '-0.125em', marginLeft: '8px' }} />
              </a>
            </div>
          )
        }

        return (
          <div>
            {violationCell}
            {policyReportLink}
          </div>
        )
      },
    }
  }, [t])

  const [reasonCache, setReasonCache] = useState<any>({}) // keys like cluster:kind:groupVersion:namespace:name

  useEffect(() => {
    const updateReasonCacheEntry = (tmplKey: string, value: any) => {
      setReasonCache((cache: any) => ({ ...cache, [tmplKey]: value }))
    }

    const updateReasonCacheLoading = (tmplKey: string, foundReasons: any) => {
      updateReasonCacheEntry(tmplKey, { ...foundReasons, loading: true })
    }

    const updateReasonCacheAfterFetch = (tmplKey: string, update: any) => {
      updateReasonCacheEntry(tmplKey, update)
    }

    Object.keys(reasonCache).forEach((tmplKey) => {
      const foundReasons = reasonCache[tmplKey]
      if (foundReasons.loading === undefined) {
        updateReasonCacheLoading(tmplKey, foundReasons)
        const tmpl = foundReasons.tmpl
        const tmplApiVersion = tmpl.apiGroup ? tmpl.apiGroup + '/' + tmpl.apiVersion : tmpl.apiVersion

        fleetResourceRequest('GET', tmpl.clusterName, {
          apiVersion: tmplApiVersion,
          kind: tmpl.kind,
          name: tmpl.templateName,
          namespace: tmpl.templateNamespace,
        })
          .then((res: any) => {
            if ('errorMessage' in res) {
              console.error('Error getting resource: ', res.errorMessage)
            } else {
              const update: any = { tmpl, loading: false }

              switch (tmpl.kind) {
                case 'ConfigurationPolicy':
                case 'OperatorPolicy':
                  update.reasons = extractRelatedObjectReasons(res, tmpl)
                  break
                case 'CertificatePolicy':
                  update.certificateMessages = res?.status?.compliancyDetails
                  break
                case 'PolicyReport':
                case 'ClusterPolicyReport':
                  update.kyvernoMessages = res?.results.map(mapKyvernoResults)
                  break
                default:
                  if (tmpl.apiGroup === 'constraints.gatekeeper.sh') {
                    update.reasons = extractGKViolationReasons(res, tmpl)
                  }
                  break
              }
              updateReasonCacheAfterFetch(tmplKey, update)
            }
          })
          .catch((err) => {
            console.error('Error getting resource: ', err)
          })
      }
    })
  }, [reasonCache])

  const reasonColumn: IAcmTableColumn<any> = useMemo(() => {
    const resetReasonCacheForTemplate = (tmplKey: string, tmpl: any) => {
      setReasonCache((cache: any) => ({ ...cache, [tmplKey]: { tmpl } }))
    }

    if (
      apiGroup === 'policy.open-cluster-management.io' ||
      apiGroup === 'kyverno.io' ||
      apiGroup === 'constraints.gatekeeper.sh'
    ) {
      return {
        header: t('Reason'),
        cell: (item: any) => {
          const tmpl: any =
            apiGroup === 'kyverno.io' && item.policyReport
              ? {
                  ...item.policyReport,
                  clusterName: item.policyReport.cluster,
                  templateName: item.policyReport.name,
                  templateNamespace: item.policyReport.namespace,
                  apiGroup: item.policyReport.apigroup,
                  apiVersion: item.policyReport.apiversion,
                }
              : item.templateInfo

          const tmplApiVersion = tmpl.apiGroup ? tmpl.apiGroup + '/' + tmpl.apiVersion : tmpl.apiVersion
          const tmplKey = `${tmpl.clusterName}:${tmpl.kind}:${tmplApiVersion}:${tmpl.templateName}:${tmpl.templateNamespace}`

          const foundReasons = reasonCache[tmplKey]
          if (foundReasons === undefined) {
            resetReasonCacheForTemplate(tmplKey, tmpl)
          } else if (foundReasons.loading === false) {
            if (apiGroup === 'kyverno.io' && foundReasons?.kyvernoMessages) {
              return flexKyvernoMessages(foundReasons.kyvernoMessages)
            } else if (
              policyKind === 'ConfigurationPolicy' ||
              policyKind === 'OperatorPolicy' ||
              apiGroup === 'constraints.gatekeeper.sh'
            ) {
              const key = `${item.cluster}:${item.kind}:${item.groupversion}:${item.namespace}:${item.name}`
              const reasonInfo = foundReasons.reasons?.[key]

              if (reasonInfo && !reasonInfo.reason) {
                // resource must be newer than the cached view: need to fetch it again
                resetReasonCacheForTemplate(tmplKey, tmpl)
              } else {
                return (
                  <>
                    {reasonInfo?.reason}
                    <DiffModal diff={reasonInfo?.diff} kind={item.kind} namespace={item.namespace} name={item.name} />
                  </>
                )
              }
            } else if (policyKind === 'CertificatePolicy') {
              const message = foundReasons?.certificateMessages?.[item.namespace]?.message
                ?.split('\n')
                .filter((m: string) => m.startsWith(item.name))
                .join('\n')
              return <span style={{ whiteSpace: 'pre-wrap' }}>{message}</span>
            }
          }

          return <Skeleton fontSize="sm" width="250px" />
        },
      }
    }

    return {
      header: t('Reason'),
      cell: () => '-',
    }
  }, [t, apiGroup, reasonCache, policyKind])

  const resourceCols = useMemo(() => {
    const cols = [
      {
        header: t('Name'),
        cell: (item: any) => {
          const { created, cluster, groupversion, kind, name, namespace } = item
          if (created && cluster && kind && groupversion && name && name != '-') {
            const namespaceArg = namespace ? `&namespace=${namespace}` : ''
            return (
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={`${NavigationPath.resourceYAML}?cluster=${cluster}&kind=${kind}&apiversion=${groupversion}&name=${name}${namespaceArg}`}
              >
                {name} <ExternalLinkAltIcon style={{ verticalAlign: '-0.125em', marginLeft: '8px' }} />
              </a>
            )
          }
          return name
        },
        sort: 'name',
        search: 'name',
      },
      {
        header: t('Cluster'),
        cell: (item: any) => {
          return (
            <Link to={generatePath(NavigationPath.discoveredPolicyDetails, item.templateInfo)}>{item.cluster}</Link>
          )
        },
        sort: 'cluster',
        search: 'cluster',
      },
      {
        header: t('Namespace'),
        cell: (item: any) => item?.namespace ?? '-',
        search: (item: any) => item?.namespace,
        sort: (a: any, b: any) => compareStrings(a.namespace, b.namespace),
      },
      {
        header: t('Kind'),
        cell: 'kind',
        sort: 'kind',
        search: 'kind',
      },
      {
        header: t('API version'),
        cell: 'groupversion',
        sort: 'groupversion',
        search: 'groupversion',
      },
    ]

    if (isVAPB || isGatekeeperMutation) {
      return cols
    }
    return [...cols, violationColumn, reasonColumn]
  }, [isVAPB, isGatekeeperMutation, violationColumn, reasonColumn, t])

  const emptyState: JSX.Element = useMemo(() => {
    return emptyResources(isVAPB, isGatekeeperMutation, t)
  }, [isVAPB, isGatekeeperMutation, t])

  const gatekeeperTooltip = useMemo(() => {
    const shouldShowTooltip = relatedObjects?.length && relatedObjects.length < totalViolations
    if (!shouldShowTooltip) return null

    return (
      <Tooltip content={t('discoveredPolicies.tooltip.gatekeeperRelatedResources', { limit: relatedObjects.length })}>
        <Button
          variant="plain"
          aria-label="More info"
          onClick={(e) => e.preventDefault()}
          className="pf-v6-c-form__group-label-help"
          style={{ marginLeft: 'var(--pf-t--global--spacer--sm)' }}
          icon={<HelpIcon />}
        />
      </Tooltip>
    )
  }, [relatedObjects?.length, totalViolations, t])

  return (
    <div>
      <PageSection hasBodyWrapper={false}>
        <Card>
          <CardTitle>
            {isVAPB ? t('Parameter resources') : t('Related resources')}
            {apiGroup === 'constraints.gatekeeper.sh' && gatekeeperTooltip}
          </CardTitle>
          <CardBody>
            <AcmTableStateProvider localStorageKey="grc-discovered-resources">
              <AcmTable
                items={relatedObjects}
                emptyState={emptyState}
                columns={resourceCols}
                keyFn={(item: any) => `${item?.cluster}.${item?.kind}.${item?.namespace}.${item?.name}`}
                initialSort={{
                  index: 0,
                  direction: 'asc',
                }}
              />
            </AcmTableStateProvider>
          </CardBody>
        </Card>
      </PageSection>
    </div>
  )
}
