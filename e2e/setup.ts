import * as axios from 'axios'

export let request: axios.AxiosInstance

// eslint-disable-next-line @typescript-eslint/require-await
async function setupBeforeAll(): Promise<void> {
    request = axios.default.create({
        baseURL: process.env.CONSOLE_API,
        validateStatus: () => true,
        headers: { cookie: 'acm-access-token-cookie=123' },
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
