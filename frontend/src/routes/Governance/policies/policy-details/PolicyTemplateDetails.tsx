/* Copyright Contributors to the Open Cluster Management project */
import { Flex, FlexItem, PageSection, Spinner, Title } from '@patternfly/react-core'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  ExternalLinkAltIcon,
} from '@patternfly/react-icons'
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import {
  AcmAlert,
  AcmDescriptionList,
  AcmEmptyState,
  AcmTable,
  AcmTablePaginationContextProvider,
  compareStrings,
  ListItems,
} from '../../../../ui-components'
import { DiffModal } from '../../components/DiffModal'
import { useTemplateDetailsContext } from './PolicyTemplateDetailsPage'
import { useParams } from 'react-router-dom-v5-compat'
import { getEngineWithSvg } from '../../common/util'
import { useFetchKyvernoRelated, useFetchVapb } from './PolicyTemplateDetailHooks'
import { addRowsForHasVapb, addRowsForOperatorPolicy, addRowsForVapb } from './PolicyTemplateDetailsColumns'
import { fireManagedClusterView } from '../../../../resources'

interface IRuleMessage {
  ruleName: string
  message: string
}
interface IRelatedObjMessages {
  [relatedItemUid: string]: IRuleMessage[]
}

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
  // This is for gatekeeper constraint and kyverno
  const vapb = useFetchVapb()
  const kyvernoRelated = useFetchKyvernoRelated()
  const isKyverno = ['kyverno.io'].includes(apiGroup)
  const hasVapb = ['constraints.gatekeeper.sh', 'kyverno.io'].includes(apiGroup)
  const [relatedObjectsMessages, setRelatedObjectsMessages] = useState<IRelatedObjMessages>({})

  const updateRelatedObjectsMessages = (uid: string, ruleName: string, message: string) => {
    setRelatedObjectsMessages((pstate) => {
      if (pstate[uid] !== undefined) {
        // Use filter to exclude duplicate messages caused by rule message updates.
        const ruleMessageArr = pstate[uid].filter((ruleMessage) => {
          return ruleMessage.ruleName != ruleName
        })
        ruleMessageArr.push({ ruleName, message })
        return { ...pstate, [uid]: ruleMessageArr }
      } else {
        return { ...pstate, [uid]: [{ ruleName, message }] }
      }
    })
  }

  useEffect(() => {
    if (isKyverno && kyvernoRelated.relatedItems !== undefined && kyvernoRelated.relatedItems) {
      setRelatedObjects(kyvernoRelated.relatedItems)
      if (kyvernoRelated.violationNum != undefined) {
        handleAuditViolation(kyvernoRelated.violationNum)
      }
    }
  }, [kyvernoRelated, apiGroup, isKyverno, handleAuditViolation])

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

  const violationColumn = useMemo(() => {
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
                <CheckCircleIcon color="var(--pf-global--success-color--100)" /> {t('No violations')}
              </div>
            )
            break
          case 'noncompliant':
            violationCell = (
              <div>
                <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" /> {t('Violations')}{' '}
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
                <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" /> {t('Inapplicable')}
              </div>
            )
            break
          case 'unknowncompliancy':
            if (kind === 'OperatorPolicy') {
              switch (item.object?.kind) {
                case 'Deployment':
                  violationCell = (
                    <div>
                      <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" /> {t('Inapplicable')}
                    </div>
                  )
                  break
                case 'CustomResourceDefinition':
                  violationCell = (
                    <div>
                      <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" /> {t('Inapplicable')}
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
                <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" /> {t('No status')}
              </div>
            )
        }

        let policyReportLink: ReactNode = <></>
        if (item.policyReport) {
          const { cluster, kind, name, namespace, apigroup, apiversion } = item.policyReport
          const namespaceArg = namespace ? `&namespace=${namespace}` : ''
          const apigroupArg = apigroup ? `${apigroup}%2F` : ''
          policyReportLink = (
            <div>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={`${NavigationPath.resourceYAML}?cluster=${cluster}&kind=${kind}&apiversion=${apigroupArg}${apiversion}&name=${name}${namespaceArg}`}
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
      ...(kind === 'ValidatingAdmissionPolicyBinding' ? [] : [violationColumn]),
      {
        header: t('Reason'),
        cell: 'reason',
        search: 'reason',
      },
    ],
    [t, violationColumn, kind]
  )

  const relatedResourceKyvernoColumns = useMemo(
    () => [
      {
        header: t('Name'),
        cell: (item: any) => {
          const { cluster, kind, name, namespace, apiversion, apigroup } = item
          const apigroupArg = apigroup ? `${apigroup}%2F` : ''
          const namespaceArg = namespace ? `&namespace=${namespace}` : ''
          return (
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`${NavigationPath.resourceYAML}?cluster=${cluster}&kind=${kind}&apiversion=${apigroupArg}${apiversion}&name=${name}${namespaceArg}`}
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
      violationColumn,
      {
        header: t('Messages'),
        cell: (item: any) => (
          <KyvernoMessages
            {...{
              item,
              kyvernoPolicyName: name,
              KyvernoPolicyNamespace: namespace,
              relatedObjectsMessages,
              updateRelatedObjectsMessages,
            }}
          />
        ),
        sort: 'Messages',
        search: 'Messages',
      },
    ],
    [t, violationColumn, name, relatedObjectsMessages, namespace]
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
        <Title headingLevel="h2">{t('Related resources')}</Title>
        <AcmTablePaginationContextProvider localStorageKey="grc-template-details">
          <AcmTable
            items={relatedObjects}
            emptyState={
              <AcmEmptyState
                title={t('No related resources')}
                message={t('There are no resources related to this policy template.')}
              />
            }
            columns={isKyverno ? relatedResourceKyvernoColumns : relatedResourceColumns}
            keyFn={(item) =>
              isKyverno ? `${item.kind}.${item.name}` : `${item?.object?.kind}.${item?.object?.metadata.name}`
            }
            initialSort={{
              index: 0,
              direction: 'asc',
            }}
            perPageOptions={isKyverno ? [] : undefined}
          />
        </AcmTablePaginationContextProvider>
      </PageSection>
    </div>
  )
}

const KyvernoMessages = ({
  item,
  kyvernoPolicyName,
  KyvernoPolicyNamespace,
  relatedObjectsMessages,
  updateRelatedObjectsMessages,
}: {
  item: any
  kyvernoPolicyName: string
  KyvernoPolicyNamespace?: string
  relatedObjectsMessages: IRelatedObjMessages
  updateRelatedObjectsMessages: (policyName: string, ruleName: string, message: string) => void
}) => {
  // Cluster + '/' + Resource uid
  const uid = item._uid
  const {
    cluster: reportCluster,
    kind: reportKind,
    name: reportName,
    namespace: reportNs,
    apigroup,
    apiversion,
  } = item.policyReport
  const [loading, setLoading] = useState<boolean>(false)
  const [ruleMsg, setRuleMsg] = useState<IRuleMessage[] | undefined>()
  const [errString, setErrString] = useState<string | undefined>()
  const reportVersion = apigroup ? `${apigroup}/${apiversion}` : apiversion
  // To prevent fireManagedClusterView again
  const renderCount = useRef(0)

  useEffect(
    () => {
      const foundPolicyMessages = relatedObjectsMessages[uid]
      if (foundPolicyMessages !== undefined && ruleMsg === undefined) {
        setRuleMsg(foundPolicyMessages)
      } else if (
        !loading &&
        ruleMsg === undefined &&
        item.policyReport &&
        foundPolicyMessages == undefined &&
        renderCount.current == 0
      ) {
        // To prevent fetch fireManagedClusterView again
        ++renderCount.current
        setLoading(true)
        fireManagedClusterView(reportCluster, reportKind, reportVersion, reportName, reportNs)
          .then((viewResponse) => {
            if (viewResponse?.message) {
              setErrString(viewResponse.message)
            } else {
              // policy field: namespace/policyName
              const results: { message: string; rule: string; policy: string }[] = viewResponse?.result?.results.filter(
                ({ policy: policyNsName, rule, message }: { policy: string; rule: string; message: string }) => {
                  // To avoid scenarios where a ClusterPolicy and a Kyverno Policy share the same name.
                  const nsName = KyvernoPolicyNamespace
                    ? KyvernoPolicyNamespace + '/' + kyvernoPolicyName
                    : kyvernoPolicyName

                  if (nsName === policyNsName) {
                    updateRelatedObjectsMessages(uid, rule, message)
                    return true
                  }

                  return false
                }
              )

              setRuleMsg(results.map((r) => ({ ruleName: r.rule, message: r.message })))
            }
          })
          .catch((err: Error) => {
            console.error('Error getting resource: ', err)
            setErrString(err.message)
          })
      }
      setLoading(false)
    },
    // Should not include relatedObjectsMessages updateRelatedObjectsMessages, loading for performance
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  if (errString) {
    return (
      <div>
        <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />
        {errString}
      </div>
    )
  }

  if (loading) {
    return <Spinner size="md" />
  }

  return (
    <Flex direction={{ default: 'column' }} style={{ gap: 4 }}>
      {ruleMsg?.map((rm) => {
        return (
          <FlexItem key={rm.ruleName} style={{ margin: 0 }}>
            {rm.message ? (
              <>
                <b>{rm.ruleName}:</b> {rm.message}
              </>
            ) : (
              <>-</>
            )}
          </FlexItem>
        )
      })}
    </Flex>
  )
}
