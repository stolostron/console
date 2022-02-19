/* Copyright Contributors to the Open Cluster Management project */
import { Redirect, Route, Switch } from 'react-router-dom'
import { NavigationPath } from '../../NavigationPath'
import GovernancePage from './GovernancePage'
import { CreatePolicy } from './policies/CreatePolicy'
import { EditPolicy } from './policies/EditPolicy'
import { PolicyDetailsHistoryPage } from './policies/policy-details/PolicyDetailsHistoryPage'
import { PolicyDetailsPage } from './policies/policy-details/PolicyDetailsPage'
import { CreatePolicySet } from './policy-sets/CreatePolicySet'
import { EditPolicySet } from './policy-sets/EditPolicySet'

export default function Governance() {
    return (
        <Switch>
            <Route exact path={NavigationPath.createPolicy} render={() => <CreatePolicy />} />
            <Route exact path={NavigationPath.editPolicy} render={() => <EditPolicy />} />
            <Route path={NavigationPath.policyDetailsHistory} component={PolicyDetailsHistoryPage} />
            <Route path={NavigationPath.policyDetails} component={PolicyDetailsPage} />
            <Route exact path={NavigationPath.createPolicySet} render={() => <CreatePolicySet />} />
            <Route exact path={NavigationPath.editPolicySet} render={() => <EditPolicySet />} />
            <Route path={NavigationPath.governance} component={GovernancePage} />
            <Route path="*">
                <Redirect to={NavigationPath.governance} />
            </Route>
        </Switch>
    )
}
