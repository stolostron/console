/* Copyright Contributors to the Open Cluster Management project */
import { Badge, Grid, GridItem, PageSection, Skeleton, Title } from '@patternfly/react-core'
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
import { getEngineWithSvg } from '../../common/util'
import { Grid as MuiGrid } from '@mui/material'
import { useFetchVapb } from './PolicyTemplateDetailHooks'

interface IKinds {
  apiGroups: string[]
  kinds: string[]
}
export function PolicyTemplateDetails() {
  const { t } = useTranslation()
  const urlParams = useParams()
  const name = urlParams.templateName ?? '-'
  const kind = urlParams.kind ?? ''
  const apiGroup = urlParams.apiGroup ?? ''
  const apiVersion = urlParams.apiVersion ?? ''
  const { clusterName, template, templateLoading } = useTemplateDetailsContext()
  const [relatedObjects, setRelatedObjects] = useState<any>(undefined)
  // This is for gatekeeper constraint
  const vapb = useFetchVapb()

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

    if (!templateLoading) {
      setRelatedObjects([])
    }
  }, [apiGroup, clusterName, template, templateLoading])

  const descriptionItems = useMemo(() => {
    const cols: ListItems[] = [
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
        key: t('API groups'),
        value: apiVersion ? apiGroup + '/' + apiVersion : apiGroup,
      },
    ]

    if (apiGroup === 'constraints.gatekeeper.sh') {
      // Loading to fetch VAPB
      if (!vapb.vapbItems) {
        cols.push({
          key: 'Validating Admission Policy Binding',
          value: <Skeleton width="100%" screenreaderText="Fetching ValidatingAdmissionPolicyBinding" />,
        })
      } else if (vapb.vapbItems && vapb.vapbItems.length > 0 && !vapb.loading) {
        cols.push({
          key: 'Validating Admission Policy Binding',
          value: (
            <Link
              to={generatePath(NavigationPath.discoveredPolicyDetails, {
                clusterName,
                apiVersion: 'v1',
                apiGroup: 'admissionregistration.k8s.io',
                kind: 'ValidatingAdmissionPolicyBinding',
                templateName: `gatekeeper-${name}`,
                templateNamespace: null,
              })}
              target="_blank"
            >
              gatekeeper-{name} <ExternalLinkAltIcon style={{ verticalAlign: '-0.125em', marginLeft: '8px' }} />
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

    return cols
  }, [t, name, kind, apiGroup, template, clusterName, vapb, apiVersion])

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
        header: t('API groups'),
        cell: 'object.apiVersion',
        sort: 'object.apiVersion',
        search: 'object.apiVersion',
      },
      ...(kind === 'ValidatingAdmissionPolicyBinding'
        ? []
        : [
            {
              header: t('Violations'),
              sort: (a: any, b: any) => compareStrings(a.compliant, b.compliant),
              cell: (item: any) => {
                let compliant = item.compliant ?? '-'
                compliant = compliant && typeof compliant === 'string' ? compliant.trim().toLowerCase() : '-'

                switch (compliant) {
                  case 'compliant':
                    compliant = (
                      <div>
                        <CheckCircleIcon color="var(--pf-global--success-color--100)" /> {t('No violations')}
                      </div>
                    )
                    break
                  case 'noncompliant':
                    compliant = (
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
                  case 'unknowncompliancy':
                    if (kind === 'OperatorPolicy') {
                      switch (item.object?.kind) {
                        case 'Deployment':
                          compliant = (
                            <div>
                              <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />{' '}
                              {t('Inapplicable')}
                            </div>
                          )
                          break
                        case 'CustomResourceDefinition':
                          compliant = (
                            <div>
                              <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />{' '}
                              {t('Inapplicable')}
                            </div>
                          )
                          break
                        default:
                          compliant = (
                            <div>
                              <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" /> {t('No status')}
                            </div>
                          )
                          break
                      }
                    } else {
                      compliant = (
                        <div>
                          <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" /> {t('No status')}
                        </div>
                      )
                    }
                    break
                  default:
                    compliant = (
                      <div>
                        <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" /> {t('No status')}
                      </div>
                    )
                    break
                }

                return compliant
              },
            },
          ]),
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
    [t, kind]
  )

  return (
    <div>
      {vapb.err && (
        <PageSection style={{ paddingBottom: '0' }}>
          <AcmAlert variant="danger" title={vapb.err} isInline noClose />
        </PageSection>
      )}
      <PageSection style={{ paddingBottom: '0' }}>
        <Grid hasGutter>
          <GridItem span={12}>
            <AcmDescriptionList
              id={'template-details-section'}
              title={kind + ' ' + t('details')}
              leftItems={descriptionItems}
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
            columns={relatedResourceColumns}
            keyFn={(item) => `${item.object.kind}.${item.object.metadata.name}`}
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
