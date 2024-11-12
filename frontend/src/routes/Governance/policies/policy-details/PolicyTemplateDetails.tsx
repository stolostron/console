/* Copyright Contributors to the Open Cluster Management project */
import { Badge, Divider, Flex, Grid, GridItem, LabelGroup, PageSection, Skeleton, Title } from '@patternfly/react-core'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  ExternalLinkAltIcon,
} from '@patternfly/react-icons'
import { ReactNode, useEffect, useMemo, useState } from 'react'
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
import { generatePath, Link, useParams } from 'react-router-dom-v5-compat'
import { collectKinds, getEngineWithSvg } from '../../common/util'
import { Grid as MuiGrid } from '@mui/material'
import { useFetchKyvernoRelated, useFetchVapb } from './PolicyTemplateDetailHooks'

interface IKinds {
  apiGroups: string[]
  kinds: string[]
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
  const isFromSearch = ['kyverno.io'].includes(apiGroup)
  const hasVapb = ['constraints.gatekeeper.sh', 'kyverno.io'].includes(apiGroup)

  useEffect(() => {
    if (isFromSearch && kyvernoRelated.relatedItems !== undefined && kyvernoRelated.relatedItems) {
      setRelatedObjects(kyvernoRelated.relatedItems)
      if (kyvernoRelated.violationNum != undefined) {
        handleAuditViolation(kyvernoRelated.violationNum)
      }
    }
  }, [kyvernoRelated, apiGroup, isFromSearch, handleAuditViolation])

  useEffect(() => {
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
    if (!templateLoading && !isFromSearch) {
      setRelatedObjects([])
    }
  }, [apiGroup, clusterName, template, templateLoading, isFromSearch])

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

    if (hasVapb) {
      // Loading to fetch VAPB
      if (!vapb.vapbItems) {
        cols.push({
          key: 'Validating Admission Policy Binding',
          value: <Skeleton width="100%" screenreaderText="Fetching ValidatingAdmissionPolicyBinding" />,
        })
      } else if (vapb.vapbItems && vapb.vapbItems.length > 0 && !vapb.loading) {
        const vapbName = apiGroup === 'constraints.gatekeeper.sh' ? `gatekeeper-${name}` : name + '-binding'
        cols.push({
          key: 'Validating Admission Policy Binding',
          value: (
            <Link
              to={generatePath(NavigationPath.discoveredPolicyDetails, {
                clusterName,
                apiVersion: 'v1',
                apiGroup: 'admissionregistration.k8s.io',
                kind: 'ValidatingAdmissionPolicyBinding',
                templateName: vapbName,
                templateNamespace: null,
              })}
              target="_blank"
            >
              {vapbName} <ExternalLinkAltIcon style={{ verticalAlign: '-0.125em', marginLeft: '8px' }} />
            </Link>
          ),
        })
      } else if (vapb.vapbItems && vapb.vapbItems.length == 0 && !vapb.loading) {
        cols.push({
          key: 'Validating Admission Policy Binding',
          value: '-',
        })
      }
    }

    // Gatekeeper Constraint
    if (template?.spec?.match?.kinds && apiGroup === 'constraints.gatekeeper.sh') {
      return [
        ...cols.slice(0, 2),
        {
          key: t('Matches'),
          value: matchesBadges(template?.spec?.match?.kinds as IKinds[]),
        },
        ...cols.slice(2),
      ]
    }

    if (kind === 'OperatorPolicy') {
      let value = '-'

      for (const condition of template?.status?.conditions ?? []) {
        if (condition?.type === 'Compliant') {
          value = condition?.message ?? '-'
          break
        }
      }

      cols.push({ key: t('Message'), value: value })
    }

