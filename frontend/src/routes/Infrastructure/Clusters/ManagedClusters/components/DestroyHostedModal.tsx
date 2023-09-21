/* Copyright Contributors to the Open Cluster Management project */

import { Button, CodeBlock, CodeBlockCode, ModalVariant, Text, TextVariants } from '@patternfly/react-core'
import { AcmModal } from '../../../../../ui-components'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import DocPage from '../CreateCluster/components/assisted-installer/hypershift/common/DocPage'
import { Fragment } from 'react'
import { Actions, GetOCLogInCommand } from '../CreateCluster/components/assisted-installer/hypershift/common/common'

export function DestroyHostedModal(props: { open: boolean; close: () => void; clusterName: string }) {
  const { open, close, clusterName } = props
  const { t } = useTranslation()

  const destroyCode = `# Set environment variables
export CLUSTER_NAME="example"
export SECRET_CREDS="example-aws-credential-secret"  # The credential name defined in step 1.

hcp destroy cluster aws \\
  --name $CLUSTER_NAME \\
  --secret-creds $SECRET_CREDS`

  const destroyhelperCommand = `hcp create cluster aws --help`

  const listItems = [
    {
      title: t('Log in to your hosted cluster'),
      content: (
        <Fragment>
          <Text component={TextVariants.p}>
            {t('Use the Amazon Web Services (AWS) credential that you used to create your hosted cluster.')}
          </Text>
        </Fragment>
      ),
    },
    {
      title: t('Log in to OpenShift Container Platform'),
      content: GetOCLogInCommand(),
    },
    {
      title: t('Destroy the hosted cluster'),
      content: (
        <Fragment>
          <CodeBlock actions={Actions(destroyCode, 'code-command')}>
            <CodeBlockCode id="destroy-content">{destroyCode}</CodeBlockCode>
          </CodeBlock>
          <Text style={{ marginTop: '1em' }}>{t('Run the following command:')}</Text>
          <CodeBlock actions={Actions(destroyhelperCommand, 'helper-command')}>
            <CodeBlockCode id="helper-command">{destroyhelperCommand}</CodeBlockCode>
          </CodeBlock>
        </Fragment>
      ),
    },
  ]

  return (
    <AcmModal
      title={t('Permanently destroy clusters?')}
      titleIconVariant="warning"
      isOpen={open}
      variant={ModalVariant.medium}
      onClose={() => {
        close()
      }}
      description={
        <Trans
          i18nKey="The <bold>{{clusterName}}</bold> cluster can only be destroyed through the CLI"
          components={{ bold: <strong /> }}
          values={{
            clusterName,
          }}
        />
      }
      actions={[
        <Button
          key="close"
          id="close"
          variant="link"
          onClick={() => {
            close()
          }}
        >
          {t('Close')}
        </Button>,
      ]}
    >
      <DocPage listItems={listItems} noMargin={true} />
    </AcmModal>
  )
}
