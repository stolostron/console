/* Copyright Contributors to the Open Cluster Management project */
import { AlertVariant, List, ListComponent, ListItem, OrderType, Stack, StackItem } from '@patternfly/react-core'
import * as React from 'react'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import { getSecret, unpackSecret } from '../../../../../resources'
import { AcmAlert } from '../../../../../ui-components'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { useHypershiftKubeconfig } from '../ClusterDetails/ClusterOverview/HypershiftKubeAPI'
import { CopyCommandButton, useImportCommand } from './ImportCommand'
import { LoginCredential } from './LoginCredentials'

export const HypershiftImportCommand = () => {
    const { t } = useTranslation()
    const [hypershiftKubeAPI, error] = useHypershiftKubeconfig()
    const { cluster } = React.useContext(ClusterContext)

    const [credentials, setCredentials] = React.useState<LoginCredential>()
    const name = cluster?.kubeadmin
    const namespace = cluster?.namespace
    React.useEffect(() => {
        const fetchCredentials = async () => {
            if (name && namespace) {
                const secret = await getSecret({ name, namespace }).promise
                const { stringData } = unpackSecret(secret)
                setCredentials(stringData as LoginCredential)
            }
        }
        fetchCredentials()
    }, [name, namespace])

    const { v1ImportCommand, loading, error: importErr } = useImportCommand()

    const loginCommand = `oc login ${hypershiftKubeAPI} -u kubeadmin -p ${credentials?.password}`

    return (
        <>
            {!!cluster && !loading && !importErr && !error && !!v1ImportCommand && (
                <div style={{ marginBottom: '12px' }}>
                    <AcmAlert
                        isInline
                        variant={AlertVariant.info}
                        title={t('import.command.pendingimport')}
                        noClose
                        message={
                            <Stack hasGutter>
                                <StackItem>{t('Hosted cluster requires a manual import.')}</StackItem>
                                <StackItem>
                                    <List component={ListComponent.ol} type={OrderType.number}>
                                        <ListItem>
                                            <Trans>
                                                <CopyCommandButton variant="link" isInline command={loginCommand}>
                                                    Run this command
                                                </CopyCommandButton>{' '}
                                                to log-in to the existing cluster in your terminal
                                            </Trans>
                                        </ListItem>
                                        <ListItem>
                                            <Trans>
                                                <CopyCommandButton
                                                    variant="link"
                                                    isInline
                                                    loading={loading}
                                                    command={v1ImportCommand}
                                                >
                                                    Run this command
                                                </CopyCommandButton>{' '}
                                                to import your cluster
                                            </Trans>
                                        </ListItem>
                                    </List>
                                </StackItem>
                            </Stack>
                        }
                    />
                </div>
            )}
        </>
    )
}