    if (kind === 'ValidatingAdmissionPolicyBinding') {
      // Add a row forValidatingAdmissionPolicy
      if (!template) {
        cols.push({
          key: 'Validating Admission Policy',
          value: <Skeleton width="100%" screenreaderText="Fetching ValidatingAdmissionPolicyBinding" />,
        })
      } else {
        const policyName = template?.spec?.policyName
        if (policyName) {
          cols.push({
            key: 'Validating Admission Policy',
            value: (
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={`${NavigationPath.resourceYAML}?cluster=${clusterName}&kind=ValidatingAdmissionPolicy&apiversion=v1&name=${policyName}`}
              >
                {policyName}
                <ExternalLinkAltIcon style={{ verticalAlign: '-0.125em', marginLeft: '8px' }} />
              </a>
            ),
          })
        } else {
          cols.push({
            key: 'Validating Admission Policy',
            value: '-',
          })
        }
      }
    }

    // kyverno
    if (template?.spec?.rules && apiGroup === 'kyverno.io') {
      return [
        ...cols.slice(0, 2),
        {
          key: t('Rules'),
          value: kyvernoMatchesBadges(template?.spec?.rules),
        },
        ...cols.slice(2),
      ]
    }

    return cols
  }, [t, name, kind, apiGroup, clusterName, apiVersion, namespace, hasVapb, template, vapb.vapbItems, vapb.loading])

  const violationColumn = useMemo(() => {
    return {
      header: t('Violations'),
      sort: (a: any, b: any) => compareStrings(a.compliant, b.compliant),
      cell: (item: any) => {
        let compliant = item.compliant ?? '-'
        compliant = compliant && typeof compliant === 'string' ? compliant.trim().toLowerCase() : '-'

        switch (compliant) {
          case 'compliant':
            return (
              <div>
                <CheckCircleIcon color="var(--pf-global--success-color--100)" /> {t('No violations')}
              </div>
            )
          case 'noncompliant':
            return (
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
          case 'inapplicable':
            return (
              <div>
                <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" /> {t('Inapplicable')}
              </div>
            )
          // @ts-expect-error: Falls through to 'No status'
          case 'unknowncompliancy':
            if (kind === 'OperatorPolicy') {
              switch (item.object?.kind) {
                case 'Deployment':
                  return (
                    <div>
                      <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" /> {t('Inapplicable')}
                    </div>
                  )
                case 'CustomResourceDefinition':
                  return (
                    <div>
                      <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" /> {t('Inapplicable')}
                    </div>
                  )
              }
            }
          // falls through to 'No status'
          default:
            return (
              <div>
                <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" /> {t('No status')}
              </div>
            )
        }
      },
    }
  }, [t, kind])

  const relatedResourceColumns = useMemo(
    () => [
      {
        header: t('Name'),
        cell: 'object.metadata.name',
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
      {
        header: '',
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
            return ''
          }
          if (cluster && kind && apiVersion && name && name != '-') {
            const namespaceArg = namespace ? `&namespace=${namespace}` : ''
            return (
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={`${NavigationPath.resourceYAML}?cluster=${cluster}&kind=${kind}&apiversion=${apiVersion}&name=${name}${namespaceArg}`}
              >
                {t('View YAML')} <ExternalLinkAltIcon style={{ verticalAlign: '-0.125em', marginLeft: '8px' }} />
              </a>
            )
          }
          return ''
        },
      },
    ],
    [t, violationColumn, kind]
  )

  const relatedResourceFromSearchAPIColumns = useMemo(
    () => [
      {
        header: t('Name'),
        cell: 'name',
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
        header: '',
        cell: (item: any) => {
          let policyReportLink: ReactNode = <></>
          if (item.policyReport) {
            const { cluster, kind, name, namespace, apigroup, apiversion } = item.policyReport
            const namespaceArg = namespace ? `&namespace=${namespace}` : ''
            const apigroupArg = apigroup ? `${apigroup}%2F` : ''
            policyReportLink = (
              <>
                <span>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`${NavigationPath.resourceYAML}?cluster=${cluster}&kind=${kind}&apiversion=${apigroupArg}${apiversion}&name=${name}${namespaceArg}`}
                  >
                    {t('View report')}
                    <ExternalLinkAltIcon style={{ verticalAlign: '-0.125em', marginLeft: '8px' }} />
                  </a>
                </span>{' '}
                <Divider
                  orientation={{
                    default: 'vertical',
                  }}
                  inset={{
                    default: 'insetMd',
                    md: 'insetNone',
                    lg: 'insetSm',
                    xl: 'insetXs',
                  }}
                />
              </>
            )
          }

          const { cluster, kind, name, namespace, apiversion } = item
          const namespaceArg = namespace ? `&namespace=${namespace}` : ''
          return (
            <Flex>
              {policyReportLink}

              <span>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`${NavigationPath.resourceYAML}?cluster=${cluster}&kind=${kind}&apiversion=${apiversion}&name=${name}${namespaceArg}`}
                >
                  {t('View YAML')} <ExternalLinkAltIcon style={{ verticalAlign: '-0.125em', marginLeft: '8px' }} />
                </a>
              </span>
            </Flex>
          )
        },
      },
    ],
    [t, violationColumn]
  )
  return (
    <div>
      {(vapb.err || kyvernoRelated.err) && (
        <PageSection style={{ paddingBottom: '0' }}>
          <AcmAlert variant="danger" title={vapb.err ?? kyvernoRelated.err} isInline noClose />
        </PageSection>
      )}
      <PageSection style={{ paddingBottom: '0' }}>
        <Grid hasGutter>
          <GridItem span={12}>
            <AcmDescriptionList
              id={'template-details-section'}
              title={kind + ' ' + t('details')}
              leftItems={descriptionItems.filter((_, i) => i < descriptionItems.length / 2)}
              rightItems={descriptionItems.filter((_, i) => i >= descriptionItems.length / 2)}
              defaultOpen
            />
          </GridItem>
        </Grid>
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
            columns={isFromSearch ? relatedResourceFromSearchAPIColumns : relatedResourceColumns}
            keyFn={(item) =>
              isFromSearch ? `${item.kind}.${item.name}` : `${item?.object?.kind}.${item?.object?.metadata.name}`
            }
            initialSort={{
              index: 0,
              direction: 'asc',
            }}
          />
        </AcmTablePaginationContextProvider>
      </PageSection>
    </div>
  )
}

