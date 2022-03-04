/* Copyright Contributors to the Open Cluster Management project */
import {
    AcmButton,
    AcmPage,
    AcmPageHeader,
    AcmRoute,
    AcmSecondaryNav,
    AcmSecondaryNavItem,
} from '@stolostron/ui-components'
import { Page } from '@patternfly/react-core'
import { Fragment, Suspense, useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'
import { Link, Redirect, Route, RouteComponentProps, Switch, useHistory, useLocation } from 'react-router-dom'
import { useRecoilState, useRecoilValue, waitForAll } from 'recoil'
import { CIM } from 'openshift-assisted-ui-lib'
import { isMatch } from 'lodash'

import { acmRouteState, configMapsState } from '../../../../atoms'
import { ErrorPage } from '../../../../components/ErrorPage'
import { NavigationPath } from '../../../../NavigationPath'
import { ResourceError } from '../../../../resources'
import { agentsState, bareMetalHostsState } from '../../../../atoms'
import {
    getOnCreateBMH,
    getOnSaveISOParams,
    useInfraEnv,
} from '../../Clusters/ManagedClusters/CreateCluster/components/assisted-installer/utils'
import DetailsTab from './DetailsTab'
import HostsTab from './HostsTab'
import { getAIConfigMap } from '../../Clusters/ManagedClusters/CreateCluster/components/assisted-installer/utils'

const { AddHostModal, InfraEnvHostsTabAgentsWarning, INFRAENV_AGENTINSTALL_LABEL_KEY, getAgentsHostsNames } = CIM

type InfraEnvironmentDetailsPageProps = RouteComponentProps<{ namespace: string; name: string }>

const InfraEnvironmentDetailsPage: React.FC<InfraEnvironmentDetailsPageProps> = ({ match }) => {
    const { t } = useTranslation()
    const history = useHistory()
    const location = useLocation()
    const [, setRoute] = useRecoilState(acmRouteState)
    useEffect(() => setRoute(AcmRoute.InfraEnvironments), [setRoute])
    const [isoModalOpen, setISOModalOpen] = useState(false)

    const [agents, bareMetalHosts, configMaps] = useRecoilValue(
        waitForAll([agentsState, bareMetalHostsState, configMapsState])
    )

    const infraEnv = useInfraEnv({ name: match.params.name, namespace: match.params.namespace })

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

    const usedHostnames = useMemo(() => getAgentsHostsNames(infraAgents, infraBMHs), [infraAgents])
    const aiConfigMap = useMemo(() => getAIConfigMap(configMaps), [configMaps])

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
                                infraEnv={infraEnv}
                                infraAgents={infraAgents}
                                bareMetalHosts={infraBMHs}
                                aiConfigMap={aiConfigMap}
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
            />
        </>
    )
}

export default InfraEnvironmentDetailsPage
