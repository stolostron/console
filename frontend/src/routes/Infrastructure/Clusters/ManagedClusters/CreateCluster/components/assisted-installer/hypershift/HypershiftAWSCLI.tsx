/* Copyright Contributors to the Open Cluster Management project */

import { CodeBlock, CodeBlockCode, Modal, ModalVariant, Page, Text, TextVariants } from '@patternfly/react-core'
import { ICatalogBreadcrumb } from '@stolostron/react-data-view'
import { Fragment, useState } from 'react'
import { CreateCredentialModal } from '../../../../../../../../components/CreateCredentialModal'
import { GetProjects } from '../../../../../../../../components/GetProjects'
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
  const { projects } = GetProjects()

  const code = `# Set environment variables
export REGION="us-east-1"
export CLUSTER_NAME="example"
export SECRET_CREDS="example-aws-credential-secret"  # The credential name defined in step 2.
export NAMESPACE="example-namespace"  # $SECRET_CREDS needs to exist in $NAMESPACE.

hcp create cluster aws \\
  --name $CLUSTER_NAME \\
  --namespace $NAMESPACE \\
  --node-pool-replicas=3 \\
  --secret-creds $SECRET_CREDS \\
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
      title: t('Add your Amazon Web Services (AWS) credential'),
      content: (
        <Text component={TextVariants.p}>
          {t('Create a new or update an existing AWS credential.')}
          <CreateCredentialModal handleModalToggle={handleModalToggleAws} />
        </Text>
      ),
    },
    {
      title: t('Add your AWS S3 bucket credential'),
      content: (
        <Text component={TextVariants.p}>
          {t('Create a new or update an existing AWS S3 bucket credential.')}
          <CreateCredentialModal handleModalToggle={handleModalToggleAwsBucket} />
        </Text>
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
