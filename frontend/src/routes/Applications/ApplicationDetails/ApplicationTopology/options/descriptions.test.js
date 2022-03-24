/* Copyright Contributors to the Open Cluster Management project */

import { getNodeDescription } from './descriptions'

describe('getNodeDescription', () => {
    it('get the app node description', () => {
        const appnode = {
            name: 'myapp',
            layout: {
                compactLabel: 'Application',
                label: 'Application',
                title: '',
                type: 'application',
                uid: 'application--feng-error-app',
                isMajorHub: true,
            },
            type: 'application',
        }
        const result = 'myapp'
        expect(getNodeDescription(appnode)).toEqual(result)
    })

    it('get the cluster node description', () => {
        const clusternode = {
            name: 'myapp--cluster',
            layout: {
                compactLabel: 'Cluster',
                label: 'Cluster',
                title: '',
                type: 'cluster',
                uid: 'cluster--feng-error-app',
                isMinorHub: true,
            },
            type: 'cluster',
            specs: {
                clusterNames: ['local-cluster', 'console-managed'],
            },
        }
        const result = ''
        expect(getNodeDescription(clusternode)).toEqual(result)
    })
})
