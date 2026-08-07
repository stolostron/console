/* Copyright Contributors to the Open Cluster Management project */

import { Button, CodeBlock, CodeBlockCode, Content, ContentVariants, Icon } from '@patternfly/react-core'
import { ModalVariant } from '@patternfly/react-core/deprecated'
import { ExclamationTriangleIcon } from '@patternfly/react-icons'
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

const azureDestroyInfraCode = String.raw`# Set environment variables
export CLUSTER_NAME="example"
export INFRA_ID="example-infra-id"
export AZURE_CREDS="/path/to/azure-credentials.json"
export LOCATION="example-location"

hcp destroy infra azure \
  --name $CLUSTER_NAME \
  --infra-id $INFRA_ID \
  --azure-creds "$AZURE_CREDS" \
  --location $LOCATION`

const azureDestroyInfraHelperCommand = String.raw`hcp destroy infra azure --help`

const azureDestroyWorkloadIdentitiesCode = String.raw`# Set environment variables
export CLUSTER_NAME="example"
export INFRA_ID="example-infra-id"
export PERSISTENT_RG_NAME="example-persistent-resource-group"
export AZURE_CREDS="/path/to/azure-credentials.json"
export WORKLOAD_IDENTITIES_FILE="./workload-identities.json"

hcp destroy iam azure \
  --name $CLUSTER_NAME \
  --infra-id $INFRA_ID \
  --resource-group-name $PERSISTENT_RG_NAME \
  --azure-creds "$AZURE_CREDS" \
  --workload-identities-file "$WORKLOAD_IDENTITIES_FILE"`

const azureDestroyWorkloadIdentitiesHelperCommand = String.raw`hcp destroy iam azure --help`

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
          <CodeBlock actions={Actions(destroyCode, 'destroy-cluster-code')}>
            <CodeBlockCode id="destroy-cluster-content">{destroyCode}</CodeBlockCode>
          </CodeBlock>
          <Content component="p" style={{ marginTop: '1em' }}>
            {t('Use the following command to get a list of available parameters:')}
          </Content>
          <CodeBlock actions={Actions(helperCommand, 'destroy-cluster-helper')}>
            <CodeBlockCode id="destroy-cluster-helper-content">{helperCommand}</CodeBlockCode>
          </CodeBlock>
        </Fragment>
      ),
    },
  ]

  if (provider === Provider.azure) {
    listItems.push(
      {
        title: t('Destroy the infrastructure'),
        content: (
          <Fragment>
            <Content component="p">
              <Icon status="warning" isInline>
                <ExclamationTriangleIcon />
              </Icon>{' '}
              <strong>{t('This step can only be completed after the hosted cluster is destroyed.')}</strong>
            </Content>
            <Content component="p">
              {t('Destroy the infrastructure by copying and pasting the following command:')}
            </Content>
            <CodeBlock actions={Actions(azureDestroyInfraCode, 'destroy-infra-code')}>
              <CodeBlockCode id="destroy-infra-content">{azureDestroyInfraCode}</CodeBlockCode>
            </CodeBlock>
            <Content component="p" style={{ marginTop: '1em' }}>
              {t('Use the following command to get a list of available parameters:')}
            </Content>
            <CodeBlock actions={Actions(azureDestroyInfraHelperCommand, 'destroy-infra-helper')}>
              <CodeBlockCode id="destroy-infra-helper-content">{azureDestroyInfraHelperCommand}</CodeBlockCode>
            </CodeBlock>
          </Fragment>
        ),
      },
      {
        title: t('Destroy workload identities (optional)'),
        content: (
          <Fragment>
            <Content component="p">
              <Icon status="warning" isInline>
                <ExclamationTriangleIcon />
              </Icon>{' '}
              <strong>
                {t(
                  'Skip this step if reusing IAM for future clusters. This step can only be completed after the infrastructure is destroyed.'
                )}
              </strong>
            </Content>
            <Content component="p">
              {t('Destroy the workload identities by copying and pasting the following command:')}
            </Content>
            <CodeBlock actions={Actions(azureDestroyWorkloadIdentitiesCode, 'destroy-workload-code')}>
              <CodeBlockCode id="destroy-workload-content">{azureDestroyWorkloadIdentitiesCode}</CodeBlockCode>
            </CodeBlock>
            <Content component="p" style={{ marginTop: '1em' }}>
              {t('Use the following command to get a list of available parameters:')}
            </Content>
            <CodeBlock actions={Actions(azureDestroyWorkloadIdentitiesHelperCommand, 'destroy-workload-helper')}>
              <CodeBlockCode id="destroy-workload-helper-content">
                {azureDestroyWorkloadIdentitiesHelperCommand}
              </CodeBlockCode>
            </CodeBlock>
          </Fragment>
        ),
      }
    )
  }

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
