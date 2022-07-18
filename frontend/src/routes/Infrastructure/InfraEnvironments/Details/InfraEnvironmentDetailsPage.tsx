/* Copyright Contributors to the Open Cluster Management project */
import { Page } from '@patternfly/react-core'
import { AcmButton, AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '../../../../ui-components'
import { isMatch } from 'lodash'
import { CIM } from 'openshift-assisted-ui-lib'
import { Fragment, Suspense, useMemo, useState } from 'react'
import { Link, Redirect, Route, RouteComponentProps, Switch, useHistory, useLocation } from 'react-router-dom'
import { useRecoilValue, waitForAll } from 'recoil'
import {
    agentClusterInstallsState,
    agentsState,
    bareMetalHostsState,
    configMapsState,
    infrastructuresState,
    nmStateConfigsState,
} from '../../../../atoms'
import { ErrorPage } from '../../../../components/ErrorPage'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { ResourceError } from '../../../../resources'
import {
    getAIConfigMap,
    getOnCreateBMH,
    getOnSaveISOParams,
    useInfraEnv,
} from '../../Clusters/ManagedClusters/CreateCluster/components/assisted-installer/utils'
import { getInfraEnvNMStates, isBMPlatform } from '../utils'
import DetailsTab from './DetailsTab'
import HostsTab from './HostsTab'

const { AddHostModal, InfraEnvHostsTabAgentsWarning, INFRAENV_AGENTINSTALL_LABEL_KEY, getAgentsHostsNames } = CIM

type InfraEnvironmentDetailsPageProps = RouteComponentProps<{ namespace: string; name: string }>

const InfraEnvironmentDetailsPage: React.FC<InfraEnvironmentDetailsPageProps> = ({ match }) => {
    const { t } = useTranslation()
    const history = useHistory()
    const location = useLocation()
    const [isoModalOpen, setISOModalOpen] = useState(false)

    const [agentClusterInstalls, agents, bareMetalHosts, configMaps, infrastructures, nmStateConfigs] = useRecoilValue(
        waitForAll([
            agentClusterInstallsState,
            agentsState,
            bareMetalHostsState,
            configMapsState,
            infrastructuresState,
            nmStateConfigsState,
        ])
    )

    const infraEnv = useInfraEnv({ name: match.params.name, namespace: match.params.namespace })

    const infraNMStates = useMemo(() => getInfraEnvNMStates(infraEnv, nmStateConfigs), [nmStateConfigs, infraEnv])

    const infraAgents = useMemo(
        () =>
            agents.filter(
                (a) =>
                    a.metadata.namespace === infraEnv?.metadata?.namespace &&
                    isMatch(a.metadata.labels, infraEnv.status?.agentLabelSelector?.matchLabels)
            ),
        [agents, infraEnv]
    )

    const infraBMHs = useMemo(
        () =>
            bareMetalHosts.filter(
                (bmh) =>
                    bmh.metadata.namespace === infraEnv?.metadata?.namespace &&
                    bmh.metadata.labels?.[INFRAENV_AGENTINSTALL_LABEL_KEY] === infraEnv?.metadata?.name
            ),
        [bareMetalHosts, infraEnv?.metadata?.namespace, infraEnv?.metadata?.name]
    )

    const usedHostnames = useMemo(() => getAgentsHostsNames(infraAgents, infraBMHs), [infraAgents, infraBMHs])
    const aiConfigMap = getAIConfigMap(configMaps)

    if (!infraEnv) {
        return (
            <Page>
                <ErrorPage
                    error={new ResourceError('Not found', 404)}
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
                            { text: t('infraenvs'), to: NavigationPath.infraEnvironments },
                            { text: infraEnv.metadata.name, to: '' },
                        ]}
                        title={infraEnv.metadata.name}
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
                                        <InfraEnvHostsTabAgentsWarning infraAgents={infraAgents} />
                                    </Link>
                                </AcmSecondaryNavItem>
                            </AcmSecondaryNav>
                        }
                        actions={
                            <AcmButton
                                isDisabled={!infraEnv?.status?.isoDownloadURL}
                                onClick={() => setISOModalOpen(true)}
                            >
                                {t('Add host')}
                            </AcmButton>
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
                                aiConfigMap={aiConfigMap}
                                infraNMStates={infraNMStates}
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
        </>
    )
}

export default InfraEnvironmentDetailsPage
