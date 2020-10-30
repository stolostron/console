import {
    AcmEmptyState,
    AcmPageHeader,
    AcmPageCard
} from '@open-cluster-management/ui-components'
import {
    AcmSecondaryNav,
    AcmSecondaryNavItem,
} from '@open-cluster-management/ui-components/lib/AcmSecondaryNav/AcmSecondaryNav'

import { Page } from '@patternfly/react-core'
import React from 'react'
import { RouteComponentProps, Link, useLocation, Route, Switch, useRouteMatch } from 'react-router-dom'
import {NodePoolsPageContent} from './ClusterDetailsPages/NodesPools'
import {ClustersSettingsPageContent} from './ClusterDetailsPages/ClusterSettings'

type ClusterDetailsParams =  { id: string };
export function ClusterDetailsPage({match}: RouteComponentProps<ClusterDetailsParams>) {
    return (
        <Page>
            <AcmPageHeader title="Cluster Details" />
            <ClusterDetailsNavigation namespace={match.params.id} name={match.params.id}/>
            <ClustersDeatilsPageContent namespace={match.params.id} name={match.params.id}/>
        </Page>
    )
}

export function ClusterDetailsNavigation(props: {
    name: string;
    namespace: string;
}) {
    let l = useLocation()
    return (
        <AcmSecondaryNav>
            <AcmSecondaryNavItem isActive={l.pathname.endsWith(`/clusters/details/${props.name}`)}>
                <Link to={`/cluster-management/clusters/details/${props.name}`}> Overview </Link>
            </AcmSecondaryNavItem>
            <AcmSecondaryNavItem isActive={l.pathname.endsWith(`/clusters/details/${props.name}/nodespools`)}>
                <Link to={`/cluster-management/clusters/details/${props.name}/nodespools`}> Nodes </Link>
            </AcmSecondaryNavItem>
            <AcmSecondaryNavItem isActive={l.pathname.endsWith(`/clusters/details/${props.name}/settings`)}>
                <Link to={`/cluster-management/clusters/details/${props.name}/settings`}> Cluster Settings </Link>
            </AcmSecondaryNavItem>
        </AcmSecondaryNav>
    )
    
}

export function ClustersDeatilsPageContent(props: {
    name: string;
    namespace: string;
}) {
    let match = useRouteMatch();
    return(
        <React.Fragment>
                <Switch>
                    <Route path={`${match.path}`} exact>
                    <AcmPageCard><AcmEmptyState title="No cluster found." message="Your cluster does not exist." /></AcmPageCard>
                    </Route>
                    <Route path={`${match.path}/nodespools`} >
                        <NodePoolsPageContent name={props.name} namespace={props.namespace} />
                    </Route>
                    <Route path={`${match.path}/settings`} >
                        <ClustersSettingsPageContent name={props.name} namespace={props.namespace} />
                    </Route>
                </Switch>
        </React.Fragment>
    )
}
