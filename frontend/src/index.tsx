/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

import '@patternfly/react-core/dist/styles/base.css'
import '@patternfly/patternfly/patternfly-charts.css'
import { Fragment, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import 'regenerator-runtime/runtime'
import App from './App'
import '@patternfly/patternfly/patternfly-charts-theme-dark.css'
import { BrowserRouter } from 'react-router-dom'
import { CompatRouter } from 'react-router-dom-v5-compat'

const container = document.getElementById('root')
const root = createRoot(container!)

root.render(
  <StrictMode>
    <Suspense fallback={<Fragment />}>
      <BrowserRouter>
        <CompatRouter>
          <App />
        </CompatRouter>
      </BrowserRouter>
    </Suspense>
  </StrictMode>
)
