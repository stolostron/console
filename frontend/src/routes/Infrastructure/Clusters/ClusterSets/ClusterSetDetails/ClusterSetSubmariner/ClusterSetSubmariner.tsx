/* Copyright Contributors to the Open Cluster Management project */

import {
  ButtonVariant,
  Flex,
  FlexItem,
  PageSection,
  Stack,
  StackItem,
  Content,
  ContentVariants,
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
import { Link, generatePath, useNavigate } from 'react-router-dom-v5-compat'
import { useRecoilValue, useSharedAtoms } from '../../../../../../shared-recoil'
import { BulkActionModal, errorIsNot, BulkActionModalProps } from '../../../../../../components/BulkActionModal'
import { RbacButton, RbacDropdown } from '../../../../../../components/Rbac'
import { Trans, useTranslation } from '../../../../../../lib/acm-i18next'
import { deleteSubmarinerAddon } from '../../../../../../lib/delete-submariner'
import { DOC_LINKS } from '../../../../../../lib/doc-util'
import { canUser, rbacCreate, rbacDelete, rbacGet, rbacPatch } from '../../../../../../lib/rbac-util'
import { NavigationPath, SubRoutesRedirect } from '../../../../../../NavigationPath'
import {
  BrokerDefinition,
  defaultBrokerName,
  isGlobalClusterSet,
  ManagedClusterAddOn,
  ManagedClusterSetDefinition,
  submarinerBrokerNamespaceAnnotation,
} from '../../../../../../resources'
import { ResourceErrorCode } from '../../../../../../resources/utils'
import { EditSubmarinerConfigModal, EditSubmarinerConfigModalProps } from '../../components/EditSubmarinerConfigModal'
import { useClusterSetDetailsContext } from '../ClusterSetDetails'
import { PluginContext } from '../../../../../../lib/PluginContext'

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

type RouteAgentConnectionDegradedType = 'RouteAgentConnectionDegraded'
const RouteAgentConnectionDegraded: RouteAgentConnectionDegradedType = 'RouteAgentConnectionDegraded'

export enum SubmarinerStatus {
  'progressing' = 'progressing',
  'healthy' = 'healthy',
  'degraded' = 'degraded',
}

export const submarinerHealthCheck = (mca: ManagedClusterAddOn) => {
  const connectionDegradedCondition = mca.status?.conditions?.find((c) => c.type === SubmarinerConnectionDegraded)
  const agentCondition = mca.status?.conditions?.find((c) => c.type === SubmarinerAgentDegraded)
  const nodeLabeledCondition = mca.status?.conditions?.find((c) => c.type === SubmarinerGatewayNodesLabeled)
  const routeAgentConnectionDegradedCondition = mca.status?.conditions?.find(
    (c) => c.type === RouteAgentConnectionDegraded
  )

  const isConnectionProgressing = connectionDegradedCondition?.status === undefined
  const isRouteAgentProgressing = routeAgentConnectionDegradedCondition?.status === undefined
  const isAgentProgressing = agentCondition?.status === undefined
  const isNodeLabeledProgressing = nodeLabeledCondition?.status === undefined

  if (isConnectionProgressing || isRouteAgentProgressing || isAgentProgressing || isNodeLabeledProgressing) {
    return SubmarinerStatus.progressing
  } else {
    const isHealthyConnection = connectionDegradedCondition?.status === 'False'
    const isHealthyRouteAgent = routeAgentConnectionDegradedCondition?.status === 'False'
    const isHealthyAgent = agentCondition?.status === 'False'
    const isNodeLabeled = nodeLabeledCondition?.status === 'True'
    const isConnectionHealthy = isHealthyConnection && isHealthyRouteAgent

    if (isHealthyAgent && isNodeLabeled && isConnectionHealthy) {
      return SubmarinerStatus.healthy
    } else {
      return SubmarinerStatus.degraded
    }
  }
}

export function ClusterSetSubmarinerPageContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { submarinerConfigsState } = useSharedAtoms()
  const submarinerConfigs = useRecoilValue(submarinerConfigsState)
  const { clusterSet, clusters, submarinerAddons } = useClusterSetDetailsContext()
  const [canInstallSubmarinerAddons, setCanInstallSubmarinerAddons] = useState<boolean>(false)
  const [modalProps, setModalProps] = useState<BulkActionModalProps<ManagedClusterAddOn> | { open: false }>({
    open: false,
  })
  const [editSubmarinerConfigModalProps, setEditSubmarinerConfigModalProps] = useState<EditSubmarinerConfigModalProps>(
    {}
  )
  const { isSubmarinerAvailable } = useContext(PluginContext)

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
        const matchedCluster = clusters.find((c) => c.namespace === mca.metadata.namespace)
        return matchedCluster!.displayName
      },
    },
    {
      header: t('table.provider'),
      cell: (mca: ManagedClusterAddOn) => {
        const matchedCluster = clusters.find((c) => c.namespace === mca.metadata.namespace)
        return matchedCluster?.provider ? <AcmInlineProvider provider={matchedCluster!.provider!} /> : '-'
      },
    },
    {
      header: t('table.submariner.connection'),
      cell: (mca: ManagedClusterAddOn) => {
        const connectionDegradedCondition = mca.status?.conditions?.find((c) => c.type === SubmarinerConnectionDegraded)
        const routeAgentConnectionDegradedCondition = mca.status?.conditions?.find(
          (c) => c.type === RouteAgentConnectionDegraded
        )

        let type: StatusType = StatusType.progress
        let status: string = t('status.submariner.progressing')
        let message: string | undefined = t('status.submariner.progressing.message')

        const isSubmarinerDegraded = connectionDegradedCondition?.status === 'True'
        const isRouteAgentDegraded = routeAgentConnectionDegradedCondition?.status === 'True'

        if (isSubmarinerDegraded || isRouteAgentDegraded) {
          status = t('status.submariner.connection.degraded')
          type = StatusType.danger
          if (isSubmarinerDegraded) {
            message = connectionDegradedCondition?.message
          } else {
            message = routeAgentConnectionDegradedCondition?.message
          }
        } else if (
          connectionDegradedCondition?.status === 'False' &&
          routeAgentConnectionDegradedCondition?.status === 'False'
        ) {
          type = StatusType.healthy
          status = t('status.submariner.connection.healthy')
          message = connectionDegradedCondition?.message
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

  if (!isSubmarinerAvailable || isGlobalClusterSet(clusterSet)) {
    return (
      <SubRoutesRedirect matchPath={NavigationPath.clusterSetDetails} targetPath={NavigationPath.clusterSetOverview} />
    )
  }

  return (
    <AcmPageContent id="clusters">
      <PageSection hasBodyWrapper={false}>
        <EditSubmarinerConfigModal {...editSubmarinerConfigModalProps} />
        <BulkActionModal<ManagedClusterAddOn> {...modalProps} />
        <Stack hasGutter>
          <StackItem>
            <AcmExpandableCard title={t('multi-cluster.networking')} id="submariner-info">
              <Flex spaceItems={{ default: 'spaceItemsLg' }}>
                <FlexItem flex={{ default: 'flex_1' }}>
                  <Content>
                    <Content component={ContentVariants.h4}>{t('submariner')}</Content>
                    <Content component={ContentVariants.p}>{t('learn.submariner')}</Content>
                    <Content component={ContentVariants.p}>
                      <Trans i18nKey="learn.submariner.additional" components={{ bold: <strong /> }} />
                    </Content>
                  </Content>
                </FlexItem>
              </Flex>
              <Flex justifyContent={{ default: 'justifyContentFlexEnd' }}>
                <FlexItem>
                  <AcmButton
                    onClick={() => window.open(DOC_LINKS.SUBMARINER, '_blank')}
                    variant="link"
                    role="link"
                  >
                    {t('view.documentation')}{' '}
                    <ExternalLinkAltIcon />
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
                  isActionCol: true,
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
                    navigate(
                      generatePath(NavigationPath.clusterSetSubmarinerInstall, { id: clusterSet?.metadata.name! })
                    ),
                  variant: ButtonVariant.primary,
                  isDisabled: !canInstallSubmarinerAddons,
                },
              ]}
              emptyState={
                <AcmEmptyState
                  key="mcEmptyState"
                  title={
                    clusters.length === 0
                      ? t("You don't have any clusters assigned to this cluster set yet")
                      : t('No submariner add-ons found yet')
                  }
                  message={
                    clusters.length === 0
                      ? t(
                          'At least two clusters must be assigned to the cluster set to create a multicluster network. To get started, manage your resource assignments to add clusters.'
                        )
                      : t(
                          'No clusters in this cluster set have the Submariner add-on installed. To get started, install Submariner add-ons to install the add-on on any available clusters in this cluster set.'
                        )
                  }
                  action={
                    clusters.length === 0 ? (
                      <RbacButton
                        component={Link}
                        to={generatePath(NavigationPath.clusterSetManage, { id: clusterSet.metadata.name! })}
                        variant="primary"
                        rbac={[rbacCreate(ManagedClusterSetDefinition, undefined, clusterSet.metadata.name, 'join')]}
                      >
                        {t('managed.clusterSets.clusters.emptyStateButton')}
                      </RbacButton>
                    ) : (
                      <RbacButton
                        id="install-submariner"
                        component={Link}
                        to={generatePath(NavigationPath.clusterSetSubmarinerInstall, {
                          id: clusterSet?.metadata.name!,
                        })}
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
