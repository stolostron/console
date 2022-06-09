/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

import '@patternfly/react-core/dist/styles/base.css'
import { Fragment, StrictMode, Suspense } from 'react'
import ReactDOM from 'react-dom'
import { RecoilRoot } from 'recoil'
import 'regenerator-runtime/runtime'
import App from './App'

ReactDOM.render(
    <StrictMode>
        <Suspense fallback={<Fragment />}>
            <RecoilRoot>
                <App />
            </RecoilRoot>
        </Suspense>
    </StrictMode>,
    document.getElementById('root')
)
