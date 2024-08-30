/* Copyright Contributors to the Open Cluster Management project */
import { Grid, GridItem, PageSection, Title } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'

import {
  AcmDescriptionList,
  AcmEmptyState,
  AcmTable,
  AcmTablePaginationContextProvider,
  compareStrings,
} from '../../../../ui-components'
import { DiffModal } from '../../components/DiffModal'
import { useTemplateDetailsContext } from './PolicyTemplateDetailsPage'
import { useParams } from 'react-router-dom-v5-compat'

export function PolicyTemplateDetails() {
  const { t } = useTranslation()
  const urlParams = useParams()
  const kind = urlParams.kind ?? ''
  const { clusterName, template } = useTemplateDetailsContext()
  const isCertPolicy = kind === 'CertificatePolicy'
  const [relatedObjects, setRelatedObjects] = useState<any>()

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
      template?.apiVersion == 'constraints.gatekeeper.sh/v1beta1' &&
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

    setRelatedObjects([])
  }, [clusterName, template])

  const descriptionItems = [
    {
      key: t('Name'),
      value: template?.metadata?.name ?? '-',
    },
    {
      key: t('Cluster'),
      value: template ? clusterName : '-',
    },
    {
      key: t('Kind'),
      value: kind ?? '-',
    },
    {
      key: t('API groups'),
      value: template?.apiVersion ?? '-',
    },
  ]

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
                        <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" /> {t('Inapplicable')}
                      </div>
                    )
                    break
                  case 'CustomResourceDefinition':
                    compliant = (
                      <div>
                        <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" /> {t('Inapplicable')}
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
                {t('View YAML')}
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
      <PageSection style={{ paddingBottom: '0' }}>
        <Grid hasGutter>
          <GridItem span={12}>
            <AcmDescriptionList
              id={'template-details-section'}
              title={kind + ' ' + t('details')}
              leftItems={descriptionItems}
              defaultOpen={isCertPolicy}
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
