/* Copyright Contributors to the Open Cluster Management project */

import React, { Fragment, useContext, useEffect, useState } from 'react'
import {
    AcmAlertContext,
    AcmEmptyState,
    AcmForm,
    AcmPageContent,
    AcmTable,
} from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { useTranslation, Trans } from 'react-i18next'
import {
    AnsibleTowerSecret,
    AnsibleTowerSecretApiVersion,
    AnsibleTowerSecretKind,
} from '../../../resources/ansible-tower-secret'
import { TableGridBreakpoint } from '@patternfly/react-table'
import { V1ObjectMeta } from '@kubernetes/client-node'

export default function IntegrationsPage() {
    const alertContext = useContext(AcmAlertContext)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => alertContext.clearAlerts, [])

    return (
        <AcmPageContent id="clusters">
            <PageSection variant="light" isFilled={true}>
                <IntegrationTable></IntegrationTable>
            </PageSection>
        </AcmPageContent>
    )
}

function IntegrationTable() {
    // Load Data

    const exampleIntegrations: AnsibleTowerSecret[] = [
        {
            apiVersion: AnsibleTowerSecretApiVersion,
            kind: AnsibleTowerSecretKind,
            metadata: {
                name: 'Test-connection',
                namespace: 'default',
            },
        },
    ]
    function mckeyFn(ansibleTowerSecret: AnsibleTowerSecret) {
        return ansibleTowerSecret.metadata.uid!
    }
    const { t } = useTranslation(['cluster'])

    // Set table
    return (
        <Fragment>
            <AcmTable<AnsibleTowerSecret>
                gridBreakPoint={TableGridBreakpoint.none}
                plural="integrations"
                items={exampleIntegrations}
                columns={[
                    {
                        header: t('table.name'),
                        sort: 'metadata.name',
                        search: 'metadata.name',
                        cell: (ansibleSecret) => {
                            return ansibleSecret.metadata.name
                        },
                    },
                    {
                        header: t('table.linkedCred'),
                        cell: (ansibleSecret) => {
                            return ''
                        },
                    },
                    {
                        header: t('table.clustersInUse'),
                        cell: (ansibleSecret) => {
                            return ''
                        },
                    },
                    {
                        header: t('table.defaultTemplate'),
                        cell: (ansibleSecret) => {
                            return ''
                        },
                    },
                ]}
                keyFn={mckeyFn}
                key="integrationTable"
                bulkActions={[
                    {
                        id: 'deleteIntegrations',
                        title: t('bulk.delete.integrations'),
                        click: (integrations) => {
                            // setModalProps({
                            //     open: true,
                            //     title: t('bulk.delete.clusterPools'),
                            //     action: t('common:delete'),
                            //     processing: t('common:deleting'),
                            //     resources: clusterPools,
                            //     description: t('bulk.message.deleteClusterPool'),
                            //     columns: modalColumns,
                            //     keyFn: mckeyFn,
                            //     actionFn: deleteResource,
                            //     close: () => setModalProps({ open: false }),
                            //     isDanger: true,
                            //     confirmText: t('confirm').toLowerCase(),
                            //     isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                            // })
                        },
                    },
                ]}
                tableActions={[
                    
                ]}
                rowActions={[]}
                emptyState={
                    <AcmEmptyState
                        key="mcEmptyState"
                        title={t('cluster:integration.emptyStateHeader')}
                        message={
                            <Trans
                                i18nKey={'integration.integrations.emptyStateMsg'}
                                components={{ bold: <strong />, p: <p /> }}
                            />
                        }
                        // action={
                        //     <AcmButton
                        //         role="link"
                        //         onClick={() => history.push(NavigationPath.clusterPools)}
                        //         disabled={!canCreateClusterPool}
                        //         tooltip={t('common:rbac.unauthorized')}
                        //     >
                        //         {t('managed.createClusterPool')}
                        //     </AcmButton>
                        // }
                    />
                }
            ></AcmTable>
        </Fragment>
    )
}
