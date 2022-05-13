/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

import '@patternfly/react-core/dist/styles/base.css'

import { AcmHeader, AcmRoute } from '@stolostron/ui-components'
import { PageSection } from '@patternfly/react-core'
import { StrictMode, Suspense } from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import { RecoilRoot } from 'recoil'
import { MemoryRouter } from 'react-router'
import 'regenerator-runtime/runtime'
import { initTheme } from './theme'

import '@patternfly/patternfly/patternfly-theme-dark.css'

initTheme();

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

document.documentElement.classList.add("pf-theme-dark")