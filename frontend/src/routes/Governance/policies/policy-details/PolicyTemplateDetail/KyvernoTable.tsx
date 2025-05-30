/* Copyright Contributors to the Open Cluster Management project */

import { TFunction } from 'react-i18next'
import { parseStringMap } from '../../../common/util'
import { useEffect, useState } from 'react'
import { fireManagedClusterView } from '../../../../../resources'
import { ExclamationCircleIcon, ExternalLinkAltIcon } from '@patternfly/react-icons'
import { Flex, FlexItem, Spinner } from '@patternfly/react-core'
import { NavigationPath } from '../../../../../NavigationPath'
import { compareStrings } from '../../../../../ui-components'
import { IRelatedObjMessages, IRuleMessage } from './KyvernoRelatedResources'

export const kyvernoMessageCell = (
  t: TFunction,
  item: any,
  kyvernoPolicyName: string,
  KyvernoPolicyNamespace: string | undefined,
  messageCache: IRelatedObjMessages
) => {
  if (item.policyReport) {
    return (
      <KyvernoMessages
        {...{
          item,
          kyvernoPolicyName,
          KyvernoPolicyNamespace,
          messageCache,
        }}
      />
    )
  }

  if (item.generatedByKyverno) {
    const ruleName = parseStringMap(item.label)['generate.kyverno.io/rule-name']
    if (!ruleName) {
      return t('Missing rule that generates this resource.')
    }
    return (
      <>
        {t('This resource is generated by')} <b>{ruleName}</b> {t('rule')}
      </>
    )
  }

  return '-'
}

export const KyvernoMessages = ({
  item,
  kyvernoPolicyName,
  KyvernoPolicyNamespace,
  messageCache,
}: {
  item: any
  kyvernoPolicyName: string
  KyvernoPolicyNamespace?: string
  messageCache: IRelatedObjMessages
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

  useEffect(
    () => {
      let ignore = false

      const foundPolicyMessages = messageCache[uid]
      if (foundPolicyMessages !== undefined) {
        setRuleMsg(foundPolicyMessages)
        setLoading(false)
      } else if (!loading) {
        setLoading(true)

        fireManagedClusterView(reportCluster, reportKind, reportVersion, reportName, reportNs)
          .then((viewResponse) => {
            if (ignore) {
              return
            }

            if (viewResponse?.message) {
              setErrString(viewResponse.message)
            } else {
              // policy field: namespace/policyName
              const results: { message: string; rule: string; policy: string }[] = viewResponse?.result?.results.filter(
                ({ policy: policyNsName }: { policy: string }) => {
                  // To avoid scenarios where a ClusterPolicy and a Kyverno Policy share the same name.
                  const nsName = KyvernoPolicyNamespace
                    ? KyvernoPolicyNamespace + '/' + kyvernoPolicyName
                    : kyvernoPolicyName

                  if (nsName === policyNsName) {
                    return true
                  }

                  return false
                }
              )

              const ruleMsgs = results.map((r) => ({ ruleName: r.rule, message: r.message }))
              messageCache[uid] = ruleMsgs

              setRuleMsg(ruleMsgs)
            }
          })
          .catch((err: Error) => {
            if (ignore) {
              return
            }

            console.error('Error getting resource: ', err)
            setErrString(err.message)
          })
          .finally(() => {
            if (ignore) {
              return
            }

            setLoading(false)
          })
      }

      return () => {
        ignore = true
      }
    },

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

  return flexKyvernoMessages(ruleMsg)
}

export const flexKyvernoMessages = (messages: IRuleMessage[] | undefined) => {
  return (
    <Flex direction={{ default: 'column' }} style={{ gap: 4 }}>
      {messages?.map((rm) => {
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

export const relatedResourceKyvernoColumns = (
  t: TFunction,
  violationColumn: any,
  name: string,
  namespace: string,
  relatedObjectsMessages: IRelatedObjMessages
) => [
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
  violationColumn,
  {
    header: t('Messages'),
    cell: (item: any) => kyvernoMessageCell(t, item, name, namespace, relatedObjectsMessages),
    sort: 'Messages',
    search: 'Messages',
  },
]
