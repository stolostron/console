/* Copyright Contributors to the Open Cluster Management project */
import { Redirect, Route, Switch } from 'react-router-dom'
import { NavigationPath } from '../../NavigationPath'
import GovernancePage from './GovernancePage'
import { CreatePolicy } from './policies/CreatePolicy'
import { CreatePolicyAutomation } from './policies/CreatePolicyAutomation'
import { EditPolicy } from './policies/EditPolicy'
import { EditPolicyAutomation } from './policies/EditPolicyAutomation'
import { PolicyDetailsHistoryPage } from './policies/policy-details/PolicyDetailsHistoryPage'
import { PolicyDetailsPage } from './policies/policy-details/PolicyDetailsPage'
import { PolicyTemplateDetailsPage } from './policies/policy-details/PolicyTemplateDetailsPage'
import { CreatePolicySet } from './policy-sets/CreatePolicySet'
import { EditPolicySet } from './policy-sets/EditPolicySet'

export default function Governance() {
    return (
        <Switch>
            <Route exact path={NavigationPath.createPolicy} render={() => <CreatePolicy />} />
            <Route exact path={NavigationPath.editPolicy} render={() => <EditPolicy />} />
            <Route exact path={NavigationPath.createPolicyAutomation} render={() => <CreatePolicyAutomation />} />
            <Route exact path={NavigationPath.editPolicyAutomation} render={() => <EditPolicyAutomation />} />
            <Route path={NavigationPath.policyTemplateDetails} component={PolicyTemplateDetailsPage} />
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
