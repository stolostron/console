/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmAlertContext,
    AcmButton,
    AcmEmptyState,
    AcmPageContent,
    AcmTable,
} from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { TableGridBreakpoint } from '@patternfly/react-table'
import { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { clusterCuratorsState, secretsState } from '../../../atoms'
import { BulkActionModel, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { DropdownActionModal, IDropdownActionModalProps } from '../../../components/DropdownActionModal'
import { deleteResource } from '../../../lib/resource-request'
import {
    ClusterCurator,
    filterForTemplatedCurators,
    getTemplateJobsNum,
    LinkAnsibleCredential,
} from '../../../resources/cluster-curator'
import { unpackProviderConnection } from '../../../resources/provider-connection'

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
    const [clusterCurators] = useRecoilState(clusterCuratorsState)
    const providerConnections = secrets.map(unpackProviderConnection)
    const templatedCurators = useMemo(() => filterForTemplatedCurators(clusterCurators), [clusterCurators])
    const ansibleCredentials = providerConnections.map((providerConnection) => {
        if (providerConnection.spec?.ansibleHost) {
            return providerConnection.metadata.name as string
        } else return ''
    })

    const [bulkModalProps, setBulkModalProps] = useState<IBulkActionModelProps<ClusterCurator> | { open: false }>({
        open: false,
    })

    const [dropdownModalProps, setDropdownModalProps] = useState<
        IDropdownActionModalProps<ClusterCurator> | { open: false }
    >({
        open: false,
    })
    const { t } = useTranslation(['cluster', 'common'])

    const history = useHistory()

    const actionFn = (curatorTemplate: ClusterCurator, ansibleCredentialName: string) => {
        console.log('in actionFn')
        return LinkAnsibleCredential(curatorTemplate as ClusterCurator, ansibleCredentialName)
    }

    // Set table
    return (
        <Fragment>
            <BulkActionModel<ClusterCurator> {...bulkModalProps} />
            <DropdownActionModal<ClusterCurator> {...dropdownModalProps} />
            <AcmTable<ClusterCurator>
                gridBreakPoint={TableGridBreakpoint.none}
                plural="integrations"
                items={templatedCurators}
                columns={[
                    {
                        header: t('table.name'),
                        sort: 'metadata.name',
                        search: 'metadata.name',
                        cell: (clusterCurator) => {
                            return clusterCurator.metadata.name
                        },
                    },
                    {
                        header: t('table.linkedCred'),
                        cell: (clusterCurator) => {
                            if (clusterCurator.spec?.install?.towerAuthSecret === undefined) {
                                //Connect to Modal
                                console.log('checking table curator template', clusterCurator)
                                return (
                                    <AcmButton
                                        isInline
                                        variant="link"
                                        isSmall
                                        tooltip={
                                            <Trans
                                                i18nKey="cluster:integration.modal.noCredentials"
                                                components={{ bold: <strong /> }}
                                            />
                                        }
                                        isDisabled={ansibleCredentials.length === 0}
                                        onClick={() => {
                                            setDropdownModalProps({
                                                open: true,
                                                title: t('integration.modal.linkProvider.title'),
                                                action: t('integration.modal.linkProvider.submit'),
                                                processing: t('integration.modal.linkProvider.submitting'),
                                                resource: clusterCurator,
                                                description: t('integration.modal.linkProvider.message'),
                                                actionFn: LinkAnsibleCredential,
                                                close: () => setDropdownModalProps({ open: false }),
                                                isDanger: false,
                                                selectOptions: ansibleCredentials,
                                                selectLabel: t('integration.modal.linkProvider.label'),
                                                selectPlaceholder: t('integration.modal.linkProvider.placeholder'),
                                                confirmText: 'Link',
                                            })
                                        }}
                                    >
                                        {t('integration.link')}
                                    </AcmButton>
                                )
                            } else return clusterCurator.spec.install.towerAuthSecret
                        },
                    },
                    {
                        header: t('table.jobTemplate'),
                        cell: (clusterCurator) => {
                            return getTemplateJobsNum(clusterCurator)
                        },
                    },
                ]}
                keyFn={(clusterCurator: ClusterCurator) => {
                    return clusterCurator.metadata.uid as string
                }}
                tableActions={[
                    {
                        id: 'add',
                        title: t('template.create'),
                        click: () => {
                            // history.push(NavigationPath.addIntegration)
                        },
                    },
                ]}
                rowActions={[
                    {
                        id: 'edit-template',
                        title: t('integration.edit'),
                        click: () => {
                            // history.push(NavigationPath.addIntegration)
                        },
                    },
                    {
                        id: 'delete',
                        title: t('integration.delete'),
                        click: (curator) => {
                            setBulkModalProps({
                                open: true,
                                title: t('integration.modal.delete.title'),
                                action: t('common:delete'),
                                processing: t('common:deleting'),
                                resources: [curator],
                                description: curator.spec?.install?.towerAuthSecret ? (
                                    <div>
                                        <Trans
                                            i18nKey="cluster:integration.modal.delete.message.linked"
                                            values={{
                                                curatorTemplate: curator.metadata.name as string,
                                                ansibleCredential: curator.spec.install.towerAuthSecret as string,
                                            }}
                                            components={{ bold: <strong /> }}
                                        />
                                    </div>
                                ) : (
                                    t('integration.modal.delete.message.noLink')
                                ),
                                columns: [
                                    {
                                        header: t('table.name'),
                                        cell: 'metadata.name',
                                        sort: 'metadata.name',
                                    },
                                    {
                                        header: t('table.namespace'),
                                        cell: 'metadata.namespace',
                                        sort: 'metadata.namespace',
                                    },
                                ],
                                keyFn: (curator: ClusterCurator) => curator.metadata.uid as string,
                                actionFn: deleteResource,
                                close: () => setBulkModalProps({ open: false }),
                                isDanger: true,
                            })
                        },
                    },
                ]}
                bulkActions={[
                    {
                        id: 'deleteTemplate',
                        title: t('bulk.delete.integrations'),
                        click: (curators: ClusterCurator[]) => {
                            setBulkModalProps({
                                open: true,
                                title: t('bulk.delete.integrations'),
                                action: t('common:delete'),
                                processing: t('common:deleting'),
                                resources: [...curators],
                                description: t('bulk.delete.integration.message'),
                                columns: [
                                    {
                                        header: t('table.name'),
                                        cell: 'metadata.name',
                                        sort: 'metadata.name',
                                    },
                                    {
                                        header: t('table.namespace'),
                                        cell: 'metadata.namespace',
                                        sort: 'metadata.namespace',
                                    },
                                ],
                                keyFn: (curator: ClusterCurator) => curator.metadata.uid as string,
                                actionFn: deleteResource,
                                close: () => setBulkModalProps({ open: false }),
                                isDanger: true,
                            })
                        },
                    },
                ]}
                emptyState={
                    <AcmEmptyState
                        title={t('integration.emptyStateHeader')}
                        message={<Trans i18nKey={t('integration.emptyStateMsg')} components={{ bold: <strong /> }} />}
                        action={
                            <AcmButton
                                role="link"
                                onClick={() => {
                                    // TODO: make sure addIntegration can handle new integrations
                                    //history.push(NavigationPath.addIntegration)
                                }}
                                // disabled={}
                                // tooltip={t('common:rbac.unauthorized')}
                                hidden
                            >
                                {t('template.create')}
                            </AcmButton>
                        }
                    />
                }
            ></AcmTable>
        </Fragment>
    )
}
