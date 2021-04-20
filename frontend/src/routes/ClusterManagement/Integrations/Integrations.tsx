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
import { Fragment, useContext, useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { secretsState } from '../../../atoms'
import { errorIsNot, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { providers } from '../../../lib/providers'
import { deleteResource, ResourceErrorCode } from '../../../lib/resource-request'
import { NavigationPath } from '../../../NavigationPath'
import { AnsibleTowerSecret, filterForAnsibleSecrets } from '../../../resources/ansible-tower-secret'
import { filterForProviderSecrets, ProviderConnection } from '../../../resources/provider-connection'

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
    const providerSecrets = filterForProviderSecrets(secrets)

    const secretMap: { [key: string]: Array<Object> } = {}
    ansibleSecrets.forEach((ansibleSecret) => {
        secretMap[ansibleSecret.metadata.name!] = []
    })
    providerSecrets.forEach((provider) => {
        if (provider.spec?.anisibleSecretName) {
            if (provider.spec.anisibleSecretName in secretMap) {
                secretMap[provider.spec.anisibleSecretName!].push({
                    rowOne: '',
                    title: provider.metadata.name!,
                    props: {
                        colSpan: 3,
                    },
                })
            }
        }
    })

    console.log('checking Secret Map: ', secretMap)

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
                addSubRows={(ansibleSecret) => {
                    if (secretMap[ansibleSecret.metadata.name!].length < 1) {
                        return undefined
                    }
                    const subRows: Array<Object> = secretMap[ansibleSecret.metadata.name!].map((row) => {
                        return {
                            cells: [{ title: '', id: 'blank-cell' }, row],
                        }
                    })

                    return subRows
                }}
                keyFn={(ansibleSecret: AnsibleTowerSecret) => {
                    console.log('uid: ', ansibleSecret.metadata.uid as string)
                    return ansibleSecret.metadata.uid as string
                }}
                tableActions={[]}
                rowActions={[
                    {
                        id: 'delete',
                        title: 'Delete',
                        click: () => {},
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
