/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmAlertContext,
    AcmButton,
    AcmEmptyState,
    AcmPageContent,
    AcmTable,
} from '@open-cluster-management/ui-components'
import { PageSection, Button } from '@patternfly/react-core'
import { TableGridBreakpoint } from '@patternfly/react-table'
import { Fragment, useContext, useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { clusterCuratorsState, secretsState } from '../../../atoms'
import { errorIsNot, BulkActionModel, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { deleteResource } from '../../../lib/resource-request'
// import { NavigationPath } from '../../../NavigationPath'
import { AnsibleTowerSecret, filterForAnsibleSecrets } from '../../../resources/ansible-tower-secret'
import { ClusterCurator, filterForTemplatedCurators, getTemplateJobsNum } from '../../../resources/cluster-curator'
import { DropdownActionModel, IDropdownActionModelProps } from '../../../components/DropdownActionModal'
import { filterForProviderSecrets } from '../../../resources/provider-connection'

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
    const [clusterCurators] = useRecoilState(clusterCuratorsState)
    const [templatedCurators] = useState(filterForTemplatedCurators(clusterCurators))
    const providers = filterForProviderSecrets(secrets)

    const [bulkModalProps, setBulkModalProps] = useState<IBulkActionModelProps<ClusterCurator> | { open: false }>({
        open: false,
    })

    const [dropdownModalProps, setDropdownModalProps] = useState<IDropdownActionModelProps | { open: false }>({
        open: false,
    })
    const { t } = useTranslation(['cluster'])

    const history = useHistory()

    // Set table
    return (
        <Fragment>
            <BulkActionModel<ClusterCurator> {...bulkModalProps} />
            <DropdownActionModel {...dropdownModalProps} />
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
                                //Connect to model
                                return (
                                    <Button
                                        isInline
                                        variant="link"
                                        isSmall
                                        onClick={() => {
                                            setDropdownModalProps({
                                                open: true,
                                                title: t('integration.modal.delete.title'),
                                                action: t('common:delete'),
                                                processing: t('common:deleting'),
                                                // resources: [clusterCurator],
                                                description: t('integration.modal.delete.message'),
                                                // actionFn: deleteResource,
                                                close: () => setDropdownModalProps({ open: false }),
                                                isDanger: true,
                                                selectOptions: providers.map(
                                                    (provider) => provider.metadata.name as string
                                                ),
                                                selectLabel: t('integration.modal.linkProvider.label'),
                                                selectPlaceholder: t('integration.modal.linkProvider.placeholder'),
                                                confirmText: 'Link',
                                            })
                                        }}
                                    >
                                        {t('integration.link')}
                                    </Button>
                                )
                            }
                            return ''
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
                    console.log('uid: ', clusterCurator.metadata.uid as string)
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
                                description: t('integration.modal.delete.message'),
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
                        message={
                            <Trans
                                i18nKey={t('integration.emptyStateMsg')}
                                components={{ bold: <strong />, p: <p /> }}
                            />
                        }
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
