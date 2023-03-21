/* Copyright Contributors to the Open Cluster Management project */
import {
  Button,
  ButtonVariant,
  Flex,
  FlexItem,
  PageSection,
  Popover,
  Stack,
  StackItem,
  TextContent,
} from '@patternfly/react-core'
import { CogIcon, InfoCircleIcon, OutlinedQuestionCircleIcon } from '@patternfly/react-icons'
import { fitContent } from '@patternfly/react-table'
import { global_palette_blue_300 as blueInfoColor } from '@patternfly/react-tokens/dist/js/global_palette_blue_300'
import {
  AcmButton,
  AcmEmptyState,
  AcmInlineStatusGroup,
  AcmLabels,
  AcmPage,
  AcmPageContent,
  AcmPageHeader,
  AcmTable,
  compareStrings,
} from '../../../ui-components'
import isMatch from 'lodash/isMatch'
import {
  AgentK8sResource,
  InfraEnvK8sResource,
  AGENT_LOCATION_LABEL_KEY,
  getAgentStatus,
  isCIMConfigured,
  isStorageConfigured,
  CimConfigurationModal,
  AgentServiceConfigK8sResource,
  CimStorageMissingAlert,
  CimConfigProgressAlert,
  getCurrentClusterVersion,
  getMajorMinorVersion,
  CreateResourceFuncType,
  GetResourceFuncType,
  ListResourcesFuncType,
  PatchResourceFuncType,
  InfrastructureK8sResource,
} from 'openshift-assisted-ui-lib/cim'
import { useState, useEffect } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { BulkActionModal, BulkActionModalProps } from '../../../components/BulkActionModal'
import { RbacDropdown } from '../../../components/Rbac'
import { useTranslation } from '../../../lib/acm-i18next'
import { deleteResources } from '../../../lib/delete-resources'
import { DOC_LINKS, OCP_DOC_BASE_PATH, viewDocumentation } from '../../../lib/doc-util'
import { canUser, rbacDelete } from '../../../lib/rbac-util'
import { NavigationPath } from '../../../NavigationPath'
import { getDateTimeCell } from '../helpers/table-row-helpers'
import { useSharedAtoms, useSharedRecoil, useRecoilValue } from '../../../shared-recoil'
import { IResource } from '../../../resources/resource'
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk'
import { createResource, getResource, listResources, patchResource } from '../../../resources'

// Will change perspective, still in the OCP Console app
const storageOperatorUrl = '/operatorhub/ns/multicluster-engine?category=Storage'
const assistedServiceDeploymentUrl = '/k8s/ns/multicluster-engine/deployments/assisted-service'

export const getMatchingInfraAgents = (infraEnv: InfraEnvK8sResource, agents: AgentK8sResource[]) => {
  const infraAgents = agents.filter((a) =>
    isMatch(a.metadata?.labels || {}, infraEnv.status?.agentLabelSelector?.matchLabels || {})
  )
  return infraAgents
}

export const isDeleteDisabled = (infraEnvs: InfraEnvK8sResource[], agents: AgentK8sResource[]) => {
  let isDisabled = true
  infraEnvs.forEach((infraEnv) => {
    if (getMatchingInfraAgents(infraEnv, agents).length == 0) isDisabled = false
  })
  return isDisabled
}

export const getFirstAgenterviceConfig = (agentServiceConfigs?: AgentServiceConfigK8sResource[]) =>
  agentServiceConfigs?.[0]

export const getPlatform = (infrastructures?: InfrastructureK8sResource[]) =>
  infrastructures?.[0]?.status?.platform || 'None'

export const getInfraEnvsOfMatchingPullSecret = (infraEnvs: InfraEnvK8sResource[], infraEnv: InfraEnvK8sResource) =>
  infraEnvs.filter((a) => isMatch(a.spec?.pullSecretRef || {}, infraEnv.spec?.pullSecretRef || {}))

export const isPullSecretReused = (
  infraEnvs: InfraEnvK8sResource[],
  infraEnv: InfraEnvK8sResource,
  agents: AgentK8sResource[]
): boolean =>
  !!infraEnv.spec?.pullSecretRef?.name &&
  getInfraEnvsOfMatchingPullSecret(infraEnvs, infraEnv).length === 1 &&
  getMatchingInfraAgents(infraEnv, agents).length === 0

