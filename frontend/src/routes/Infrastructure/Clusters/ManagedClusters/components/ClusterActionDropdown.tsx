/* Copyright Contributors to the Open Cluster Management project */

import { Text, TextContent, TextVariants } from '@patternfly/react-core'
import { AcmInlineProvider } from '../../../../../ui-components'
import { useContext, useMemo, useState } from 'react'
import { useHistory } from 'react-router'
import { BulkActionModal, errorIsNot, BulkActionModalProps } from '../../../../../components/BulkActionModal'
import { RbacDropdown } from '../../../../../components/Rbac'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { deleteCluster, detachCluster } from '../../../../../lib/delete-cluster'
import { deleteHypershiftCluster } from '../../../../../lib/delete-hypershift-cluster'
import { createImportResources } from '../../../../../lib/import-cluster'
import { PluginContext } from '../../../../../lib/PluginContext'
import { rbacCreate, rbacDelete, rbacPatch } from '../../../../../lib/rbac-util'
import { NavigationPath } from '../../../../../NavigationPath'
import {
  Cluster,
  ClusterCuratorDefinition,
  ClusterDeployment,
  ClusterDeploymentDefinition,
  ClusterStatus,
  HostedClusterDefinition,
  ManagedClusterDefinition,
  patchResource,
  ResourceErrorCode,
  SecretDefinition,
} from '../../../../../resources'
import { BatchChannelSelectModal } from './BatchChannelSelectModal'
import { BatchUpgradeModal } from './BatchUpgradeModal'
import ScaleUpDialog from './cim/ScaleUpDialog'
import { EditLabels } from './EditLabels'
import { StatusField } from './StatusField'
import { UpdateAutomationModal } from './UpdateAutomationModal'
import { ClusterAction, clusterSupportsAction } from '../utils/cluster-actions'
import { RemoveAutomationModal } from './RemoveAutomationModal'

export function ClusterActionDropdown(props: { cluster: Cluster; isKebab: boolean }) {
  const { t } = useTranslation()
  const history = useHistory()
  const { isSearchAvailable } = useContext(PluginContext)

  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false)
  const [showChannelSelectModal, setShowChannelSelectModal] = useState<boolean>(false)
  const [showUpdateAutomationModal, setShowUpdateAutomationModal] = useState<boolean>(false)
  const [showRemoveAutomationModal, setShowRemoveAutomationModal] = useState<boolean>(false)
  const [scaleUpModalOpen, setScaleUpModalOpen] = useState<string | undefined>(undefined)
  const [modalProps, setModalProps] = useState<BulkActionModalProps<Cluster> | { open: false }>({
    open: false,
  })
  const [showEditLabels, setShowEditLabels] = useState<boolean>(false)

  const { cluster } = props

  const modalColumns = useMemo(
    () => [
      {
        header: t('table.name'),
        cell: (cluster: Cluster) => (
          <>
            <span style={{ whiteSpace: 'nowrap' }}>{cluster.displayName}</span>
            {cluster.hive.clusterClaimName && (
              <TextContent>
                <Text component={TextVariants.small}>{cluster.hive.clusterClaimName}</Text>
              </TextContent>
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
          text: t('managed.upgrade'),
          click: () => setShowUpgradeModal(true),
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
                  header: t('upgrade.table.name'),
                  sort: 'displayName',
                  cell: (cluster) => (
                    <>
                      <span style={{ whiteSpace: 'nowrap' }}>{cluster.displayName}</span>
                      {cluster.hive.clusterClaimName && (
                        <TextContent>
                          <Text component={TextVariants.small}>{cluster.hive.clusterClaimName}</Text>
                        </TextContent>
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
              actionFn: (cluster: Cluster) => createImportResources(cluster.name!, cluster.clusterSet!),
            })
          },
          rbac: [rbacCreate(ManagedClusterDefinition)],
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
          id: ClusterAction.Destroy,
          text: t('managed.destroy'),
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
              actionFn: (cluster) => deleteCluster(cluster),
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
          rbac: destroyRbac,
        },
        {
          id: ClusterAction.EditAI,
          text: t('managed.editAI'),
          click: (cluster: Cluster) =>
            history.push(
              NavigationPath.editCluster.replace(':namespace', cluster.namespace!).replace(':name', cluster.name!)
            ),
          isAriaDisabled: cluster.status !== ClusterStatus.draft,
        },
        {
          id: ClusterAction.ScaleUpAI,
          text: t('managed.ai.scaleUp'),
          click: (cluster: Cluster) => setScaleUpModalOpen(cluster.name),
        },
        {
          id: ClusterAction.DestroyHosted,
          text: t('managed.destroy'),
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
              actionFn: (cluster) => deleteHypershiftCluster(cluster),
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
          rbac: destroyRbac,
        },
      ].filter((action) => clusterSupportsAction(cluster, action.id)),
    [cluster, destroyRbac, history, isSearchAvailable, modalColumns, t]
  )

  return (
    <>
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
    </>
  )
}
