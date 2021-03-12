/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

import '@patternfly/react-core/dist/styles/base.css'
import { AcmHeader } from '@open-cluster-management/ui-components'
import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'

ReactDOM.render(
    <React.StrictMode>
        <React.Suspense fallback={<AcmHeader />}>
            <App />
        </React.Suspense>
    </React.StrictMode>,
    document.getElementById('root')
)
