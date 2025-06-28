/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useMemo } from 'react'
import { PathParam, generatePath, useLocation, useNavigate, useParams } from 'react-router-dom-v5-compat'
import {
  ACM_ENABLED_FEATURES,
  AgentK8sResource,
  ClusterDeploymentDetailsValues,
  ClusterDeploymentWizard,
  ClusterDeploymentWizardStepsType,
  ClusterImageSetK8sResource,
  FeatureGateContextProvider,
  LoadingState,
  isAgentOfInfraEnv,
} from '@openshift-assisted/ui-lib/cim'
import { PageSection, Switch } from '@patternfly/react-core'
import { AcmErrorBoundary, AcmPageContent, AcmPage, AcmPageHeader } from '../../../../../../ui-components'

import { IResource } from '../../../../../../resources'
import { patchResource } from '../../../../../../resources/utils'
import {
  onDiscoveryHostsNext,
  onHostsNext,
  onSaveNetworking,
  useClusterDeployment,
  useAgentClusterInstall,
  fetchInfraEnv,
  useAssistedServiceConfigMap,
  useClusterDeploymentInfraEnv,
  onSetInstallationDiskId,
  onEditFinish,
} from '../../CreateCluster/components/assisted-installer/utils'
import { NavigationPath } from '../../../../../../NavigationPath'
import { useTranslation } from '../../../../../../lib/acm-i18next'
import { useSharedAtoms, useRecoilValue } from '../../../../../../shared-recoil'
import { DOC_VERSION } from '../../../../../../lib/doc-util'

const TEMPLATE_EDITOR_OPEN_COOKIE = 'yaml'

