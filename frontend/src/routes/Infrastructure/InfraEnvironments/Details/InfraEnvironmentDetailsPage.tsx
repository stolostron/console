/* Copyright Contributors to the Open Cluster Management project */
import { Dropdown, DropdownGroup, DropdownItem, DropdownSeparator, DropdownToggle, Page } from '@patternfly/react-core'
import { AcmButton, AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '../../../../ui-components'
import { isMatch } from 'lodash'
import { CIM } from 'openshift-assisted-ui-lib'
import { Fragment, Suspense, useMemo, useState } from 'react'
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

const {
  AddHostModal,
  AddBmcHostModal,
  AddBmcHostYamlModal,
  InfraEnvHostsTabAgentsWarning,
  INFRAENV_AGENTINSTALL_LABEL_KEY,
  getAgentsHostsNames,
} = CIM

type InfraEnvironmentDetailsPageProps = RouteComponentProps<{ namespace: string; name: string }>

const InfraEnvironmentDetailsPage: React.FC<InfraEnvironmentDetailsPageProps> = ({ match }) => {
  const { t } = useTranslation()
  const history = useHistory()
  const location = useLocation()
  const [isoModalOpen, setISOModalOpen] = useState(false)
  const [isBmcModalOpen, setBMCModalOpen] = useState(false)
  const [isBmcYamlModalOpen, setBMCYamlModalOpen] = useState(false)

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
  const [isKebabOpen, setIsKebabOpen] = useState<boolean>(false)

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
              <Dropdown
                id={`${infraEnv.metadata?.name}-actions`}
                toggle={
                  <DropdownToggle id="dropdown-basic" onToggle={setIsKebabOpen} isPrimary>
                    {t('Add hosts')}
                  </DropdownToggle>
                }
                isOpen={isKebabOpen}
                dropdownItems={[
                  <DropdownItem
                    key="discovery-iso"
                    onClick={() => {
                      setIsKebabOpen(false)
                      setISOModalOpen(true)
                    }}
                    description={t('Discover hosts by booting a discovery image')}
                  >
                    {t('With Discovery ISO')}
                  </DropdownItem>,
                  <DropdownSeparator key="separator" />,
                  <DropdownGroup
                    id="discovery-bmc"
                    key="discovery-bmc"
                    label={t('Baseboard Management Controller (BMC)')}
                  >
                    <DropdownItem
                      key="width-credentials"
                      onClick={() => {
                        setIsKebabOpen(false)
                        setBMCModalOpen(true)
                      }}
                      description={t('Discover a single host via Baseboard Management Controller')}
                    >
                      {t('With BMC form')}
                    </DropdownItem>
                    <DropdownItem
                      key="upload-yaml"
                      onClick={() => {
                        setIsKebabOpen(false)
                        setBMCYamlModalOpen(true)
                      }}
                      description={t('Discover multiple hosts by providing yaml with Bare Metal Host definitions')}
                    >
                      {t('By uploading a YAML')}
                    </DropdownItem>
                  </DropdownGroup>,
                ]}
                position={'right'}
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
      <AddHostModal
        infraEnv={infraEnv}
        isOpen={isoModalOpen}
        onClose={() => setISOModalOpen(false)}
        onCreateBMH={getOnCreateBMH(infraEnv)}
        onSaveISOParams={getOnSaveISOParams(infraEnv)}
        usedHostnames={usedHostnames}
        isBMPlatform={isBMPlatform(infrastructures[0])}
      />
      {isBmcModalOpen && (
        <AddBmcHostModal
          infraEnv={infraEnv}
          isOpen={isBmcModalOpen}
          onClose={() => setBMCModalOpen(false)}
          onCreateBMH={getOnCreateBMH(infraEnv)}
          onSaveISOParams={getOnSaveISOParams(infraEnv)}
          usedHostnames={usedHostnames}
          isBMPlatform={isBMPlatform(infrastructures[0])}
        />
      )}
      {isBmcYamlModalOpen && (
        <AddBmcHostYamlModal
          isOpen={isBmcYamlModalOpen}
          onClose={() => setBMCYamlModalOpen(false)}
          onCreateBmcByYaml={importYaml}
        />
      )}
    </>
  )
}

export default InfraEnvironmentDetailsPage
