// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { showArgoApplicationSetLink, getURLSearchData } from './diagram-helpers-argo'

const t = (string) => {
    return string
}

describe('showArgoApplicationSetLink', () => {
    const argoAppsWithAppSet = {
        id: 'application--nginx-in-cluster',
        type: 'application',
        name: 'nginx-in-cluster',
        namespace: 'openshift-gitops',
        specs: {
            raw: {
                apiVersion: 'argoproj.io/v1alpha1',
                kind: 'Application',
                metadata: {
                    ownerReferences: [
                        {
                            kind: 'ApplicationSet',
                            name: 'nginx-sample',
                        },
                    ],
                },
            },
        },
    }
    const argoAppsNoAppSet = {
        id: 'application--nginx-in-cluster',
        type: 'application',
        name: 'nginx-in-cluster',
        namespace: 'openshift-gitops',
        specs: {
            raw: {
                apiVersion: 'argoproj.io/v1alpha1',
                kind: 'Application',
                metadata: {
                    ownerReferences: [],
                },
            },
        },
    }

    const argoAppsNoAppSet2 = {
        id: 'application--nginx-in-cluster',
        type: 'application',
        name: 'nginx-in-cluster',
        namespace: 'openshift-gitops',
        specs: {
            raw: {
                apiVersion: 'argoproj.io/v1alpha1',
                kind: 'Application',
                metadata: {},
            },
        },
    }

    const result = [
        {
            type: 'spacer',
        },
        {
            labelValue: 'props.show.yaml.argoset',
            value: 'nginx-sample',
        },
        {
            type: 'link',
            value: {
                label: 'props.show.yaml.argoset.yaml',
                data: {
                    action: 'show_resource_yaml',
                    cluster: 'local-cluster',
                    editLink:
                        '/resources?apiversion=argoproj.io%2Fv1alpha1&cluster=local-cluster&kind=applicationset&name=nginx-sample&namespace=openshift-gitops',
                },
            },
            indent: true,
        },
        {
            type: 'spacer',
        },
    ]
    it('returns application set', () => {
        expect(showArgoApplicationSetLink(argoAppsWithAppSet, [], t)).toEqual(result)
    })

    it('returns no application set', () => {
        expect(showArgoApplicationSetLink(argoAppsNoAppSet, [], t)).toEqual([])
    })

    it('returns no application set, no owner ref set', () => {
        expect(showArgoApplicationSetLink(argoAppsNoAppSet2, [], t)).toEqual([])
    })
})

describe('getURLSearchData with data', () => {
    const { location } = window

    beforeAll(() => {
        delete window.location

        window.location = {
            search: '?apiVersion=argoproj.io%2Fv1alpha1&cluster=ui-managed',
        }
    })

    afterAll(() => {
        window.location = location
    })

    const expectedResult = {
        apiVersion: 'argoproj.io/v1alpha1',
        cluster: 'ui-managed',
    }
    it('should return the search data', () => {
        expect(getURLSearchData()).toEqual(expectedResult)
    })
})

describe('getURLSearchData with data', () => {
    const expectedResult = {}

    it('should return an empty object', () => {
        expect(getURLSearchData()).toEqual(expectedResult)
    })
})
