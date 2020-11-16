import {
    AcmEmptyState,
    AcmPageCard,
    AcmPageHeader,
    AcmSecondaryNav,
    AcmSecondaryNavItem,
} from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import React, { Fragment, Suspense } from 'react'
import { Link, Redirect, Route, RouteComponentProps, Switch, useLocation } from 'react-router-dom'
import { NavigationPath } from '../../../../NavigationPath'
import { NodePoolsPageContent } from './ClusterNodes/ClusterNodes'
import { ClustersSettingsPageContent } from './ClusterSettings/ClusterSettings'

export default function ClusterDetailsPage({ match }: RouteComponentProps<{ id: string }>) {
    const location = useLocation()
    return (
        <Page>
            <AcmPageHeader title="Cluster Details" />
            <AcmSecondaryNav>
                <AcmSecondaryNavItem
                    isActive={location.pathname === NavigationPath.clusterOverview.replace(':id', match.params.id)}
                >
                    <Link to={NavigationPath.clusterOverview.replace(':id', match.params.id)}>Overview</Link>
                </AcmSecondaryNavItem>
                <AcmSecondaryNavItem
                    isActive={location.pathname === NavigationPath.clusterNodePools.replace(':id', match.params.id)}
                >
                    <Link to={NavigationPath.clusterNodePools.replace(':id', match.params.id)}>Nodes</Link>
                </AcmSecondaryNavItem>
                <AcmSecondaryNavItem
                    isActive={location.pathname === NavigationPath.clusterSettings.replace(':id', match.params.id)}
                >
                    <Link to={NavigationPath.clusterSettings.replace(':id', match.params.id)}>Settings</Link>
                </AcmSecondaryNavItem>
            </AcmSecondaryNav>
            <Suspense fallback={<Fragment />}>
                <Switch>
                    <Route exact path={NavigationPath.clusterOverview}>
                        <AcmPageCard>
                            <AcmEmptyState title="No cluster found." message="Your cluster does not exist." />
                        </AcmPageCard>
                    </Route>
                    <Route exact path={NavigationPath.clusterNodePools}>
                        <NodePoolsPageContent name={match.params.id} namespace={match.params.id} />
                    </Route>
                    <Route exact path={NavigationPath.clusterSettings}>
                        <ClustersSettingsPageContent name={match.params.id} namespace={match.params.id} />
                    </Route>
                    <Route exact path={NavigationPath.clusterDetails}>
                        <Redirect to={NavigationPath.clusterOverview.replace(':id', match.params.id)} />
                    </Route>
                </Switch>
            </Suspense>
        </Page>
    )
}
