/* Copyright Contributors to the Open Cluster Management project */

import { AcmAlert, AcmButton } from '@open-cluster-management/ui-components'
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
} from '@patternfly/react-core'
import { CopyIcon } from '@patternfly/react-icons'
import i18next from 'i18next'
import { Fragment, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ClusterStatus } from '../../../../lib/get-cluster'
import { ResourceError } from '../../../../lib/resource-request'
import { getSecret } from '../../../../resources/secret'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'

export function ImportCommandContainer() {
    const { t } = useTranslation(['cluster', 'common'])
    const { cluster, importCommand, setImportCommand } = useContext(ClusterContext)
    const [error, setError] = useState<string | undefined>()
    const [loading, setLoading] = useState<boolean>(false)

    useEffect(() => {
        if (
            cluster?.name &&
            !cluster?.isHive &&
            !error &&
            !loading &&
            !importCommand &&
            cluster?.status === ClusterStatus.pendingimport
        ) {
            setLoading(true)
            pollImportYamlSecret(cluster?.name)
                .then((command: string) => {
                    setImportCommand?.(command)
                })
                .catch((err) => {
                    const resourceError = err as ResourceError
                    setError(resourceError.message)
                })
                .finally(() => {
                    setLoading(false)
                })
        }
    }, [cluster, error, loading, importCommand, setImportCommand])

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

    if (cluster?.status === ClusterStatus.pendingimport) {
        return (
            <>
                <div style={{ marginBottom: '12px' }}>
                    <AcmAlert isInline variant={AlertVariant.info} title={t('import.command.pendingimport')} />
                </div>
                <ImportCommand importCommand={importCommand} />
            </>
        )
    }

    return null
}

type ImportCommandProps = {
    loading?: boolean
    error?: string
    children?: React.ReactNode
    importCommand?: string
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

    if (props.loading || props.error || !props.importCommand) {
        return null
    }

    return (
        <Fragment>
            <Card style={{ marginBottom: '24px' }}>
                <Tabs activeKey={'first'}>
                    <Tab eventKey={'first'} title={<TabTitleText>{t('import.command.runcommand')}</TabTitleText>}>
                        <Card>
                            <CardTitle>{t('import.command.generated')}</CardTitle>
                            <CardBody>
                                <div style={{ marginBottom: '12px' }}>{t('import.command.copy.description')}</div>
                                <Tooltip isVisible={copied} content={t('common:copied')} trigger="click">
                                    <AcmButton
                                        id="import-command"
                                        variant="secondary"
                                        icon={<CopyIcon />}
                                        iconPosition="right"
                                        onClick={(e: any) => {
                                            onCopy(e, props.importCommand ?? '')
                                            setCopied(true)
                                        }}
                                    >
                                        {t('import.command.copy')}
                                    </AcmButton>
                                </Tooltip>
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

export async function pollImportYamlSecret(clusterName: string): Promise<string> {
    let retries = 10
    const poll = async (resolve: any, reject: any) => {
        getSecret({ namespace: clusterName, name: `${clusterName}-import` })
            .promise.then((secret) => {
                const klusterletCRD = secret.data?.['crds.yaml']
                const importYaml = secret.data?.['import.yaml']
                const alreadyImported = i18next.t('cluster:import.command.alreadyimported')
                const alreadyImported64 = Buffer.from(alreadyImported).toString('base64')
                resolve(
                    `echo "${klusterletCRD}" | base64 -d | kubectl create -f - || test $? -eq 0 && sleep 2 && echo "${importYaml}" | base64 -d | kubectl apply -f - || echo "${alreadyImported64}" | base64 -d`
                )
            })
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
