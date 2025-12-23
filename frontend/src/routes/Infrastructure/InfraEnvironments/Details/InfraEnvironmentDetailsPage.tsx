/* Copyright Contributors to the Open Cluster Management project */
import {
  AddHostDropdown,
  AgentClusterInstallK8sResource,
  AgentK8sResource,
  BareMetalHostK8sResource,
  getAgentsHostsNames,
  InfraEnvHostsTabAgentsWarning,
  InfraEnvK8sResource,
  INFRAENV_AGENTINSTALL_LABEL_KEY,
  NMStateK8sResource,
} from '@openshift-assisted/ui-lib/cim'
import { isMatch } from 'lodash'
import { Fragment, Suspense, useMemo } from 'react'
import {
  generatePath,
  Outlet,
  PathParam,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom-v5-compat'
import { ErrorPage } from '../../../../components/ErrorPage'
import { useTranslation } from '../../../../lib/acm-i18next'
import { DOC_VERSION } from '../../../../lib/doc-util'
import { NavigationPath } from '../../../../NavigationPath'
import { ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { AcmButton, AcmPage, AcmPageHeader, AcmSecondaryNav } from '../../../../ui-components'
import {
  getOnCreateBMH,
  getOnSaveISOParams,
  importYaml,
  useInfraEnv,
  useProvisioningConfiguration,
} from '../../Clusters/ManagedClusters/CreateCluster/components/assisted-installer/utils'
import { getInfraEnvNMStates } from '../utils'

type InfraEnvironmentDetailsContext = {
  agentClusterInstalls: AgentClusterInstallK8sResource[]
  infraEnv: InfraEnvK8sResource
  infraAgents: AgentK8sResource[]
  bareMetalHosts: BareMetalHostK8sResource[]
  infraNMStates: NMStateK8sResource[]
}

const InfraEnvironmentDetailsPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { name = '', namespace = '' } = useParams<PathParam<NavigationPath.infraEnvironmentDetails>>()

  const { agentClusterInstallsState, agentsState, bareMetalHostsState, nmStateConfigsState } = useSharedAtoms()
  const agentClusterInstalls = useRecoilValue(agentClusterInstallsState)
  const agents = useRecoilValue(agentsState)
  const bareMetalHosts = useRecoilValue(bareMetalHostsState)
  const nmStateConfigs = useRecoilValue(nmStateConfigsState)
  const infraEnv = useInfraEnv({ name, namespace })

  const infraNMStates = useMemo(() => getInfraEnvNMStates(nmStateConfigs, infraEnv), [nmStateConfigs, infraEnv])

  const infraAgents = useMemo(
    () =>
      agents.filter(
        (a) =>
          a.metadata?.namespace === infraEnv?.metadata?.namespace &&
          isMatch(a.metadata?.labels || {}, infraEnv?.status?.agentLabelSelector?.matchLabels || {})
      ),
    [agents, infraEnv]
  )

  const infraBMHs = useMemo(
    () =>
      bareMetalHosts.filter(
        (bmh) =>
          bmh.metadata?.namespace === infraEnv?.metadata?.namespace &&
          bmh.metadata?.labels?.[INFRAENV_AGENTINSTALL_LABEL_KEY] === infraEnv?.metadata?.name
      ),
    [bareMetalHosts, infraEnv?.metadata?.namespace, infraEnv?.metadata?.name]
  )

  const infraEnvDetailsContext = useMemo(
    () => ({
      agentClusterInstalls,
      infraEnv,
      infraAgents,
      bareMetalHosts: infraBMHs,
      infraNMStates,
    }),
    [agentClusterInstalls, infraAgents, infraBMHs, infraEnv, infraNMStates]
  )

  const usedHostnames = useMemo(() => getAgentsHostsNames(infraAgents, infraBMHs), [infraAgents, infraBMHs])
  const provisioningConfigResult = useProvisioningConfiguration()
  if (!infraEnv) {
    return (
      <>
        <ErrorPage
          error={new ResourceError(ResourceErrorCode.NotFound)}
          actions={
            <AcmButton role="link" onClick={() => navigate(NavigationPath.infraEnvironments)}>
              {t('button.backToInfraEnvs')}
            </AcmButton>
          }
        />
      </>
    )
  }

  const overviewPath = generatePath(NavigationPath.infraEnvironmentOverview, { name, namespace })
  const hostsPath = generatePath(NavigationPath.infraEnvironmentHosts, { name, namespace })

  return (
    <>
      <AcmPage
        hasDrawer
        header={
          <AcmPageHeader
            breadcrumb={[
              { text: t('Host inventory'), to: NavigationPath.infraEnvironments },
              { text: infraEnv?.metadata?.name || '', to: '' },
            ]}
            title={infraEnv.metadata?.name || ''}
            navigation={
              <AcmSecondaryNav
                navItems={[
                  {
                    key: 'infrastructure-envs-details',
                    title: t('tab.details'),
                    isActive: location.pathname === overviewPath,
                    to: overviewPath,
                  },
                  {
                    key: 'infrastructure-envs-hosts',
                    title: (
                      <>
                        <span style={{ marginRight: '.25rem' }}>{t('tab.hosts')}</span>
                        <InfraEnvHostsTabAgentsWarning infraAgents={infraAgents} infraBMHs={infraBMHs} />
                      </>
                    ),
                    isActive: location.pathname === hostsPath,
                    to: hostsPath,
                  },
                ]}
              />
            }
            actions={
              <AddHostDropdown
                infraEnv={infraEnv}
                docVersion={DOC_VERSION}
                onCreateBMH={getOnCreateBMH(infraEnv)}
                onCreateBmcByYaml={importYaml}
                onSaveISOParams={getOnSaveISOParams(infraEnv)}
                usedHostnames={usedHostnames}
                provisioningConfigResult={provisioningConfigResult}
              />
            }
          />
        }
      >
        <Suspense fallback={<Fragment />}>
          <Outlet context={infraEnvDetailsContext} />
        </Suspense>
      </AcmPage>
    </>
  )
}

export function useInfraEnvironmentDetailsContext() {
  return useOutletContext<InfraEnvironmentDetailsContext>()
}

export default InfraEnvironmentDetailsPage
