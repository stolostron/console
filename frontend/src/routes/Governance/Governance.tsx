/* Copyright Contributors to the Open Cluster Management project */
import { Redirect, Route, Switch } from 'react-router-dom'
import { NavigationPath } from '../../NavigationPath'
import GovernancePage from './GovernancePage'
import { PolicyWizardPage } from './policies/PolicyWizardPage'
import { PolicySetWizardPage } from './policy-sets/PolicySetWizardPage'

export default function Governance() {
    return (
        <Switch>
            <Route exact path={NavigationPath.createPolicy} render={() => <PolicyWizardPage />} />
            <Route exact path={NavigationPath.createPolicySet} render={() => <PolicySetWizardPage />} />
            <Route path={NavigationPath.governance} component={GovernancePage} />
            <Route path="*">
                <Redirect to={NavigationPath.governance} />
            </Route>
        </Switch>
    )
}
