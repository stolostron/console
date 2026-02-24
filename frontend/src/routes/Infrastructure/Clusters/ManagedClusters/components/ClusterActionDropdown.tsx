/* Copyright Contributors to the Open Cluster Management project */

import { Content, ContentVariants } from '@patternfly/react-core'
import { AcmInlineProvider, AcmToastContext } from '../../../../../ui-components'
import { useCallback, useContext, useMemo, useState } from 'react'
import { generatePath, useNavigate } from 'react-router-dom-v5-compat'
import { BulkActionModal, errorIsNot, BulkActionModalProps } from '../../../../../components/BulkActionModal'
import { RbacDropdown } from '../../../../../components/Rbac'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { deleteCluster, detachCluster } from '../../../../../lib/delete-cluster'
import { createImportResources } from '../../../../../lib/import-cluster'
import { PluginContext } from '../../../../../lib/PluginContext'
import { rbacCreate, rbacDelete, rbacPatch } from '../../../../../lib/rbac-util'
import { NavigationPath } from '../../../../../NavigationPath'
import {
  ClusterCuratorDefinition,
  ClusterDeployment,
  ClusterDeploymentDefinition,
  HostedClusterDefinition,
  ManagedClusterDefinition,
  NodePool,
  SecretDefinition,
} from '../../../../../resources'
import {
  Cluster,
  ClusterStatus,
  IRequestResult,
  patchResource,
  ResourceErrorCode,
} from '../../../../../resources/utils'
import { BatchChannelSelectModal } from './BatchChannelSelectModal'
import { BatchUpgradeModal } from './BatchUpgradeModal'
import ScaleUpDialog from './cim/ScaleUpDialog'
import { EditLabels } from './EditLabels'
import { StatusField } from './StatusField'
import { UpdateAutomationModal } from './UpdateAutomationModal'
import { ClusterAction, clusterDestroyable, clusterSupportsAction } from '../utils/cluster-actions'
import { RemoveAutomationModal } from './RemoveAutomationModal'
import { DestroyHostedModal } from './DestroyHostedModal'
import { deleteHypershiftCluster } from '../../../../../lib/delete-hypershift-cluster'
import { useRecoilValue, useSharedAtoms } from '../../../../../shared-recoil'
import { importHostedControlPlaneCluster } from './HypershiftImportCommand'
import { HostedClusterK8sResource } from '@openshift-assisted/ui-lib/cim'
import { HostedClusterK8sResourceWithChannel } from '../../../../../resources/hosted-cluster'
import { HypershiftUpgradeModal } from './HypershiftUpgradeModal'
import { getNodepoolStatus } from './NodePoolsTable'
import { useLocalHubName } from '../../../../../hooks/use-local-hub'
import { useHypershiftAvailableUpdates } from '../hooks/useHypershiftAvailableUpdates'

