/* Copyright Contributors to the Open Cluster Management project */
import { AlertVariant, List, ListComponent, ListItem, OrderType, Stack, StackItem } from '@patternfly/react-core'
import { HostedClusterK8sResource } from '@openshift-assisted/ui-lib/cim'
import * as React from 'react'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import {
  getSecret,
  unpackSecret,
  createManagedCluster,
  createKlusterletAddonConfig,
  IResource,
  Namespace,
  NamespaceKind,
  NamespaceApiVersion,
} from '../../../../../resources'
import { ResourceError, ResourceErrorCode, createResource } from '../../../../../resources/utils'
import { AcmAlert, AcmButton, AcmToastContext, IAlertContext } from '../../../../../ui-components'
import { useHypershiftKubeconfig } from '../ClusterDetails/ClusterOverview/HypershiftKubeAPI'
import { CopyCommandButton, useImportCommand } from './ImportCommand'
import { LoginCredential } from './LoginCredentials'
import { getErrorInfo } from '../../../../../components/ErrorPage'
import { TFunction } from 'react-i18next'
import { useContext } from 'react'
import { PluginContext } from '../../../../../lib/PluginContext'
import { useClusterDetailsContext } from '../ClusterDetails/ClusterDetails'
import { useLocalHubName } from '../../../../../hooks/use-local-hub'

export const importHostedControlPlaneCluster = (
  selectedHostedClusterResource: HostedClusterK8sResource,
  t: TFunction,
  hubClusterName: string,
  toastContext: IAlertContext,
  isACMAvailable: boolean | undefined
) => {
  const hdName = selectedHostedClusterResource.metadata?.name
  const clusterName = hdName

  const match = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(hdName!)

  if (!match) {
    //Invalid hostname
    //throw error, don't import cluster
    toastContext.addAlert({ ...getErrorInfo(t('invalidclustername.message'), t), autoClose: true })
    return
  }

  const clusterLabels: Record<string, string> = {
    cloud: 'auto-detect',
    'cluster.open-cluster-management.io/clusterset': 'default',
    name: hdName || '',
    vendor: 'OpenShift',
  }

  const clusterAnnotations: Record<string, string> = {
    'import.open-cluster-management.io/hosting-cluster-name': hubClusterName,
    'import.open-cluster-management.io/klusterlet-deploy-mode': 'Hosted',
    'open-cluster-management/created-via': 'hypershift',
  }

  const clusterNameSpace: Namespace = {
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: {
      name: hdName,
    },
  }

  try {
    createResource(clusterNameSpace as IResource)
  } catch {}

  return {
    promise: createManagedCluster({ clusterName, clusterLabels, clusterAnnotations }).promise.then((mc) =>
      createKlusterletAddonConfig({ clusterName, clusterLabels })
        .promise.catch((err) => {
          // ignore conflict if KlusterletAddonConfig already exists
          if (!(err instanceof ResourceError && err.code === ResourceErrorCode.Conflict)) {
            // ignore KlusterletAddonConfig not found for MCE only clusters
            if (err instanceof ResourceError && err.code === ResourceErrorCode.NotFound && isACMAvailable) {
              throw err
            }
            if (!(err instanceof ResourceError && err.code === ResourceErrorCode.NotFound)) {
              throw err
            }
          }
        })
        .then(() => mc)
    ),
    abort: () => {},
  }
}

export const HypershiftImportCommand = (props: { selectedHostedClusterResource: HostedClusterK8sResource }) => {
  const { selectedHostedClusterResource } = props
  const { t } = useTranslation()
  const [hypershiftKubeAPI, error] = useHypershiftKubeconfig()
  const { cluster, managedCluster } = useClusterDetailsContext()
  const toastContext = useContext(AcmToastContext)
  const { isACMAvailable } = useContext(PluginContext)
  const localHubName = useLocalHubName()

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

  const { importCommand, loading, error: importErr } = useImportCommand(true)

  const loginCommand = `oc login ${hypershiftKubeAPI} -u kubeadmin -p ${credentials?.password}`
  // support all hypershift operator versions
  const HostedClusterReadyStatus = props?.selectedHostedClusterResource?.status?.conditions?.find(
    (c) =>
      c.reason === 'HostedClusterAsExpected' ||
      (c.reason === 'AsExpected' && c.message === 'The hosted control plane is available')
  )

  if (!importCommand && cluster?.isHypershift && !managedCluster) {
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
                  isInline
                  onClick={() =>
                    importHostedControlPlaneCluster(
                      selectedHostedClusterResource,
                      t,
                      localHubName,
                      toastContext,
                      isACMAvailable
                    )
                  }
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
      {!!cluster && !loading && !importErr && !error && !!importCommand && (
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
                        <CopyCommandButton variant="link" isInline loading={loading} command={importCommand}>
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
