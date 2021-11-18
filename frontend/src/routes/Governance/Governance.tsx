/* Copyright Contributors to the Open Cluster Management project */
import { Redirect, Route, Switch } from 'react-router-dom'
import { NavigationPath } from '../../NavigationPath'
import GovernancePage from './GovernancePage'
import PoliciesPage from './policies/Policies'
import PolicySetsPage from './policy-sets/PolicySets'

export default function Governance() {
    return (
        <Switch>
            <Route exact path={NavigationPath.policies} component={PoliciesPage} />
            <Route exact path={NavigationPath.policySets} component={PolicySetsPage} />
            <Route exact path={NavigationPath.governance} component={GovernancePage} />
            <Route path="*">
                <Redirect to={NavigationPath.governance} />
            </Route>
        </Switch>
    )
}
