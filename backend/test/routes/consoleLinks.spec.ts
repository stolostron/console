/* Copyright Contributors to the Open Cluster Management project */
import { request } from '../mock-request'
import { parseResponseJsonBody } from '../../src/lib/body-parser'
import nock from 'nock'

interface FormatedConsoleLink {
    url: string
    name: string
    icon: string
}

describe(`consoleLinks Route`, function () {
    it(`should return a map of console links to include in the app launcher`, async function () {
        nock(process.env.CLUSTER_API_URL).get('/apis').reply(200, {
            status: 200,
        })
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
                ],
            })
        const res = await request('GET', '/console-links')
        expect(res.statusCode).toEqual(200)
        const { data } = await parseResponseJsonBody(res)
        console.dir(data)
        // The mocked data is transformed into arrays of console links by section name, so in
        // in this case it is of this form (but not clear how to write the "expect" statements to 
        // reference the data and validate and meet typescript rules):
        //
        // {
        //     'Search Engines': [
        //         {
        //             url: 'https://www.google.com',
        //             name: 'Google',
        //             icon: 'https://www.google.com/favicon.ico'
        //         }
        //     ]
        // }

    })
})
