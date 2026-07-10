/* Copyright Contributors to the Open Cluster Management project */

import { Button, CodeBlock, CodeBlockCode, Content, ContentVariants } from '@patternfly/react-core'
import { ModalVariant } from '@patternfly/react-core/deprecated'
import { AcmModal, Provider } from '../../../../../ui-components'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import DocPage from '../CreateCluster/components/assisted-installer/hypershift/common/DocPage'
import { Fragment } from 'react'
import { Actions, GetOCLogInCommand } from '../CreateCluster/components/assisted-installer/hypershift/common/common'
import type { TFunction } from 'i18next'

interface DestroyHostedModalProps {
  readonly open: boolean
  readonly close: () => void
  readonly clusterName: string
  readonly provider?: Provider
}

function getDestroyInstructions(t: TFunction, provider?: Provider) {
  switch (provider) {
    case Provider.azure:
      return {
        destroyCode: String.raw`# Set environment variables
export CLUSTER_NAME="example"
export AZURE_CREDS="/path/to/azure-credentials.json"
export MANAGED_RG_NAME="example-managed-resource-group"
export DNS_ZONE_RG_NAME="example-dns-zone-resource-group"

hcp destroy cluster azure \
  --name $CLUSTER_NAME \
  --azure-creds $AZURE_CREDS \
  --resource-group-name $MANAGED_RG_NAME \
  --dns-zone-rg-name $DNS_ZONE_RG_NAME`,
        helperCommand: `hcp destroy cluster azure --help`,
        credentialStep: t(
          'Find the Azure credentials file that you used to create your hosted cluster. You will need the path to your credentials file, your managed resource group name, and your DNS zone resource group name.'
        ),
      }
    case Provider.aws:
      return {
        destroyCode: String.raw`# Set environment variables
export CLUSTER_NAME="example"
export STS_CREDS="/path/to/example-sts-creds.json"  # The credential name from step 1.
export ROLE_ARN="example-role-arn" # Role ARN from step 1

hcp destroy cluster aws \
  --name $CLUSTER_NAME \
  --sts-creds $STS_CREDS \
  --role-arn $ROLE_ARN`,
        helperCommand: `hcp destroy cluster aws --help`,
        credentialStep: t(
          'Find the Amazon Web Services (AWS) STS credential and role ARN that you used to create your hosted cluster. The STS credential by default expires in 12 hours so a new one may be needed.'
        ),
      }
    default:
      return {
        destroyCode: String.raw`export CLUSTER_NAME="example"

hcp destroy cluster <platform> \
  --name $CLUSTER_NAME`,
        helperCommand: `hcp destroy cluster --help`,
        credentialStep: t(
          'Find the credentials that you used to create your hosted cluster. Use the help command below to determine the required parameters for your platform.'
        ),
      }
  }
}

export function DestroyHostedModal(props: DestroyHostedModalProps) {
  const { open, close, clusterName, provider } = props
  const { t } = useTranslation()

  const { destroyCode, helperCommand, credentialStep } = getDestroyInstructions(t, provider)

  const listItems = [
    {
      title: t('Log in to OpenShift Container Platform'),
      content: (
        <Fragment>
          {GetOCLogInCommand()}
          <Content component={ContentVariants.p}>{credentialStep}</Content>
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
          <CodeBlock actions={Actions(helperCommand, 'helper-command')}>
            <CodeBlockCode id="helper-command">{helperCommand}</CodeBlockCode>
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
