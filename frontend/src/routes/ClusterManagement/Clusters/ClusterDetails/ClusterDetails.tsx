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
import { useTranslation } from 'react-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { NodePoolsPageContent } from './ClusterNodes/ClusterNodes'
import { ClustersSettingsPageContent } from './ClusterSettings/ClusterSettings'

export default function ClusterDetailsPage({ match }: RouteComponentProps<{ id: string }>) {
    const location = useLocation()
    const { t } = useTranslation(['cluster'])
    return (
        <Page>
            <AcmPageHeader title={match.params.id} breadcrumb={[{ text: t('clusters'), to: NavigationPath.clusters }, { text: t('cluster.details'), to: '' }]} />
            <AcmSecondaryNav>
                <AcmSecondaryNavItem
                    isActive={location.pathname === NavigationPath.clusterOverview.replace(':id', match.params.id)}
                >
                    <Link to={NavigationPath.clusterOverview.replace(':id', match.params.id)}>Overview</Link>
                </AcmSecondaryNavItem>
                <AcmSecondaryNavItem
                    isActive={location.pathname === NavigationPath.clusterNodes.replace(':id', match.params.id)}
                >
                    <Link to={NavigationPath.clusterNodes.replace(':id', match.params.id)}>Nodes</Link>
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
                    <Route exact path={NavigationPath.clusterNodes}>
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
