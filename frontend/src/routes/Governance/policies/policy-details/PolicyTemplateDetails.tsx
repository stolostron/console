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
import {
    AcmAlert,
    AcmDescriptionList,
    AcmTable,
    AcmTablePaginationContextProvider,
    compareStrings,
} from '@stolostron/ui-components'
import jsYaml from 'js-yaml'
import { useEffect, useMemo, useState } from 'react'
import YamlEditor from '../../../../components/YamlEditor'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { fireManagedClusterView, getResource } from '../../../../resources'

export function PolicyTemplateDetails(props: {
    clusterName: string
    apiGroup: string
    apiVersion: string
    kind: string
    templateName: string
}) {
    const { t } = useTranslation()
    const { clusterName, apiGroup, apiVersion, kind, templateName } = props
    const [template, setTemplate] = useState<any>()
    const [relatedObjects, setRelatedObjects] = useState<any>()
    const [templateError, setTemplateError] = useState<string>()

    function getRelatedObjects(resource: any) {
        return resource?.status?.relatedObjects.map((obj: any) => {
            obj.cluster = resource.metadata.namespace
            return obj
        })
    }

    useEffect(() => {
        const version = apiGroup ? `${apiGroup}/${apiVersion}` : apiVersion
        if (clusterName === 'local-cluster') {
            const resourceResult = getResource({
                apiVersion: version,
                kind,
                metadata: { namespace: clusterName, name: templateName },
            }).promise
            resourceResult
                .then((response) => {
                    setTemplate(response)
                    setRelatedObjects(getRelatedObjects(response))
                })
                .catch((err) => {
                    console.error('Error getting resource: ', err)
                    setTemplateError(err.message)
                })
        } else {
            fireManagedClusterView(clusterName, kind, version, templateName, clusterName)
                .then((viewResponse) => {
                    if (viewResponse?.message) {
                        setTemplateError(viewResponse.message)
                    } else {
                        setTemplate(viewResponse.result)
                        setRelatedObjects(getRelatedObjects(viewResponse.result))
                    }
                })
                .catch((err) => {
                    console.error('Error getting resource: ', err)
                    setTemplateError(err)
                })
        }
    }, [clusterName, kind, apiGroup, apiVersion])

    const descriptionItems = [
        {
            key: t('Name'),
            value: template?.metadata?.name ?? '-',
        },
        {
            key: t('Cluster'),
            value: template?.metadata?.namespace ?? '-',
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
                header: 'Name',
                cell: 'object.metadata.name',
                sort: 'object.metadata.name',
                search: 'object.metadata.name',
            },
            {
                header: 'Namespace',
                cell: (item: any) => item.object?.metadata?.namespace ?? '-',
                search: (item: any) => item.object?.metadata?.namespace,
                sort: (a: any, b: any) => compareStrings(a.object?.metadata?.namespace, b.object?.metadata?.namespace),
            },
            {
                header: 'Kind',
                cell: 'object.kind',
                sort: 'object.kind',
                search: 'object.kind',
            },
            {
                header: 'API groups',
                cell: 'object.apiVersion',
                sort: 'object.apiVersion',
                search: 'object.apiVersion',
            },
            {
                header: 'Compliant',
                sort: (a: any, b: any) => compareStrings(a.compliant, b.compliant),
                cell: (item: any) => {
                    let compliant = item.compliant ?? '-'
                    compliant = compliant && typeof compliant === 'string' ? compliant.trim().toLowerCase() : '-'

                    switch (compliant) {
                        case 'compliant':
                            compliant = (
                                <div>
                                    <CheckCircleIcon color="var(--pf-global--success-color--100)" /> {'No violations'}
                                </div>
                            )
                            break
                        case 'noncompliant':
                            compliant = (
                                <div>
                                    <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" /> {'Violations'}
                                </div>
                            )
                            break
                        default:
                            compliant = (
                                <div>
                                    <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />{' '}
                                    {'No status'}
                                </div>
                            )
                            break
                    }

                    return compliant
                },
            },
            {
                header: 'Reason',
                cell: 'reason',
                search: 'reason',
            },
            {
                header: '',
                cell: (item: any) => {
                    let {
                        // eslint-disable-next-line prefer-const
                        cluster,
                        // eslint-disable-next-line prefer-const
                        reason,
                        object: {
                            // eslint-disable-next-line prefer-const
                            apiVersion,
                            kind,
                            // eslint-disable-next-line prefer-const
                            metadata: { name, namespace = '' },
                        },
                    } = item
                    if (
                        reason === 'Resource not found but should exist' ||
                        reason === 'Resource not found as expected'
                    ) {
                        return ''
                    }
                    if (kind.endsWith('ies')) {
                        kind = kind.slice(0, -3)
                    } else if (kind.endsWith('s')) {
                        kind = kind.slice(0, -1)
                    }
                    if (cluster && kind && apiVersion && name) {
                        if (namespace !== '') {
                            return (
                                <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href={`${NavigationPath.resources}?cluster=${cluster}&kind=${kind}&apiversion=${apiVersion}&namespace=${namespace}&name=${name}`}
                                >
                                    {t('View yaml')}
                                </a>
                            )
                        } else {
                            return (
                                <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href={`${NavigationPath.resources}?cluster=${cluster}&kind=${kind}&apiversion=${apiVersion}&name=${name}`}
                                >
                                    {t('View yaml')}
                                </a>
                            )
                        }
                    }
                    return ''
                },
            },
        ],
        []
    )

    if (templateError) {
        return <AcmAlert variant="danger" title={templateError} isInline noClose />
    }

    return (
        <div>
            <PageSection style={{ paddingBottom: '0' }}>
                <Grid hasGutter>
                    <GridItem span={6}>
                        <AcmDescriptionList title={t('Template details')} leftItems={descriptionItems} />
                    </GridItem>
                    <GridItem span={6}>
                        <Card isExpanded={true}>
                            <CardHeader onExpand={() => {}}>
                                <CardTitle id="titleId">{t('Template yaml')}</CardTitle>
                            </CardHeader>
                            <CardExpandableContent>
                                <YamlEditor
                                    resourceYAML={jsYaml.dump(template, { indent: 2 })}
                                    editMode={false}
                                    width={'100%'}
                                    height={'500px'}
                                />
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
                        columns={relatedResourceColumns}
                        keyFn={(item) => `${item.object.kind}.${item.object.metadata.name}`}
                        initialSort={{
                            index: 0,
                            direction: 'asc',
                        }}
                        plural={'related resources'}
                    />
                </AcmTablePaginationContextProvider>
            </PageSection>
        </div>
    )
}
