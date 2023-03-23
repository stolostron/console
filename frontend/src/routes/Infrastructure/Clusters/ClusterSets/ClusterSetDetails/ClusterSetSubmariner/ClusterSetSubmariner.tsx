/* Copyright Contributors to the Open Cluster Management project */

import {
  ButtonVariant,
  Flex,
  FlexItem,
  PageSection,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { fitContent } from '@patternfly/react-table'
import {
  AcmButton,
  AcmEmptyState,
  AcmExpandableCard,
  AcmInlineProvider,
  AcmInlineStatus,
  AcmPageContent,
  AcmTable,
  StatusType,
} from '../../../../../../ui-components'
import { useContext, useEffect, useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { useRecoilState, useSharedAtoms } from '../../../../../../shared-recoil'
import { BulkActionModal, errorIsNot, BulkActionModalProps } from '../../../../../../components/BulkActionModal'
import { RbacButton, RbacDropdown } from '../../../../../../components/Rbac'
import { Trans, useTranslation } from '../../../../../../lib/acm-i18next'
import { deleteSubmarinerAddon } from '../../../../../../lib/delete-submariner'
import { DOC_LINKS } from '../../../../../../lib/doc-util'
import { canUser, rbacCreate, rbacDelete, rbacGet, rbacPatch } from '../../../../../../lib/rbac-util'
import { NavigationPath } from '../../../../../../NavigationPath'
import {
  BrokerDefinition,
  defaultBrokerName,
  ManagedClusterAddOn,
  ManagedClusterSetDefinition,
  ResourceErrorCode,
  submarinerBrokerNamespaceAnnotation,
} from '../../../../../../resources'
import { EditSubmarinerConfigModal, EditSubmarinerConfigModalProps } from '../../components/EditSubmarinerConfigModal'
import { ClusterSetContext } from '../ClusterSetDetails'

type SubmarinerGatewayNodesLabeledType = 'SubmarinerGatewayNodesLabeled'
const SubmarinerGatewayNodesLabeled: SubmarinerGatewayNodesLabeledType = 'SubmarinerGatewayNodesLabeled'

type SubmarinerAgentDegradedType = 'SubmarinerAgentDegraded'
const SubmarinerAgentDegraded: SubmarinerAgentDegradedType = 'SubmarinerAgentDegraded'

type SubmarinerConnectionDegradedType = 'SubmarinerConnectionDegraded'
const SubmarinerConnectionDegraded: SubmarinerConnectionDegradedType = 'SubmarinerConnectionDegraded'

// Status type from the submariner agent controller indicating whether the submariner broker has been
// created and its configuration applied
type SubmarinerBrokerConfigAppliedType = 'SubmarinerBrokerConfigApplied'
const SubmarinerBrokerConfigApplied: SubmarinerBrokerConfigAppliedType = 'SubmarinerBrokerConfigApplied'

export enum SubmarinerStatus {
  'progressing' = 'progressing',
  'healthy' = 'healthy',
  'degraded' = 'degraded',
}

export const submarinerHealthCheck = (mca: ManagedClusterAddOn) => {
  const connectionDegradedCondition = mca.status?.conditions?.find((c) => c.type === SubmarinerConnectionDegraded)
  const agentCondition = mca.status?.conditions?.find((c) => c.type === SubmarinerAgentDegraded)
  const nodeLabeledCondition = mca.status?.conditions?.find((c) => c.type === SubmarinerGatewayNodesLabeled)

  const isConnectionProgressing = connectionDegradedCondition?.status === undefined
  const isAgentProgressing = agentCondition?.status === undefined
  const isNodeLabeledProgressing = nodeLabeledCondition?.status === undefined

  if (isConnectionProgressing || isAgentProgressing || isNodeLabeledProgressing) {
    return SubmarinerStatus.progressing
  } else {
    const isHealthyConnection = connectionDegradedCondition?.status === 'False'
    const isHealthyAgent = agentCondition?.status === 'False'
    const isNodeLabeled = nodeLabeledCondition?.status === 'True'

    if (isHealthyConnection && isHealthyAgent && isNodeLabeled) {
      return SubmarinerStatus.healthy
    } else {
      return SubmarinerStatus.degraded
    }
  }
}

export function ClusterSetSubmarinerPageContent() {
  const { t } = useTranslation()
  const history = useHistory()
  const { submarinerConfigsState } = useSharedAtoms()
  const [submarinerConfigs] = useRecoilState(submarinerConfigsState)
  const { clusterSet, clusters, submarinerAddons } = useContext(ClusterSetContext)
  const [canInstallSubmarinerAddons, setCanInstallSubmarinerAddons] = useState<boolean>(false)
  const [modalProps, setModalProps] = useState<BulkActionModalProps<ManagedClusterAddOn> | { open: false }>({
    open: false,
  })
  const [editSubmarinerConfigModalProps, setEditSubmarinerConfigModalProps] = useState<EditSubmarinerConfigModalProps>(
    {}
  )

  function keyFn(mca: ManagedClusterAddOn) {
    return mca.metadata.namespace!
  }

  useEffect(() => {
    const create = canUser(
      'create',
      BrokerDefinition,
      clusterSet?.metadata?.annotations?.[submarinerBrokerNamespaceAnnotation],
      defaultBrokerName
    )
    const get = canUser(
      'get',
      BrokerDefinition,
      clusterSet?.metadata?.annotations?.[submarinerBrokerNamespaceAnnotation],
      defaultBrokerName
    )
    Promise.all([create.promise, get.promise])
      .then((result) => {
        setCanInstallSubmarinerAddons(result.every((r) => r.status?.allowed!))
      })
      .catch((err) => console.error(err))
    return () => {
      create.abort()
      get.abort()
    }
  }, [clusterSet?.metadata?.annotations])

  const columns = [
    {
      header: t('table.cluster'),
      sort: 'metadata.namespace',
      search: 'metadata.namespace',
      cell: (mca: ManagedClusterAddOn) => {
        const matchedCluster = clusters!.find((c) => c.namespace === mca.metadata.namespace)
        return matchedCluster!.displayName
      },
    },
    {
      header: t('table.provider'),
      cell: (mca: ManagedClusterAddOn) => {
        const matchedCluster = clusters!.find((c) => c.namespace === mca.metadata.namespace)
        return matchedCluster?.provider ? <AcmInlineProvider provider={matchedCluster!.provider!} /> : '-'
      },
    },
    {
      header: t('table.submariner.connection'),
      cell: (mca: ManagedClusterAddOn) => {
        const connectionDegradedCondition = mca.status?.conditions?.find((c) => c.type === SubmarinerConnectionDegraded)
        let type: StatusType = StatusType.progress
        let status: string = t('status.submariner.progressing')
        let message: string | undefined = t('status.submariner.progressing.message')
        if (connectionDegradedCondition) {
          status =
            connectionDegradedCondition?.status === 'True'
              ? t('status.submariner.connection.degraded')
              : t('status.submariner.connection.healthy')
          type = connectionDegradedCondition?.status === 'True' ? StatusType.danger : StatusType.healthy
          message = connectionDegradedCondition.message
        }
        return <AcmInlineStatus type={type} status={status} popover={message ? { bodyContent: message } : undefined} />
      },
    },
    {
      header: t('table.submariner.agent'),
      cell: (mca: ManagedClusterAddOn) => {
        const agentCondition = mca.status?.conditions?.find((c) => c.type === SubmarinerAgentDegraded)
        let type: StatusType = StatusType.progress
        let status: string = t('status.submariner.progressing')
        let message: string | undefined = t('status.submariner.progressing.message')
        if (agentCondition) {
          status =
            agentCondition?.status === 'True'
              ? t('status.submariner.agent.degraded')
              : t('status.submariner.agent.healthy')
          type = agentCondition?.status === 'True' ? StatusType.danger : StatusType.healthy
          message = agentCondition.message
        } else {
          // Check for the status condition that the broker is missing.  This could be temporary, but
          // if the broker was not created at all, then the status needs to be surfaced so the user knows
          // why the submariner managed cluster addon deployment is not progressing.
          const brokerCondition = mca.status?.conditions?.find((c) => c.type === SubmarinerBrokerConfigApplied)
          if (brokerCondition) {
            // The broker is missing if the status is false
            if (brokerCondition?.status === 'False') {
              status = t('status.submariner.agent.degraded')
              type = StatusType.warning
              // The submariner managed cluster addon is not setting the message on this condition
              // (only logging it), but probably should
              // message = brokerCondition?.message
              message = t('status.submariner.missing.broker.message')
            }
          }
        }
        return <AcmInlineStatus type={type} status={status} popover={message ? { bodyContent: message } : undefined} />
      },
    },
    {
      header: t('table.submariner.nodes'),
      cell: (mca: ManagedClusterAddOn) => {
        const nodeLabeledCondition = mca.status?.conditions?.find((c) => c.type === SubmarinerGatewayNodesLabeled)
        let type: StatusType = StatusType.progress
        let status: string = t('status.submariner.progressing')
        let message: string | undefined = t('status.submariner.progressing.message')
        if (nodeLabeledCondition) {
          status =
            nodeLabeledCondition?.status === 'True'
              ? t('status.submariner.nodes.labeled')
              : t('status.submariner.nodes.notLabeled')
          type = nodeLabeledCondition?.status === 'True' ? StatusType.healthy : StatusType.danger
          message = nodeLabeledCondition.message
        }
        return <AcmInlineStatus type={type} status={status} popover={message ? { bodyContent: message } : undefined} />
      },
    },
  ]

  return (
    <AcmPageContent id="clusters">
      <PageSection>
        <EditSubmarinerConfigModal {...editSubmarinerConfigModalProps} />
        <BulkActionModal<ManagedClusterAddOn> {...modalProps} />
        <Stack hasGutter>
          <StackItem>
            <AcmExpandableCard title={t('multi-cluster.networking')} id="submariner-info">
              <Flex spaceItems={{ default: 'spaceItemsLg' }}>
                <FlexItem flex={{ default: 'flex_1' }}>
                  <TextContent>
                    <Text component={TextVariants.h4}>{t('submariner')}</Text>
                    <Text component={TextVariants.p}>{t('learn.submariner')}</Text>
                    <Text component={TextVariants.p}>
                      <Trans i18nKey="learn.submariner.additional" components={{ bold: <strong /> }} />
                    </Text>
                  </TextContent>
                </FlexItem>
              </Flex>
              <Flex justifyContent={{ default: 'justifyContentFlexEnd' }}>
                <FlexItem>
                  <AcmButton
                    onClick={() => window.open(DOC_LINKS.SUBMARINER, '_blank')}
                    variant="link"
                    role="link"
                    icon={<ExternalLinkAltIcon />}
                    iconPosition="right"
                  >
                    {t('view.documentation')}
                  </AcmButton>
                </FlexItem>
              </Flex>
            </AcmExpandableCard>
          </StackItem>
          <StackItem>
            <AcmTable<ManagedClusterAddOn>
              items={submarinerAddons}
              columns={[
                ...columns,
                {
                  header: '',
                  cellTransforms: [fitContent],
                  cell: (mca: ManagedClusterAddOn) => {
                    const submarinerConfig = submarinerConfigs.find(
                      (sc) => sc.metadata.namespace === mca.metadata.namespace
                    )
                    const cluster = clusters?.find((c) => c.namespace === mca.metadata.namespace)
                    const actions = [
                      {
                        id: 'uninstall-submariner',
                        text: t('uninstall.add-on'),
                        isAriaDisabled: true,
                        rbac: [rbacDelete(mca)],
                        click: (mca: ManagedClusterAddOn) => {
                          setModalProps({
                            open: true,
                            title: t('bulk.title.uninstallSubmariner'),
                            action: t('uninstall'),
                            processing: t('uninstalling'),
                            items: [mca],
                            emptyState: undefined, // there is always 1 item supplied
                            description: t('bulk.message.uninstallSubmariner'),
                            columns,
                            icon: 'warning',
                            keyFn: (mca) => mca.metadata.namespace as string,
                            actionFn: (managedClusterAddOn: ManagedClusterAddOn) => {
                              const submarinerConfig = submarinerConfigs.find(
                                (sc) => sc.metadata.namespace === managedClusterAddOn.metadata.namespace
                              )
                              return deleteSubmarinerAddon(managedClusterAddOn, submarinerConfig)
                            },
                            close: () => setModalProps({ open: false }),
                            isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                          })
                        },
                      },
                    ]

                    if (submarinerConfig !== undefined) {
                      actions.unshift({
                        id: 'edit-submariner-config',
                        text: t('submariner.config.edit'),
                        isAriaDisabled: true,
                        rbac: [rbacPatch(submarinerConfig!)],
                        click: () => {
                          setEditSubmarinerConfigModalProps({
                            submarinerConfig,
                            cluster,
                            onClose: () => setEditSubmarinerConfigModalProps({}),
                          })
                        },
                      })
                    }

                    return (
                      <RbacDropdown<ManagedClusterAddOn>
                        id={`${mca.metadata.name}-actions`}
                        item={mca}
                        isKebab={true}
                        text={`${mca.metadata.name}-actions`}
                        actions={actions}
                      />
                    )
                  },
                },
              ]}
              keyFn={keyFn}
              key="submarinerTable"
              tableActions={[
                {
                  id: 'uninstall-submariner',
                  title: t('bulk.title.uninstallSubmariner.action'),
                  click: (mcas: ManagedClusterAddOn[]) => {
                    setModalProps({
                      open: true,
                      title: t('bulk.title.uninstallSubmariner'),
                      action: t('uninstall'),
                      processing: t('uninstalling'),
                      items: mcas,
                      emptyState: undefined, // table action is only enabled when items are selected
                      description: t('bulk.message.uninstallSubmariner'),
                      columns,
                      icon: 'warning',
                      keyFn: (mca) => mca.metadata.namespace as string,
                      actionFn: (managedClusterAddOn: ManagedClusterAddOn) => {
                        const submarinerConfig = submarinerConfigs.find(
                          (sc) => sc.metadata.namespace === managedClusterAddOn.metadata.namespace
                        )
                        return deleteSubmarinerAddon(managedClusterAddOn, submarinerConfig)
                      },
                      close: () => setModalProps({ open: false }),
                      isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                    })
                  },
                  variant: 'bulk-action',
                },
              ]}
              rowActions={[]}
              tableActionButtons={[
                {
                  id: 'install-submariner',
                  title: t('managed.clusterSets.submariner.addons.install'),
                  click: () =>
                    history.push(NavigationPath.clusterSetSubmarinerInstall.replace(':id', clusterSet?.metadata.name!)),
                  variant: ButtonVariant.primary,
                  isDisabled: !canInstallSubmarinerAddons,
                },
              ]}
              emptyState={
                <AcmEmptyState
                  key="mcEmptyState"
                  title={
                    clusters!.length === 0
                      ? t('managed.clusterSets.clusters.emptyStateHeader')
                      : t('empty-state.submariner.title')
                  }
                  message={
                    clusters!.length === 0 ? (
                      <Trans
                        i18nKey="managed.clusterSets.submariner.clusters.emptyStateMsg"
                        components={{ bold: <strong />, p: <p /> }}
                      />
                    ) : (
                      <Trans
                        i18nKey="managed.clusterSets.submariner.addons.emptyStateMsg"
                        components={{ bold: <strong />, p: <p /> }}
                      />
                    )
                  }
                  action={
                    clusters!.length === 0 ? (
                      <RbacButton
                        component={Link}
                        to={NavigationPath.clusterSetManage.replace(':id', clusterSet!.metadata.name!)}
                        variant="primary"
                        rbac={[rbacCreate(ManagedClusterSetDefinition, undefined, clusterSet!.metadata.name, 'join')]}
                      >
                        {t('managed.clusterSets.clusters.emptyStateButton')}
                      </RbacButton>
                    ) : (
                      <RbacButton
                        id="install-submariner"
                        component={Link}
                        to={NavigationPath.clusterSetSubmarinerInstall.replace(':id', clusterSet?.metadata.name!)}
                        variant="primary"
                        rbac={[
                          rbacCreate(
                            BrokerDefinition,
                            clusterSet?.metadata?.annotations?.[submarinerBrokerNamespaceAnnotation],
                            defaultBrokerName
                          ),
                          rbacGet(
                            BrokerDefinition,
                            clusterSet?.metadata?.annotations?.[submarinerBrokerNamespaceAnnotation],
                            defaultBrokerName
                          ),
                        ]}
                      >
                        {t('managed.clusterSets.submariner.addons.install')}
                      </RbacButton>
                    )
                  }
                />
              }
            />
          </StackItem>
        </Stack>
      </PageSection>
    </AcmPageContent>
  )
}
