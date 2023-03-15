/* Copyright Contributors to the Open Cluster Management project */

import {
  Button,
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
  PageGroup,
  Text,
  TextContent,
  TextVariants,
  Toolbar,
  ToolbarContent,
} from '@patternfly/react-core'
import { PageHeader } from '@stolostron/react-data-view'
import { Fragment, useState } from 'react'
import { GetProjects } from '../../../../../../../../components/GetProjects'
import { useTranslation } from '../../../../../../../../lib/acm-i18next'
import { DOC_CREATE_HOSTED_CLUSTER, DOC_LINKS, viewDocumentation } from '../../../../../../../../lib/doc-util'
import { NavigationPath, useBackCancelNavigation } from '../../../../../../../../NavigationPath'
import './css/HypershiftAWSCLI.css'

export function HypershiftKubeVirtCLI() {
  const { t } = useTranslation()
  const { back, cancel } = useBackCancelNavigation()
  const breadcrumbs = [
    { label: t('Clusters'), to: NavigationPath.clusters },
    { label: t('Infrastructure'), to: NavigationPath.createCluster },
    {
      label: t('Control plane type - {{hcType}}', { hcType: 'KubeVirt' }),
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
  const patchCommand = `oc patch ingresscontroller -n openshift-ingress-operator default --type=json -p '[{ "op": "add", "path": "/spec/routeAdmission", "value": {wildcardPolicy: "WildcardsAllowed"}}]'`
  const patchStorageCommand = `oc patch storageclass ocs-storagecluster-ceph-rbd -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'`
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
                {t('Enable Hosted Control Plane feature for KubeVirt. Download and install Hosted Control Plane CLI.')}
              </Text>
              <Text component={TextVariants.a} href={DOC_LINKS.HYPERSHIFT_MANAGE_KUBEVIRT} target="_blank">
                {t('Follow documentation for more information.')}
              </Text>
            </TextContent>
          </ListItem>
          <ListItem icon={<span className="ocm-icons">2</span>}>
            <TextContent>
              <Text component={TextVariants.h2}>{t('Configure')}</Text>
              <Text component={TextVariants.p}>
                {t('The management OpenShift Container Platform cluster must have wildcard DNS routes enabled:')}
              </Text>
              <CodeBlock actions={actions(patchCommand, 'helper-command')}>
                <CodeBlockCode id="patch-command">{patchCommand}</CodeBlockCode>
              </CodeBlock>

              <Text component={TextVariants.p}>
                {t(
                  'The management OpenShift Container Platform cluster must have OpenShift Virtualization installed on it. For more information, see Installing OpenShift Virtualization using the web console.'
                )}
              </Text>
              <Text component={TextVariants.p}>
                {t(
                  'The management {ocp-short} cluster must have a default storage class. For more information, see link:https://docs.openshift.com/container-platform/4.12/post_installation_configuration/storage-configuration.html[Post-installation storage configuration]. This example shows how to set a default storage class:'
                )}
              </Text>
              <CodeBlock actions={actions(patchStorageCommand, 'helper-command')}>
                <CodeBlockCode id="patch-storageclass-command">{patchStorageCommand}</CodeBlockCode>
              </CodeBlock>
            </TextContent>
          </ListItem>
          <ListItem icon={<span className="ocm-icons">3</span>}>
            <TextContent>
              <Text component={TextVariants.h2}>{t('Pull secret')}</Text>
              <Text component={TextVariants.p}>
                {t(
                  'Create a valid pull secret for the `quay.io/openshift-release-dev` repository. For more information, see link:https://console.redhat.com/openshift/install/platform-agnostic/user-provisioned[Install OpenShift on any x86_64 platform with user-provisioned infrastructure]'
                )}
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
      <PageGroup sticky="bottom" style={{ height: '68px' }}>
        <Toolbar>
          <ToolbarContent>
            <Button variant="secondary" onClick={back(NavigationPath.createAWSControlPlane)}>
              {t('Back')}
            </Button>
            <ToolbarContent>
              <Button
                variant="link"
                isInline
                onClick={cancel(NavigationPath.managedClusters)}
                style={{
                  paddingLeft: 48,
                }}
              >
                {t('Cancel')}
              </Button>
            </ToolbarContent>
          </ToolbarContent>
        </Toolbar>
      </PageGroup>
    </Page>
  )
}
