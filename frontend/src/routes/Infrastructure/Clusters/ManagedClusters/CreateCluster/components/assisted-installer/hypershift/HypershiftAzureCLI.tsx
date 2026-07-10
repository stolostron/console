/* Copyright Contributors to the Open Cluster Management project */

import { CodeBlock, CodeBlockCode, Content, ContentVariants } from '@patternfly/react-core'
import { ICatalogBreadcrumb } from '@stolostron/react-data-view'
import { Fragment } from 'react'
import { useTranslation } from '../../../../../../../../lib/acm-i18next'
import { DOC_LINKS, ViewDocumentationLink } from '../../../../../../../../lib/doc-util'
import { NavigationPath, useBackCancelNavigation } from '../../../../../../../../NavigationPath'
import { Actions, GetOCLogInCommand } from './common/common'
import DocPage from './common/DocPage'

export function HypershiftAzureCLI() {
  const { t } = useTranslation()
  const { back, cancel } = useBackCancelNavigation()
  const breadcrumbs: ICatalogBreadcrumb[] = [
    { label: t('Clusters'), to: NavigationPath.clusters },
    { label: t('Infrastructure'), to: NavigationPath.createCluster },
    {
      label: t('Control plane type - {{hcType}}', { hcType: 'Azure' }),
      to: NavigationPath.createAzureControlPlane,
    },
    { label: t('Create cluster') },
  ]

  const envVarsCode = `# Set environment variables
export CLUSTER_NAME="my-azure-hcp"
export CLUSTER_NAMESPACE="clusters"
export LOCATION="centralus"
export BASE_DOMAIN="example.azure.devcluster.openshift.com"
export RESOURCE_GROUP_NAME="my-resource-group"
export DNS_ZONE_RG_NAME="my-dns-zone-rg"
export AZURE_CREDS="./azure-creds.json"
export PULL_SECRET="/path/to/pull-secret.json"

# Derive from hosting cluster infrastructure
export INFRA_ID="$(oc get infrastructures cluster -o jsonpath='{.status.infrastructureName}')"
export SUBSCRIPTION_ID="$(jq -r '.subscriptionId' "\${AZURE_CREDS}")"
export TENANT_ID="$(jq -r '.tenantId' "\${AZURE_CREDS}")"`

  const azureCredsCode = `{
  "subscriptionId": "your-subscription-id",
  "tenantId": "your-tenant-id",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret"
}`

  const oidcCode = `export OIDC_STORAGE_ACCOUNT_NAME="youroidcstorageacct"

# Ensure cluster resource group exists
az group create --name "\${RESOURCE_GROUP_NAME}" --location "\${LOCATION}"

# Create signing key pair
ccoctl azure create-key-pair
export SA_TOKEN_ISSUER_PRIVATE_KEY_PATH="./serviceaccount-signer.private"
export SA_TOKEN_ISSUER_PUBLIC_KEY_PATH="./serviceaccount-signer.public"

# Create OIDC issuer resources
ccoctl azure create-oidc-issuer \\
  --oidc-resource-group-name "\${RESOURCE_GROUP_NAME}" \\
  --tenant-id "\${TENANT_ID}" \\
  --region "\${LOCATION}" \\
  --name "\${OIDC_STORAGE_ACCOUNT_NAME}" \\
  --subscription-id "\${SUBSCRIPTION_ID}" \\
  --public-key-file "\${SA_TOKEN_ISSUER_PUBLIC_KEY_PATH}"

export OIDC_ISSUER_URL="https://\${OIDC_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/\${OIDC_STORAGE_ACCOUNT_NAME}"`

  const workloadIdentitiesCode = `export WORKLOAD_IDENTITIES_FILE="./workload-identities.json"

hcp create iam azure \\
  --name "\${CLUSTER_NAME}" \\
  --infra-id "\${INFRA_ID}" \\
  --azure-creds "\${AZURE_CREDS}" \\
  --location "\${LOCATION}" \\
  --resource-group-name "\${RESOURCE_GROUP_NAME}" \\
  --oidc-issuer-url "\${OIDC_ISSUER_URL}" \\
  --output-file "\${WORKLOAD_IDENTITIES_FILE}"`

  const infraCode = `export INFRA_OUTPUT_FILE="./infra-output.json"

hcp create infra azure \\
  --name "\${CLUSTER_NAME}" \\
  --infra-id "\${INFRA_ID}" \\
  --azure-creds "\${AZURE_CREDS}" \\
  --base-domain "\${BASE_DOMAIN}" \\
  --location "\${LOCATION}" \\
  --workload-identities-file "\${WORKLOAD_IDENTITIES_FILE}" \\
  --output-file "\${INFRA_OUTPUT_FILE}"`

  const createClusterCode = `export DNS_ZONE_NAME="external-dns.\${BASE_DOMAIN}"
export INFRA_ID_FROM_FILE="$(yq -p yaml -r '.infraID' "\${INFRA_OUTPUT_FILE}")"

hcp create cluster azure \\
  --name "\${CLUSTER_NAME}" \\
  --namespace "\${CLUSTER_NAMESPACE}" \\
  --azure-creds "\${AZURE_CREDS}" \\
  --location "\${LOCATION}" \\
  --node-pool-replicas 2 \\
  --base-domain "\${BASE_DOMAIN}" \\
  --pull-secret "\${PULL_SECRET}" \\
  --generate-ssh \\
  --external-dns-domain "\${DNS_ZONE_NAME}" \\
  --infra-json "\${INFRA_OUTPUT_FILE}" \\
  --infra-id "\${INFRA_ID_FROM_FILE}" \\
  --sa-token-issuer-private-key-path "\${SA_TOKEN_ISSUER_PRIVATE_KEY_PATH}" \\
  --oidc-issuer-url "\${OIDC_ISSUER_URL}" \\
  --dns-zone-rg-name "\${DNS_ZONE_RG_NAME}" \\
  --auto-assign-roles \\
  --workload-identities-file "\${WORKLOAD_IDENTITIES_FILE}" \\
  --diagnostics-storage-account-type Managed`

  const helperCommand = `hcp create cluster azure --help`

  const listItems = [
    {
      title: t('Prerequisites'),
      content: (
        <Fragment>
          <Content component={ContentVariants.p}>
            {t(
              'Install the Hosted Control Plane CLI (hcp), oc, az, and ccoctl. Authenticate with Azure and OpenShift as needed.'
            )}
          </Content>
          <Content component={ContentVariants.a} href={DOC_LINKS.HYPERSHIFT_DEPLOY_AZURE} target="_blank">
            {t('Follow documentation for more information.')}
          </Content>
        </Fragment>
      ),
    },
    {
      title: t('Prepare environment variables'),
      content: (
        <Fragment>
          <Content component={ContentVariants.p}>
            {t(
              'Set the required environment variables for your Azure hosted cluster. Update the values below to match your environment.'
            )}
          </Content>
          <CodeBlock actions={Actions(envVarsCode, 'env-vars-command')}>
            <CodeBlockCode id="env-vars-content">{envVarsCode}</CodeBlockCode>
          </CodeBlock>
        </Fragment>
      ),
    },
    {
      title: t('Create Azure credentials file'),
      content: (
        <Fragment>
          <Content component={ContentVariants.p}>
            {t('Create an azure-creds.json file with your Azure service principal credentials.')}
          </Content>
          <CodeBlock actions={Actions(azureCredsCode, 'azure-creds-command')}>
            <CodeBlockCode id="azure-creds-content">{azureCredsCode}</CodeBlockCode>
          </CodeBlock>
        </Fragment>
      ),
    },
    {
      title: t('Configure OIDC issuer'),
      content: (
        <Fragment>
          <Content component={ContentVariants.p}>
            {t(
              'Create the OIDC issuer resources required for workload identity. This creates a signing key pair and configures the OIDC storage account in Azure.'
            )}
          </Content>
          <CodeBlock actions={Actions(oidcCode, 'oidc-command')}>
            <CodeBlockCode id="oidc-content">{oidcCode}</CodeBlockCode>
          </CodeBlock>
        </Fragment>
      ),
    },
    {
      title: t('Create workload identities'),
      content: (
        <Fragment>
          <Content component={ContentVariants.p}>
            {t(
              'Create the Azure workload identities required by the hosted cluster components. The resource group must already exist in Azure.'
            )}
          </Content>
          <CodeBlock actions={Actions(workloadIdentitiesCode, 'workload-identities-command')}>
            <CodeBlockCode id="workload-identities-content">{workloadIdentitiesCode}</CodeBlockCode>
          </CodeBlock>
        </Fragment>
      ),
    },
    {
      title: t('Create Azure infrastructure'),
      content: (
        <Fragment>
          <Content component={ContentVariants.p}>
            {t(
              'Create the Azure infrastructure resources required by the hosted cluster, including networking and DNS configuration.'
            )}
          </Content>
          <CodeBlock actions={Actions(infraCode, 'infra-command')}>
            <CodeBlockCode id="infra-content">{infraCode}</CodeBlockCode>
          </CodeBlock>
        </Fragment>
      ),
    },
    {
      title: t('Create the Hosted Control Plane'),
      content: (
        <Fragment>
          <Content component={ContentVariants.h4}>{t('Log in to OpenShift Container Platform')}</Content>
          {GetOCLogInCommand()}
          <Content component={ContentVariants.h4}>{t('Run command')}</Content>
          <Content component={ContentVariants.p}>
            {t('Create the Hosted Control Plane by copying and pasting the following command:')}
          </Content>
          <CodeBlock actions={Actions(createClusterCode, 'code-command')}>
            <CodeBlockCode id="code-content">{createClusterCode}</CodeBlockCode>
          </CodeBlock>
          <Content component={ContentVariants.p} style={{ marginTop: '1em' }}>
            {t('Use the following command to get a list of available parameters: ')}
          </Content>
          <CodeBlock actions={Actions(helperCommand, 'helper-command')}>
            <CodeBlockCode id="helper-command">{helperCommand}</CodeBlockCode>
          </CodeBlock>
          <ViewDocumentationLink doclink={DOC_LINKS.HYPERSHIFT_DEPLOY_AZURE} />
        </Fragment>
      ),
    },
  ]

  return (
    <DocPage
      listItems={listItems}
      breadcrumbs={breadcrumbs}
      docLink={DOC_LINKS.HYPERSHIFT_DEPLOY_AZURE}
      onBack={back(NavigationPath.createAzureControlPlane)}
      onCancel={cancel(NavigationPath.managedClusters)}
    />
  )
}
