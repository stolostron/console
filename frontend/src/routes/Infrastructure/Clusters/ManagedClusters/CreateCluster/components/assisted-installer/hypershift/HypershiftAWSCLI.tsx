/* Copyright Contributors to the Open Cluster Management project */

import { Card, CardBody, CardTitle, Divider, Page, Text, TextVariants } from '@patternfly/react-core'
import { PageHeader } from '@stolostron/react-data-view'
import { useTranslation } from '../../../../../../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../../../../../../lib/doc-util'
import { NavigationPath } from '../../../../../../../../NavigationPath'
import { AcmInlineCopy } from '../../../../../../../../ui-components'

export function HypershiftAWSCLI() {
    const { t } = useTranslation()
    const breadcrumbs = [
        { label: t('Clusters'), to: NavigationPath.clusters },
        { label: t('Infrastructure'), to: NavigationPath.createCluster },
        { label: t('Control plane type'), to: NavigationPath.createAWSControlPlane },
        { label: t('Create cluster') },
    ]

    const copyCommand =
        'hypershift create cluster aws --name $CLUSTER_NAME --namespace $NAMESPACE --node-pool-replicas=3 --secret-creds $SECRET_CREDS --region $REGION'

    return (
        <Page>
            <PageHeader
                title={t('Create cluster')}
                breadcrumbs={breadcrumbs}
                titleHelp={
                    <>
                        {t('page.header.create-cluster.tooltip')}
                        <a
                            href={DOC_LINKS.CREATE_CLUSTER}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'block', marginTop: '4px' }}
                        >
                            {t('learn.more')}
                        </a>
                    </>
                }
            />
            <Card style={{ margin: '2em' }}>
                <CardTitle style={{ fontSize: '1.2em' }}>{t('Prerequisite')}</CardTitle>
                <CardBody>
                    {t('Enable hosted control plane feature for AWS. Download and install hosted control plane CLI.')}
                    <br />
                    <Text component={TextVariants.a} href={DOC_LINKS.HOSTED_CONTROL_PLANES} target="_blank">
                        {t('Follow documentation for more information.')}
                    </Text>
                </CardBody>
                <Divider component="div" />
                <CardTitle style={{ fontSize: '1.2em' }}>{t('AWS Credentials')}</CardTitle>
                <CardBody>
                    {t('Use existing AWS credentials, or create new AWS credentials.')}
                    <br />
                    <Text component={TextVariants.a} href={`${NavigationPath.addCredentials}?type=aws`} target="_blank">
                        {t('Click here for Credentials wizard.')}
                    </Text>
                </CardBody>
                <Divider component="div" />
                <CardTitle style={{ fontSize: '1.2em' }}>{t('Hosted control plane command')}</CardTitle>
                <CardTitle>{t('Copy command')}</CardTitle>
                <CardBody>
                    {' '}
                    {t('Log in to OpenShift Container Platform by using the oc login command.')}
                    <br />
                    <AcmInlineCopy
                        text={copyCommand}
                        displayText={t('Copy this template')}
                        id="copy-template"
                        iconPosition="left"
                    />{' '}
                    {t('to create the hosted control plane command.')}
                </CardBody>
                <CardTitle>{t('Replace variables')}</CardTitle>
                <CardBody>
                    {t('Replace the template variables.')}
                    <br />
                    {t('*Note')}: {/* command, no translation needed */}
                    <span style={{ border: '1px solid #dfe3e6', padding: '0.2em' }}>
                        --secret-screds $SECRET_CREDS
                    </span>{' '}
                    {t('will be replaced with your AWS credentials from step 1.')}
                </CardBody>
            </Card>
        </Page>
    )
}
