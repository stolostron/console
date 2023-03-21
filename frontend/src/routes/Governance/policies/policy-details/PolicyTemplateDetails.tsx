/* Copyright Contributors to the Open Cluster Management project */

import {
  Card,
  CardExpandableContent,
  CardHeader,
  CardTitle,
  Grid,
  GridItem,
  PageSection,
  Title,
} from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import jsYaml from 'js-yaml'
import { useEffect, useMemo, useState } from 'react'
import YamlEditor from '../../../../components/YamlEditor'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { fireManagedClusterView } from '../../../../resources'
import { useRecoilState, useSharedAtoms } from '../../../../shared-recoil'
import {
  AcmAlert,
  AcmDescriptionList,
  AcmEmptyState,
  AcmTable,
  AcmTablePaginationContextProvider,
  compareStrings,
} from '../../../../ui-components'

export function PolicyTemplateDetails(props: {
  clusterName: string
  apiGroup: string
  apiVersion: string
  kind: string
  templateName: string
}) {
  const { t } = useTranslation()
  const { clusterName, apiGroup, apiVersion, kind, templateName } = props
  const { managedClusterAddonsState } = useSharedAtoms()
  const [template, setTemplate] = useState<any>()
  const [relatedObjects, setRelatedObjects] = useState<any>()
  const [templateError, setTemplateError] = useState<string>()
  const [isExpanded, setIsExpanded] = useState<boolean>(true)
  const [editorHeight, setEditorHeight] = useState<number>(250)
  const [managedClusterAddOns] = useRecoilState(managedClusterAddonsState)

  let templateClusterName = clusterName
  let templateNamespace = clusterName

  // Determine if the policy framework is deployed in hosted mode. If so, the policy template needs to be retrieved
  // from the hosting cluster instead of the managed cluster.
  for (const addon of managedClusterAddOns) {
    if (addon.metadata.namespace !== clusterName) {
      continue
    }

    if (addon.metadata.name !== 'governance-policy-framework') {
      continue
    }

    if (addon.metadata.annotations?.['addon.open-cluster-management.io/hosting-cluster-name']) {
      templateClusterName = addon.metadata.annotations['addon.open-cluster-management.io/hosting-cluster-name']
      // open-cluster-management-agent-addon is the default namespace but it shouldn't be used for hosted mode.
      templateNamespace = addon.spec.installNamespace || 'open-cluster-management-agent-addon'
    }

    break
  }

  function getRelatedObjects(resource: any, clusterName: string) {
    return (
      resource?.status?.relatedObjects?.map((obj: any) => {
        obj.cluster = clusterName
        return obj
      }) ?? []
    )
  }

  useEffect(() => {
    const version = apiGroup ? `${apiGroup}/${apiVersion}` : apiVersion
    fireManagedClusterView(templateClusterName, kind, version, templateName, templateNamespace)
      .then((viewResponse) => {
        if (viewResponse?.message) {
          setTemplateError(viewResponse.message)
        } else {
          setTemplate(viewResponse.result)
          setRelatedObjects(getRelatedObjects(viewResponse.result, clusterName))
        }
      })
      .catch((err) => {
        console.error('Error getting resource: ', err)
        setTemplateError(err)
      })
  }, [templateClusterName, templateNamespace, clusterName, kind, apiGroup, apiVersion, templateName])

  // Hook to get the height of the template details section so both details and editor sections are the same height
  /* istanbul ignore next */
  useEffect(() => {
    const detailsElementHeight = document.getElementById('template-details-section')?.offsetHeight
    if (detailsElementHeight && detailsElementHeight > 250) {
      setEditorHeight(detailsElementHeight)
    }
  }, [])

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
      value: template?.kind ?? '-',
    },
    {
      key: t('API groups'),
      value: template?.apiVersion ?? '-',
    },
    {
      key: t('Compliant'),
      value: template?.status?.compliant ?? '-',
    },
    {
      key: t('Details'),
      value: JSON.stringify(template?.status?.compliancyDetails ?? '-'),
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
        header: t('Compliant'),
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
                  <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" /> {t('Violations')}
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
          if (cluster && kind && apiVersion && name) {
            if (namespace !== '') {
              return (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`${NavigationPath.resourceYAML}?cluster=${cluster}&kind=${kind}&apiversion=${apiVersion}&namespace=${namespace}&name=${name}`}
                >
                  {t('View YAML')}
                </a>
              )
            } else {
              return (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`${NavigationPath.resourceYAML}?cluster=${cluster}&kind=${kind}&apiversion=${apiVersion}&name=${name}`}
                >
                  {t('View YAML')}
                </a>
              )
            }
          }
          return ''
        },
      },
    ],
    [t]
  )

  if (templateError) {
    return (
      <PageSection style={{ paddingBottom: '0' }}>
        <AcmAlert variant="danger" title={templateError} isInline noClose />
      </PageSection>
    )
  }

  return (
    <div>
      <PageSection style={{ paddingBottom: '0' }}>
        <Grid hasGutter>
          <GridItem span={6}>
            <AcmDescriptionList
              id={'template-details-section'}
              title={t('Template details')}
              leftItems={descriptionItems}
            />
          </GridItem>
          <GridItem span={6}>
            <Card isExpanded={isExpanded}>
              <CardHeader onExpand={() => setIsExpanded(!isExpanded)}>
                <CardTitle id="titleId">{t('Template yaml')}</CardTitle>
              </CardHeader>
              <CardExpandableContent>
                <YamlEditor resourceYAML={jsYaml.dump(template, { indent: 2 })} readOnly={true} height={editorHeight} />
              </CardExpandableContent>
            </Card>
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
