/* Copyright Contributors to the Open Cluster Management project */

import React, { Fragment, useContext, useEffect, useState } from 'react'
import {
    AcmAlertContext,
    AcmButton,
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
    filterForAnsibleSecrets,
} from '../../../resources/ansible-tower-secret'
import { TableGridBreakpoint } from '@patternfly/react-table'
import { useRecoilState } from 'recoil'
import { secretsState } from '../../../atoms'
import { deleteResource, ResourceErrorCode } from '../../../lib/resource-request'
import { NavigationPath } from '../../../NavigationPath'
import { useHistory } from 'react-router-dom'

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
    const [secrets] = useRecoilState(secretsState)
    const ansibleSecrets = filterForAnsibleSecrets(secrets)

    function mckeyFn(ansibleTowerSecret: AnsibleTowerSecret) {
        return ansibleTowerSecret.metadata.uid!
    }

    const [modalProps, setModalProps] = useState<IBulkActionModelProps<AnsibleTowerSecret> | { open: false }>({
        open: false,
    })

    const { t } = useTranslation(['cluster'])

    const history = useHistory()

    // Set table
    return (
        <Fragment>
            <AcmTable<AnsibleTowerSecret>
                gridBreakPoint={TableGridBreakpoint.none}
                plural="integrations"
                items={ansibleSecrets}
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
                            setModalProps({
                                open: true,
                                title: t('bulk.delete.integrations'),
                                action: t('common:delete'),
                                processing: t('common:deleting'),
                                resources: integrations,
                                description: t('bulk.message.delete.integrations'),
                                // columns: modalColumns,
                                keyFn: mckeyFn,
                                actionFn: deleteResource,
                                close: () => setModalProps({ open: false }),
                                isDanger: true,
                                confirmText: t('confirm').toLowerCase(),
                                isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                            })
                        },
                    },
                ]}
                tableActions={[]}
                rowActions={[]}
                emptyState={
                    <AcmEmptyState
                        key="mcEmptyState"
                        title={t('integration.emptyStateHeader')}
                        message={
                            <Trans
                                i18nKey={t('integration.emptyStateMsg')}
                                components={{ bold: <strong />, p: <p /> }}
                            />
                        }
                        action={
                            <AcmButton
                                role="link"
                                onClick={() => history.push(NavigationPath.addCredentials)}
                                // disabled={}
                                // tooltip={t('common:rbac.unauthorized')}
                            >
                                {t('integration.create')}
                            </AcmButton>
                        }
                    />
                }
            ></AcmTable>
        </Fragment>
    )
}
