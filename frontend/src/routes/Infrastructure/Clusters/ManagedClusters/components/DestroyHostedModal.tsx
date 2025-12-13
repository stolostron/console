/* Copyright Contributors to the Open Cluster Management project */

import { Button, CodeBlock, CodeBlockCode, Content, ContentVariants } from '@patternfly/react-core'
import { ModalVariant } from '@patternfly/react-core/deprecated'
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
export STS_CREDS="example-sts-creds-json"  # The credential name from step 1.
export ROLE_ARN="example-role-arn" # Role ARN from step 1

hcp destroy cluster aws \\
  --name $CLUSTER_NAME \\
  --sts-creds $STS_CREDS \\
  --role-arn $ROLE_ARN`

  const destroyhelperCommand = `hcp destroy cluster aws --help`

  const listItems = [
    {
      title: t('Log in to OpenShift Container Platform'),
      content: (
        <Fragment>
          {GetOCLogInCommand()}
          <Content component={ContentVariants.p}>
            {t(
              'Find the Amazon Web Services (AWS) STS credential and role ARN that you used to create your hosted cluster. The STS credential by default expires in 12 hours so a new one may be needed.'
            )}
          </Content>
        </Fragment>
      ),
    },
    {
      title: t('Destroy the hosted cluster'),
      content: (
        <Fragment>
          <Content component="p">
            {t('Destroy the Hosted Control Plane by copying and pasting the following command:')}
          </Content>
          <CodeBlock actions={Actions(destroyCode, 'code-command')}>
            <CodeBlockCode id="destroy-content">{destroyCode}</CodeBlockCode>
          </CodeBlock>
          <Content component="p" style={{ marginTop: '1em' }}>
            {t('Use the following command to get a list of available parameters:')}
          </Content>
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
