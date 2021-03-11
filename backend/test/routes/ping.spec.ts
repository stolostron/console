/* Copyright Contributors to the Open Cluster Management project */
import { request } from '../mock-request'

describe(`Ping Route`, function () {
    it(`GET /ping should return status code 200`, async function () {
        const res = await request('GET', '/ping')
        expect(res.statusCode).toEqual(200)
    })
})
