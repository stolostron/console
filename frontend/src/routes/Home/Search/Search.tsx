/* Copyright Contributors to the Open Cluster Management project */
import { Redirect, Route, Switch } from 'react-router-dom'
import { NavigationPath } from '../../../NavigationPath'
import DetailsPage from './Details/DetailsPage'
import SearchPage from './SearchPage'

export default function Search() {
  return (
    <Switch>
      <Route exact path={NavigationPath.resources} component={DetailsPage} />
      <Route path={NavigationPath.resourceYAML} component={DetailsPage} />
      <Route path={NavigationPath.resourceRelated} component={DetailsPage} />
      <Route path={NavigationPath.resourceLogs} component={DetailsPage} />
      <Route exact path={NavigationPath.search} component={SearchPage} />
      <Route path="*">
        <Redirect to={NavigationPath.search} />
      </Route>
    </Switch>
  )
}
