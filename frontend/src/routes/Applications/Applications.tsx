/* Copyright Contributors to the Open Cluster Management project */
import { Redirect, Route, Switch } from 'react-router-dom'
import { NavigationPath } from '../../NavigationPath'
import ApplicationsDetailsPage from './ApplicationDetails/ApplicationDetails'
import ApplicationsPage from './ApplicationsPage'
import { CreateApplicationArgo } from './CreateApplication/CreateApplicationArgo'
import { EditArgoApplicationSet } from './CreateApplication/EditArgoApplicationSet'
import CreateSubscriptionApplicationPage from './SubscriptionApplication'

export default function Applications() {
    return (
        <Switch>
            <Route path={NavigationPath.createApplicationArgo} component={CreateApplicationArgo} />
            <Route path={NavigationPath.editApplicationArgo} component={EditArgoApplicationSet} />
            <Route
                exact
                path={NavigationPath.createApplicationSubscription}
                component={CreateSubscriptionApplicationPage}
            />
            <Route path={NavigationPath.editApplicationSubscription} component={CreateSubscriptionApplicationPage} />
            <Route path={NavigationPath.applicationDetails} component={ApplicationsDetailsPage} />
            <Route path={NavigationPath.applications} component={ApplicationsPage} />
            <Route path="*">
                <Redirect to={NavigationPath.applications} />
            </Route>
        </Switch>
    )
}