const EditAICluster: React.FC = () => {
  const { search } = useLocation()
  const { name = '', namespace = '' } = useParams<PathParam<NavigationPath.editCluster>>()
  const searchParams = new URLSearchParams(search)
  const { t } = useTranslation()
  const [patchingHoldInstallation, setPatchingHoldInstallation] = useState(true)
  const navigate = useNavigate()
  const { agentsState, clusterImageSetsState, clusterCuratorsState, bareMetalHostsState } =
    useSharedAtoms()
  const clusterImageSets = useRecoilValue(clusterImageSetsState)
  const agents = useRecoilValue(agentsState)
  const clusterCurators = useRecoilValue(clusterCuratorsState)
  const bareMetalHosts = useRecoilValue(bareMetalHostsState)
  const aiConfigMap = useAssistedServiceConfigMap()

  const clusterDeployment = useClusterDeployment({ name, namespace })
  const agentClusterInstall = useAgentClusterInstall({ name, namespace })
  const infraEnv = useClusterDeploymentInfraEnv(
    clusterDeployment?.metadata?.name!,
    clusterDeployment?.metadata?.namespace!
  )

  const [isPreviewOpen, setPreviewOpen] = useState(!!localStorage.getItem(TEMPLATE_EDITOR_OPEN_COOKIE))

  const onSaveDetails = (values: ClusterDeploymentDetailsValues) => {
    return patchResource(agentClusterInstall as IResource, [
      {
        op: 'replace',
        path: '/spec/imageSetRef/name',
        value: values.openshiftVersion,
      },
    ]).promise
  }

  // Specific for the AI flow which has single&dedicated InfraEnv per Cluster
  const agentsOfSingleInfraEnvCluster = useMemo(
    () =>
      agents.filter((a) =>
        // TODO(mlibra): extend here once we can "disable" hosts
        isAgentOfInfraEnv(infraEnv, a)
      ),
    [agents, infraEnv]
  )

  const hostActions = {
    onEditRole: (agent: AgentK8sResource, role: string | undefined) => {
      return patchResource(agent as IResource, [
        {
          op: 'replace',
          path: '/spec/role',
          value: role,
        },
      ]).promise as Promise<AgentK8sResource>
    },
    onSetInstallationDiskId,
  }

  useEffect(() => {
    const patch = async () => {
      if (agentClusterInstall) {
        try {
          if (!agentClusterInstall.spec?.holdInstallation) {
            await patchResource(agentClusterInstall as IResource, [
              {
                op: agentClusterInstall.spec?.holdInstallation === false ? 'replace' : 'add',
                path: '/spec/holdInstallation',
                value: true,
              },
            ]).promise
          }
        } finally {
          setPatchingHoldInstallation(false)
        }
      }
    }
    patch()
  }, [
    // just once but when the ACI is loaded
    !!agentClusterInstall,
  ])

  const isNutanix = agentClusterInstall?.spec?.platformType === 'Nutanix'

  const clusterCurator = clusterCurators.find((c) => c.metadata?.namespace === namespace)

  return patchingHoldInstallation || !clusterDeployment || !agentClusterInstall ? (
    <LoadingState />
  ) : (
    <AcmPage
      hasDrawer
      header={
        <AcmPageHeader
          breadcrumb={[
            { text: t('Clusters'), to: NavigationPath.clusters },
            {
              text: clusterDeployment?.metadata?.name!,
              to: generatePath(NavigationPath.clusterDetails, { name, namespace }),
            },
            {
              text: t('managed.ai.editCluster.configurationBreadcrumb'),
            },
          ]}
          title={t('managed.ai.editCluster.title')}
          switches={
            <Switch
              label={`YAML: ${isPreviewOpen ? 'On' : 'Off'}`}
              isChecked={isPreviewOpen}
              onChange={(_event, checked) => {
                setPreviewOpen(checked)
                if (checked) {
                  localStorage.setItem(TEMPLATE_EDITOR_OPEN_COOKIE, 'true')
                } else {
                  localStorage.removeItem(TEMPLATE_EDITOR_OPEN_COOKIE)
                }
              }}
            />
          }
        />
      }
    >
      <AcmErrorBoundary>
        <AcmPageContent id="edit-cluster">
          <PageSection variant="light" type="wizard" isFilled>
            {/* @ts-expect-error @openshift-assisted/ui-lib needs React 18 updates */}
            <FeatureGateContextProvider features={ACM_ENABLED_FEATURES}>
              <ClusterDeploymentWizard
                className="cluster-deployment-wizard"
                clusterImages={clusterImageSets as ClusterImageSetK8sResource[]}
                clusterDeployment={clusterDeployment}
                agentClusterInstall={agentClusterInstall}
                agents={agents}
                bareMetalHosts={bareMetalHosts}
                usedClusterNames={[] /* We are in Edit flow - cluster name can not be changed. */}
                onClose={() => navigate(-1)}
                onSaveDetails={onSaveDetails}
                onSaveNetworking={(values) => onSaveNetworking(agentClusterInstall, values)}
                onSaveHostsSelection={(values) =>
                  onHostsNext({ values, clusterDeployment, agents, agentClusterInstall })
                }
                onSaveHostsDiscovery={() =>
                  onDiscoveryHostsNext({
                    clusterDeployment,
                    agents: agentsOfSingleInfraEnvCluster,
                    agentClusterInstall,
                  })
                }
                hostActions={hostActions}
                onFinish={async () => {
                  const aci = await onEditFinish(agentClusterInstall, clusterCurator)
                  navigate(generatePath(NavigationPath.clusterDetails, { name, namespace }))
                  return aci
                }}
                aiConfigMap={aiConfigMap}
                infraEnv={infraEnv}
                initialStep={(searchParams.get('initialStep') as ClusterDeploymentWizardStepsType) || undefined}
                fetchInfraEnv={fetchInfraEnv}
                isPreviewOpen={isPreviewOpen}
                setPreviewOpen={setPreviewOpen}
                docVersion={DOC_VERSION}
                isNutanix={isNutanix}
              />
            </FeatureGateContextProvider>
          </PageSection>
        </AcmPageContent>
      </AcmErrorBoundary>
    </AcmPage>
  )
}

export default EditAICluster
