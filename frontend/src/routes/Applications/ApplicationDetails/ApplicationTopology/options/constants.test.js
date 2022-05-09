/* Copyright Contributors to the Open Cluster Management project */

import { ClusterCountIcon, PodIcon } from './constants'

describe('use constants', () => {
    it('get the cluster name from the id', () => {
        const result1 = 'clusterCount'
        const result2 = 'circle'
        expect(ClusterCountIcon.icon).toEqual(result1)
        expect(PodIcon.icon).toEqual(result2)
    })
})
