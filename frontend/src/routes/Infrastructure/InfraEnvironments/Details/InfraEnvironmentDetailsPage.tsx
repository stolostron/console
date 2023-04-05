/* Copyright Contributors to the Open Cluster Management project */
import { Page } from '@patternfly/react-core'
import { AcmButton, AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '../../../../ui-components'
import { isMatch } from 'lodash'
import {
  InfraEnvHostsTabAgentsWarning,
  INFRAENV_AGENTINSTALL_LABEL_KEY,
  getAgentsHostsNames,
  AddHostDropdown,
} from 'openshift-assisted-ui-lib/cim'
import { Fragment, Suspense, useMemo } from 'react'
import { Link, Redirect, Route, RouteComponentProps, Switch, useHistory, useLocation } from 'react-router-dom'
import { useRecoilValue, useSharedAtoms, useSharedRecoil } from '../../../../shared-recoil'
import { ErrorPage } from '../../../../components/ErrorPage'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { ResourceError, ResourceErrorCode } from '../../../../resources'
import {
  getOnCreateBMH,
  getOnSaveISOParams,
  importYaml,
  useInfraEnv,
} from '../../Clusters/ManagedClusters/CreateCluster/components/assisted-installer/utils'
import { getInfraEnvNMStates, isBMPlatform } from '../utils'
import DetailsTab from './DetailsTab'
import HostsTab from './HostsTab'
import { DOC_VERSION } from '../../../../lib/doc-util'

type InfraEnvironmentDetailsPageProps = RouteComponentProps<{ namespace: string; name: string }>

const InfraEnvironmentDetailsPage: React.FC<InfraEnvironmentDetailsPageProps> = ({ match }) => {
  const { t } = useTranslation()
  const history = useHistory()
  const location = useLocation()

  const { agentClusterInstallsState, agentsState, bareMetalHostsState, infrastructuresState, nmStateConfigsState } =
    useSharedAtoms()
  const { waitForAll } = useSharedRecoil()
  const [agentClusterInstalls, agents, bareMetalHosts, infrastructures, nmStateConfigs] = useRecoilValue(
    waitForAll([agentClusterInstallsState, agentsState, bareMetalHostsState, infrastructuresState, nmStateConfigsState])
  )
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

  if (!infraEnv) {
    return (
      <Page>
        <ErrorPage
          error={new ResourceError(ResourceErrorCode.NotFound)}
          actions={
            <AcmButton role="link" onClick={() => history.push(NavigationPath.infraEnvironments)}>
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
                isBMPlatform={isBMPlatform(infrastructures[0])}
                onSaveISOParams={getOnSaveISOParams(infraEnv)}
                usedHostnames={usedHostnames}
              />
            }
          />
        }
      >
        <Suspense fallback={<Fragment />}>
          <Switch>
            <Route exact path={NavigationPath.infraEnvironmentOverview}>
              <DetailsTab infraEnv={infraEnv} infraAgents={infraAgents} bareMetalHosts={infraBMHs} />
            </Route>
            <Route exact path={NavigationPath.infraEnvironmentHosts}>
              <HostsTab
                agentClusterInstalls={agentClusterInstalls}
                infraEnv={infraEnv}
                infraAgents={infraAgents}
                bareMetalHosts={infraBMHs}
                infraNMStates={infraNMStates}
                infrastructure={infrastructures[0]}
              />
            </Route>
            <Route exact path={NavigationPath.infraEnvironmentDetails}>
              <Redirect
                to={NavigationPath.infraEnvironmentOverview
                  .replace(':namespace', match.params.namespace)
                  .replace(':name', match.params.name)}
              />
            </Route>
          </Switch>
        </Suspense>
      </AcmPage>
    </>
  )
}

export default InfraEnvironmentDetailsPage
