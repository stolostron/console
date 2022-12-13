/* Copyright Contributors to the Open Cluster Management project */

import { Card, List, ListItem, Page, Text, TextContent, TextVariants } from '@patternfly/react-core'
import { PageHeader } from '@stolostron/react-data-view'
import { useTranslation } from '../../../../../../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../../../../../../lib/doc-util'
import { NavigationPath } from '../../../../../../../../NavigationPath'
import { AcmInlineCopy } from '../../../../../../../../ui-components'
import './css/HypershiftAWSCLI.css'

export function HypershiftAWSCLI() {
    const { t } = useTranslation()
    const breadcrumbs = [
        { label: t('Clusters'), to: NavigationPath.clusters },
        { label: t('Infrastructure'), to: NavigationPath.createCluster },
        { label: t('Control plane type'), to: NavigationPath.createAWSControlPlane },
        { label: t('Create cluster') },
    ]

    const copyCommand =
        'oc hcp create cluster aws --name $CLUSTER_NAME --namespace $NAMESPACE --node-pool-replicas=3 --secret-creds $SECRET_CREDS --region $REGION'

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
            <Card style={{ margin: '2em', padding: '2em' }}>
                <List isPlain isBordered iconSize="large">
                    <ListItem icon={<span className="ocm-icons">1</span>}>
                        <TextContent>
                            <Text component={TextVariants.h2}>{t('Prerequisite')}</Text>
                            <Text component={TextVariants.p}>
                                {t(
                                    'Enable Hosted Control Plane feature for AWS. Download and install Hosted Control Plane CLI.'
                                )}
                            </Text>
                            <Text component={TextVariants.a} href={DOC_LINKS.HOSTED_CONTROL_PLANES} target="_blank">
                                {t('Follow documentation for more information.')}
                            </Text>
                        </TextContent>
                    </ListItem>
                    <ListItem icon={<span className="ocm-icons">2</span>}>
                        <TextContent>
                            <Text component={TextVariants.h2}>{t('Amazon Web Services (AWS) Credentials')}</Text>
                            <Text component={TextVariants.p}>
                                {t('Use your existing AWS credentials, or create new AWS credentials.')}
                            </Text>
                            <Text
                                component={TextVariants.a}
                                href={`${NavigationPath.addCredentials}?type=aws`}
                                target="_blank"
                            >
                                {t('Click here to open the Credentials wizard.')}
                            </Text>
                        </TextContent>
                    </ListItem>
                    <ListItem icon={<span className="ocm-icons">3</span>}>
                        <TextContent>
                            <Text component={TextVariants.h2}>{t('Running the Hosted Control Plane command')}</Text>
                            <Text component={TextVariants.h4}>{t('Copy command')}</Text>
                            <Text component={TextVariants.p}>
                                {t('Log in to OpenShift Container Platform by using the oc login command.')}
                            </Text>
                            <Text component={TextVariants.p}>
                                <AcmInlineCopy
                                    text={copyCommand}
                                    displayText={t('Copy this template')}
                                    id="copy-template"
                                    iconPosition="left"
                                />{' '}
                                {t('to create the Hosted Control Plane command.')}
                            </Text>
                            <Text component={TextVariants.h4}>{t('Replace variables')}</Text>
                            <Text component={TextVariants.p}>{t('Replace the template variables.')}</Text>
                            <Text component={TextVariants.p}>
                                {t('*Note')}: {/* command, no translation needed */}
                                <span style={{ border: '1px solid #dfe3e6', padding: '0.2em' }}>
                                    --secret-creds $SECRET_CREDS
                                </span>{' '}
                                {t('will be replaced with your AWS credentials from step 1.')}
                            </Text>
                        </TextContent>
                    </ListItem>
                </List>
            </Card>
        </Page>
    )
}
