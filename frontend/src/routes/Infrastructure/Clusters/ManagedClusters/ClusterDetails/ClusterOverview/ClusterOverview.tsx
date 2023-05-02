/* Copyright Contributors to the Open Cluster Management project */

import {
  ClusterCuratorDefinition,
  ClusterDeployment,
  ClusterStatus,
  ManagedClusterDefinition,
  isAutomationTemplate,
} from '../../../../../../resources'
import {
  AcmButton,
  AcmDescriptionList,
  AcmInlineCopy,
  AcmInlineProvider,
  AcmInlineStatus,
  AcmLabels,
  AcmPageContent,
  StatusType,
  Provider,
  AcmAlert,
} from '../../../../../../ui-components'
import { AlertVariant, ButtonVariant, Modal, ModalVariant, PageSection, Popover } from '@patternfly/react-core'
import { ExternalLinkAltIcon, OutlinedQuestionCircleIcon, PencilAltIcon } from '@patternfly/react-icons'
import { Fragment, useContext, useState } from 'react'
import { Trans, useTranslation } from '../../../../../../lib/acm-i18next'
import { Link } from 'react-router-dom'
import { CIM } from 'openshift-assisted-ui-lib'
import { RbacButton } from '../../../../../../components/Rbac'
import { rbacCreate, rbacPatch } from '../../../../../../lib/rbac-util'
import { NavigationPath } from '../../../../../../NavigationPath'
import { BatchChannelSelectModal } from '../../components/BatchChannelSelectModal'
import { ClusterStatusMessageAlert } from '../../components/ClusterStatusMessageAlert'
import { DistributionField } from '../../components/DistributionField'
import { EditLabels } from '../../components/EditLabels'
import { HiveNotification } from '../../components/HiveNotification'
import { ImportCommandContainer } from '../../components/ImportCommand'
import { LoginCredentials } from '../../components/LoginCredentials'
import { ProgressStepBar } from '../../components/ProgressStepBar'
import { StatusField } from '../../components/StatusField'
import { StatusSummaryCount } from '../../components/StatusSummaryCount'
import { ClusterContext } from '../ClusterDetails'
import AIClusterDetails from '../../components/cim/AIClusterDetails'
import AIHypershiftClusterDetails from '../../components/cim/AIHypershiftClusterDetails'
import HypershiftClusterDetails from '../../components/HypershiftClusterDetails'
import HypershiftKubeAPI from './HypershiftKubeAPI'
import { HypershiftImportCommand } from '../../components/HypershiftImportCommand'
import TemplateSummaryModal from '../../../../../../components/TemplateSummaryModal'
import { ClusterDeploymentK8sResource, HostedClusterK8sResource } from 'openshift-assisted-ui-lib/cim'
import { CredentialsForm } from '../../../../../Credentials/CredentialsForm'
import { GetProjects } from '../../../../../../components/GetProjects'

const { getClusterProperties } = CIM

function getAIClusterProperties(
  clusterDeployment: ClusterDeployment,
  agentClusterInstall: CIM.AgentClusterInstallK8sResource
) {
  const aiClusterProperties = getClusterProperties(
    clusterDeployment as ClusterDeploymentK8sResource,
    agentClusterInstall
  )
  return [
    aiClusterProperties.baseDnsDomain,
    aiClusterProperties.apiVip,
    aiClusterProperties.ingressVip,
    aiClusterProperties.clusterNetworkCidr,
    aiClusterProperties.clusterNetworkHostPrefix,
    aiClusterProperties.serviceNetworkCidr,
  ]
}

