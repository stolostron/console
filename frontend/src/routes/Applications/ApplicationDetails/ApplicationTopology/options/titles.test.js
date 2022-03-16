// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { getLegendTitle } from './titles'

describe('getLegendTitle', () => {
    const titleMap = new Map([
        ['deploymentconfig', 'Deploymentconfig'],
        ['replicationcontroller', 'ReplicationController'],
        ['daemonset', 'Daemonset'],
        ['replicaset', 'Replicaset'],
        ['configmap', 'Configmap'],
        ['customresource', 'Customresource'],
        ['statefulset', 'Statefulset'],
        ['storageclass', 'Storageclass'],
        ['serviceaccount', 'Serviceaccount'],
        ['securitycontextconstraints', 'Securitycontextconstraints'],
        ['inmemorychannel', 'Inmemory Channel'],
        ['integrationplatform', 'Integrationplatform'],
        ['persistentvolumeclaim', 'Persistentvolumeclaim'],
        ['application', 'Application'],
        ['placements', 'Placements'],
        ['unknown', 'Unknown'],
        ['', ''],
        [undefined, ''],
    ])

    it('should get the correct title', () => {
        titleMap.forEach((value, key) => {
            expect(getLegendTitle(key)).toEqual(value)
        })
    })
})
