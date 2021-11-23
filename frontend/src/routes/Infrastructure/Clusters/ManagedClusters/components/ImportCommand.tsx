/* Copyright Contributors to the Open Cluster Management project */

import { ClusterStatus, getSecret, ResourceError, Secret } from '../../../../../resources'
import { AcmAlert, AcmButton, AcmInlineCopy } from '@open-cluster-management/ui-components'
import { onCopy } from '@open-cluster-management/ui-components/lib/utils'
import {
    Alert,
    AlertVariant,
    Card,
    CardBody,
    CardFooter,
    CardTitle,
    Skeleton,
    Tab,
    Tabs,
    TabTitleText,
    Tooltip,
} from '@patternfly/react-core'
import { CopyIcon } from '@patternfly/react-icons'
import i18next from 'i18next'
import { Fragment, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRecoilState } from 'recoil'
import { secretsState } from '../../../../../atoms'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'

export function ImportCommandContainer() {
    const { t } = useTranslation()
    const [secrets] = useRecoilState(secretsState)
    const { cluster } = useContext(ClusterContext)
    const [error, setError] = useState<string | undefined>()
    const [loading, setLoading] = useState<boolean>(false)
    const [importSecret, setImportSecret] = useState<Secret | undefined>(undefined)

    // do not show command if it's configured to auto-import
    const autoImportSecret = secrets.find(
        (s) => s.metadata.namespace === cluster?.namespace && s.metadata.name === 'auto-import-secret'
    )

    useEffect(() => {
        if (
            cluster?.name &&
            !cluster?.isHive &&
            !error &&
            !loading &&
            !importSecret &&
            !autoImportSecret &&
            cluster?.status === ClusterStatus.pendingimport
        ) {
            setLoading(true)
            pollImportYamlSecret(cluster?.name)
                .then((secret: Secret) => setImportSecret(secret))
                .catch((err) => {
                    const resourceError = err as ResourceError
                    setError(resourceError.message)
                })
                .finally(() => setLoading(false))
        }
    }, [cluster, error, loading, importSecret, autoImportSecret])

    if (loading) {
        return (
            <Card style={{ height: '276px', marginBottom: '24px' }}>
                <CardBody>
                    <Skeleton height="100%" role="progressbar" screenreaderText={t('Loading cluster import command')} />
                </CardBody>
            </Card>
        )
    }

    if (error) {
        return <AcmAlert isInline variant="danger" title={t('Request failed')} message={error} />
    }

    if (cluster?.status === ClusterStatus.pendingimport && !autoImportSecret) {
        return (
            <>
                <div style={{ marginBottom: '12px' }}>
                    <AcmAlert isInline variant={AlertVariant.info} title={t('Cluster is pending import')} />
                </div>
                <ImportCommand importSecret={importSecret} />
            </>
        )
    }

    return null
}

type ImportCommandProps = {
    loading?: boolean
    error?: string
    children?: React.ReactNode
    importSecret?: Secret
}

export function ImportCommand(props: ImportCommandProps) {
    const { t } = useTranslation()

    const [copied, setCopied] = useState<boolean>(false)
    useEffect(() => {
        /* istanbul ignore if */
        if (copied) {
            setTimeout(() => setCopied(false), 2000)
        }
    }, [copied])

    if (props.loading || props.error || !props.importSecret) {
        return null
    }

    const v1ImportCommand = getImportCommand(props.importSecret, 'v1')
    const v1beta1ImportCommand = getImportCommand(props.importSecret, 'v1beta1')

    return (
        <Fragment>
            <Card style={{ marginBottom: '24px' }}>
                <Tabs activeKey={'first'}>
                    <Tab eventKey={'first'} title={<TabTitleText>{t('Run a command')}</TabTitleText>}>
                        <Card>
                            <CardTitle>{t('1. Copy this command')}</CardTitle>
                            <CardBody>
                                <strong style={{ marginBottom: '12px', fontSize: '14px', display: 'block' }}>
                                    {t('For OpenShift 4 and Kubernetes 1.16.0 clusters or above')}
                                </strong>
                                <Tooltip isVisible={copied} content={t('Copied')} trigger="click">
                                    <AcmButton
                                        id="import-command"
                                        variant="secondary"
                                        icon={<CopyIcon />}
                                        iconPosition="right"
                                        onClick={(e: any) => {
                                            onCopy(e, v1ImportCommand)
                                            setCopied(true)
                                        }}
                                    >
                                        {t('Copy command')}
                                    </AcmButton>
                                </Tooltip>
                                <Alert
                                    isInline
                                    title={t('Support for OpenShift 3.11 clusters')}
                                    variant={AlertVariant.info}
                                    style={{ marginTop: '16px' }}
                                >
                                    <div>
                                        {t(
                                            'The latest distributions of OpenShift no longer support the v1beta1 API version. For continued compatibility support, use the command below to import your OpenShift 3.11 cluster.'
                                        )}
                                    </div>
                                    <AcmInlineCopy
                                        text={v1beta1ImportCommand}
                                        displayText={t('Copy command for OpenShift 3.11')}
                                        id="3.11-copy"
                                    />
                                </Alert>
                            </CardBody>
                            <CardTitle>
                                {t(
                                    '2. Run this command with kubectl configured for your targeted cluster to start the import'
                                )}
                            </CardTitle>
                            <CardBody>
                                {t('Log in to the existing cluster in your terminal and run the command.')}
                            </CardBody>
                            {sessionStorage.getItem('DiscoveredClusterConsoleURL') && (
                                <CardFooter>
                                    <AcmButton
                                        id="launch-console"
                                        variant="secondary"
                                        onClick={() => {
                                            const location = sessionStorage.getItem('DiscoveredClusterConsoleURL')
                                            if (location) {
                                                window.open(location, '_blank')
                                            }
                                        }}
                                        role="link"
                                    >
                                        {t('Launch console')}
                                    </AcmButton>
                                </CardFooter>
                            )}
                        </Card>
                    </Tab>
                </Tabs>
            </Card>
            {props.children}
        </Fragment>
    )
}

export async function pollImportYamlSecret(clusterName: string): Promise<Secret> {
    let retries = 20
    const poll = async (resolve: any, reject: any) => {
        getSecret({ namespace: clusterName, name: `${clusterName}-import` })
            .promise.then((secret) => resolve(secret))
            .catch((err) => {
                if (retries-- > 0) {
                    setTimeout(poll, 500, resolve, reject)
                } else {
                    reject(err)
                }
            })
    }
    return new Promise(poll)
}

export function getImportCommand(importSecret: Secret, version: 'v1' | 'v1beta1') {
    let klusterletCRD = importSecret.data?.['crdsv1.yaml']
    if (version === 'v1beta1') {
        klusterletCRD = importSecret.data?.['crdsv1beta1.yaml']
    }
    const importYaml = importSecret.data?.['import.yaml']
    const alreadyImported = i18next.t('cluster:import.command.alreadyimported')
    const alreadyImported64 = Buffer.from(alreadyImported).toString('base64')
    return `echo "${klusterletCRD}" | base64 -d | kubectl create -f - || test $? -eq 0 && sleep 2 && echo "${importYaml}" | base64 -d | kubectl apply -f - || echo "${alreadyImported64}" | base64 -d`
}
