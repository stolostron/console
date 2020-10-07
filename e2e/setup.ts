import { config } from 'dotenv'
config()

import * as axios from 'axios'

export let request: axios.AxiosInstance

// eslint-disable-next-line @typescript-eslint/require-await
async function setupBeforeAll(): Promise<void> {
    request = axios.default.create({
        baseURL: process.env.BACKEND_URL,
        validateStatus: () => true,
        headers: { cookie: `acm-access-token-cookie=${process.env.CLUSTER_API_TOKEN}` },
    })
}

function setupBeforeEach(): void {
    /**/
}

function setupAfterEach(): void {
    /**/
}

async function setupAfterAll(): Promise<void> {
    /**/
}

export function setup(): void {
    beforeAll(setupBeforeAll, 30 * 1000)
    beforeEach(setupBeforeEach)
    afterEach(setupAfterEach)
    afterAll(setupAfterAll)
}
