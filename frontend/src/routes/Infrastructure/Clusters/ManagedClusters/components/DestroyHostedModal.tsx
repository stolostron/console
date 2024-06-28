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
export STS_CREDS="example-sts-creds-json"  # The credential name step 1.
export ROLE_ARN="example-role-arn" # Role ARN from step 1

hcp destroy cluster aws \\
  --name $CLUSTER_NAME \\
  --sts-creds $STS_CREDS \\
  --role-arn $ROLE_ARN`

  const destroyhelperCommand = `hcp destroy cluster aws --help`

  const listItems = [
    {
      title: t('Log in to your hosting hub cluster'),
      content: (
        <Fragment>
          <Text component={TextVariants.p}>
            {t(
              'Use a valid Amazon Web Services (AWS) STS credential and role ARN that you used to create your hosted cluster.'
            )}
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
          <Text>{t('Destroy the Hosted Control Plane by copying and pasting the following command:')}</Text>
          <CodeBlock actions={Actions(destroyCode, 'code-command')}>
            <CodeBlockCode id="destroy-content">{destroyCode}</CodeBlockCode>
          </CodeBlock>
          <Text style={{ marginTop: '1em' }}>
            {t('Use the following command to get a list of available parameters:')}
          </Text>
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
