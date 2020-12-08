import Axios, { AxiosResponse, Method } from 'axios'
import * as https from 'https'
import { logger } from './logger'

export async function kubeRequest<T = unknown>(
    token: string,
    method: string,
    url: string,
    data?: unknown,
    headers?: Record<string, string>
): Promise<AxiosResponse<T>> {
    let response: AxiosResponse<T>
    // eslint-disable-next-line no-constant-condition
    let tries = method === 'GET' ? 3 : 1
    while (tries-- > 0) {
        try {
            response = await Axios.request<T>({
                url,
                method: method as Method,
                httpsAgent: new https.Agent({ rejectUnauthorized: false }),
                headers: {
                    ...{
                        Authorization: `Bearer ${token}`,
                    },
                    ...headers,
                },
                responseType: 'json',
                validateStatus: () => true,
                data,
                // timeout - defaults to unlimited
            })
            switch (response.status) {
                case 429:
                    if (tries > 0) {
                        await new Promise((resolve) => setTimeout(resolve, 100))
                    }
                    break
                default:
                    return response
            }
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            const code = err.code as string
            switch (code) {
                case 'ETIMEDOUT':
                    logger.warn({ msg: 'ETIMEDOUT', method, url })
                    break
                case 'ECONNRESET':
                    logger.warn({ msg: 'ECONNRESET', method, url })
                    break
                default:
                    throw err
            }
        }
    }
    return response
}
