/* Copyright Contributors to the Open Cluster Management project */

import {
  Card,
  ClipboardCopyButton,
  CodeBlock,
  CodeBlockAction,
  CodeBlockCode,
  List,
  ListItem,
  Modal,
  ModalVariant,
  Page,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core'
import { PageHeader } from '@stolostron/react-data-view'
import { Fragment, useState } from 'react'
import { CreateCredentialModal } from '../../../../../../../../components/CreateCredentialModal'
import { GetProjects } from '../../../../../../../../components/GetProjects'
import { useTranslation } from '../../../../../../../../lib/acm-i18next'
import { DOC_CREATE_HOSTED_CLUSTER, DOC_LINKS, viewDocumentation } from '../../../../../../../../lib/doc-util'
import { NavigationPath } from '../../../../../../../../NavigationPath'
import { Provider } from '../../../../../../../../ui-components'
import { CredentialsForm } from '../../../../../../../Credentials/CredentialsForm'
import './css/HypershiftAWSCLI.css'

export function HypershiftAWSCLI() {
  const { t } = useTranslation()
  const breadcrumbs = [
    { label: t('Clusters'), to: NavigationPath.clusters },
    { label: t('Infrastructure'), to: NavigationPath.createCluster },
    { label: t('Control plane type - {{hcType}}', { hcType: 'AWS' }), to: NavigationPath.createAWSControlPlane },
    { label: t('Create cluster') },
  ]

  const [copied, setCopied] = useState(false)
  const [isModalOpenAws, setIsModalOpenAws] = useState(false)
  const [isModalOpenAwsBucket, setIsModalOpenAwsBucket] = useState(false)
  const { projects } = GetProjects()

  const code = `# Set environment variables
REGION="us-east-1"
CLUSTER_NAME="example"
SECRET_CREDS="example-aws-credential-secret"  # The credential name defined in step 2.
NAMESPACE="example-namespace"  # $SECRET_CREDS needs to exist in $NAMESPACE.

hypershift create cluster aws 
  --name $CLUSTER_NAME \\
  --namespace $NAMESPACE \\
  --node-pool-replicas=3 \\
  --secret-creds $SECRET_CREDS \\
  --region $REGION \\`

  const helperCommand = `hypershift create cluster aws --help`
  const handleModalToggleAws = () => {
    setIsModalOpenAws(!isModalOpenAws)
  }

  const handleModalToggleAwsBucket = () => {
    setIsModalOpenAwsBucket(!isModalOpenAwsBucket)
  }

  const onClick = (text: string) => {
    navigator.clipboard.writeText(text.toString())
    setCopied(true)
  }

  const actions = (code: string, id: string) => (
    <Fragment>
      <CodeBlockAction>
        <ClipboardCopyButton
          id={`${id}-copy`}
          textId={id}
          aria-label={t('Copy to clipboard')}
          onClick={() => onClick(code)}
          exitDelay={copied ? 1500 : 600}
          maxWidth="110px"
          variant="plain"
        >
          {copied ? t('Successfully copied to clipboard!') : t('Copy to clipboard')}
        </ClipboardCopyButton>
      </CodeBlockAction>
    </Fragment>
  )

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
                {t('Enable Hosted Control Plane feature for AWS. Download and install Hosted Control Plane CLI.')}
              </Text>
              <Text component={TextVariants.a} href={DOC_LINKS.HOSTED_CONTROL_PLANES} target="_blank">
                {t('Follow documentation for more information.')}
              </Text>
            </TextContent>
          </ListItem>
          <ListItem icon={<span className="ocm-icons">2</span>}>
            <TextContent>
              <Text component={TextVariants.h2}>{t('Amazon Web Services (AWS) credential')}</Text>
              <Text component={TextVariants.p}>
                {t('Create a new or update an existing AWS credential.')}
                <CreateCredentialModal handleModalToggle={handleModalToggleAws} />
              </Text>
            </TextContent>
          </ListItem>
          <ListItem icon={<span className="ocm-icons">3</span>}>
            <TextContent>
              <Text component={TextVariants.h2}>{t('Amazon Web Services (AWS) S3 bucket credential')}</Text>
              <Text component={TextVariants.p}>
                {t('Create a new or update an existing AWS S3 bucket credential.')}
                <CreateCredentialModal handleModalToggle={handleModalToggleAwsBucket} />
              </Text>
            </TextContent>
          </ListItem>
          <ListItem icon={<span className="ocm-icons">4</span>}>
            <TextContent>
              <Text component={TextVariants.h2}>{t('Running the Hosted Control Plane command')}</Text>
              <Text component={TextVariants.h4}>{t('How to log into OpenShift Container Platform')}</Text>
              <Text
                component={TextVariants.a}
                onClick={() => {
                  window.open(window.SERVER_FLAGS?.requestTokenURL)
                }}
                target="_blank"
              >
                {t('Use the oc login command.')}
              </Text>
              <Text component={TextVariants.h4}>{t('Execute command')}</Text>
              <Text component={TextVariants.p}>{t('To create the Hosted Control Plane command, copy the code:')}</Text>
              <CodeBlock actions={actions(code, 'code-command')}>
                <CodeBlockCode id="code-content">{code}</CodeBlockCode>
              </CodeBlock>
              <Text style={{ marginTop: '1em' }}>
                {t('Use the following command to see all available parameters.')}
              </Text>
              <CodeBlock actions={actions(helperCommand, 'helper-command')}>
                <CodeBlockCode id="helper-command">{helperCommand}</CodeBlockCode>
              </CodeBlock>
              {viewDocumentation(DOC_CREATE_HOSTED_CLUSTER, t)}
            </TextContent>
          </ListItem>
        </List>
      </Card>
    </Page>
  )
}
