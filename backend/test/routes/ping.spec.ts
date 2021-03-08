/* Copyright Contributors to the Open Cluster Management project */
import { request } from '../setup'

describe(`GET /ping`, function () {
    it(`should return 200`, async function () {
        const result = await request.get(`/ping`)
        expect(result.status).toBe(200)
    })
})
