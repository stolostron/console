/* Copyright Contributors to the Open Cluster Management project */
import { Redirect, Route, Switch } from 'react-router-dom'
import { NavigationPath } from '../../NavigationPath'
import ApplicationsPage from './ApplicationsPage'
import { CreateApplication } from './CreateApplication/CreateApplication'
import ApplicationsDetailsPage from './ApplicationDetails/ApplicationDetails'

export default function Applications() {
    return (
        <Switch>
            <Route exact path={NavigationPath.createApplication} component={CreateApplication} />
            <Route path={NavigationPath.applicationDetails} component={ApplicationsDetailsPage} />
            <Route path={NavigationPath.applications} component={ApplicationsPage} />
            <Route path="*">
                <Redirect to={NavigationPath.applications} />
            </Route>
        </Switch>
    )
}
