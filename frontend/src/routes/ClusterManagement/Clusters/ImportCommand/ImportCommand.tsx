import {
    AcmAlert,
    AcmCodeSnippet,
    AcmPage,
    AcmPageHeader,
    AcmSpinnerBackdrop,
} from '@open-cluster-management/ui-components'
import {
    AlertVariant,
    Button,
    Card,
    CardBody,
    CardFooter,
    CardTitle,
    Tab,
    Tabs,
    TabTitleText,
} from '@patternfly/react-core'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { ResourceError } from '../../../../lib/resource-request'
import { getSecret, Secret } from '../../../../resources/secret'

export default function ImportCommandPage() {
    const { clusterName } = useParams() as { clusterName: string }
    const { t } = useTranslation(['cluster'])
    return (
        <AcmPage>
            <AcmPageHeader title={t('page.header.import-cluster')} />
            <ImportCommandPageContent clusterName={clusterName} />
        </AcmPage>
    )
}

export function ImportCommandPageContent(props: { clusterName: string }) {
    const { t } = useTranslation(['cluster', 'common'])
    const [importCommand, setImportCommand] = useState<string>('')
    const [error, setError] = useState<string>()
    const [loading, setLoading] = useState<boolean>(true)
    const [active] = useState('first')
    const [clusterConsoleURL] = useState<string>(sessionStorage.getItem('DiscoveredClusterConsoleURL') ?? '')

    useEffect(() => {
        pollImportYamlSecret(props.clusterName)
            .then((secret) => {
                const klusterletCRD = secret.data?.['crds.yaml']
                const importYaml = secret.data?.['import.yaml']
                setImportCommand(
                    `echo ${klusterletCRD} | base64 --decode | kubectl apply -f - && sleep 2 && echo ${importYaml} | base64 --decode | kubectl apply -f -`
                )
            })
            .catch((err) => {
                const resourceError = err as ResourceError
                setError(resourceError.message)
            })
            .finally(() => {
                setLoading(false)
            })
    }, [props.clusterName])

    if (loading) {
        return <AcmSpinnerBackdrop />
    } else if (error) {
        return <AcmAlert variant={AlertVariant.danger} title={t('common:request.failed')} subtitle={error} />
    }

    return (
        <Card>
            <Tabs activeKey={active}>
                <Tab eventKey={'first'} title={<TabTitleText>{t('import.command.runcommand')}</TabTitleText>}>
                    <Card>
                        <CardTitle>{t('import.command.generated')}</CardTitle>
                        <CardBody>
                            <AcmCodeSnippet
                                id="import-command"
                                fakeCommand={t('import.command.fake')}
                                command={importCommand}
                                copyTooltipText={t('clipboardCopy')}
                                copySuccessText={t('copied')}
                            />
                        </CardBody>
                        <CardTitle>{t('import.command.configurecluster')}</CardTitle>
                        <CardBody>{t('import.command.configureclusterdescription')}</CardBody>
                        {clusterConsoleURL ? (
                            <CardFooter>
                                <Button
                                    key="launchToConsoleBtn"
                                    variant="secondary"
                                    isDisabled={!clusterConsoleURL}
                                    onClick={() => {
                                        window.open(clusterConsoleURL, '_blank')
                                    }}
                                >
                                    {t('import.command.launchconsole')}
                                </Button>
                            </CardFooter>
                        ) : null}
                    </Card>
                </Tab>
            </Tabs>
        </Card>
    )
}

async function pollImportYamlSecret(clusterName: string): Promise<Secret> {
    let retries = 10
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
