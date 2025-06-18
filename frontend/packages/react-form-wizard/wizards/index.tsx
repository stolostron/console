import '@patternfly/react-core/dist/styles/base.css'
import '@patternfly/react-styles/css/components/Wizard/wizard.css'
import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'

const Demo = lazy(() => import('./Demo'))

const div = document.createElement('div')
document.body.appendChild(div)
const root = createRoot(div)
root.render(
    <StrictMode>
        <Suspense fallback={<div />}>
            <Demo />
        </Suspense>
    </StrictMode>
)
