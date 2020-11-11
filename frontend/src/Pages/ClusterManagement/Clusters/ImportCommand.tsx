import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    AcmPage,
    AcmPageCard,
    AcmPageHeader,
    AcmCodeSnippet,
    AcmSpinnerBackdrop,
    AcmAlert,
    AcmSecondaryNav,
    AcmSecondaryNavItem,
} from '@open-cluster-management/ui-components'
import { Title, AlertVariant, Tabs, Tab, TabTitleText, Card, CardTitle, CardBody, CardFooter, Button } from '@patternfly/react-core'
import { secretMethods } from '../../../library/resources/secret'
import { AxiosResponse } from 'axios'
import { NavigationPath } from '../ClusterManagement'


export function ImportCommandPage() {
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
    const [error, setError] = useState<AxiosResponse | undefined>()
    const [loading, setLoading] = useState<boolean>(true)
    const [active, setActive] = useState('first')
    const [clusterConsoleURL] = useState<string>(sessionStorage.getItem('DiscoveredClusterConsoleURL') ?? '')

    useEffect(() => {
        ;(async () => {
            const secret = (await pollImportYamlSecret(props.clusterName)) as AxiosResponse
            if (secret.status === 200) {
                const klusterletCRD = secret.data.data['crds.yaml']
                const importYaml = secret.data.data['import.yaml']
                setImportCommand(
                    `echo ${klusterletCRD} | base64 --decode | kubectl apply -f - && sleep 2 && echo ${importYaml} | base64 --decode | kubectl apply -f -`
                )
            } else {
                setError(secret)
            }
            setLoading(false)
        })()
    }, [props.clusterName])

    if (loading) {
        return <AcmSpinnerBackdrop />
    } else if (error) {
        return (
            <AcmAlert
                variant={AlertVariant.danger}
                title={t('common:request.failed')}
                subtitle={`${error.data.code}: ${error.data.message}`}
            />
        )
    }

    return (
        <AcmPageCard>
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
                        <CardBody>
                            {t('import.command.configureclusterdescription')}
                        </CardBody>
                        <CardFooter>
                            <Button key="launchToConsoleBtn" variant="secondary" isDisabled={!clusterConsoleURL} onClick={() => {window.open(clusterConsoleURL, "_blank")}}>{t('import.command.launchconsole')}</Button>
                        </CardFooter>
                    </Card>
                </Tab>
            </Tabs>
            <Card>
                <CardBody>
                    <Link to={NavigationPath.clusterDetails.replace(":id", props.clusterName as string)}><Button variant="primary">{t('import.footer.viewcluster')}</Button></Link>{' '}
                    <Link to={NavigationPath.clusters}><Button variant="secondary">{t('import.footer.importanother')}</Button></Link>
                </CardBody>
            </Card>
        </AcmPageCard>
    )
}

async function pollImportYamlSecret(clusterName: string) {
    let count = 0
    let importYamlSecret: AxiosResponse

    const poll = async (resolve: any, reject: any) => {
        importYamlSecret = await secretMethods.get({ namespace: clusterName, name: `${clusterName}-import` })
        if ((!importYamlSecret || importYamlSecret.status === 404) && count < 10) {
            count += 1
            setTimeout(poll, 500, resolve, reject)
        } else {
            return resolve(importYamlSecret)
        }
    }
    return new Promise(poll)
}
