/* Copyright Contributors to the Open Cluster Management project */

import {
  ClipboardCopyButton,
  CodeBlock,
  CodeBlockAction,
  CodeBlockCode,
  Page,
  PageGroup,
  Text,
  TextVariants,
} from '@patternfly/react-core'
import { PageHeader } from '@stolostron/react-data-view'
import { Fragment, useState } from 'react'
import { useTranslation } from '../../../../../../../../lib/acm-i18next'
import { DOC_CREATE_kUBEVIRT_CLUSTER, DOC_LINKS, viewDocumentation } from '../../../../../../../../lib/doc-util'
import { NavigationPath, useBackCancelNavigation } from '../../../../../../../../NavigationPath'
import DocPage from './common/DocPage'
import DocPageToolbar from './common/DocPageToolbar'
import './css/HypershiftAWSCLI.css'

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

  const [copied, setCopied] = useState(false)

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
--cores $CPU \\`

  const helperCommand = `hypershift create cluster kubevirt --help`
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
          <Text component={TextVariants.p}>
            {t(
              'Hosted Control Planes for OpenShift Virtualization are created using the KubeVirt platform type. To create the Hosted Control Plane, copy and paste the following command: '
            )}
          </Text>
          <CodeBlock actions={actions(code, 'code-command')}>
            <CodeBlockCode id="code-content">{code}</CodeBlockCode>
          </CodeBlock>
          <Text style={{ marginTop: '1em' }}>{t('Use the following command to see all available parameters.')}</Text>
          <CodeBlock actions={actions(helperCommand, 'helper-command')}>
            <CodeBlockCode id="helper-command">{helperCommand}</CodeBlockCode>
          </CodeBlock>
          {viewDocumentation(DOC_CREATE_kUBEVIRT_CLUSTER, t)}
        </Fragment>
      ),
    },
  ]

  return (
    <Page>
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
      <DocPage listItems={listItems} />
      <PageGroup sticky="bottom" style={{ height: '68px' }}>
        <DocPageToolbar
          onBack={back(NavigationPath.createKubeVirtControlPlane)}
          onCancel={cancel(NavigationPath.managedClusters)}
        />
      </PageGroup>
    </Page>
  )
}
