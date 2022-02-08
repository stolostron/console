/* Copyright Contributors to the Open Cluster Management project */
import { Redirect, Route, Switch } from 'react-router-dom'
import { NavigationPath } from '../../NavigationPath'
import GovernancePage from './GovernancePage'
import { PolicyWizardPage } from './policies/PolicyWizardPage'
import { CreatePolicySet } from './policy-sets/CreatePolicySet'
import { EditPolicySet } from './policy-sets/EditPolicySet'

export default function Governance() {
    return (
        <Switch>
            <Route exact path={NavigationPath.createPolicy} render={() => <PolicyWizardPage />} />
            <Route exact path={NavigationPath.createPolicySet} render={() => <CreatePolicySet />} />
            <Route exact path={NavigationPath.editPolicySet} render={() => <EditPolicySet />} />
            <Route path={NavigationPath.governance} component={GovernancePage} />
            <Route path="*">
                <Redirect to={NavigationPath.governance} />
            </Route>
        </Switch>
    )
}