const deleteInfraEnv = (
  infraEnv: InfraEnvK8sResource,
  infraEnvs: InfraEnvK8sResource[],
  agents: AgentK8sResource[]
) => {
  const resources = [infraEnv]

  // Check all infraenv with same pull secret. If we don't found more infraenv we delete pull secret.
  if (isPullSecretReused(infraEnvs, infraEnv, agents)) {
    resources.push({
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: infraEnv.spec?.pullSecretRef?.name,
        namespace: infraEnv.metadata?.namespace,
      },
    })
  }

  const deleteResourcesResult = deleteResources(resources as IResource[])

  return {
    promise: new Promise((resolve, reject) => {
      deleteResourcesResult.promise.then((promisesSettledResult) => {
        if (promisesSettledResult[0]?.status === 'rejected') {
          const error = promisesSettledResult[0].reason
          if (error) {
            reject(promisesSettledResult[0].reason)
            return
          }
        }
        if (promisesSettledResult[1]?.status === 'rejected') {
          reject(promisesSettledResult[1].reason)
          return
        }
        resolve(promisesSettledResult)
      })
    }),
    abort: deleteResourcesResult.abort,
  }
}

const k8sPrimitives: {
  createResource: CreateResourceFuncType
  getResource: GetResourceFuncType
  listResources: ListResourcesFuncType
  patchResource: PatchResourceFuncType
} = {
  createResource: (res) => createResource(res).promise,
  getResource: (res) => getResource(res).promise,
  listResources: (...params) => listResources(...params).promise,
  patchResource: (...params) => patchResource(...params).promise,
}

const InfraEnvironmentsPage: React.FC = () => {
  const { agentsState, infraEnvironmentsState, infrastructuresState, agentServiceConfigsState, storageClassState } =
    useSharedAtoms()
  const { waitForAll } = useSharedRecoil()
  const [infraEnvs, agents, infrastructures, agentServiceConfigs, storageClasses] = useRecoilValue(
    waitForAll([infraEnvironmentsState, agentsState, infrastructuresState, agentServiceConfigsState, storageClassState])
  )

  const [canUserAgentServiceConfig, setCanUserAgentServiceConfig] = useState(false)
  const [isCimConfigurationModalOpen, setIsCimConfigurationModalOpen] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    const canUserAgentServiceConfigPromise = canUser('get', {
      apiVersion: 'agent-install.openshift.io/v1beta1',
      kind: 'AgentServiceConfig',
      metadata: {
        name: 'agent',
      },
    })
    canUserAgentServiceConfigPromise.promise
      .then((result) => setCanUserAgentServiceConfig(result.status?.allowed!))
      .catch((err) => console.error(err))
    return () => canUserAgentServiceConfigPromise.abort()
  }, [])

  const platform: string = infrastructures?.[0]?.status?.platform || 'None'
  const agentServiceConfig = getFirstAgenterviceConfig(agentServiceConfigs)
  const isStorage = isStorageConfigured({ storageClasses: storageClasses as K8sResourceCommon[] | undefined })

  return (
    <AcmPage
      hasDrawer
      header={
        <AcmPageHeader
          title={t('Host inventory')}
          description={
            <>
              <span>
                {
                  // i18next-parser does not detect nested references in values
                  // t('hostCount')
                  // t('infraEnvCount')
                  t('hostInfraEnvCounts', {
                    hostCount: agents.length,
                    infraEnvCount: infraEnvs.length,
                  })
                }
              </span>
              <Popover
                bodyContent={t(
                  'An infrastructure environment manages your hosts and creates clusters that share network, proxy, and location settings.'
                )}
              >
                <Button isInline variant="plain" icon={<OutlinedQuestionCircleIcon />} />
              </Popover>
            </>
          }
          actions={
            <Button
              isDisabled={!isStorage || !canUserAgentServiceConfig}
              variant={ButtonVariant.link}
              onClick={() => setIsCimConfigurationModalOpen(true)}
            >
              <CogIcon />
              &nbsp;{t('Configure host inventory settings')}
            </Button>
          }
        />
      }
    >
      <AcmPageContent id="infra-environments">
        <PageSection>
          <InfraEnvsTable
            infraEnvs={infraEnvs}
            agents={agents}
            agentServiceConfig={agentServiceConfig}
            isStorage={isStorage}
          />
        </PageSection>
      </AcmPageContent>

      {isCimConfigurationModalOpen && (
        <CimConfigurationModal
          {...k8sPrimitives}
          isOpen
          onClose={() => setIsCimConfigurationModalOpen(false)}
          agentServiceConfig={agentServiceConfig}
          platform={platform}
          docDisconnectedUrl={DOC_LINKS.CIM_CONFIG_DISONNECTED}
          docConfigUrl={DOC_LINKS.CIM_CONFIG}
          docConfigAwsUrl={DOC_LINKS.CIM_CONFIG_AWS}
        />
      )}
    </AcmPage>
  )
}

