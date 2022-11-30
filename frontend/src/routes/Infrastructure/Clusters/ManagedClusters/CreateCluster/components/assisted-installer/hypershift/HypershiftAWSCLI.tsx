/* Copyright Contributors to the Open Cluster Management project */

import {
    ActionList,
    ActionListItem,
    Button,
    Page,
    PageSection,
    Text,
    TextContent,
    TextVariants,
} from '@patternfly/react-core'

import { PageHeader } from '@stolostron/react-data-view'
import { Trans, useTranslation } from '../../../../../../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../../../../../../lib/doc-util'
import { NavigationPath, useBackCancelNavigation } from '../../../../../../../../NavigationPath'
import { AcmInlineCopy } from '../../../../../../../../ui-components'

export function HypershiftAWSCLI() {
    const { t } = useTranslation()
    const { back, cancel } = useBackCancelNavigation()
    const breadcrumbs = [
        { label: t('Clusters'), to: NavigationPath.clusters },
        { label: t('Infrastructure'), to: NavigationPath.createCluster },
        { label: t('Control plane type'), to: NavigationPath.createAWSControlPlane },
        { label: t('Hosted') },
    ]

    const copyCommand =
        'hypershift create cluster aws \
  --name $CLUSTER_NAME \
  --namespace $NAMESPACE \
  --node-pool-replicas=3 \
  --secret-creds $SECRET_CREDS \
  --region $REGION'

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
            <PageSection variant={'light'}>
                <TextContent>
                    <Text component={TextVariants.p} style={{ marginBottom: '2em' }}>
                        <Trans
                            i18nKey="<bold>Prerequisite:</bold> Enable hosted control plane feature for AWS. Download and install hosted control plane CLI."
                            components={{ bold: <strong /> }}
                        />{' '}
                        <a href={DOC_LINKS.HOSTED_CONTROL_PLANES} target="_blank">
                            {t('Follow documentation for more information.')}
                        </a>
                    </Text>
                    <Text component={TextVariants.p} style={{ marginBottom: '2em' }}>
                        {t('Use existing AWS credentials, or create new AWS credentials.')}{' '}
                        <a href={`${NavigationPath.addCredentials}?type=aws`} target="_blank">
                            {t('Click here for Credentials wizard.')}
                        </a>
                    </Text>
                    <Text component={TextVariants.p} style={{ marginBottom: '2em' }}>
                        {t('Log in to OpenShift Container Platform by using the oc login command.')}{' '}
                        <AcmInlineCopy
                            text={copyCommand}
                            displayText={t('Copy this template')}
                            id="copy-template"
                            iconPosition="left"
                        />{' '}
                        {t('to create the hosted control plane command.')}
                    </Text>
                    <Text component={TextVariants.p} style={{ marginBottom: '0.5em' }}>
                        {t('Replace the template variables.')}
                    </Text>
                    <Text component={TextVariants.small}>
                        {t('*Note')}:{' '}
                        <span style={{ border: '1px solid #dfe3e6', padding: '0.2em' }}>
                            --secret-screds $SECRET_CREDS
                        </span>{' '}
                        {t('will be replaced with your AWS credentials from step 1.')}
                    </Text>
                </TextContent>
                <div style={{ position: 'absolute', bottom: '1em' }}>
                    <ActionList>
                        <ActionListItem>
                            <Button variant="secondary" onClick={back(NavigationPath.createBMControlPlane)}>
                                {t('Back')}
                            </Button>
                        </ActionListItem>
                        <ActionListItem>
                            <Button variant="link" onClick={cancel(NavigationPath.clusters)}>
                                {t('Cancel')}
                            </Button>
                        </ActionListItem>
                    </ActionList>
                </div>
            </PageSection>
        </Page>
    )
}
