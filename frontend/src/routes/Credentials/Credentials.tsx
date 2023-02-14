/* Copyright Contributors to the Open Cluster Management project */
import { Redirect, Route, Switch } from 'react-router-dom'
import { NavigationPath } from '../../NavigationPath'
import { CreateCredentialsPage } from './CreateCredentials'
import { CreateCredentialsAWS } from './CreateCredentialsType/CreateCredentialsAWS'
import { ViewEditCredentialsFormPage } from './CredentialsForm'
import CredentialsPage from './CredentialsPage'

export default function Credentials() {
  return (
    <Switch>
      <Route exact path={NavigationPath.addAWSType} component={CreateCredentialsAWS} />
      <Route exact path={NavigationPath.addCredentials} component={CreateCredentialsPage} />
      <Route exact path={NavigationPath.editCredentials} component={ViewEditCredentialsFormPage} />
      <Route exact path={NavigationPath.viewCredentials} component={ViewEditCredentialsFormPage} />
      <Route exact path={NavigationPath.credentials} component={CredentialsPage} />
      <Route path="*">
        <Redirect to={NavigationPath.credentials} />
      </Route>
    </Switch>
  )
}
