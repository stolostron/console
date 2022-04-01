// Copyright Contributors to the Open Cluster Management project

import {
    getClusterCount,
    groupByChannelType,
    getChannelLabel,
    createEditLink,
    getResourceType
} from './resource-helper'
import { render, screen, waitFor } from '@testing-library/react'
import { groupBy } from 'lodash'

const t = (string, arg) => {
    switch (string) {
        case 'cluster.count.local':
            return 'Local'
        case 'cluster.count.none':
            return 'None'
        case 'cluster.count.remote':
            return 'Remote'
        case 'cluster.count.remote_and_local':
            return `${arg} Remote, 1 Local`
        case 'channel.type.git':
            return 'Git'
        default:
            return string
    }
}

describe('getClusterCount', () => {
    it('return the cluster count local deploy', () => {
        expect(
            getClusterCount({
                t,
                remoteCount: 0,
                localPlacement: true,
                name: 'cluster1',
                namespace: 'cluster1-ns',
                kind: 'cluster',
                apigroup: 'apps.open-cluster-management.io',
                clusterNames: ['local-cluster']
            })
        ).toEqual('Local')
    })
    it('return the cluster count none', () => {
        expect(
            getClusterCount({
                t,
                remoteCount: 0,
                localPlacement: false,
                name: 'cluster1',
                namespace: 'cluster1-ns',
                kind: 'cluster',
                apigroup: 'apps.open-cluster-management.io',
                clusterNames: ['local-cluster']
            })
        ).toEqual('None')
    })
    it('return the cluster count remote and local deploy', () => {
        const { getByText } = render(
            getClusterCount({
                t,
                remoteCount: 1,
                localPlacement: true,
                name: 'cluster1',
                namespace: 'cluster1-ns',
                kind: 'cluster',
                apigroup: 'apps.open-cluster-management.io',
                clusterNames: ['local-cluster', 'cluster1']
            })
        )
        expect(getByText(('1 Remote, 1 Local'))).toBeTruthy()
    })
    it('return the cluster count remote argo app', () => {
        const { getByText } = render(
            getClusterCount({
                t,
                remoteCount: 1,
                localPlacement: false,
                name: 'cluster1',
                namespace: 'cluster1-ns',
                kind: 'cluster',
                apigroup: 'argoproj.io',
                clusterNames: ['cluster1']
            })
        )
        expect(getByText(('Remote'))).toBeTruthy()
    })
})

describe('groupByChannelType', () => {
    const channels = [
        {
            type: 'github'
        },
        {
            type: 'helm'
        }
    ]

    const result = {
        "git":  [
            {
            "type": "github",
            },
        ],
        "helm":  [
            {
            "type": "helm",
            },
        ],
    }
    it('group channel by type', () => {
        expect(groupByChannelType(channels)).toEqual(result)
    })
})

describe('getChannelLabel', () => {
    it('get channel label', () => {
        expect(getChannelLabel('git', 1, t)).toEqual('Git')
    })

    it('get channel label count greater than 1', () => {
        expect(getChannelLabel('git', 2, t)).toEqual('Git (2)')
    })
})

describe('createEditLink', () => {
    it('create an edit link', () => {
        const item = {
            name: 'app1',
            namespace: 'app1-ns',
            kind: 'application',
            apiVersion: 'v1',
            cluster: 'local-cluster'
        }

        const { getByText } = render(
            createEditLink(item)
        )
        expect(getByText('app1')).toBeTruthy()
    })
})

describe('getResourceType', () => {
    it('get the resource type', () => {
        const item = {
            resourceType: 'git'
        }
        expect(getResourceType(item)).toEqual('git')
    })
    it('get the resource type with key', () => {
        const item = {
            key: 'spec.type',
            spec: {
                type: 'blah'
            }
        }
        expect(getResourceType(item, undefined, item.key)).toEqual('blah')
    })
})