const matchesBadges = (kinds: IKinds[]): ReactNode => {
  return (
    <MuiGrid container style={{ maxWidth: '500px', gap: 8 }}>
      {kinds.map((kinds) => {
        return kinds.kinds.map((k) => {
          if (!kinds.apiGroups || kinds.apiGroups.length == 0) {
            return (
              <div key={k}>
                <Badge isRead key={k}>
                  {k}
                </Badge>
              </div>
            )
          }

          return kinds.apiGroups.map((apigroup) => {
            return (
              <div key={`${apigroup}/${k}`}>
                <Badge isRead key={`${apigroup}/${k}`}>
                  {apigroup ? `${apigroup}/${k}` : k}
                </Badge>
              </div>
            )
          })
        })
      })}
    </MuiGrid>
  )
}

const kyvernoMatchesBadges = (rules: any[]): ReactNode => {
  return (
    <MuiGrid container style={{ gap: 16 }} direction="column">
      {rules.map((r) => {
        const kinds: string[] = collectKinds(r)
        return (
          <MuiGrid item xs="auto" key={r.name} container direction="column" style={{ gap: 8 }}>
            <MuiGrid item>{r.name}</MuiGrid>
            <MuiGrid item style={{ paddingLeft: 16, width: 'fit-content' }} direction="column" container>
              <LabelGroup
                categoryName="Controls"
                key={r.name + '-controls'}
                style={{ alignItems: 'center' }}
                numLabels={10}
              >
                {r.validate && <Badge isRead>Validate</Badge>}
                {r.mutate && <Badge isRead>Mutate</Badge>}
                {r.generate && <Badge isRead>Generate</Badge>}
                {r.verifyImages && <Badge isRead>verifyImages</Badge>}
              </LabelGroup>
              <LabelGroup
                categoryName="Matches"
                key={r.name + '-matches'}
                style={{ alignItems: 'center' }}
                numLabels={10}
              >
                {kinds.map((kind: string) => (
                  <Badge isRead key={`${r.name}/${kind}`}>
                    {kind}
                  </Badge>
                ))}
              </LabelGroup>
            </MuiGrid>
          </MuiGrid>
        )
      })}
    </MuiGrid>
  )
}
