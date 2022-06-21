/* Copyright Contributors to the Open Cluster Management project */
import { CyHttpMessages } from 'cypress/types/net-stubbing'

export interface IResource {
    apiVersion: string
    kind: string
    metadata: {
        name: string
        namespace?: string
        labels?: Record<string, string>
    }
}

const sid = 'qKNAdUvgaMqOq4-ZAAAf'
const websocketMockQueue: any[] = [
    `0{"sid":"${sid}","upgrades":[""],"pingInterval":25000,"pingTimeout":20000,"maxPayload":1000000}`,
    `40{"sid":"${sid}"}`,
]

export function setupWebsocketMock() {
    if (!Cypress.env('mock')) return

    cy.intercept({ method: 'POST', url: '/socket.io/?*' }, (req: CyHttpMessages.IncomingHttpRequest) => {
        req.reply('ok')
    })

    cy.intercept({ method: 'GET', url: '/socket.io/?*' }, (req: CyHttpMessages.IncomingHttpRequest) => {
        async function handleResponse() {
            let count = 10 * 1000
            while (true) {
                if (websocketMockQueue.length) {
                    const pollItem = websocketMockQueue.shift()
                    switch (typeof pollItem) {
                        case 'string':
                            req.reply(pollItem)
                            break
                        case 'object':
                            req.reply('42' + JSON.stringify(pollItem))
                            break
                        default:
                            req.reply('2')
                            break
                    }
                    break
                }
                await new Promise((resolve) => setTimeout(resolve, 500))
                count -= 500
                if (count === 0) {
                    req.reply('2')
                    break
                }
            }
        }
        return handleResponse()
    })

    websocketMockQueue.push(['LOADED'])
}

export function websocketMockCreateResourceEvent(resource: IResource) {
    if (!Cypress.env('mock')) return

    websocketMockQueue.push(['ADDED', resource])
}
