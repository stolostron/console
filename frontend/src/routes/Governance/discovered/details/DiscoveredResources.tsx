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
import { useTranslation } from '../../../../lib/acm-i18next'
import { generatePath, Link } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../../../NavigationPath'
import { AcmTable, AcmTablePaginationContextProvider, compareStrings, IAcmTableColumn } from '../../../../ui-components'
import { DiffModal } from '../../components/DiffModal'

import { useDiscoveredDetailsContext } from './DiscoveredPolicyDetailsPage'
import { fireManagedClusterView } from '../../../../resources'
import { emptyResources } from '../../common/util'
import { flexKyvernoMessages } from '../../policies/policy-details/PolicyTemplateDetail/KyvernoTable'

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
    Object.keys(reasonCache).forEach((tmplKey) => {
      const foundReasons = reasonCache[tmplKey]
      if (foundReasons.loading === undefined) {
        setReasonCache((cache: any) => {
          return { ...cache, [tmplKey]: { ...foundReasons, loading: true } }
        })

        const tmpl = foundReasons.tmpl

        const tmplApiVersion = tmpl.apiGroup ? tmpl.apiGroup + '/' + tmpl.apiVersion : tmpl.apiVersion
        fireManagedClusterView(tmpl.clusterName, tmpl.kind, tmplApiVersion, tmpl.templateName, tmpl.templateNamespace)
          .then((viewResponse) => {
            const update: any = { tmpl, loading: false }

            switch (tmpl.kind) {
              case 'ConfigurationPolicy':
              case 'OperatorPolicy':
                update.reasons = viewResponse?.result?.status?.relatedObjects?.reduce((acc: any, relObj: any) => {
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
                break
              case 'CertificatePolicy':
                update.certificateMessages = viewResponse?.result?.status?.compliancyDetails
                break
              case 'PolicyReport':
              case 'ClusterPolicyReport':
                update.kyvernoMessages = viewResponse?.result?.results.map((r: any) => {
                  return { ruleName: r.rule, message: r.message }
                })
                break
              default:
                if (tmpl.apiGroup === 'constraints.gatekeeper.sh') {
                  update.reasons = viewResponse?.result?.status?.violations?.reduce((acc: any, violation: any) => {
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
                break
            }
            setReasonCache((cache: any) => {
              return { ...cache, [tmplKey]: update }
            })
          })
          .catch((err: Error) => {
            console.error('Error getting resource: ', err)
          })
      }
    })
  }, [reasonCache])

  const reasonColumn: IAcmTableColumn<any> = useMemo(() => {
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
            setReasonCache((cache: any) => {
              return { ...cache, [tmplKey]: { tmpl } }
            })
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
                setReasonCache((cache: any) => {
                  return { ...cache, [tmplKey]: { tmpl } }
                })
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
          className="pf-v5-c-form__group-label-help"
          style={{ marginLeft: 'var(--pf-v5-global--spacer--sm)' }}
          icon={<HelpIcon />}
        />
      </Tooltip>
    )
  }, [relatedObjects?.length, totalViolations, t])

  return (
    <div>
      <PageSection>
        <Card>
          <CardTitle>
            {isVAPB ? t('Parameter resources') : t('Related resources')}
            {apiGroup === 'constraints.gatekeeper.sh' && gatekeeperTooltip}
          </CardTitle>
          <CardBody>
            <AcmTablePaginationContextProvider localStorageKey="grc-discovered-resources">
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
            </AcmTablePaginationContextProvider>
          </CardBody>
        </Card>
      </PageSection>
    </div>
  )
}
