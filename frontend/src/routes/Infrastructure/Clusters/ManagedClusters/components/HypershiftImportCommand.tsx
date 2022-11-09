/* Copyright Contributors to the Open Cluster Management project */
import { AlertVariant, List, ListComponent, ListItem, OrderType, Stack, StackItem } from '@patternfly/react-core'
import { HostedClusterK8sResource } from 'openshift-assisted-ui-lib/cim'
import * as React from 'react'
import { useContext } from 'react'
import { getErrorInfo } from '../../../../../components/ErrorPage'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import {
    createResource,
    getSecret,
    IResource,
    ManagedCluster,
    ManagedClusterApiVersion,
    ManagedClusterKind,
    patchResource,
    unpackSecret,
} from '../../../../../resources'
import { AcmAlert, AcmButton, AcmToastContext } from '../../../../../ui-components'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { useHypershiftKubeconfig } from '../ClusterDetails/ClusterOverview/HypershiftKubeAPI'
import { CopyCommandButton, useImportCommand } from './ImportCommand'
import { LoginCredential } from './LoginCredentials'

export const HypershiftImportCommand = (props: { selectedHostedClusterResource: HostedClusterK8sResource }) => {
    const { selectedHostedClusterResource } = props
    const { t } = useTranslation()
    const [hypershiftKubeAPI, error] = useHypershiftKubeconfig()
    const { cluster } = React.useContext(ClusterContext)
    const toastContext = useContext(AcmToastContext)

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

    const { v1ImportCommand, loading, error: importErr } = useImportCommand(true)

    const loginCommand = `oc login ${hypershiftKubeAPI} -u kubeadmin -p ${credentials?.password}`

    // let clusters = useAllClusters()
    // const selectedHostedCluster = clusters.find((c) => c.name === cluster?.name)

    function importHostedControlPlaneCluster() {
        const hdName = selectedHostedClusterResource.metadata.name
        const hdNamespace = selectedHostedClusterResource.metadata.namespace
        const managedClusterResource: ManagedCluster = {
            apiVersion: ManagedClusterApiVersion,
            kind: ManagedClusterKind,
            metadata: {
                annotations: {
                    'import.open-cluster-management.io/hosting-cluster-name': 'local-cluster',
                    'import.open-cluster-management.io/klusterlet-deploy-mode': 'Hosted',
                    'open-cluster-management/created-via': 'other',
                },
                labels: {
                    cloud: 'auto-detect',
                    'cluster.open-cluster-management.io/clusterset': 'default',
                    name: hdName,
                    vendor: 'OpenShift',
                },
                name: hdName,
            },
            spec: {
                hubAcceptsClient: true,
                leaseDurationSeconds: 60,
            },
        }

        const updateAnnotations = {
            'cluster.open-cluster-management.io/managedcluster-name': hdName,
            'cluster.open-cluster-management.io/hypershiftdeployment': `${hdNamespace}/${hdName}`,
        }

        createResource(managedClusterResource as IResource)
            .promise.then(() => {
                toastContext.addAlert({
                    title: t('Import hosted control plane cluster...'),
                    type: 'success',
                    autoClose: true,
                })
            })
            .catch((err) => {
                const errorInfo = getErrorInfo(err, t)
                toastContext.addAlert({
                    type: 'danger',
                    title: errorInfo.title,
                    message: errorInfo.message,
                })
            })

        patchResource(selectedHostedClusterResource, [
            { op: 'replace', path: '/metadata/annotations', value: updateAnnotations },
        ])
    }

    if (!v1ImportCommand && cluster?.isHypershift) {
        // import alert
        return (
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
                                <AcmButton
                                    variant="link"
                                    style={{ paddingLeft: '0px' }}
                                    onClick={() => importHostedControlPlaneCluster()}
                                >
                                    {t('managed.importCluster')}
                                </AcmButton>
                            </StackItem>
                        </Stack>
                    }
                />
            </div>
        )
    }
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
