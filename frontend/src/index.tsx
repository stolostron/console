/* Copyright Contributors to the Open Cluster Management project */

/* istanbul ignore file */

import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import './lib/acm-header'

ReactDOM.render(
    <React.StrictMode>
        <React.Suspense fallback={<React.Fragment />}>
            <App />
        </React.Suspense>
    </React.StrictMode>,
    document.getElementById('root')
)
