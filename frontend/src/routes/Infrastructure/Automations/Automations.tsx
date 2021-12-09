/* Copyright Contributors to the Open Cluster Management project */
import { Redirect, Route, Switch } from 'react-router-dom'
import { NavigationPath } from '../../../NavigationPath'
import AnsibleAutomationsPage from './AnsibleAutomations'
import AnsibleAutomationsFormPage from './AnsibleAutomationsForm'

export default function Automations() {
    return (
        <Switch>
            <Route exact path={NavigationPath.addAnsibleAutomation} component={AnsibleAutomationsFormPage} />
            <Route exact path={NavigationPath.editAnsibleAutomation} component={AnsibleAutomationsFormPage} />
            <Route exact path={NavigationPath.ansibleAutomations} component={AnsibleAutomationsPage} />
            <Route path="*">
                <Redirect to={NavigationPath.ansibleAutomations} />
            </Route>
        </Switch>
    )
}