export function ClusterActionDropdown(props: { cluster: Cluster; isKebab: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isSearchAvailable } = useContext(PluginContext)
  const toastContext = useContext(AcmToastContext)
  const { isACMAvailable } = useContext(PluginContext)

  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false)
  const [showChannelSelectModal, setShowChannelSelectModal] = useState<boolean>(false)
  const [showDestroyHostedModal, setShowDestroyHostedModal] = useState<boolean>(false)
  const [showUpdateAutomationModal, setShowUpdateAutomationModal] = useState<boolean>(false)
  const [showRemoveAutomationModal, setShowRemoveAutomationModal] = useState<boolean>(false)
  const [scaleUpModalOpen, setScaleUpModalOpen] = useState<string | undefined>(undefined)
  const [showHypershiftUpgradeModal, setShowHypershiftUpgradeModal] = useState<boolean>(false)
  const [modalProps, setModalProps] = useState<BulkActionModalProps<Cluster> | { open: false }>({
    open: false,
  })
  const { hostedClustersState, infraEnvironmentsState, agentMachinesState, agentsState } = useSharedAtoms()
  const agents = useRecoilValue(agentsState)
  const agentMachines = useRecoilValue(agentMachinesState)
  const [showEditLabels, setShowEditLabels] = useState<boolean>(false)
  const infraEnvs = useRecoilValue(infraEnvironmentsState)
  const hostedClusters = useRecoilValue(hostedClustersState)
  const localHubName = useLocalHubName()

  const { cluster } = props

  const hypershiftAvailableUpdates = useHypershiftAvailableUpdates(cluster)

  const isHypershiftUpdateAvailable: boolean = useMemo(() => {
    //if managed cluster page - cluster, cluster curator and hosted cluster
    let updateAvailable = false
    if (cluster?.hypershift?.nodePools && cluster?.hypershift?.nodePools.length > 0) {
      for (let i = 0; i < cluster?.hypershift?.nodePools.length; i++) {
        if (
          getNodepoolStatus(cluster?.hypershift?.nodePools[i]) == 'Ready' &&
          (cluster?.hypershift?.nodePools[i].status?.version || '') < (cluster.distribution?.ocp?.version || '')
        ) {
          updateAvailable = true
          break
        }
      }
    }

    //if no nodepool has updates, still check if hcp has updates
    if (!updateAvailable) {
      return Object.keys(hypershiftAvailableUpdates).length > 0
    }

    return updateAvailable
  }, [cluster?.distribution?.ocp?.version, cluster?.hypershift?.nodePools, hypershiftAvailableUpdates])

  // Find the hosted cluster resource for this cluster to check if channel is set
  const hostedCluster: HostedClusterK8sResourceWithChannel | undefined = useMemo(() => {
    return hostedClusters.find(
      (hc) => hc.metadata?.name === cluster.name && hc.metadata?.namespace === cluster.namespace
    ) as HostedClusterK8sResourceWithChannel | undefined
  }, [hostedClusters, cluster.name, cluster.namespace])

  // Check if this hypershift cluster can select a channel
  // Show unless channel selection is in progress (same pattern as standalone clusters)
  const isHypershiftChannelSelectable: boolean = useMemo(() => {
    if (!cluster.isHypershift) {
      return false
    }
    // Allow channel selection unless it's already in progress
    return !cluster.distribution?.upgradeInfo?.isSelectingChannel
  }, [cluster.isHypershift, cluster.distribution?.upgradeInfo?.isSelectingChannel])

  const modalColumns = useMemo(
    () => [
      {
        header: t('table.name'),
        cell: (cluster: Cluster) => (
          <>
            <span style={{ whiteSpace: 'nowrap' }}>{cluster.displayName}</span>
            {cluster.hive.clusterClaimName && (
              <Content>
                <Content component={ContentVariants.small}>{cluster.hive.clusterClaimName}</Content>
              </Content>
            )}
          </>
        ),
        sort: 'displayName',
      },
      {
        header: t('table.status'),
        sort: 'status',
        cell: (cluster: Cluster) => (
          <span style={{ whiteSpace: 'nowrap' }}>
            <StatusField cluster={cluster} />
          </span>
        ),
      },
      {
        header: t('table.provider'),
        sort: 'provider',
        cell: (cluster: Cluster) => (cluster?.provider ? <AcmInlineProvider provider={cluster?.provider} /> : '-'),
      },
    ],
    [t]
  )

  const destroyRbac = useMemo(
    () => [
      rbacDelete(
        cluster.isHypershift ? HostedClusterDefinition : ClusterDeploymentDefinition,
        cluster.namespace,
        cluster.name
      ),
    ],
    [cluster.name, cluster.namespace, cluster.isHypershift]
  )
  if (cluster.isManaged) {
    destroyRbac.push(rbacDelete(ManagedClusterDefinition, undefined, cluster.name))
  }

  const importTemplate = useCallback(
    (action: (item: Cluster, options?: { [key: string]: boolean } | undefined) => IRequestResult) => {
      return {
        text: t('managed.import'),
        click: (cluster: Cluster) => {
          setModalProps({
            open: true,
            title: t('bulk.title.import'),
            action: t('import'),
            processing: t('importing'),
            items: [cluster],
            emptyState: undefined, // there is always 1 item supplied
            close: () => {
              setModalProps({ open: false })
            },
            description: t('bulk.message.import'),
            columns: [
              {
                header: t('update.table.name'),
                sort: 'displayName',
                cell: (cluster) => (
                  <>
                    <span style={{ whiteSpace: 'nowrap' }}>{cluster.displayName}</span>
                    {cluster.hive.clusterClaimName && (
                      <Content>
                        <Content component={ContentVariants.small}>{cluster.hive.clusterClaimName}</Content>
                      </Content>
                    )}
                  </>
                ),
              },
              {
                header: t('table.provider'),
                sort: 'provider',
                cell: (cluster: Cluster) =>
                  cluster?.provider ? <AcmInlineProvider provider={cluster?.provider} /> : '-',
              },
            ],
            keyFn: (cluster) => cluster.name as string,
            actionFn: action,
          })
        },
        rbac: [rbacCreate(ManagedClusterDefinition)],
      }
    },
    [t]
  )

  const actions = useMemo(
    () =>
      [
        {
          id: ClusterAction.UpdateAutomationTemplate,
          text: t('Update automation template'),
          click: () => setShowUpdateAutomationModal(true),
          isAriaDisabled: true,
          rbac: [
            rbacPatch(ClusterCuratorDefinition, cluster.namespace),
            rbacPatch(SecretDefinition, cluster.namespace),
            rbacCreate(ClusterCuratorDefinition, cluster.namespace),
            rbacCreate(SecretDefinition, cluster.namespace),
          ],
        },
        {
          id: ClusterAction.RemoveAutomationTemplate,
          text: t('Remove automation template'),
          click: () => setShowRemoveAutomationModal(true),
          isAriaDisabled: true,
          rbac: [
            rbacDelete(ClusterCuratorDefinition, cluster.namespace),
            rbacDelete(SecretDefinition, cluster.namespace),
          ],
        },
        {
          id: ClusterAction.EditLabels,
          text: t('managed.editLabels'),
          click: () => setShowEditLabels(true),
          isAriaDisabled: true,
          rbac: [rbacPatch(ManagedClusterDefinition, undefined, cluster.name)],
        },
        {
          id: ClusterAction.Upgrade,
          text: t('managed.update'),
          click: () => (cluster.isHostedCluster ? setShowHypershiftUpgradeModal(true) : setShowUpgradeModal(true)),
          isAriaDisabled: true,
          rbac: [
            rbacPatch(ClusterCuratorDefinition, cluster.namespace),
            rbacCreate(ClusterCuratorDefinition, cluster.namespace),
          ],
        },
        {
          id: ClusterAction.SelectChannel,
          text: t('managed.selectChannel'),
          click: () => setShowChannelSelectModal(true),
          isAriaDisabled: true,
          rbac: [
            rbacPatch(ClusterCuratorDefinition, cluster.namespace),
            rbacCreate(ClusterCuratorDefinition, cluster.namespace),
          ],
        },
        ...(isSearchAvailable
          ? [
              {
                id: ClusterAction.Search,
                text: t('managed.search'),
                click: (cluster: Cluster) =>
                  window.location.assign(
                    `${NavigationPath.search}?filters={"textsearch":"cluster%3A${cluster?.name}"}`
                  ),
              },
            ]
          : []),
        {
          id: ClusterAction.Import,
          ...importTemplate((cluster: Cluster) => createImportResources(cluster.name!, cluster.clusterSet!)),
        },
        {
          id: ClusterAction.Hibernate,
          text: t('managed.hibernate'),
          click: () => {
            setModalProps({
              open: true,
              title: t('bulk.title.hibernate'),
              action: t('hibernate'),
              processing: t('hibernating'),
              items: [cluster],
              emptyState: undefined, // there is always 1 item supplied
              description: t('bulk.message.hibernate'),
              columns: modalColumns,
              keyFn: (cluster) => cluster.name as string,
              actionFn: (cluster) => {
                return patchResource(
                  {
                    apiVersion: ClusterDeploymentDefinition.apiVersion,
                    kind: ClusterDeploymentDefinition.kind,
                    metadata: {
                      name: cluster.name!,
                      namespace: cluster.namespace!,
                    },
                  } as ClusterDeployment,
                  [{ op: 'replace', path: '/spec/powerState', value: 'Hibernating' }]
                )
              },
              close: () => {
                setModalProps({ open: false })
              },
            })
          },
          isAriaDisabled: true,
          rbac: [rbacPatch(ClusterDeploymentDefinition, cluster.namespace, cluster.name)],
        },
        {
          id: ClusterAction.Resume,
          text: t('managed.resume'),
          click: () => {
            setModalProps({
              open: true,
              title: t('bulk.title.resume'),
              action: t('resume'),
              processing: t('resuming'),
              items: [cluster],
              emptyState: undefined, // there is always 1 item supplied
              description: t('bulk.message.resume'),
              columns: modalColumns,
              keyFn: (cluster) => cluster.name as string,
              actionFn: (cluster) => {
                return patchResource(
                  {
                    apiVersion: ClusterDeploymentDefinition.apiVersion,
                    kind: ClusterDeploymentDefinition.kind,
                    metadata: {
                      name: cluster.name!,
                      namespace: cluster.namespace!,
                    },
                  } as ClusterDeployment,
                  [{ op: 'replace', path: '/spec/powerState', value: 'Running' }]
                )
              },
              close: () => {
                setModalProps({ open: false })
              },
            })
          },
          isAriaDisabled: true,
          rbac: [rbacPatch(ClusterDeploymentDefinition, cluster.namespace, cluster.name)],
        },
        {
          id: ClusterAction.Detach,
          text: t('managed.detach'),
          click: (cluster: Cluster) => {
            setModalProps({
              open: true,
              title: t('bulk.title.detach'),
              action: t('detach'),
              processing: t('detaching'),
              items: [cluster],
              emptyState: undefined, // there is always 1 item supplied
              description: t('bulk.message.detach'),
              columns: modalColumns,
              keyFn: (cluster) => cluster.name as string,
              actionFn: (cluster) => detachCluster(cluster),
              close: () => {
                setModalProps({ open: false })
              },
              isDanger: true,
              icon: 'warning',
              confirmText: cluster.displayName,
              isValidError: errorIsNot([ResourceErrorCode.NotFound]),
            })
          },
          isAriaDisabled: true,
          rbac: [rbacDelete(ManagedClusterDefinition, undefined, cluster.name)],
        },
        {
          id: ClusterAction.DestroyManaged,
          text: t('managed.destroy'),
          separator: true,
          isDisabled: true,
          description: t('Imported clusters cannot be destroyed'),
          click: () => {},
        },
        {
          id: ClusterAction.Destroy,
          text: t('managed.destroy'),
          separator: true,
          click: (cluster: Cluster) => {
            setModalProps({
              open: true,
              title: t('bulk.title.destroy'),
              action: t('destroy'),
              processing: t('destroying'),
              items: [cluster],
              emptyState: undefined, // there is always 1 item supplied
              description: t('bulk.message.destroy'),
              columns: modalColumns,
              keyFn: (cluster) => cluster.name as string,
              actionFn: (cluster, options) =>
                deleteCluster({
                  cluster,
                  ignoreClusterDeploymentNotFound: false,
                  infraEnvs,
                  deletePullSecret: !!options?.deletePullSecret,
                }),
              close: () => {
                setModalProps({ open: false })
              },
              isDanger: true,
              icon: 'warning',
              confirmText: cluster.displayName,
              isValidError: errorIsNot([ResourceErrorCode.NotFound]),
              enableDeletePullSecret: true,
            })
          },
          isAriaDisabled: true,
          rbac: destroyRbac,
        },
        {
          id: ClusterAction.EditAI,
          text: t('managed.editAI'),
          click: (cluster: Cluster) =>
            navigate(generatePath(NavigationPath.editCluster, { namespace: cluster.namespace!, name: cluster.name })),
          isAriaDisabled: cluster.status !== ClusterStatus.draft,
        },
        {
          id: ClusterAction.ScaleUpAI,
          text: t('managed.ai.scaleUp'),
          click: (cluster: Cluster) => setScaleUpModalOpen(cluster.name),
        },
        {
          id: ClusterAction.ImportHosted,
          ...importTemplate(
            (cluster) =>
              importHostedControlPlaneCluster(
                hostedClusters.find(
                  (hc) => hc.metadata?.name === cluster.name && hc.metadata?.namespace === cluster.namespace
                ) as HostedClusterK8sResource,
                t,
                localHubName,
                toastContext,
                isACMAvailable
              ) as IRequestResult
          ),
        },
        {
          id: ClusterAction.DestroyHosted,
          separator: true,
          text: t('managed.destroy'),
          click: (cluster: Cluster) => {
            if (clusterDestroyable(cluster)) {
              setModalProps({
                open: true,
                title: t('bulk.title.destroy'),
                action: t('destroy'),
                processing: t('destroying'),
                items: [cluster],
                emptyState: undefined, // there is always 1 item supplied
                description: t('bulk.message.destroy'),
                columns: modalColumns,
                keyFn: (cluster) => cluster.name as string,
                actionFn: (cluster) => deleteHypershiftCluster(cluster),
                close: () => {
                  setModalProps({ open: false })
                },
                isDanger: true,
                icon: 'warning',
                confirmText: cluster.displayName,
                isValidError: errorIsNot([ResourceErrorCode.NotFound]),
              })
            } else {
              setShowDestroyHostedModal(true)
            }
          },
          isAriaDisabled: true,
          rbac: destroyRbac,
        },
      ].filter((action) =>
        clusterSupportsAction(cluster, action.id, isHypershiftUpdateAvailable, isHypershiftChannelSelectable)
      ),
    [
      t,
      cluster,
      isSearchAvailable,
      importTemplate,
      destroyRbac,
      modalColumns,
      infraEnvs,
      navigate,
      hostedClusters,
      localHubName,
      toastContext,
      isACMAvailable,
      isHypershiftUpdateAvailable,
      isHypershiftChannelSelectable,
    ]
  )

  return (
    <>
      <DestroyHostedModal
        open={showDestroyHostedModal}
        close={() => setShowDestroyHostedModal(false)}
        clusterName={cluster.name}
      />
      <UpdateAutomationModal
        clusters={[cluster]}
        open={showUpdateAutomationModal}
        close={() => setShowUpdateAutomationModal(false)}
      />
      <RemoveAutomationModal
        clusters={[cluster]}
        open={showRemoveAutomationModal}
        close={() => setShowRemoveAutomationModal(false)}
      />
      <EditLabels
        resource={
          showEditLabels
            ? { ...ManagedClusterDefinition, metadata: { name: cluster.name, labels: cluster.labels } }
            : undefined
        }
        displayName={cluster.displayName}
        close={() => setShowEditLabels(false)}
      />
      <BatchUpgradeModal clusters={[cluster]} open={showUpgradeModal} close={() => setShowUpgradeModal(false)} />
      <BatchChannelSelectModal
        clusters={[cluster]}
        open={showChannelSelectModal}
        close={() => setShowChannelSelectModal(false)}
        hostedClusters={hostedCluster ? { [cluster.name]: hostedCluster } : undefined}
      />
      <BulkActionModal<Cluster> {...modalProps} />
      {actions && actions.length > 0 && (
        <RbacDropdown<Cluster>
          id={`${cluster.name}-actions`}
          item={cluster}
          isKebab={props.isKebab}
          text={t('actions')}
          actions={actions}
        />
      )}
      <ScaleUpDialog
        isOpen={!!scaleUpModalOpen}
        clusterName={scaleUpModalOpen}
        closeDialog={() => setScaleUpModalOpen(undefined)}
      />
      <HypershiftUpgradeModal
        controlPlane={cluster}
        nodepools={cluster.hypershift?.nodePools as NodePool[]}
        open={showHypershiftUpgradeModal}
        close={() => setShowHypershiftUpgradeModal(!showHypershiftUpgradeModal)}
        agents={agents}
        agentMachines={agentMachines}
        hostedCluster={
          hostedClusters.find(
            (hc) => hc.metadata?.name === cluster.name && hc.metadata?.namespace === cluster.namespace
          ) as HostedClusterK8sResource
        }
        availableUpdates={hypershiftAvailableUpdates}
      />
    </>
  )
}
