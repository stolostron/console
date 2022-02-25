/* Copyright Contributors to the Open Cluster Management project */
import { Redirect, Route, Switch } from 'react-router-dom'
import { NavigationPath } from '../../NavigationPath'
import ApplicationsPage from './ApplicationsPage'
import { CreateApplicationArgo } from './CreateApplication/CreateApplicationArgo'
import CreateSubscriptionApplicationPage from './CreateApplication/Subscription/SubscriptionApplication'
import ApplicationsDetailsPage from './ApplicationDetails/ApplicationDetails'

export default function Applications() {
    return (
        <Switch>
            <Route path={NavigationPath.createApplicationArgo} component={CreateApplicationArgo} />
            <Route
                exact
                path={NavigationPath.createApplicationSubscription}
                component={CreateSubscriptionApplicationPage}
            />
            <Route path={NavigationPath.applicationDetails} component={ApplicationsDetailsPage} />
            <Route path={NavigationPath.applications} component={ApplicationsPage} />
            <Route path="*">
                <Redirect to={NavigationPath.applications} />
            </Route>
        </Switch>
    )
}
