/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

import '@patternfly/react-core/dist/styles/base.css'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom'
import { RecoilRoot } from 'recoil'
import 'regenerator-runtime/runtime'
import App from './App'

ReactDOM.render(
    <StrictMode>
        <RecoilRoot>
            <App />
        </RecoilRoot>
    </StrictMode>,
    document.getElementById('root')
)
