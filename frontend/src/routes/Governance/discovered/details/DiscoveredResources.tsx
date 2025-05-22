/* Copyright Contributors to the Open Cluster Management project */
import { Card, CardBody, CardTitle, Icon, PageSection, Skeleton } from '@patternfly/react-core'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  ExternalLinkAltIcon,
} from '@patternfly/react-icons'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'
import { generatePath, Link } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../../../NavigationPath'
import {
  AcmEmptyState,
  AcmTable,
  AcmTablePaginationContextProvider,
  compareStrings,
  IAcmTableColumn,
} from '../../../../ui-components'
import { DiffModal } from '../../components/DiffModal'

import { useDiscoveredDetailsContext } from './DiscoveredPolicyDetailsPage'
import { fireManagedClusterView } from '../../../../resources'
import { emptyResources } from '../../common/util'
import { flexKyvernoMessages } from '../../policies/policy-details/PolicyTemplateDetail/KyvernoTable'

export function DiscoveredResources() {
  const { policyKind, apiGroup, isFetching, relatedResources } = useDiscoveredDetailsContext()
  const { t } = useTranslation()
  const [relatedObjects, setRelatedObjects] = useState<any>(undefined)
  const isVAPB = apiGroup === 'admissionregistration.k8s.io' && policyKind === 'ValidatingAdmissionPolicyBinding'
  const isGatekeeperMutation = apiGroup === 'mutations.gatekeeper.sh'

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
        reasonCache[tmplKey] = { ...foundReasons, loading: true }
        setReasonCache({ ...reasonCache })

        const tmpl = foundReasons.tmpl

        const tmplApiVersion = tmpl.apiGroup ? tmpl.apiGroup + '/' + tmpl.apiVersion : tmpl.apiVersion
        fireManagedClusterView(tmpl.clusterName, tmpl.kind, tmplApiVersion, tmpl.templateName, tmpl.templateNamespace)
          .then((viewResponse) => {
            const reasons: any = {}

            switch (tmpl.kind) {
              case 'ConfigurationPolicy':
              case 'OperatorPolicy':
                viewResponse?.result?.status?.relatedObjects?.forEach((relObj: any) => {
                  const key =
                    `${tmpl.clusterName}:${relObj?.object?.kind}:${relObj?.object?.apiVersion}` +
                    `:${relObj?.object?.metadata?.namespace}:${relObj?.object?.metadata?.name}`
                  reasons[key] = {
                    reason: relObj?.reason,
                    diff: relObj?.properties?.diff,
                  }
                })
                reasonCache[tmplKey] = { tmpl, reasons, loading: false }
                break
              case 'CertificatePolicy':
                reasonCache[tmplKey] = {
                  tmpl,
                  certificateMessages: viewResponse?.result?.status?.compliancyDetails,
                  loading: false,
                }
                break
              case 'PolicyReport':
              case 'ClusterPolicyReport':
                reasonCache[tmplKey] = {
                  tmpl,
                  kyvernoMessages: viewResponse?.result?.results.map((r: any) => {
                    return { ruleName: r.rule, message: r.message }
                  }),
                  loading: false,
                }
                break
            }
            setReasonCache({ ...reasonCache })
          })
          .catch((err: Error) => {
            console.error('Error getting resource: ', err)
          })
      }
    })
  }, [reasonCache])

  const reasonColumn: IAcmTableColumn<any> = useMemo(() => {
    if (apiGroup === 'policy.open-cluster-management.io' || apiGroup === 'kyverno.io') {
      return {
        header: t('Reason'),
        cell: (item: any) => {
          let tmpl: any = {}

          if (apiGroup === 'kyverno.io' && item.policyReport) {
            tmpl = {
              ...item.policyReport,
              clusterName: item.policyReport.cluster,
              templateName: item.policyReport.name,
              templateNamespace: item.policyReport.namespace,
              apiGroup: item.policyReport.apigroup,
              apiVersion: item.policyReport.apiversion,
            }
          } else {
            tmpl = item.templateInfo
          }

          const tmplApiVersion = tmpl.apiGroup ? tmpl.apiGroup + '/' + tmpl.apiVersion : tmpl.apiVersion
          const tmplKey = `${tmpl.clusterName}:${tmpl.kind}:${tmplApiVersion}:${tmpl.templateName}:${tmpl.templateNamespace}`

          const foundReasons = reasonCache[tmplKey]
          if (foundReasons === undefined) {
            reasonCache[tmplKey] = { tmpl }
            setReasonCache({ ...reasonCache })
          } else if (foundReasons.loading === false) {
            if (apiGroup === 'kyverno.io' && foundReasons?.kyvernoMessages) {
              return flexKyvernoMessages(foundReasons.kyvernoMessages)
            } else if (policyKind === 'ConfigurationPolicy' || policyKind === 'OperatorPolicy') {
              const key = `${item.cluster}:${item.kind}:${item.groupversion}:${item.namespace}:${item.name}`
              const reasonInfo = foundReasons.reasons?.[key]

              if (reasonInfo && !reasonInfo.reason) {
                // resource must be newer than the cached view: need to fetch it again
                reasonCache[tmplKey] = { tmpl, state: 'fire' }
                setReasonCache({ ...reasonCache })
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
    if (apiGroup.includes('gatekeeper')) {
      return (
        <AcmEmptyState
          title={t('No related resources')}
          message={t('Related resources are not collected for Gatekeeper resources across clusters.')}
        />
      )
    }
    return emptyResources(isVAPB, isGatekeeperMutation, t)
  }, [isVAPB, isGatekeeperMutation, apiGroup, t])

  return (
    <div>
      <PageSection>
        <Card>
          <CardTitle>{isVAPB ? t('Parameter resources') : t('Related resources')}</CardTitle>
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
