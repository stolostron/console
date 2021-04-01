/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmButton,
    AcmPage,
    AcmPageHeader,
    AcmRoute,
    AcmSecondaryNav,
    AcmSecondaryNavItem,
    AcmPageProcess,
} from '@open-cluster-management/ui-components'
import { createContext, Fragment, Suspense, useEffect } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { Link, Redirect, Route, RouteComponentProps, Switch, useHistory, useLocation } from 'react-router-dom'
import { useRecoilState, useRecoilValue, waitForAll } from 'recoil'
import { acmRouteState, managedClusterSetsState } from '../../../../atoms'
import { ErrorPage } from '../../../../components/ErrorPage'
import { Cluster } from '../../../../lib/get-cluster'
import { ResourceError } from '../../../../lib/resource-request'
import { NavigationPath } from '../../../../NavigationPath'
import { ClusterSetOverviewPageContent } from './ClusterSetOverview/ClusterSetOverview'
import { ClusterSetManageClustersPage } from './ClusterSetManageClusters/ClusterSetManageClusters'
import { usePrevious } from '../../../../components/usePrevious'
import { ManagedClusterSet } from '../../../../resources/managed-cluster-set'
import { useClusters } from '../components/useClusters'
import { ClusterSetActionDropdown } from '../components/ClusterSetActionDropdown'

export const ClusterSetContext = createContext<{
    readonly clusterSet: ManagedClusterSet | undefined
    readonly clusters: Cluster[] | undefined
}>({
    clusterSet: undefined,
    clusters: undefined,
})

export default function ClusterDetailsPage({ match }: RouteComponentProps<{ id: string }>) {
    const location = useLocation()
    const history = useHistory()
    const { t } = useTranslation(['cluster'])
    const [, setRoute] = useRecoilState(acmRouteState)
    useEffect(() => setRoute(AcmRoute.Clusters), [setRoute])

    const [managedClusterSets] = useRecoilValue(waitForAll([managedClusterSetsState]))

    const clusterSet = managedClusterSets.find((mcs) => mcs.metadata.name === match.params.id)
    const prevClusterSet = usePrevious(clusterSet)

    const clusters = useClusters(clusterSet)

    if (prevClusterSet?.metadata?.deletionTimestamp) {
        return (
            <AcmPageProcess
                isLoading={clusterSet !== undefined}
                loadingTitle={t('deleting.managedClusterSet.inprogress', {
                    managedClusterSetName: prevClusterSet!.metadata.name,
                })}
                loadingMessage={
                    <Trans
                        i18nKey="cluster:deleting.managedClusterSet.inprogress.message"
                        components={{ bold: <strong /> }}
                        values={{ managedClusterSetName: prevClusterSet!.metadata.name }}
                    />
                }
                successTitle={t('deleting.managedClusterSet.success', {
                    managedClusterSetName: prevClusterSet!.metadata.name,
                })}
                successMessage={
                    <Trans
                        i18nKey="cluster:deleting.managedClusterSet.success.message"
                        components={{ bold: <strong /> }}
                        values={{ managedClusterSetName: prevClusterSet!.metadata.name }}
                    />
                }
                loadingPrimaryAction={
                    <AcmButton role="link" onClick={() => history.push(NavigationPath.clusterSets)}>
                        {t('button.backToClusterSets')}
                    </AcmButton>
                }
                primaryAction={
                    <AcmButton role="link" onClick={() => history.push(NavigationPath.clusterSets)}>
                        {t('button.backToClusterSets')}
                    </AcmButton>
                }
            />
        )
    }

    if (clusterSet === undefined) {
        return (
            <AcmPage>
                <ErrorPage
                    error={new ResourceError('Not found', 404)}
                    actions={
                        <AcmButton role="link" onClick={() => history.push(NavigationPath.clusterSets)}>
                            {t('button.backToClusterSets')}
                        </AcmButton>
                    }
                />
            </AcmPage>
        )
    }

    return (
        <ClusterSetContext.Provider
            value={{
                clusterSet,
                clusters,
            }}
        >
            <Suspense fallback={<Fragment />}>
                <Switch>
                    <Route exact path={NavigationPath.clusterSetDetails.replace(':id', match.params.id)}>
                        <Redirect to={NavigationPath.clusterSetOverview.replace(':id', match.params.id)} />
                    </Route>
                    <Route exact path={NavigationPath.clusterSetManage.replace(':id', match.params.id)}>
                        <ClusterSetManageClustersPage />
                    </Route>
                    <AcmPage hasDrawer>
                        <AcmPageHeader
                            breadcrumb={[
                                { text: t('clusterSets'), to: NavigationPath.clusterSets },
                                { text: match.params.id, to: '' },
                            ]}
                            title={match.params.id}
                            actions={<ClusterSetActionDropdown managedClusterSet={clusterSet} isKebab={false} />}
                            navigation={
                                <AcmSecondaryNav>
                                    <AcmSecondaryNavItem
                                        isActive={
                                            location.pathname ===
                                            NavigationPath.clusterSetOverview.replace(':id', match.params.id)
                                        }
                                    >
                                        <Link to={NavigationPath.clusterSetOverview.replace(':id', match.params.id)}>
                                            {t('tab.overview')}
                                        </Link>
                                    </AcmSecondaryNavItem>
                                </AcmSecondaryNav>
                            }
                        />

                        <Route exact path={NavigationPath.clusterSetOverview}>
                            <ClusterSetOverviewPageContent />
                        </Route>
                    </AcmPage>
                </Switch>
            </Suspense>
        </ClusterSetContext.Provider>
    )
}