export function ClusterOverviewPageContent(props: {
  canGetSecret?: boolean
  selectedHostedClusterResource?: HostedClusterK8sResource
}) {
  const { cluster, clusterCurator, clusterDeployment, agentClusterInstall, hostedCluster } = useContext(ClusterContext)
  const { t } = useTranslation()
  const [showEditLabels, setShowEditLabels] = useState<boolean>(false)
  const [showChannelSelectModal, setShowChannelSelectModal] = useState<boolean>(false)
  const [curatorSummaryModalIsOpen, setCuratorSummaryModalIsOpen] = useState<boolean>(false)
  const { projects } = GetProjects()

  const renderControlPlaneType = () => {
    if (cluster?.name === 'local-cluster') {
      return t('Hub')
    }
    if (cluster?.isRegionalHubCluster) {
      if (cluster?.isHostedCluster || cluster?.isHypershift) {
        return t('Hub, Hosted')
      }
      return t('Hub')
    }
    if (cluster?.isHostedCluster || cluster?.isHypershift) {
      return t('Hosted')
    } else {
      return t('Standalone')
    }
  }

  const clusterProperties: { [key: string]: { key: string; value?: React.ReactNode; keyAction?: React.ReactNode } } = {
    clusterName: {
      key: t('table.clusterName'),
      value: (
        <span>
          {cluster!.name}
          <Popover bodyContent={<Trans i18nKey="table.clusterName.helperText" components={{ bold: <strong /> }} />}>
            <AcmButton variant="link" style={{ paddingLeft: '6px' }}>
              <OutlinedQuestionCircleIcon />
            </AcmButton>
          </Popover>
        </span>
      ),
    },
    clusterControlPlaneType: {
      key: t('table.clusterControlPlaneType'),
      value: renderControlPlaneType(),
    },
    clusterClaim: {
      key: t('table.clusterClaim'),
      value: cluster?.hive?.clusterClaimName && (
        <span>
          {cluster?.hive?.clusterClaimName}
          <Popover bodyContent={<Trans i18nKey="table.clusterClaim.helperText" components={{ bold: <strong /> }} />}>
            <AcmButton variant="link" style={{ paddingLeft: '6px' }}>
              <OutlinedQuestionCircleIcon />
            </AcmButton>
          </Popover>
        </span>
      ),
    },
    status: {
      key: t('table.status'),
      value: cluster?.status && <StatusField cluster={cluster} />,
    },
    provider: {
      key: t('table.provider'),
      value: cluster?.provider && <AcmInlineProvider provider={cluster.provider} />,
    },
    distribution: {
      key: t('table.distribution'),
      value: (
        <DistributionField
          cluster={cluster}
          clusterCurator={clusterCurator}
          hostedCluster={hostedCluster}
          resource={'hostedcluster'}
        />
      ),
    },
    channel: {
      key: t('table.channel'),
      value: (
        <span>
          {cluster?.distribution?.upgradeInfo?.isSelectingChannel ? (
            <AcmInlineStatus
              type={StatusType.progress}
              status={t('upgrade.selecting.channel', {
                channel: cluster?.distribution?.upgradeInfo.desiredChannel,
              })}
            ></AcmInlineStatus>
          ) : (
            cluster!.distribution?.upgradeInfo?.currentChannel || ''
          )}
          <Popover bodyContent={<Trans i18nKey="table.clusterChannel.helperText" components={{ bold: <strong /> }} />}>
            <AcmButton variant="link" style={{ paddingLeft: '6px' }}>
              <OutlinedQuestionCircleIcon />
            </AcmButton>
          </Popover>
        </span>
      ),
      keyAction: cluster?.isManaged && cluster.distribution?.upgradeInfo?.isReadySelectChannels && (
        <RbacButton
          onClick={() => {
            if (cluster) {
              setShowChannelSelectModal(true)
            }
          }}
          variant={ButtonVariant.plain}
          aria-label={t('bulk.title.selectChannel')}
          rbac={[
            rbacPatch(ClusterCuratorDefinition, cluster?.namespace, cluster?.name),
            rbacCreate(ClusterCuratorDefinition, cluster?.namespace, cluster?.name),
          ]}
        >
          <PencilAltIcon />
        </RbacButton>
      ),
    },
    acmDistribution: {
      key: t('table.acm.distribution'),
      value: (
        <span>
          {cluster?.acmDistribution?.version}
          <Popover
            bodyContent={<Trans i18nKey="table.acm.distribution.helperText" components={{ bold: <strong /> }} />}
          >
            <AcmButton variant="link" style={{ paddingLeft: '6px' }}>
              <OutlinedQuestionCircleIcon />
            </AcmButton>
          </Popover>
        </span>
      ),
    },
    acmChannel: {
      key: t('table.acm.channel'),
      value: (
        <span>
          {cluster?.acmDistribution?.channel}
          <Popover bodyContent={<Trans i18nKey="table.acm.channel.helperText" components={{ bold: <strong /> }} />}>
            <AcmButton variant="link" style={{ paddingLeft: '6px' }}>
              <OutlinedQuestionCircleIcon />
            </AcmButton>
          </Popover>
        </span>
      ),
    },
    labels: {
      key: t('table.labels'),
      value: cluster?.labels && <AcmLabels labels={cluster?.labels} />,
      keyAction: cluster?.isManaged && (
        <RbacButton
          onClick={() => setShowEditLabels(true)}
          variant={ButtonVariant.plain}
          aria-label={t('labels.edit.title')}
          rbac={[rbacPatch(ManagedClusterDefinition, undefined, cluster?.name)]}
        >
          <PencilAltIcon />
        </RbacButton>
      ),
    },
    kubeApiServer: {
      key: t('table.kubeApiServer'),
      value: cluster?.kubeApiServer ? (
        <AcmInlineCopy text={cluster?.kubeApiServer} id="kube-api-server" />
      ) : cluster?.isHypershift && hostedCluster ? (
        <HypershiftKubeAPI />
      ) : undefined,
    },
    consoleUrl: {
      key: t('table.consoleUrl'),
      value: cluster?.consoleURL && (
        <AcmButton
          variant="link"
          isInline
          onClick={() => window.open(cluster.consoleURL!, '_blank')}
          isDisabled={cluster.status === ClusterStatus.hibernating}
          tooltip={t('hibernating.tooltip')}
          icon={<ExternalLinkAltIcon />}
          iconPosition="right"
        >
          {cluster?.consoleURL}
        </AcmButton>
      ),
    },
    acmConsoleUrl: {
      key: t('table.acm.consoleUrl'),
      value: cluster?.acmConsoleURL && (
        <AcmButton
          variant="link"
          isInline
          onClick={() => window.open(cluster.acmConsoleURL, '_blank')}
          tooltip={t('table.acm.consoleUrl.helperText')}
          icon={<ExternalLinkAltIcon />}
          iconPosition="right"
        >
          {cluster?.acmConsoleURL}
        </AcmButton>
      ),
    },
    clusterId: {
      key: t('table.clusterId'),
      value: cluster?.labels?.clusterID && (
        <>
          <div>{cluster?.labels?.clusterID}</div>
          <a
            href={`https://console.redhat.com/openshift/details/s/${cluster?.labels?.clusterID}`}
            target="_blank"
            rel="noreferrer"
          >
            {t('openshift.cluster.manager')} <ExternalLinkAltIcon />
          </a>
        </>
      ),
    },
    credentials: {
      key: t('table.credentials'),
      value: <LoginCredentials canGetSecret={props.canGetSecret} />,
    },
    claimedBy: {
      key: cluster?.owner.claimedBy ? t('table.claimedBy') : t('table.createdBy'),
      value: cluster?.owner.claimedBy ?? cluster?.owner.createdBy,
    },
    clusterSet: {
      key: t('table.clusterSet'),
      value: cluster?.clusterSet! && (
        <Link to={NavigationPath.clusterSetOverview.replace(':id', cluster?.clusterSet!)}>{cluster?.clusterSet}</Link>
      ),
    },
    clusterPool: {
      key: t('table.clusterPool'),
      value: cluster?.hive?.clusterPool,
    },
    automationTemplate: {
      key: t('Automation template'),
      value:
        clusterCurator && isAutomationTemplate(clusterCurator) ? (
          <AcmButton variant="link" isInline onClick={() => setCuratorSummaryModalIsOpen(true)}>
            {t('View template')}
          </AcmButton>
        ) : undefined,
    },
  }

  const fromClusterPool =
    !(cluster?.isHostedCluster || cluster?.isHypershift) && clusterProperties.clusterPool?.value !== undefined
  const hasOCPVersion = cluster?.distribution?.ocp?.version
  const hasAIClusterProperties =
    cluster?.provider === Provider.hostinventory && !cluster?.isHypershift && clusterDeployment && agentClusterInstall

  const clusterClaimedBySetPool = [
    ...(!cluster?.isHypershift ? [clusterProperties.claimedBy] : []),
    clusterProperties.clusterSet,
    // clusterPool should not be shown for stand alone clusters not from a clusterpool
    ...(fromClusterPool ? [clusterProperties.clusterPool] : []),
  ]

  const leftItems = [
    clusterProperties.clusterName,
    clusterProperties.clusterControlPlaneType,
    // clusterClaim should not be shown for stand alone clusters not from a clusterpool
    ...(fromClusterPool ? [clusterProperties.clusterClaim] : []),
    clusterProperties.status,
    clusterProperties.provider,
    clusterProperties.distribution,
    // should only show channel for ocp clusters with version
    ...(!cluster?.isHypershift && hasOCPVersion ? [clusterProperties.channel] : []),
    ...(cluster?.isRegionalHubCluster ? [clusterProperties.acmDistribution, clusterProperties.acmChannel] : []),
    clusterProperties.labels,
    ...(hasAIClusterProperties ? clusterClaimedBySetPool : []),
  ]
  const rightItems = [
    clusterProperties.kubeApiServer,
    clusterProperties.consoleUrl,
    ...(cluster?.isRegionalHubCluster ? [clusterProperties.acmConsoleUrl] : []),
    ...(!cluster?.isHypershift ? [clusterProperties.clusterId] : []),
    clusterProperties.credentials,
    ...(hasAIClusterProperties
      ? getAIClusterProperties(clusterDeployment, agentClusterInstall)
      : [...clusterClaimedBySetPool, ...(!cluster?.isHypershift ? [clusterProperties.automationTemplate] : [])]),
  ]

  const [isModalOpen, setIsModalOpen] = useState(false)
  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen)
  }

  let details = <ProgressStepBar />
  if (cluster?.isHypershift) {
    details = <HypershiftClusterDetails handleModalToggle={handleModalToggle} />
  }
  if (cluster?.provider === Provider.hostinventory) {
    if (cluster.isHypershift) {
      details = <AIHypershiftClusterDetails />
    } else if (!agentClusterInstall) {
      details = (
        <div style={{ marginBottom: '1rem' }} id={`missing-agentclusterinstall-alert`}>
          <AcmAlert
            isInline
            variant={AlertVariant.danger}
            title={<>{t('Cluster installation info unavailable')}</>}
            message={t('Could not find the AgentClusterInstall resource.')}
            noClose
          />
        </div>
      )
    } else {
      details = <AIClusterDetails />
    }
  }

  return (
    <AcmPageContent id="overview">
      <Fragment>
        <Modal
          variant={ModalVariant.large}
          showClose={false}
          isOpen={isModalOpen}
          aria-labelledby="modal-wizard-label"
          aria-describedby="modal-wizard-description"
          onClose={handleModalToggle}
          hasNoBodyWrapper
        >
          <CredentialsForm
            namespaces={projects}
            isEditing={false}
            isViewing={false}
            credentialsType={Provider.awss3}
            handleModalToggle={handleModalToggle}
            hideYaml={true}
          />
        </Modal>
      </Fragment>
      <PageSection>
        {clusterCurator && (
          <TemplateSummaryModal
            curatorTemplate={clusterCurator}
            isOpen={curatorSummaryModalIsOpen}
            close={() => {
              setCuratorSummaryModalIsOpen(false)
            }}
          ></TemplateSummaryModal>
        )}
        <ClusterStatusMessageAlert cluster={cluster!} padBottom />
        <HiveNotification />
        {cluster?.isHypershift && !cluster?.isHostedCluster && props.selectedHostedClusterResource ? (
          <HypershiftImportCommand selectedHostedClusterResource={props.selectedHostedClusterResource} />
        ) : (
          <ImportCommandContainer />
        )}
        <EditLabels
          resource={
            showEditLabels
              ? {
                  ...ManagedClusterDefinition,
                  metadata: { name: cluster!.name, labels: cluster!.labels },
                }
              : undefined
          }
          displayName={cluster!.displayName}
          close={() => setShowEditLabels(false)}
        />
        {details}
        <AcmDescriptionList
          title={t('table.details')}
          leftItems={leftItems}
          rightItems={rightItems}
          id="cluster-overview"
        />
        {cluster!.isManaged &&
          [
            ClusterStatus.ready,
            ClusterStatus.degraded,
            ClusterStatus.stopping,
            ClusterStatus.resuming,
            ClusterStatus.hibernating,
            ClusterStatus.unknown,
          ].includes(cluster!.status) && <StatusSummaryCount />}
        {cluster && (
          <BatchChannelSelectModal
            clusters={[cluster]}
            open={showChannelSelectModal}
            close={() => {
              setShowChannelSelectModal(false)
            }}
          />
        )}
      </PageSection>
    </AcmPageContent>
  )
}
