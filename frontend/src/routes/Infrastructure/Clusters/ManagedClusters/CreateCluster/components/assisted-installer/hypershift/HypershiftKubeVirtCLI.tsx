/* Copyright Contributors to the Open Cluster Management project */

import { CodeBlock, CodeBlockCode, Page, Text, TextVariants } from '@patternfly/react-core'
import { Fragment } from 'react'
import { useTranslation } from '../../../../../../../../lib/acm-i18next'
import { DOC_CREATE_kUBEVIRT_CLUSTER, DOC_LINKS, viewDocumentation } from '../../../../../../../../lib/doc-util'
import { NavigationPath, useBackCancelNavigation } from '../../../../../../../../NavigationPath'
import { Actions, GetOCLogInCommand } from './common/common'
import DocPage from './common/DocPage'

export function HypershiftKubeVirtCLI() {
  const { t } = useTranslation()
  const { back, cancel } = useBackCancelNavigation()
  const breadcrumbs = [
    { label: t('Clusters'), to: NavigationPath.clusters },
    { label: t('Infrastructure'), to: NavigationPath.createCluster },
    {
      label: t('Control plane type - {{hcType}}', { hcType: 'Openshift Virtualization' }),
      to: NavigationPath.createKubeVirtControlPlane,
    },
    { label: t('Create cluster') },
  ]

  const code = `# Set environment variables
export CLUSTER_NAME=example
export PULL_SECRET="$HOME/pull-secret"
export MEM="6Gi"
export CPU="2"
export WORKER_COUNT="2"

hypershift create cluster kubevirt \\
--name $CLUSTER_NAME \\
--node-pool-replicas=$WORKER_COUNT \\
--pull-secret $PULL_SECRET \\
--memory $MEM \\
--cores $CPU`

  const helperCommand = `hypershift create cluster kubevirt --help`

  const listItems = [
    {
      title: t('Prerequisite and Configuration'),
      content: (
        <Fragment>
          <Text component={TextVariants.p}>
            {t('Enable Hosted Control Plane Feature for OpenShift Virtualization. ')}
          </Text>
          <Text component={TextVariants.a} href={DOC_LINKS.HYPERSHIFT_MANAGE_KUBEVIRT} target="_blank">
            {t('Follow documentation for more information.')}
          </Text>
        </Fragment>
      ),
    },
    {
      title: t('Running the Hosted Control Plane command'),
      content: (
        <Fragment>
          {GetOCLogInCommand()}
          <Text component={TextVariants.h4}>{t('Run command')}</Text>
          <Text component={TextVariants.p}>
            {t(
              'Hosted Control Planes for OpenShift Virtualization are created using the KubeVirt platform type. To create the Hosted Control Plane, copy and paste the following command: '
            )}
          </Text>
          <CodeBlock actions={Actions(code, 'code-command')}>
            <CodeBlockCode id="code-content">{code}</CodeBlockCode>
          </CodeBlock>
          <Text style={{ marginTop: '1em' }}>{t('Use the following command to see all available parameters.')}</Text>
          <CodeBlock actions={Actions(helperCommand, 'helper-command')}>
            <CodeBlockCode id="helper-command">{helperCommand}</CodeBlockCode>
          </CodeBlock>
          {viewDocumentation(DOC_CREATE_kUBEVIRT_CLUSTER, t)}
        </Fragment>
      ),
    },
  ]

  return (
    <Page>
      <DocPage
        listItems={listItems}
        onBack={back(NavigationPath.createKubeVirtControlPlane)}
        onCancel={cancel(NavigationPath.managedClusters)}
        breadcrumbs={breadcrumbs}
      />
    </Page>
  )
}
