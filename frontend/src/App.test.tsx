/* Copyright Contributors to the Open Cluster Management project */

import { lazy, Suspense } from 'react'
import { render } from '@testing-library/react'

// HOME
const WelcomePage = lazy(() => import('./routes/Home/Welcome/Welcome'))
const OverviewPage = lazy(() => import('./routes/Home/Overview/OverviewPage'))
const Search = lazy(() => import('./routes/Home/Search/Search'))

// INFRASTRUCTURE
const Clusters = lazy(() => import('./routes/Infrastructure/Clusters/Clusters'))
const Automations = lazy(() => import('./routes/Infrastructure/Automations/Automations'))
const InfraEnvironments = lazy(() => import('./routes/Infrastructure/InfraEnvironments/InfraEnvironments'))

// GOVERNANCE
const Governance = lazy(() => import('./routes/Governance/Governance'))

// APPLICATIONS
const Applications = lazy(() => import('./routes/Applications/Applications'))

// CREDENTIALS
const Credentials = lazy(() => import('./routes/Credentials/Credentials'))

const lazyComps = [
    WelcomePage,
    OverviewPage,
    Search,
    Clusters,
    Automations,
    InfraEnvironments,
    Governance,
    Applications,
    Credentials,
]

function App(props: any) {
    return <div>{props.component}</div>
}

it('renders lazy components', async () => {
    for (const component of lazyComps) {
        render(
            <Suspense fallback="test loading">
                <App {...component} />
            </Suspense>
        )
    }
})
