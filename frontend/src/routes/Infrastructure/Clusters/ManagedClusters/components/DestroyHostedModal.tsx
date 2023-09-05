/* Copyright Contributors to the Open Cluster Management project */

import { Button, CodeBlock, CodeBlockCode, ModalVariant, Text, TextVariants } from '@patternfly/react-core'
import { AcmModal } from '../../../../../ui-components'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import DocPage from '../CreateCluster/components/assisted-installer/hypershift/common/DocPage'
import { Fragment } from 'react'
import { Actions, GetOCLogInCommand } from '../CreateCluster/components/assisted-installer/hypershift/common/common'

export function DestroyHostedModal(props: { open: boolean; close: () => void }) {
  const { open, close } = props
  const { t } = useTranslation()

  const destroyCode = `# Set environment variables
export CLUSTER_NAME="example"
SECRET_CREDS="example-aws-credential-secret"  # The credential name defined in step 1.

hypershift destroy cluster aws \\
  --name $CLUSTER_NAME \\
  --secret-creds $SECRET_CREDS`

  const listItems = [
    {
      title: t('Prerequisite'),
      content: (
        <Fragment>
          <Text component={TextVariants.p}>
            {t('Have the Amazon Web Services (AWS) credential you used to create the cluster.')}
          </Text>
        </Fragment>
      ),
    },
    {
      title: t('Log into OpenShift Container Platform'),
      content: GetOCLogInCommand(),
    },
    {
      title: t('Run command to destroy hosted cluster'),
      content: (
        <CodeBlock actions={Actions(destroyCode, 'code-command')}>
          <CodeBlockCode id="destroy-content">{destroyCode}</CodeBlockCode>
        </CodeBlock>
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
          i18nKey="The <bold>oidc-cred</bold> cluster can only be destroyed through the CLI."
          components={{ bold: <strong /> }}
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
      <DocPage listItems={listItems} />
    </AcmModal>
  )
}
