import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import './acm-header'

ReactDOM.render(
    <React.StrictMode>
        <React.Suspense fallback={<React.Fragment />}>
            <App />
        </React.Suspense>
    </React.StrictMode>,
    document.getElementById('root')
)
