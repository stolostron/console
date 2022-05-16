/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

import '@patternfly/react-core/dist/styles/base.css'

import { StrictMode } from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import { RecoilRoot } from 'recoil'
import 'regenerator-runtime/runtime'
import { initTheme } from './theme'

import '@patternfly/patternfly/patternfly-theme-dark.css'

initTheme()

ReactDOM.render(
    <StrictMode>
        <RecoilRoot>
            <App />
        </RecoilRoot>
    </StrictMode>,
    document.getElementById('root')
)
