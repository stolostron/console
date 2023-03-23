/* Copyright Contributors to the Open Cluster Management project */
import { AlertVariant, List, ListComponent, ListItem, OrderType, Stack, StackItem } from '@patternfly/react-core'
import { HostedClusterK8sResource } from 'openshift-assisted-ui-lib/cim'
import * as React from 'react'
import { useContext } from 'react'
import { getErrorInfo } from '../../../../../components/ErrorPage'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import { PluginContext } from '../../../../../lib/PluginContext'
import {
  createResource,
  getSecret,
  IResource,
  ManagedCluster,
  ManagedClusterApiVersion,
  ManagedClusterKind,
  KlusterletAddonConfigApiVersion,
  KlusterletAddonConfigKind,
  KlusterletAddonConfig,
  patchResource,
  unpackSecret,
  Namespace,
  NamespaceApiVersion,
  NamespaceKind,
} from '../../../../../resources'
import { AcmAlert, AcmButton, AcmToastContext } from '../../../../../ui-components'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { useHypershiftKubeconfig } from '../ClusterDetails/ClusterOverview/HypershiftKubeAPI'
import { CopyCommandButton, useImportCommand } from './ImportCommand'
import { LoginCredential } from './LoginCredentials'

export const HypershiftImportCommand = (props: { selectedHostedClusterResource: HostedClusterK8sResource }) => {
  const { selectedHostedClusterResource } = props
  const { t } = useTranslation()
  const [hypershiftKubeAPI, error] = useHypershiftKubeconfig()
  const { cluster, managedCluster } = React.useContext(ClusterContext)
  const toastContext = useContext(AcmToastContext)
  const { isACMAvailable } = useContext(PluginContext)

  const [credentials, setCredentials] = React.useState<LoginCredential>()
  const name = cluster?.kubeadmin
  const namespace = cluster?.namespace
  React.useEffect(() => {
    const fetchCredentials = async () => {
      if (name && namespace) {
        const secret = await getSecret({ name, namespace }).promise
        const { stringData } = unpackSecret(secret)
        setCredentials(stringData as LoginCredential)
      }
    }
    fetchCredentials()
  }, [name, namespace])

  const { v1ImportCommand, loading, error: importErr } = useImportCommand(true)

  const loginCommand = `oc login ${hypershiftKubeAPI} -u kubeadmin -p ${credentials?.password}`
  // support all hypershift operator versions
  const HostedClusterReadyStatus = props?.selectedHostedClusterResource?.status?.conditions?.find(
    (c) =>
      c.reason === 'HostedClusterAsExpected' ||
      (c.reason === 'AsExpected' && c.message === 'The hosted control plane is available')
  )

  function importHostedControlPlaneCluster() {
    const hdName = selectedHostedClusterResource.metadata?.name
    const hdNamespace = selectedHostedClusterResource.metadata?.namespace

    const match = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(hdName!)

    if (!match) {
      //Invalid hostname
      //throw error, don't import cluster
      toastContext.addAlert({ ...getErrorInfo(t('invalidclustername.message'), t), autoClose: true })
      return
    }

    const managedClusterResource: ManagedCluster = {
      apiVersion: ManagedClusterApiVersion,
      kind: ManagedClusterKind,
      metadata: {
        annotations: {
          'import.open-cluster-management.io/hosting-cluster-name': 'local-cluster',
          'import.open-cluster-management.io/klusterlet-deploy-mode': 'Hosted',
          'open-cluster-management/created-via': 'other',
        },
        labels: {
          cloud: 'auto-detect',
          'cluster.open-cluster-management.io/clusterset': 'default',
          name: hdName || '',
          vendor: 'OpenShift',
        },
        name: hdName,
      },
      spec: {
        hubAcceptsClient: true,
        leaseDurationSeconds: 60,
      },
    }

    const klusterletAddonConfig: KlusterletAddonConfig = {
      apiVersion: KlusterletAddonConfigApiVersion,
      kind: KlusterletAddonConfigKind,
      metadata: {
        name: hdName,
        namespace: hdName,
      },
      spec: {
        clusterName: hdName!,
        clusterNamespace: hdName!,
        clusterLabels: {
          cloud: 'Amazon',
          vendor: 'Openshift',
        },
        applicationManager: {
          enabled: true,
          argocdCluster: false,
        },
        policyController: {
          enabled: true,
        },
        searchCollector: {
          enabled: true,
        },
        certPolicyController: {
          enabled: true,
        },
        iamPolicyController: {
          enabled: true,
        },
      },
    }

    const clusterNameSpace: Namespace = {
      apiVersion: NamespaceApiVersion,
      kind: NamespaceKind,
      metadata: {
        name: hdName,
      },
    }

    const updateAnnotations = {
      'cluster.open-cluster-management.io/managedcluster-name': hdName,
      'cluster.open-cluster-management.io/hypershiftdeployment': `${hdNamespace}/${hdName}`,
    }

    createResource(managedClusterResource as IResource)
      .promise.then(() => {
        toastContext.addAlert({
          title: t('Importing hosted control plane cluster...'),
          type: 'success',
          autoClose: true,
        })
      })
      .catch((err) => {
        toastContext.addAlert(getErrorInfo(err, t))
      })

    patchResource(selectedHostedClusterResource as IResource, [
      { op: 'replace', path: '/metadata/annotations', value: updateAnnotations },
    ])

    //Create namespace for addons if it doesn't already exist
    if (isACMAvailable) {
      try {
        createResource(clusterNameSpace as IResource)
      } catch (err) {}

      try {
        createResource(klusterletAddonConfig as IResource)
      } catch (err) {}
    }
  }

  if (!v1ImportCommand && cluster?.isHypershift && !managedCluster) {
    // import alert
    return (
      <div style={{ marginBottom: '12px' }}>
        <AcmAlert
          isInline
          variant={AlertVariant.info}
          title={t('import.command.pendingimport')}
          noClose
          message={
            <Stack hasGutter>
              <StackItem>{t('Import the Hosted Cluster once the Hosted Control Plane is available.')}</StackItem>
              <StackItem>
                <AcmButton
                  variant="link"
                  style={{ paddingLeft: '0px' }}
                  onClick={() => importHostedControlPlaneCluster()}
                  isDisabled={HostedClusterReadyStatus?.status !== 'True'}
                >
                  {t('managed.importCluster')}
                </AcmButton>
              </StackItem>
            </Stack>
          }
        />
      </div>
    )
  }
  return (
    <>
      {!!cluster && !loading && !importErr && !error && !!v1ImportCommand && (
        <div style={{ marginBottom: '12px' }}>
          <AcmAlert
            isInline
            variant={AlertVariant.info}
            title={t('import.command.pendingimport')}
            noClose
            message={
              <Stack hasGutter>
                <StackItem>{t('Hosted cluster requires a manual import.')}</StackItem>
                <StackItem>
                  <List component={ListComponent.ol} type={OrderType.number}>
                    <ListItem>
                      <Trans>
                        <CopyCommandButton variant="link" isInline command={loginCommand}>
                          Run this command
                        </CopyCommandButton>{' '}
                        to log-in to the existing cluster in your terminal
                      </Trans>
                    </ListItem>
                    <ListItem>
                      <Trans>
                        <CopyCommandButton variant="link" isInline loading={loading} command={v1ImportCommand}>
                          Run this command
                        </CopyCommandButton>{' '}
                        to import your cluster
                      </Trans>
                    </ListItem>
                  </List>
                </StackItem>
              </Stack>
            }
          />
        </div>
      )}
    </>
  )
}
