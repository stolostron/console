/* Copyright Contributors to the Open Cluster Management project */

export const parameters = {
    layout: 'fullscreen',
    backgrounds: {
        default: 'pf-grey',
        values: [
            {
                name: 'pf-grey',
                value: '#f0f0f0',
            },
        ],
    },
}

import '@patternfly/react-core/dist/styles/base.css'

export const decorators = [
    (Story) => (
        <div style={{ height: '100vh' }}>
            <Story />
        </div>
    ),
]
