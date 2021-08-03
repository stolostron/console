/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

import '@patternfly/react-core/dist/styles/base.css'
import { AcmHeader, AcmRoute } from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { StrictMode, Suspense } from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import { RecoilRoot } from 'recoil'
import { MemoryRouter } from 'react-router'

ReactDOM.render(
    <StrictMode>
        <Suspense
            fallback={
                <MemoryRouter>
                    <AcmHeader route={AcmRoute.Clusters}>
                        <PageSection variant="light" isFilled />
                    </AcmHeader>
                </MemoryRouter>
            }
        >
            <RecoilRoot>
                <App />
            </RecoilRoot>
        </Suspense>
    </StrictMode>,
    document.getElementById('root')
)
