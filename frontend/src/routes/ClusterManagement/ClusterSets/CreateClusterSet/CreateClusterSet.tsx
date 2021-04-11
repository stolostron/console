/* Copyright Contributors to the Open Cluster Management project */

import { useState, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { useRecoilValue, waitForAll } from 'recoil'
import { TableGridBreakpoint } from '@patternfly/react-table'
import {
    AcmAlertContext,
    AcmAlertGroup,
    AcmButton,
    AcmForm,
    AcmPage,
    AcmPageContent,
    AcmPageHeader,
    AcmSubmit,
    AcmTextInput,
    AcmTable,
    AcmInlineProvider,
    AcmEmptyState,
    AcmLabelsInput,
} from '@open-cluster-management/ui-components'
import { PageSection, Title, ActionGroup } from '@patternfly/react-core'
import { NavigationPath } from '../../../../NavigationPath'
import { DOC_LINKS } from '../../../../lib/doc-util'
import {
    ManagedClusterSet,
    ManagedClusterSetApiVersion,
    ManagedClusterSetKind,
    managedClusterSetLabel,
} from '../../../../resources/managed-cluster-set'
import { ManagedCluster, ManagedClusterApiVersion, ManagedClusterKind } from '../../../../resources/managed-cluster'
import { createResource, patchResource, resultsSettled } from '../../../../lib/resource-request'
import {
    certificateSigningRequestsState,
    clusterDeploymentsState,
    managedClusterInfosState,
    managedClustersState,
    managedClusterAddonsState,
} from '../../../../atoms'
import { Cluster, mapClusters } from '../../../../lib/get-cluster'
import { DistributionField } from '../../Clusters/components/DistributionField'
import { StatusField } from '../../Clusters/components/StatusField'

export default function CreateClusterSetPage() {
    const { t } = useTranslation(['cluster', 'common'])
    return (
        <AcmPage>
            <AcmPageHeader
                title={t('page.header.create-clusterset')}
                breadcrumb={[
                    { text: t('clusterSets'), to: NavigationPath.clusterSets },
                    { text: t('page.header.create-clusterset'), to: '' },
                ]}
                titleTooltip={
                    <>
                        {t('page.header.create-clusterset.tooltip')}
                        <a
                            href={DOC_LINKS.IMPORT_CLUSTER}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'block', marginTop: '4px' }}
                        >
                            {t('common:learn.more')}
                        </a>
                    </>
                }
            />
            <AcmPageContent id="create-cluster-set">
                <PageSection variant="light" isFilled={true}>
                    <CreateClusterSetContent />
                </PageSection>
            </AcmPageContent>
        </AcmPage>
    )
}

