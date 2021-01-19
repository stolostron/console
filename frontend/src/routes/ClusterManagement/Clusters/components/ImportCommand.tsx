import { AcmAlert, AcmButton, AcmCodeSnippet } from '@open-cluster-management/ui-components'
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
} from '@patternfly/react-core'
import React, { useContext, useEffect, useState } from 'react'
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

    if (props.loading || props.error || !props.importCommand) {
        return null
    }

    return (
        <React.Fragment>
            <Card style={{ marginBottom: '24px' }}>
                <Tabs activeKey={'first'}>
                    <Tab eventKey={'first'} title={<TabTitleText>{t('import.command.runcommand')}</TabTitleText>}>
                        <Card>
                            <CardTitle>{t('import.command.generated')}</CardTitle>
                            <CardBody>
                                <AcmCodeSnippet
                                    id="import-command"
                                    fakeCommand={t('import.command.fake')}
                                    command={props.importCommand}
                                    copyTooltipText={t('clipboardCopy')}
                                    copySuccessText={t('copied')}
                                />
                            </CardBody>
                            <CardTitle>{t('import.command.configurecluster')}</CardTitle>
                            <CardBody>{t('import.command.configureclusterdescription')}</CardBody>
                            {sessionStorage.getItem('DiscoveredClusterConsoleURL') && (
                                <CardFooter>
                                    <AcmButton
                                        id="launch-console"
                                        variant="secondary"
                                        component="a"
                                        href={
                                            /* istanbul ignore next */ sessionStorage.getItem(
                                                'DiscoveredClusterConsoleURL'
                                            ) ?? ''
                                        }
                                        target="_blank"
                                        rel="noreferrer"
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
        </React.Fragment>
    )
}

export async function pollImportYamlSecret(clusterName: string): Promise<string> {
    let retries = 10
    const poll = async (resolve: any, reject: any) => {
        getSecret({ namespace: clusterName, name: `${clusterName}-import` })
            .promise.then((secret) => {
                const klusterletCRD = secret.data?.['crds.yaml']
                const importYaml = secret.data?.['import.yaml']
                resolve(
                    `echo ${klusterletCRD} | base64 --decode | kubectl apply -f - && sleep 2 && echo ${importYaml} | base64 --decode | kubectl apply -f -`
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
