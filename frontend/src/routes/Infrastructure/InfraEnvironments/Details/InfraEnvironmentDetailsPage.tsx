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
import { Fragment, Suspense, useEffect, useState } from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'
import { Link, Redirect, Route, RouteComponentProps, Switch, useHistory, useLocation } from 'react-router-dom'
import { useRecoilState, useRecoilValue, waitForAll } from 'recoil'
import { CIM } from 'openshift-assisted-ui-lib'
import { isMatch } from 'lodash'

import { acmRouteState, infraEnvironmentsState, infrastructuresState } from '../../../../atoms'
import { ErrorPage } from '../../../../components/ErrorPage'
import { NavigationPath } from '../../../../NavigationPath'
import { ResourceError } from '../../../../resources'
import { agentsState, bareMetalHostsState } from '../../../../atoms'
import { isBMPlatform } from '../utils'
import {
    getOnCreateBMH,
    getOnSaveISOParams,
} from '../../Clusters/ManagedClusters/CreateCluster/components/assisted-installer/utils'
import DetailsTab from './DetailsTab'
import HostsTab from './HostsTab'

const { AddHostModal, InfraEnvHostsTabAgentsWarning, INFRAENV_AGENTINSTALL_LABEL_KEY } = CIM

type InfraEnvironmentDetailsPageProps = RouteComponentProps<{ namespace: string; name: string }>

const InfraEnvironmentDetailsPage: React.FC<InfraEnvironmentDetailsPageProps> = ({ match }) => {
    const { t } = useTranslation()
    const history = useHistory()
    const location = useLocation()
    const [, setRoute] = useRecoilState(acmRouteState)
    useEffect(() => setRoute(AcmRoute.InfraEnvironments), [setRoute])
    const [isoModalOpen, setISOModalOpen] = useState(false)

    const [infraEnvironments] = useRecoilValue(waitForAll([infraEnvironmentsState]))

    const infraEnv = infraEnvironments.find(
        (i) => i.metadata.name === match.params.name && i.metadata.namespace === match.params.namespace
    )

    const [infrastructures] = useRecoilState(infrastructuresState)
    const [agents, bareMetalHosts] = useRecoilValue(waitForAll([agentsState, bareMetalHostsState]))
    const infraAgents = agents.filter(
        (a) =>
            a.metadata.namespace === infraEnv?.metadata?.namespace &&
            isMatch(a.metadata.labels, infraEnv.status?.agentLabelSelector?.matchLabels)
    )

    const infraBMHs = bareMetalHosts.filter(
        (bmh) =>
            bmh.metadata.namespace === infraEnv?.metadata?.namespace &&
            bmh.metadata.labels?.[INFRAENV_AGENTINSTALL_LABEL_KEY] === infraEnv?.metadata?.name
    )

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
                            <HostsTab infraEnv={infraEnv} infraAgents={infraAgents} bareMetalHosts={infraBMHs} />
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
                isBMPlatform={isBMPlatform(infrastructures[0])}
                onClose={() => setISOModalOpen(false)}
                onCreateBMH={getOnCreateBMH(infraEnv)}
                onSaveISOParams={getOnSaveISOParams(infraEnv)}
            />
        </>
    )
}

export default InfraEnvironmentDetailsPage
