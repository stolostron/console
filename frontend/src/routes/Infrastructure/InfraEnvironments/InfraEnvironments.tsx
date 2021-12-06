/* Copyright Contributors to the Open Cluster Management project */
import { Redirect, Route, Switch } from 'react-router-dom'
import { NavigationPath } from '../../../NavigationPath'
import CreateInfraEnv from './CreateInfraEnv'
import InfraEnvironmentDetailsPage from './Details/InfraEnvironmentDetailsPage'
import InfraEnvironmentsPage from './InfraEnvironmentsPage'

export default function InfraEnvironments() {
    return (
        <Switch>
            <Route path={NavigationPath.infraEnvironmentDetails} component={InfraEnvironmentDetailsPage} />
            <Route exact path={NavigationPath.createInfraEnv} component={CreateInfraEnv} />
            <Route exact path={NavigationPath.infraEnvironments} component={InfraEnvironmentsPage} />
            <Route path="*">
                <Redirect to={NavigationPath.infraEnvironments} />
            </Route>
        </Switch>
    )
}
