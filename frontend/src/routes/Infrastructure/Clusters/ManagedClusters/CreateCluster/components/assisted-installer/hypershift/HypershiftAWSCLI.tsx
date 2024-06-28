/* Copyright Contributors to the Open Cluster Management project */

import { CodeBlock, CodeBlockCode, Modal, ModalVariant, Page, Text, TextVariants } from '@patternfly/react-core'
import { ICatalogBreadcrumb } from '@stolostron/react-data-view'
import { Fragment, useState } from 'react'
import { useProjects } from '../../../../../../../../hooks/useProjects'
import { useTranslation } from '../../../../../../../../lib/acm-i18next'
import { DOC_LINKS, ViewDocumentationLink } from '../../../../../../../../lib/doc-util'
import { NavigationPath, useBackCancelNavigation } from '../../../../../../../../NavigationPath'
import { Provider } from '../../../../../../../../ui-components'
import { CredentialsForm } from '../../../../../../../Credentials/CredentialsForm'
import { Actions, GetOCLogInCommand } from './common/common'
import DocPage from './common/DocPage'

export function HypershiftAWSCLI() {
  const { t } = useTranslation()
  const { back, cancel } = useBackCancelNavigation()
  const breadcrumbs: ICatalogBreadcrumb[] = [
    { label: t('Clusters'), to: NavigationPath.clusters },
    { label: t('Infrastructure'), to: NavigationPath.createCluster },
    { label: t('Control plane type - {{hcType}}', { hcType: 'AWS' }), to: NavigationPath.createAWSControlPlane },
    { label: t('Create cluster') },
  ]

  const [isModalOpenAws, setIsModalOpenAws] = useState(false)
  const [isModalOpenAwsBucket, setIsModalOpenAwsBucket] = useState(false)
  const { projects } = useProjects()

  const code = `# Set environment variables
export REGION="us-east-1"
export CLUSTER_NAME="example"
export STS_CREDS="example-sts-creds-json"  # JSON file from step 2
export NAMESPACE="example-namespace"
export ROLE_ARN="example-role-arn" # Role ARN from step 3
export PULL_SECRET="example-pull-secret-file" # Pull secret file path from step 4

hcp create cluster aws \\
  --name $CLUSTER_NAME \\
  --namespace $NAMESPACE \\
  --node-pool-replicas=3 \\
  --sts-creds $STS_CREDS \\
  --role-arn $ROLE_ARN \\
  --pull-secret $PULL_SECRET \\
  --region $REGION`

  const helperCommand = `hcp create cluster aws --help`
  const handleModalToggleAws = () => {
    setIsModalOpenAws(!isModalOpenAws)
  }

  const handleModalToggleAwsBucket = () => {
    setIsModalOpenAwsBucket(!isModalOpenAwsBucket)
  }

  const listItems = [
    {
      title: t('Prerequisites and Configuration'),
      content: (
        <Fragment>
          <Text component={TextVariants.p}>{t('Download and install the Hosted Control Plane CLI.')}</Text>
          <Text component={TextVariants.a} href={DOC_LINKS.HYPERSHIFT_DEPLOY_AWS} target="_blank">
            {t('Follow documentation for more information.')}
          </Text>
        </Fragment>
      ),
    },
    {
      title: t('Create Amazon Web Services (AWS) Security Token Service (STS) credential'),
      content: (
        <Fragment>
          <Text component={TextVariants.p}>{t('This creates a STS credential JSON file.')}</Text>
          <Text component={TextVariants.a} href={DOC_LINKS.CREATE_CLUSTER_HOSTED_AWS} target="_blank">
            {t('Follow documentation for more information.')}
          </Text>
        </Fragment>
      ),
    },
    {
      title: t('Create AWS Identity and Access Management (IAM) role'),
      content: (
        <Fragment>
          <Text component={TextVariants.p}>{t('This creates a AWS IAM role.')}</Text>
          <Text component={TextVariants.a} href={DOC_LINKS.CREATE_CLUSTER_HOSTED_AWS} target="_blank">
            {t('Follow documentation for more information.')}
          </Text>
        </Fragment>
      ),
    },
    {
      title: t('Create Red Hat OpenShift Container Platform pull secret'),
      content: (
        <Fragment>
          <Text component={TextVariants.p}>
            {t('This creates a Red Hat OpenShift Container Platform pull secret.')}
          </Text>
          <a href={'https://console.redhat.com/openshift/install/pull-secret'} target="_blank" rel="noreferrer">
            {t('How do I get the Red Hat OpenShift Container Platform pull secret?')}
          </a>
        </Fragment>
      ),
    },
    {
      title: t('Create the Hosted Control Plane'),
      content: (
        <Fragment>
          <Text component={TextVariants.h4}>{t('Log in to OpenShift Container Platform.')}</Text>
          {GetOCLogInCommand()}
          <Text component={TextVariants.h4}>{t('Run command')}</Text>
          <Text component={TextVariants.p}>
            {t('Create the Hosted Control Plane by copying and pasting the following command:')}
          </Text>
          <CodeBlock actions={Actions(code, 'code-command')}>
            <CodeBlockCode id="code-content">{code}</CodeBlockCode>
          </CodeBlock>
          <Text style={{ marginTop: '1em' }}>
            {t('Use the following command to get a list of available parameters: ')}
          </Text>
          <CodeBlock actions={Actions(helperCommand, 'helper-command')}>
            <CodeBlockCode id="helper-command">{helperCommand}</CodeBlockCode>
          </CodeBlock>
          <ViewDocumentationLink doclink={DOC_LINKS.CREATE_CLUSTER_HOSTED_AWS} />
        </Fragment>
      ),
    },
  ]

  return (
    <Page>
      <Modal
        variant={ModalVariant.large}
        showClose={false}
        isOpen={isModalOpenAws}
        aria-labelledby="modal-wizard-label"
        aria-describedby="modal-wizard-description"
        onClose={handleModalToggleAws}
        hasNoBodyWrapper
      >
        <CredentialsForm
          namespaces={projects}
          isEditing={false}
          isViewing={false}
          credentialsType={Provider.aws}
          handleModalToggle={handleModalToggleAws}
          hideYaml={true}
        />
      </Modal>
      <Modal
        variant={ModalVariant.large}
        showClose={false}
        isOpen={isModalOpenAwsBucket}
        aria-labelledby="modal-wizard-label"
        aria-describedby="modal-wizard-description"
        onClose={handleModalToggleAwsBucket}
        hasNoBodyWrapper
      >
        <CredentialsForm
          namespaces={projects}
          isEditing={false}
          isViewing={false}
          credentialsType={Provider.awss3}
          handleModalToggle={handleModalToggleAwsBucket}
          hideYaml={true}
        />
      </Modal>
      <DocPage
        listItems={listItems}
        breadcrumbs={breadcrumbs}
        onBack={back(NavigationPath.createAWSControlPlane)}
        onCancel={cancel(NavigationPath.managedClusters)}
      />
    </Page>
  )
}
