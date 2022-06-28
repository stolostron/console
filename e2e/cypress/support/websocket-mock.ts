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

enum SocketIOType {
    Open = '0',
    Close = '1',
    Ping = '2',
    Pong = '3',
    Message = '4',
    Upgrade = '5',
    Noop = '6',
}

enum SocketIOAction {
    Connect = '0',
    Disconnect = '1',
    Event = '2',
    Ack = '3',
    Error = '4',
    BinaryEvent = '5',
    BineryAck = '6',
}

const sid = 'qKNAdUvgaMqOq4-ZAAAf'
let websocketMockQueue = [
    `${SocketIOType.Open}{"sid":"${sid}","upgrades":[""],"pingInterval":25000,"pingTimeout":20000,"maxPayload":1000000}`,
    `${SocketIOType.Message}${SocketIOAction.Connect}{"sid":"${sid}"}`,
    ['LOADED'],
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
                            req.reply(SocketIOType.Message + SocketIOAction.Event + JSON.stringify(pollItem))
                            break
                        default:
                            req.reply(SocketIOType.Noop)
                            break
                    }
                    break
                }
                await new Promise((resolve) => setTimeout(resolve, 500))
                count -= 500
                if (count === 0) {
                    req.reply(SocketIOType.Ping)
                    break
                }
            }
        }
        return handleResponse()
    })
}

export function websocketMockCreateResourceEvent(resource: IResource) {
    if (!Cypress.env('mock')) return

    websocketMockQueue.push(['ADDED', resource])
}
