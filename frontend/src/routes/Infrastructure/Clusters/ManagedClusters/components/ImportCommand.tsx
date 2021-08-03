/* Copyright Contributors to the Open Cluster Management project */

import { AcmAlert, AcmButton, AcmInlineCopy } from '@open-cluster-management/ui-components'
import { onCopy } from '@open-cluster-management/ui-components/lib/utils'
import {
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
    Alert,
} from '@patternfly/react-core'
import { CopyIcon } from '@patternfly/react-icons'
import i18next from 'i18next'
import { Fragment, useContext, useEffect, useState } from 'react'
import { useRecoilState } from 'recoil'
import { useTranslation } from 'react-i18next'
import { ClusterStatus } from '../../../../../lib/get-cluster'
import { ResourceError } from '../../../../../lib/resource-request'
import { getSecret, Secret } from '../../../../../resources/secret'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { secretsState } from '../../../../../atoms'

export function ImportCommandContainer() {
    const { t } = useTranslation(['cluster', 'common'])
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
                    <Skeleton height="100%" role="progressbar" screenreaderText={t('import.command.fetching')} />
                </CardBody>
            </Card>
        )
    }

    if (error) {
        return <AcmAlert isInline variant="danger" title={t('common:request.failed')} message={error} />
    }

    if (cluster?.status === ClusterStatus.pendingimport && !autoImportSecret) {
        return (
            <>
                <div style={{ marginBottom: '12px' }}>
                    <AcmAlert isInline variant={AlertVariant.info} title={t('import.command.pendingimport')} />
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
    const { t } = useTranslation(['cluster', 'common'])

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
                    <Tab eventKey={'first'} title={<TabTitleText>{t('import.command.runcommand')}</TabTitleText>}>
                        <Card>
                            <CardTitle>{t('import.command.generated')}</CardTitle>
                            <CardBody>
                                <strong style={{ marginBottom: '12px', fontSize: '14px', display: 'block' }}>
                                    {t('import.command.copy.description')}
                                </strong>
                                <Tooltip isVisible={copied} content={t('common:copied')} trigger="click">
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
                                        {t('import.command.copy')}
                                    </AcmButton>
                                </Tooltip>
                                <Alert
                                    isInline
                                    title={t('import.command.311.title')}
                                    variant={AlertVariant.info}
                                    style={{ marginTop: '16px' }}
                                >
                                    <div>{t('import.command.311.description')}</div>
                                    <AcmInlineCopy
                                        text={v1beta1ImportCommand}
                                        displayText={t('import.command.311.copyText')}
                                        id="3.11-copy"
                                    />
                                </Alert>
                            </CardBody>
                            <CardTitle>{t('import.command.configurecluster')}</CardTitle>
                            <CardBody>{t('import.command.configureclusterdescription')}</CardBody>
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
                                        {t('import.command.launchconsole')}
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
