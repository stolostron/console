/* Copyright Contributors to the Open Cluster Management project */
import { Card, CardBody, CardTitle, Icon, PageSection } from '@patternfly/react-core'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  ExternalLinkAltIcon,
} from '@patternfly/react-icons'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'

import { NavigationPath } from '../../../../../NavigationPath'
import {
  AcmAlert,
  AcmDescriptionList,
  AcmEmptyState,
  AcmTable,
  AcmTablePaginationContextProvider,
  compareStrings,
  IAcmTableColumn,
  ListItems,
} from '../../../../../ui-components'
import { DiffModal } from '../../../components/DiffModal'
import { useTemplateDetailsContext } from './PolicyTemplateDetailsPage'
import { useParams } from 'react-router-dom-v5-compat'
import { getEngineWithSvg } from '../../../common/util'
import { useFetchKyvernoRelated, useFetchVapb, useFetchVapbParamRefs } from './PolicyTemplateDetailHooks'
import { addRowsForHasVapb, addRowsForOperatorPolicy, addRowsForVapb } from './PolicyTemplateDetailsColumns'
import { KyvernoRelatedResources } from './KyvernoRelatedResources'

export function PolicyTemplateDetails() {
  const { t } = useTranslation()
  const urlParams = useParams()
  const name = urlParams.templateName ?? '-'
  const namespace = urlParams.templateNamespace
  const kind = urlParams.kind ?? ''
  const apiGroup = urlParams.apiGroup ?? ''
  const apiVersion = urlParams.apiVersion ?? ''
  const { clusterName, template, templateLoading, handleAuditViolation } = useTemplateDetailsContext()
  const [relatedObjects, setRelatedObjects] = useState<any>(undefined)
  const vapb = useFetchVapb() // Used by gatekeeper constraints and kyverno resources
  const vapbRelated = useFetchVapbParamRefs() // Used when just displaying a VAPB
  const kyvernoRelated = useFetchKyvernoRelated()
  const isKyverno = ['kyverno.io'].includes(apiGroup)
  const isVAPB = apiGroup === 'admissionregistration.k8s.io' && kind === 'ValidatingAdmissionPolicyBinding'
  const hasVapb = ['constraints.gatekeeper.sh', 'kyverno.io'].includes(apiGroup)

  useEffect(() => {
    if (isKyverno && kyvernoRelated.relatedItems !== undefined && kyvernoRelated.relatedItems) {
      setRelatedObjects(kyvernoRelated.relatedItems)
      if (kyvernoRelated.violationNum != undefined) {
        handleAuditViolation(kyvernoRelated.violationNum)
      }
    }
  }, [kyvernoRelated, apiGroup, isKyverno, handleAuditViolation])

  useEffect(() => {
    if (isVAPB && vapbRelated.relatedItems !== undefined && vapbRelated.relatedItems) {
      setRelatedObjects(vapbRelated.relatedItems)
    }
  }, [vapbRelated, apiGroup, kind, isVAPB])

  useEffect(() => {
    if (apiGroup === 'constraints.gatekeeper.sh' && template?.status?.totalViolations !== undefined) {
      handleAuditViolation(template.status.totalViolations)
    }

    if (template?.status?.relatedObjects?.length) {
      const relObjs = template.status.relatedObjects.map((obj: any) => {
        obj.cluster = clusterName
        return obj
      })

      setRelatedObjects(relObjs)

      return
    } else if (
      // Detect if this is a Gatekeeper constraint and is populated with audit results from a newer Gatekeeper. Older
      // Gatekeeper installations don't set 'group' and 'version'.
      apiGroup === 'constraints.gatekeeper.sh' &&
      template?.status?.violations?.length &&
      template.status.violations[0].version !== undefined
    ) {
      const relObjs = template.status.violations.map((violation: any) => {
        return {
          cluster: clusterName,
          compliant: 'NonCompliant',
          object: {
            apiVersion: violation.group === '' ? violation.version : `${violation.group}/${violation.version}`,
            kind: violation.kind,
            metadata: {
              name: violation.name,
              namespace: violation.namespace,
            },
          },
          reason: violation.message,
        }
      })

      setRelatedObjects(relObjs)

      return
    }

    // Data from Search-api handles their loading page
    if (!templateLoading && !isKyverno) {
      setRelatedObjects([])
    }
  }, [apiGroup, clusterName, template, templateLoading, isKyverno, handleAuditViolation])

  const descriptionItems = useMemo(() => {
    let cols: ListItems[] = [
      {
        key: t('Name'),
        value: name,
      },
      {
        key: t('Engine'),
        value: kind ? getEngineWithSvg(apiGroup) : '-',
      },
      {
        key: t('Cluster'),
        value: clusterName || '-',
      },
      {
        key: t('Kind'),
        value: kind ?? '-',
      },
      {
        key: t('API version'),
        value: apiVersion ? apiGroup + '/' + apiVersion : apiGroup,
      },
    ]

    // Namespaced policy
    if (namespace) {
      cols = [
        ...cols.slice(0, 1),
        {
          key: t('Namespace'),
          value: namespace,
        },
        ...cols.slice(1),
      ]
    }

    addRowsForHasVapb(cols, hasVapb, vapb.loading, vapb.vapbItems, apiGroup, clusterName, name)

    addRowsForOperatorPolicy(cols, template, kind, t)

    addRowsForVapb(cols, template, clusterName, kind)

    return cols
  }, [t, name, kind, apiGroup, clusterName, apiVersion, namespace, hasVapb, template, vapb.loading, vapb.vapbItems])

  const violationColumn: IAcmTableColumn<any> = useMemo(() => {
    return {
      header: t('Violations'),
      sort: (a: any, b: any) => compareStrings(a.compliant, b.compliant),
      cell: (item: any) => {
        let violationCell = <></>
        let compliant = item.compliant ?? '-'
        compliant = compliant && typeof compliant === 'string' ? compliant.trim().toLowerCase() : '-'

        switch (compliant) {
          case 'compliant':
            violationCell = (
              <div>
                <Icon status="success">
                  <CheckCircleIcon />
                </Icon>{' '}
                {t('No violations')}
              </div>
            )
            break
          case 'noncompliant':
            violationCell = (
              <div>
                <Icon status="danger">
                  <ExclamationCircleIcon />
                </Icon>{' '}
                {t('Violations')}{' '}
                <DiffModal
                  diff={item.properties?.diff}
                  kind={item.object?.kind}
                  namespace={item.object?.metadata?.namespace}
                  name={item.object?.metadata?.name}
                />
              </div>
            )
            break
          case 'inapplicable':
            violationCell = (
              <div>
                <ExclamationTriangleIcon color="var(--pf-v5-global--warning-color--100)" /> {t('Inapplicable')}
              </div>
            )
            break
          case 'unknowncompliancy':
            if (kind === 'OperatorPolicy') {
              switch (item.object?.kind) {
                case 'Deployment':
                case 'CustomResourceDefinition':
                  violationCell = (
                    <div>
                      <Icon status="warning">
                        <ExclamationTriangleIcon />
                      </Icon>{' '}
                      {t('Inapplicable')}
                    </div>
                  )
                  break
              }
            }
            break
          // falls through to 'No status'
          default:
            violationCell = (
              <div>
                <Icon status="warning">
                  <ExclamationTriangleIcon />
                </Icon>{' '}
                {t('No status')}
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
  }, [t, kind])

  const relatedResourceColumns = useMemo(
    () => [
      {
        header: t('Name'),
        cell: (item: any) => {
          const {
            cluster,
            reason,
            object: {
              apiVersion,
              kind,
              metadata: { name, namespace = '' },
            },
          } = item
          if (reason === 'Resource not found but should exist' || reason === 'Resource not found as expected') {
            return name
          }
          if (cluster && kind && apiVersion && name && name != '-') {
            const namespaceArg = namespace ? `&namespace=${namespace}` : ''
            return (
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={`${NavigationPath.resourceYAML}?cluster=${cluster}&kind=${kind}&apiversion=${apiVersion}&name=${name}${namespaceArg}`}
              >
                {name} <ExternalLinkAltIcon style={{ verticalAlign: '-0.125em', marginLeft: '8px' }} />
              </a>
            )
          }
          return name
        },
        sort: 'object.metadata.name',
        search: 'object.metadata.name',
      },
      {
        header: t('Namespace'),
        cell: (item: any) => item.object?.metadata?.namespace ?? '-',
        search: (item: any) => item.object?.metadata?.namespace,
        sort: (a: any, b: any) => compareStrings(a.object?.metadata?.namespace, b.object?.metadata?.namespace),
      },
      {
        header: t('Kind'),
        cell: 'object.kind',
        sort: 'object.kind',
        search: 'object.kind',
      },
      {
        header: t('API version'),
        cell: 'object.apiVersion',
        sort: 'object.apiVersion',
        search: 'object.apiVersion',
      },
      violationColumn,
      {
        header: t('Reason'),
        cell: 'reason',
        search: 'reason',
      },
    ],
    [t, violationColumn]
  )

  const paramRefVAPBColumns = useMemo(
    () => [
      {
        header: t('Name'),
        cell: (item: any) => {
          const { cluster, kind, name, namespace, apiversion, apigroup, _hubClusterResource } = item
          const apigroupArg = apigroup ? `${apigroup}%2F` : ''
          const namespaceArg = namespace ? `&namespace=${namespace}` : ''
          const hubArg = _hubClusterResource ? `&_hubClusterResource=true` : ''
          return (
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`${NavigationPath.resourceYAML}?cluster=${cluster}&kind=${kind}&apiversion=${apigroupArg}${apiversion}&name=${name}${namespaceArg}${hubArg}`}
            >
              {item.name} <ExternalLinkAltIcon style={{ verticalAlign: '-0.125em', marginLeft: '8px' }} />
            </a>
          )
        },
        sort: 'name',
        search: 'name',
      },
      {
        header: t('Namespace'),
        cell: (item: any) => item.namespace ?? '-',
        search: (item: any) => item.namespace,
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
        cell: (item: any) => (item.apigroup ? `${item.apigroup}/${item.apiversion}` : item.apiversion),
        sort: 'apigroup',
        search: 'apigroup',
      },
    ],
    [t]
  )

  return (
    <div>
      {(vapb.err || kyvernoRelated.err) && (
        <PageSection style={{ paddingBottom: '0' }}>
          <AcmAlert variant="danger" title={vapb.err ?? kyvernoRelated.err} isInline noClose />
        </PageSection>
      )}
      <PageSection style={{ paddingBottom: '0' }}>
        <AcmDescriptionList
          id={'template-details-section'}
          title={kind + ' ' + t('details')}
          leftItems={descriptionItems.filter((_, i) => i < descriptionItems.length / 2)}
          rightItems={descriptionItems.filter((_, i) => i >= descriptionItems.length / 2)}
          defaultOpen
          xl2={4}
        />
      </PageSection>
      <PageSection>
        <Card>
          <CardTitle>{isVAPB ? t('Parameter resources') : t('Related resources')}</CardTitle>
          <CardBody>
            <AcmTablePaginationContextProvider localStorageKey="grc-template-details">
              {isKyverno ? (
                <KyvernoRelatedResources {...{ name, namespace, template, relatedObjects, violationColumn }} />
              ) : (
                <AcmTable
                  items={relatedObjects}
                  emptyState={
                    isVAPB ? (
                      <AcmEmptyState
                        title={t('No parameter resources')}
                        message={t('There are no parameter resources for this ValidatingAdmissionPolicyBinding.')}
                      />
                    ) : (
                      <AcmEmptyState
                        title={t('No related resources')}
                        message={t('There are no resources related to this policy template.')}
                      />
                    )
                  }
                  columns={isVAPB ? paramRefVAPBColumns : relatedResourceColumns}
                  keyFn={(item: any) => `${item?.object?.kind}.${item?.object?.metadata.name}`}
                  initialSort={{
                    index: 0,
                    direction: 'asc',
                  }}
                  perPageOptions={isKyverno ? [] : undefined}
                />
              )}
            </AcmTablePaginationContextProvider>
          </CardBody>
        </Card>
      </PageSection>
    </div>
  )
}
