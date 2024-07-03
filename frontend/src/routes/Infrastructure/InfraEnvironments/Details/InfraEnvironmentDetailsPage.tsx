/* Copyright Contributors to the Open Cluster Management project */
import { Page } from '@patternfly/react-core'
import { AcmButton, AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '../../../../ui-components'
import { isMatch } from 'lodash'
import {
  InfraEnvHostsTabAgentsWarning,
  INFRAENV_AGENTINSTALL_LABEL_KEY,
  getAgentsHostsNames,
  AddHostDropdown,
} from '@openshift-assisted/ui-lib/cim'
import { Fragment, Suspense, useMemo } from 'react'
import { Link, Routes, Route, useLocation, useNavigate, Navigate, useParams } from 'react-router-dom-v5-compat'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { ErrorPage } from '../../../../components/ErrorPage'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { ResourceError, ResourceErrorCode } from '../../../../resources'
import {
  getOnCreateBMH,
  getOnSaveISOParams,
  importYaml,
  useInfraEnv,
  useProvisioningConfiguration,
} from '../../Clusters/ManagedClusters/CreateCluster/components/assisted-installer/utils'
import { getInfraEnvNMStates } from '../utils'
import DetailsTab from './DetailsTab'
import HostsTab from './HostsTab'
import { DOC_VERSION } from '../../../../lib/doc-util'

const InfraEnvironmentDetailsPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { name = '', namespace = '' } = useParams()
  const match = { params: { name, namespace } }

  const { agentClusterInstallsState, agentsState, bareMetalHostsState, nmStateConfigsState } = useSharedAtoms()
  const agentClusterInstalls = useRecoilValue(agentClusterInstallsState)
  const agents = useRecoilValue(agentsState)
  const bareMetalHosts = useRecoilValue(bareMetalHostsState)
  const nmStateConfigs = useRecoilValue(nmStateConfigsState)
  const infraEnv = useInfraEnv({ name: match.params.name, namespace: match.params.namespace })

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

  const usedHostnames = useMemo(() => getAgentsHostsNames(infraAgents, infraBMHs), [infraAgents, infraBMHs])
  const provisioningConfigResult = useProvisioningConfiguration()
  if (!infraEnv) {
    return (
      <Page>
        <ErrorPage
          error={new ResourceError(ResourceErrorCode.NotFound)}
          actions={
            <AcmButton role="link" onClick={() => navigate(NavigationPath.infraEnvironments)}>
              {t('button.backToInfraEnvs')}
            </AcmButton>
          }
        />
      </Page>
    )
  }

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
              <AcmSecondaryNav>
                <AcmSecondaryNavItem
                  isActive={
                    location.pathname ===
                    NavigationPath.infraEnvironmentOverview
                      .replace(':namespace', match.params.namespace)
                      .replace(':name', match.params.name)
                  }
                >
                  <Link
                    to={NavigationPath.infraEnvironmentOverview
                      .replace(':namespace', match.params.namespace)
                      .replace(':name', match.params.name)}
                  >
                    {t('tab.details')}
                  </Link>
                </AcmSecondaryNavItem>
                <AcmSecondaryNavItem
                  isActive={
                    location.pathname ===
                    NavigationPath.infraEnvironmentHosts
                      .replace(':namespace', match.params.namespace)
                      .replace(':name', match.params.name)
                  }
                >
                  <Link
                    to={NavigationPath.infraEnvironmentHosts
                      .replace(':namespace', match.params.namespace)
                      .replace(':name', match.params.name)}
                  >
                    {t('tab.hosts')}
                    <InfraEnvHostsTabAgentsWarning infraAgents={infraAgents} infraBMHs={infraBMHs} />
                  </Link>
                </AcmSecondaryNavItem>
              </AcmSecondaryNav>
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
          <Routes>
            <Route
              path="/overview"
              element={<DetailsTab infraEnv={infraEnv} infraAgents={infraAgents} bareMetalHosts={infraBMHs} />}
            />
            <Route
              path="/hosts"
              element={
                <HostsTab
                  agentClusterInstalls={agentClusterInstalls}
                  infraEnv={infraEnv}
                  infraAgents={infraAgents}
                  bareMetalHosts={infraBMHs}
                  infraNMStates={infraNMStates}
                />
              }
            />
            <Route
              path="*"
              element={
                <Navigate
                  to={NavigationPath.infraEnvironmentOverview
                    .replace(':namespace', match.params.namespace)
                    .replace(':name', match.params.name)}
                  replace
                />
              }
            />
          </Routes>
        </Suspense>
      </AcmPage>
    </>
  )
}

export default InfraEnvironmentDetailsPage
