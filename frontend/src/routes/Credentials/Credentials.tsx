/* Copyright Contributors to the Open Cluster Management project */
import { Redirect, Route, Switch } from 'react-router-dom'
import { NavigationPath } from '../../NavigationPath'
import CredentialsFormPage from './CredentialsForm'
import { CreateInfrastructureCredentials } from './CredentialsInfrastructure'
import CredentialsPage from './CredentialsPage'

export default function Credentials() {
    return (
        <Switch>
            <Route
                exact
                path={NavigationPath.addCredentialsInfrastructure}
                component={CreateInfrastructureCredentials}
            />
            <Route exact path={NavigationPath.addCredentials} component={CredentialsFormPage} />
            <Route exact path={NavigationPath.editCredentials} component={CredentialsFormPage} />
            <Route exact path={NavigationPath.viewCredentials} component={CredentialsFormPage} />
            <Route exact path={NavigationPath.credentials} component={CredentialsPage} />
            <Route path="*">
                <Redirect to={NavigationPath.credentials} />
            </Route>
        </Switch>
    )
}
