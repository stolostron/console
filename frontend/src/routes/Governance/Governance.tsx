/* Copyright Contributors to the Open Cluster Management project */
import { Redirect, Route, Switch } from 'react-router-dom'
import { NavigationPath } from '../../NavigationPath'
import GovernancePage from './GovernancePage'
import PolicyDetailsHistoryPage from './policies/policy-details/PolicyDetailsHistoryPage'
import PolicyDetailsPage from './policies/policy-details/PolicyDetailsPage'
import { PolicyWizardPage } from './policies/PolicyWizardPage'
import { CreatePolicySet } from './policy-sets/CreatePolicySet'
import { EditPolicySet } from './policy-sets/EditPolicySet'

export default function Governance() {
    return (
        <Switch>
            <Route exact path={NavigationPath.createPolicy} render={() => <PolicyWizardPage />} />
            <Route exact path={NavigationPath.createPolicySet} render={() => <CreatePolicySet />} />
            <Route exact path={NavigationPath.editPolicySet} render={() => <EditPolicySet />} />
            {/* Specify the three exact routes for GovernancePage so we can implement the policy details page under a different AcmPageNav */}
            <Route exact path={NavigationPath.governance} component={GovernancePage} />
            <Route exact path={NavigationPath.policies} component={GovernancePage} />
            <Route exact path={NavigationPath.policySets} component={GovernancePage} />
            <Route exact path={NavigationPath.governanceClusters} component={GovernancePage} />
            {/* Policy detail pages must stay in this order to render properly. */}
            <Route path={NavigationPath.policyDetailsHistory} component={PolicyDetailsHistoryPage} />
            <Route path={NavigationPath.policyDetails} component={PolicyDetailsPage} />
            <Route path="*">
                <Redirect to={NavigationPath.governance} />
            </Route>
        </Switch>
    )
}
