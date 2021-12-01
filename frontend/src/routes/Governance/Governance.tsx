/* Copyright Contributors to the Open Cluster Management project */
import { Redirect, Route, Switch } from 'react-router-dom'
import { NavigationPath } from '../../NavigationPath'
import GovernancePage from './GovernancePage'

export default function Governance() {
    return (
        <Switch>
            <Route path={NavigationPath.governance} component={GovernancePage} />
            <Route path="*">
                <Redirect to={NavigationPath.governance} />
            </Route>
        </Switch>
    )
}
