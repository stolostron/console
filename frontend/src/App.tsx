import '@patternfly/react-core/dist/styles/base.css'
import React from 'react'
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom'
import './lib/i18n'
import { ClusterManagement } from './routes/ClusterManagement/ClusterManagement'

function App() {
    return (
        <Router>
            <Switch>
                <Route path="/cluster-management">
                    <ClusterManagement />
                </Route>
                <Route path="/">
                    <Redirect to="/cluster-management" />
                </Route>
            </Switch>
        </Router>
    )
}

export default App