const keyFn = (infraEnv: InfraEnvK8sResource) => infraEnv.metadata?.uid!

type InfraEnvsTableProps = {
  infraEnvs: InfraEnvK8sResource[]
  agents: AgentK8sResource[]
  agentServiceConfig?: AgentServiceConfigK8sResource
  isStorage: boolean
}

const InfraEnvsTable: React.FC<InfraEnvsTableProps> = ({ infraEnvs, agents, agentServiceConfig, isStorage }) => {
  const { t } = useTranslation()
  const history = useHistory()
  const getDetailsLink = (infraEnv: InfraEnvK8sResource) =>
    NavigationPath.infraEnvironmentDetails
      .replace(':namespace', infraEnv.metadata?.namespace as string)
      .replace(':name', infraEnv.metadata?.name as string)

  const { clusterVersionState } = useSharedAtoms()
  const { waitForAll } = useSharedRecoil()
  const [clusterVersions] = useRecoilValue(waitForAll([clusterVersionState]))

  const [modalProps, setModalProps] = useState<BulkActionModalProps<InfraEnvK8sResource> | { open: false }>({
    open: false,
  })

  const infraAgentsFiltered: {
    [key: string]: {
      infraAgents: AgentK8sResource[]
      errorAgents: AgentK8sResource[]
      warningAgents: AgentK8sResource[]
    }
  } = {}

  infraEnvs.forEach((infraEnv) => {
    const infraAgents = agents.filter((a) =>
      isMatch(a.metadata?.labels || {}, infraEnv.status?.agentLabelSelector?.matchLabels || {})
    )
    const errorAgents = infraAgents.filter((a) => getAgentStatus(a).status.key === 'error')
    const warningAgents = infraAgents.filter((a) =>
      ['pending-for-input', 'insufficient', 'insufficient-unbound', 'disconnected-unbound', 'disconnected'].includes(
        getAgentStatus(a).status.key
      )
    )

    infraAgentsFiltered[infraEnv.metadata?.uid!] = {
      infraAgents,
      errorAgents,
      warningAgents,
    }
  })

  const onClickBulkDeleteInfraEnvs = (infraEnvs: InfraEnvK8sResource[]) => {
    setModalProps({
      open: true,
      title: t('bulk.title.delete.infraenv'),
      action: t('delete'),
      processing: t('deleting'),
      items: infraEnvs,
      emptyState: undefined, // table action is only enabled when items are selected
      description: t('bulk.message.delete.infraenv'),
      columns: [
        {
          header: t('infraEnv.tableHeader.name'),
          cell: 'metadata.name',
          sort: 'metadata.name',
        },
        {
          header: t('infraEnv.tableHeader.hosts'),
          cell: (infraEnv) => {
            const { infraAgents, errorAgents, warningAgents } = infraAgentsFiltered[infraEnv.metadata?.uid!]

            const HostsStatusGroupCell = (
              <Link to={`${getDetailsLink(infraEnv)}/hosts`}>
                {infraAgents.length ? (
                  <AcmInlineStatusGroup
                    healthy={infraAgents.length - errorAgents.length - warningAgents.length}
                    danger={errorAgents.length}
                    warning={warningAgents.length}
                  />
                ) : (
                  0
                )}
              </Link>
            )

            return infraAgents.length ? (
              <Flex>
                <FlexItem>{HostsStatusGroupCell}</FlexItem>
                <FlexItem align={{ default: 'alignRight' }}>
                  <Popover
                    aria-label="Infraenv cannot be deleted popover"
                    headerContent={<div>Cannot be deleted</div>}
                    bodyContent={<div>{t('infraEnv.rowAction.delete.desc')}</div>}
                  >
                    <Button variant="link" icon={<InfoCircleIcon color={blueInfoColor.value} />}>
                      Cannot be deleted
                    </Button>
                  </Popover>
                </FlexItem>
              </Flex>
            ) : (
              HostsStatusGroupCell
            )
          },
        },
      ],
      keyFn: (infraEnv: InfraEnvK8sResource) => infraEnv.metadata?.uid!,
      actionFn: (infraEnv: InfraEnvK8sResource) => {
        const { infraAgents } = infraAgentsFiltered[infraEnv.metadata?.uid!]
        if (infraAgents.length) {
          return {
            promise: Promise.resolve(),
            abort: () => {},
          }
        }

        return deleteInfraEnv(infraEnv, infraEnvs, agents)
      },
      close: () => {
        setModalProps({ open: false })
      },
      isDanger: true,
      icon: 'warning',
      confirmText: t('confirm'),
      disableSubmitButton: isDeleteDisabled(infraEnvs, agents),
    })
  }

  const clusterVersion = clusterVersions?.[0]
  const isCIMWorking = isStorage && isCIMConfigured({ agentServiceConfig })

  const ocpVersion = getMajorMinorVersion(getCurrentClusterVersion(clusterVersion)) || 'latest'
  const docStorageUrl = `${OCP_DOC_BASE_PATH}/${ocpVersion}/post_installation_configuration/storage-configuration.html`

  return (
    <>
      <BulkActionModal<InfraEnvK8sResource> {...modalProps} />
      <Stack hasGutter>
        {!isStorage && <CimStorageMissingAlert docStorageUrl={docStorageUrl} storageOperatorUrl={storageOperatorUrl} />}
        {isStorage && (
          <CimConfigProgressAlert
            agentServiceConfig={agentServiceConfig}
            assistedServiceDeploymentUrl={assistedServiceDeploymentUrl}
          />
        )}
        <StackItem>
          <AcmTable<InfraEnvK8sResource>
            items={infraEnvs}
            rowActions={[]}
            keyFn={keyFn}
            columns={[
              {
                header: t('infraEnv.tableHeader.name'),
                sort: 'metadata.name',
                search: 'metadata.name',
                cell: (infraEnv) => (
                  <span style={{ whiteSpace: 'nowrap' }}>
                    <Link to={getDetailsLink(infraEnv)}>{infraEnv.metadata?.name}</Link>
                  </span>
                ),
              },
              {
                header: t('infraEnv.tableHeader.namespace'),
                cell: 'metadata.namespace',
                search: 'metadata.namespace',
              },
              {
                header: t('infraEnv.tableHeader.labels'),
                cell: (infraEnv) => {
                  if (infraEnv.metadata?.labels) {
                    const labelKeys = Object.keys(infraEnv.metadata.labels)
                    const collapse =
                      [
                        'cloud',
                        'clusterID',
                        'installer.name',
                        'installer.namespace',
                        'name',
                        'vendor',
                        'managed-by',
                        'local-cluster',
                      ].filter((label) => labelKeys.includes(label)) ?? []
                    return (
                      <AcmLabels
                        labels={infraEnv.metadata.labels}
                        expandedText={t('show.less')}
                        collapsedText={t('show.more', { count: collapse.length })}
                        collapse={collapse}
                      />
                    )
                  } else {
                    return '-'
                  }
                },
                search: (infraEnv) => JSON.stringify(infraEnv.metadata?.labels) || '',
              },
              {
                header: t('infraEnv.tableHeader.location'),
                cell: (infraEnv) => infraEnv.metadata?.labels?.[AGENT_LOCATION_LABEL_KEY] ?? '-',
              },
              {
                header: t('infraEnv.tableHeader.hosts'),
                cell: (infraEnv) => {
                  const { infraAgents, errorAgents, warningAgents } = infraAgentsFiltered[infraEnv.metadata?.uid!]

                  return (
                    <Link to={`${getDetailsLink(infraEnv)}/hosts`}>
                      {infraAgents.length ? (
                        <AcmInlineStatusGroup
                          healthy={infraAgents.length - errorAgents.length - warningAgents.length}
                          danger={errorAgents.length}
                          warning={warningAgents.length}
                        />
                      ) : (
                        0
                      )}
                    </Link>
                  )
                },
              },
              {
                header: t('infraEnv.tableHeader.creationDate'),
                sort: (a: InfraEnvK8sResource, b: InfraEnvK8sResource) => {
                  const dateTimeCellA = getDateTimeCell(
                    a.metadata?.creationTimestamp ? new Date(a.metadata?.creationTimestamp).toString() : '-'
                  )
                  const dateTimeCellB = getDateTimeCell(
                    b.metadata?.creationTimestamp ? new Date(b.metadata?.creationTimestamp).toString() : '-'
                  )
                  return compareStrings(
                    dateTimeCellA.sortableValue == 0 ? '' : dateTimeCellA.sortableValue.toString(),
                    dateTimeCellB.sortableValue == 0 ? '' : dateTimeCellB.sortableValue.toString()
                  )
                },
                cell: (infraEnv) => {
                  const dateTimeCell = getDateTimeCell(
                    infraEnv.metadata?.creationTimestamp
                      ? new Date(infraEnv.metadata?.creationTimestamp).toString()
                      : '-'
                  )
                  return dateTimeCell.title === 'Invalid Date' ? '-' : dateTimeCell.title
                },
              },
              {
                header: '',
                cellTransforms: [fitContent],
                cell: (infraEnv) => {
                  const { infraAgents } = infraAgentsFiltered[infraEnv.metadata?.uid!]

                  const actions = []
                  if (infraAgents.length > 0) {
                    actions.push({
                      id: 'delete',
                      text: t('infraEnv.rowAction.delete.title'),
                      description: t('infraEnv.rowAction.delete.desc'),
                      isDisabled: true,
                      isAriaDisabled: true,
                      click: () => {},
                    })
                  } else {
                    actions.push({
                      id: 'delete',
                      text: t('infraEnv.rowAction.delete.title'),
                      isAriaDisabled: true,
                      click: (infraEnv: InfraEnvK8sResource) => {
                        setModalProps({
                          open: true,
                          title: t('action.title.delete'),
                          action: t('delete'),
                          processing: t('deleting'),
                          items: [infraEnv],
                          emptyState: undefined, // there is always 1 item supplied
                          description: t('action.message.delete'),
                          columns: [
                            {
                              header: t('infraEnv.tableHeader.name'),
                              cell: 'metadata.name',
                              sort: 'metadata.name',
                            },
                            {
                              header: t('infraEnv.tableHeader.namespace'),
                              cell: 'metadata.namespace',
                              sort: 'metadata.namespace',
                            },
                          ],
                          keyFn: (infraEnv: InfraEnvK8sResource) => infraEnv.metadata?.uid!,
                          actionFn: (infraEnv: InfraEnvK8sResource) => {
                            return deleteInfraEnv(infraEnv, infraEnvs, agents)
                          },
                          close: () => {
                            setModalProps({ open: false })
                          },
                          isDanger: true,
                          icon: 'warning',
                        })
                      },
                      rbac: [rbacDelete(infraEnv as IResource)],
                    })
                  }

                  return (
                    <RbacDropdown<InfraEnvK8sResource>
                      id={`${infraEnv?.metadata?.name!}-actions`}
                      item={infraEnv}
                      isKebab={true}
                      text={`${infraEnv?.metadata?.name!}-actions`}
                      actions={actions}
                    />
                  )
                },
              },
            ]}
            tableActionButtons={[
              {
                id: 'createInfraEnv',
                title: t('infraEnv.bulkAction.createInfraEnv'),
                click: () => history.push(NavigationPath.createInfraEnv),
                variant: ButtonVariant.primary,
              },
            ]}
            tableActions={[
              {
                id: 'delete',
                title: t('infraEnv.delete.plural'),
                click: onClickBulkDeleteInfraEnvs,
                variant: 'bulk-action',
              },
            ]}
            emptyState={
              <AcmEmptyState
                key="ieEmptyState"
                title={t('No infrastructure environments yet')}
                message={t(
                  'To get started, create an infrastructure environment to define the settings across multiple hosts.'
                )}
                action={
                  <div>
                    <AcmButton
                      variant="primary"
                      onClick={() => {
                        history.push(NavigationPath.createInfraEnv)
                      }}
                      isDisabled={!isCIMWorking}
                      tooltip={
                        !isCIMWorking ? (
                          <>
                            {t(
                              'To create an infrastructure environment, you must configure the host inventory settings.'
                            )}
                          </>
                        ) : undefined
                      }
                    >
                      {t('Create infrastructure environment')}
                    </AcmButton>
                    <TextContent>{viewDocumentation(DOC_LINKS.INFRASTRUCTURE_EVIRONMENTS, t)}</TextContent>
                  </div>
                }
              />
            }
          />
        </StackItem>
      </Stack>
    </>
  )
}

export default InfraEnvironmentsPage
