/* Copyright Contributors to the Open Cluster Management project */

import {
    normalizeRepoType,
    groupByRepoType,
    getClusterCountString,
    getResourceType,
    getResourceLabel,
    getAge,
    getSearchLink,
    getShortDateTime,
    getEditLink,
} from './resource-helper'
import i18next from 'i18next'
import moment from 'moment'

const t = i18next.t.bind(i18next)
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => i18next.t(key),
    }),
}))

describe('normalizeRepoType', () => {
    it('should work with github', () => {
        expect(normalizeRepoType('github')).toEqual('git')
    })

    it('should work with helm', () => {
        expect(normalizeRepoType('helm')).toEqual('helm')
    })
})

describe('groupByRepoType', () => {
    it('should return repos', () => {
        const repos = [
            {
                gitPath: 'sadaf',
                pathName: 'https://13.com',
                targetRevision: 'sd',
                type: 'git',
            },
            {
                chart: 'testchart',
                gitPath: 'sadaf',
                pathName: 'https://13.com',
                targetRevision: 'sd',
                type: 'helmrepo',
            },
        ]
        const result = {
            git: [
                {
                    gitPath: 'sadaf',
                    pathName: 'https://13.com',
                    targetRevision: 'sd',
                    type: 'git',
                },
            ],
            helmrepo: [
                {
                    chart: 'testchart',
                    gitPath: 'sadaf',
                    pathName: 'https://13.com',
                    targetRevision: 'sd',
                    type: 'helmrepo',
                },
            ],
        }
        expect(groupByRepoType(repos)).toEqual(result)
    })
})

describe('getClusterCountString', () => {
    it('should return None', () => {
        expect(getClusterCountString(0, false)).toEqual('None')
    })

    it('should return Local', () => {
        expect(getClusterCountString(0, true)).toEqual('Local')
    })

    it('should return Remote', () => {
        expect(getClusterCountString(2, false)).toEqual('2 Remote')
    })

    it('should return Remote with Local', () => {
        expect(getClusterCountString(2, true)).toEqual('2 Remote, 1 Local')
    })
})

describe('getResourceType', () => {
    it('should work with git', () => {
        expect(getResourceType('git', t)).toEqual('Git')
    })

    it('should work with helmrepo', () => {
        expect(getResourceType('helmrepo', t)).toEqual('Helm')
    })

    it('should work with namespace', () => {
        expect(getResourceType('namespace', t)).toEqual('Namespace')
    })

    it('should work with objectbucket', () => {
        expect(getResourceType('objectbucket', t)).toEqual('Object storage')
    })

    it('should work with undefined', () => {
        expect(getResourceType('', t)).toEqual(undefined)
    })
})

describe('getResourceLabel', () => {
    it('should work with git', () => {
        expect(getResourceLabel('git', 2, (t) => t)).toEqual('Git (2)')
    })

    it('should work with helmrepo', () => {
        expect(getResourceLabel('helmrepo', 2, (t) => t)).toEqual('Helm (2)')
    })

    it('should work with namespace', () => {
        expect(getResourceLabel('namespace', 2, (t) => t)).toEqual('Namespace (2)')
    })

    it('should work with objectbucket', () => {
        expect(getResourceLabel('objectbucket', 2, (t) => t)).toEqual('Object storage (2)')
    })

    it('should work with undefined', () => {
        expect(getResourceLabel('', 2, (t) => t)).toEqual('undefined (2)')
    })
})

describe('getAge', () => {
    it('should get valid time', () => {
        const resource = {
            apiVersion: '',
            kind: '',
            metadata: {
                creationTimestamp: `${moment().format()}`,
            },
        }
        expect(getAge(resource, '', 'metadata.creationTimestamp')).toEqual('a few seconds ago')
    })

    it('should get invalid time', () => {
        const resource = {
            apiVersion: '',
            kind: '',
            metadata: {
                creationTimestamp: `${moment().format()}`,
            },
        }
        expect(getAge(resource, '', 'unknown')).toEqual('-')
    })
})

describe('getSearchLink', () => {
    it('should work with no props', () => {
        expect(getSearchLink({})).toEqual('/multicloud/home/search')
    })

    it('should work with multiple props', () => {
        expect(getSearchLink({ properties: { name: 'testing', kind: 'resource' } })).toEqual(
            '/multicloud/home/search?filters=%7B%22textsearch%22%3A%22name%3Atesting%20kind%3Aresource%22%7D'
        )
    })

    it('should include related resources', () => {
        expect(
            getSearchLink({
                properties: { name: 'testing' },
                showRelated: 'subscriptions',
            })
        ).toEqual(
            '/multicloud/home/search?filters=%7B%22textsearch%22%3A%22name%3Atesting%22%7D&showrelated=subscriptions'
        )
    })

    it('should work with array properties', () => {
        expect(
            getSearchLink({
                properties: {
                    name: ['helloworld-local', 'helloworld-remote'],
                    namespace: ['argocd', 'openshift-gitops'],
                    kind: 'application',
                    apigroup: 'argoproj.io',
                },
                showRelated: 'cluster',
            })
        ).toEqual(
            '/multicloud/home/search?filters=%7B%22textsearch%22%3A%22name%3Ahelloworld-local%2Chelloworld-remote%20namespace%3Aargocd%2Copenshift-gitops%20kind%3Aapplication%20apigroup%3Aargoproj%2Eio%22%7D&showrelated=cluster'
        )
    })
})

describe('getEditLink', () => {
    it('returns a url endpoint', () => {
        expect(
            getEditLink({
                properties: {
                    name: 'test-1',
                    namespace: 'test-1-ns',
                    kind: 'Application',
                    cluster: 'magchen-test',
                    apiversion: 'v1',
                },
            })
        ).toEqual(
            '/multicloud/home/search/resources?apiversion=v1&cluster=magchen-test&kind=Application&name=test-1&namespace=test-1-ns'
        )
    })
})

describe('getShortDateTime', () => {
    const sampleDate = '2020-08-26T13:21:04Z'
    const sameDay = sampleDate
    const sameYear = '2020-06-21T09:21:04Z'
    const futureYear = '2021-12-13T23:21:04Z'

    it('omits date and year for timestamps today', () => {
        expect(getShortDateTime(sampleDate, moment(sameDay))).toEqual('1:21 pm')
    })

    it('omits year for timestamps from this year', () => {
        expect(getShortDateTime(sampleDate, moment(sameYear))).toEqual('Aug 26, 1:21 pm')
    })

    it('includes all elements for timestamps from a different year', () => {
        expect(getShortDateTime(sampleDate, moment(futureYear))).toEqual('Aug 26 2020, 1:21 pm')
    })
})
