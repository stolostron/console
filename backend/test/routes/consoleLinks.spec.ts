/* Copyright Contributors to the Open Cluster Management project */
import { request } from '../mock-request'
import { parseResponseJsonBody } from '../../src/lib/body-parser'
import nock from 'nock'

describe(`consoleLinks Route`, function () {
    it(`should return a map of console links to include in the app launcher`, async function () {
        nock(process.env.CLUSTER_API_URL)
            .get('/apis/console.openshift.io/v1/consolelinks')
            .reply(200, {
                items: [
                    {
                        spec: {
                            href: 'https://www.google.com',
                            location: 'ApplicationMenu',
                            text: 'Google',
                            applicationMenu: {
                                section: 'Search Engines',
                                imageURL: 'https://www.google.com/favicon.ico',
                            },
                        },
                    },
                    {
                        spec: {
                            href: 'https://www.yahoo.com',
                            location: 'ApplicationMenu',
                            text: 'Yahoo',
                            applicationMenu: {
                                section: 'Search Engines',
                                imageURL: 'https://www.yahoo.com/favicon.ico',
                            },
                        },
                    },
                ],
            })
        const res = await request('GET', '/console-links')
        expect(res.statusCode).toEqual(200)
        const { data } = await parseResponseJsonBody(res)
        expect(data).toEqual({
            'Search Engines': [
                {
                    url: 'https://www.google.com',
                    name: 'Google',
                    icon: 'https://www.google.com/favicon.ico',
                },
                {
                    url: 'https://www.yahoo.com',
                    name: 'Yahoo',
                    icon: 'https://www.yahoo.com/favicon.ico',
                },
            ],
        })
    })
    it('should handle errors', async function () {
        nock(process.env.CLUSTER_API_URL).get('/apis/console.openshift.io/v1/consolelinks').replyWithError('failed')
        const res = await request('GET', '/console-links')
        expect(res.statusCode).toEqual(500)
    })
})