export function CreateClusterSetContent() {
    const { t } = useTranslation(['cluster', 'common'])
    const history = useHistory()
    const alertContext = useContext(AcmAlertContext)

    const [
        managedClusters,
        clusterDeployments,
        managedClusterInfos,
        certificateSigningRequests,
        managedClusterAddons,
    ] = useRecoilValue(
        waitForAll([
            managedClustersState,
            clusterDeploymentsState,
            managedClusterInfosState,
            certificateSigningRequestsState,
            managedClusterAddonsState,
        ])
    )

    let clusters = mapClusters(
        clusterDeployments,
        managedClusterInfos,
        certificateSigningRequests,
        managedClusters,
        managedClusterAddons
    )
    clusters = clusters.filter((cluster) => cluster?.clusterSet === undefined)

    const [managedClusterSet, setManagedClusterSet] = useState<ManagedClusterSet>({
        apiVersion: ManagedClusterSetApiVersion,
        kind: ManagedClusterSetKind,
        metadata: {
            name: '',
        },
        spec: {},
    })
    const [addClusters, setAddClusters] = useState<Cluster[] | undefined>()

    return (
        <AcmForm>
            <Title headingLevel="h4" size="xl">
                {t('createClusterSet.form.section.config')}
            </Title>
            <AcmTextInput
                id="clusterSetName"
                label={t('createClusterSet.form.name.label')}
                placeholder={t('createClusterSet.form.name.placeholder')}
                value={managedClusterSet.metadata.name}
                isRequired
                onChange={(name) => {
                    const copy = { ...managedClusterSet }
                    copy.metadata.name = name
                    setManagedClusterSet(copy)
                }}
            />
            <AcmLabelsInput
                id="labels"
                label={t('common:labels')}
                buttonLabel={t('common:label.add')}
                value={managedClusterSet.metadata.labels}
                onChange={(label) => {
                    const copy = { ...managedClusterSet }
                    copy.metadata.labels = label
                    setManagedClusterSet(copy)
                }}
                placeholder={t('labels.edit.placeholder')}
            />
            <Title headingLevel="h4" size="xl">
                {t('createClusterSet.form.section.clusters')}
            </Title>

            <AcmTable<Cluster>
                gridBreakPoint={TableGridBreakpoint.none}
                plural="clusters"
                items={clusters}
                keyFn={(cluster: Cluster) => cluster.name!}
                key="clustersTable"
                onSelect={(clusters: Cluster[]) => {
                    setAddClusters(clusters)
                }}
                emptyState={
                    <AcmEmptyState
                        key="mcEmptyState"
                        title={t('managed.emptyStateHeader')}
                        message={t('createClusterSet.form.section.clusters.emptyMessage')}
                    />
                }
                columns={[
                    {
                        header: t('table.name'),
                        sort: 'name',
                        search: 'name',
                        cell: (cluster) => <span style={{ whiteSpace: 'nowrap' }}>{cluster.name}</span>,
                    },
                    {
                        header: t('table.status'),
                        sort: 'status',
                        search: 'status',
                        cell: (cluster) => (
                            <span style={{ whiteSpace: 'nowrap' }}>
                                <StatusField cluster={cluster} />
                            </span>
                        ),
                    },
                    {
                        header: t('table.provider'),
                        sort: 'provider',
                        search: 'provider',
                        cell: (cluster) =>
                            cluster?.provider ? <AcmInlineProvider provider={cluster?.provider} /> : '-',
                    },
                    {
                        header: t('table.distribution'),
                        sort: 'distribution.displayVersion',
                        search: 'distribution.displayVersion',
                        cell: (cluster) => <DistributionField cluster={cluster} />,
                    },
                ]}
            />

            <AcmAlertGroup isInline canClose padTop />
            <ActionGroup>
                <AcmSubmit
                    id="submit"
                    variant="primary"
                    label={t('createClusterSet.form.create')}
                    processingLabel={t('createClusterSet.form.creating')}
                    onClick={() => {
                        alertContext.clearAlerts()
                        return createResource<ManagedClusterSet>(managedClusterSet)
                            .promise.then(async () => {
                                if (addClusters?.length) {
                                    const requestResult = resultsSettled(
                                        addClusters.map((c) => {
                                            const managedCluster: ManagedCluster = {
                                                apiVersion: ManagedClusterApiVersion,
                                                kind: ManagedClusterKind,
                                                metadata: {
                                                    name: c.name,
                                                },
                                            }

                                            return patchResource<ManagedCluster>(managedCluster, [
                                                {
                                                    op: 'add',
                                                    path: `/metadata/labels/${managedClusterSetLabel.replace(
                                                        /\//g,
                                                        '~1'
                                                    )}`,
                                                    value: managedClusterSet.metadata.name!,
                                                },
                                            ])
                                        })
                                    )
                                    const promiseResults = await requestResult.promise
                                    if (promiseResults.every((result) => result.status !== 'rejected')) {
                                        history.push(
                                            NavigationPath.clusterSetDetails.replace(
                                                ':id',
                                                managedClusterSet.metadata.name!
                                            )
                                        )
                                    } else {
                                        promiseResults.forEach((result, i) => {
                                            /* istanbul ignore else */
                                            if (result.status === 'rejected') {
                                                const error = result as PromiseRejectedResult
                                                const erroredCluster = addClusters[i]
                                                alertContext.addAlert({
                                                    type: 'danger',
                                                    title: `${erroredCluster.name} - ${error.reason.code}`,
                                                    message: error.reason.message,
                                                })
                                            }
                                        })
                                    }
                                } else {
                                    history.push(
                                        NavigationPath.clusterSetDetails.replace(
                                            ':id',
                                            managedClusterSet.metadata.name!
                                        )
                                    )
                                }
                            })
                            .catch((err) => {
                                alertContext.addAlert({
                                    type: 'danger',
                                    title: err.name,
                                    message: err.message,
                                })
                            })
                    }}
                />
                <AcmButton
                    variant="link"
                    onClick={
                        /* istanbul ignore next */ () => {
                            history.push(NavigationPath.clusterSets)
                        }
                    }
                >
                    {t('common:cancel')}
                </AcmButton>
            </ActionGroup>
        </AcmForm>
    )
}
