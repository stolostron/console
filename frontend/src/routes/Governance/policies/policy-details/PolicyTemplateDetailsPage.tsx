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
    AcmPage,
    AcmPageHeader,
    AcmTable,
    AcmTablePaginationContextProvider,
    compareStrings,
} from '@stolostron/ui-components'
import { Fragment, Suspense, useEffect, useMemo, useState } from 'react'
import { Route, Switch, useParams } from 'react-router-dom'
import YamlEditor from '../../../../components/YamlEditor'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { fireManagedClusterView, getResource } from '../../../../resources'

export function PolicyTemplateDetailsPage() {
    const { t } = useTranslation()
    const [template, setTemplate] = useState<any>()
    const [relatedObjects, setRelatedObjects] = useState<any>()
    const [templateError, setTemplateError] = useState<string>()

    const urlParams = useParams<{
        namespace: string
        name: string
        clusterName: string
        apiGroup: string
        apiVersion: string
        kind: string
        templateName: string
    }>()
    const policyNamespace = urlParams.namespace
    const policyName = urlParams.name
    const clusterName = urlParams.clusterName
    const apiGroup = urlParams.apiGroup
    const apiVersion = urlParams.apiVersion
    const kind = urlParams.kind
    const templateName = urlParams.templateName

    const templateDetailsUrl = NavigationPath.policyTemplateDetails
        .replace(':namespace', policyNamespace)
        .replace(':name', policyName)
        .replace(':clusterName', clusterName)
        .replace(':apiGroup/', apiGroup ? `${apiGroup}/` : '')
        .replace(':apiVersion', apiVersion)
        .replace(':kind', kind)
        .replace(':templateName', templateName)

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
    }, [clusterName, kind, apiGroup, apiVersion, policyName, policyNamespace])

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
                        cluster,
                        reason,
                        object: {
                            apiVersion,
                            kind,
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
        <AcmPage
            header={
                <AcmPageHeader
                    title={templateName}
                    breadcrumb={[
                        { text: t('Policies'), to: NavigationPath.policies },
                        {
                            text: policyName,
                            to: NavigationPath.policyDetailsResults
                                .replace(':namespace', policyNamespace as string)
                                .replace(':name', policyName as string),
                        },
                        { text: templateName, to: '' },
                    ]}
                    popoverAutoWidth={false}
                    popoverPosition="bottom"
                />
            }
        >
            <Suspense fallback={<Fragment />}>
                <Switch>
                    <Route
                        exact
                        path={templateDetailsUrl}
                        render={() => (
                            <div>
                                <PageSection>
                                    <Grid hasGutter>
                                        <GridItem span={6}>
                                            <AcmDescriptionList
                                                title={t('Template details')}
                                                leftItems={descriptionItems}
                                            />
                                        </GridItem>
                                        <GridItem span={6}>
                                            <Card isExpanded={true}>
                                                <CardHeader onExpand={() => {}}>
                                                    <CardTitle id="titleId">{t('Template yaml')}</CardTitle>
                                                </CardHeader>
                                                <CardExpandableContent>
                                                    <YamlEditor
                                                        resource={template}
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
                        )}
                    />
                </Switch>
            </Suspense>
        </AcmPage>
    )
}
