/* istanbul ignore file */
import { requestHandler } from './app'
import { startServer, stopServer } from './server'

console.info(`process start  NODE_ENV=${process.env.NODE_ENV}  nodeVersion=${process.versions.node}`)

for (const variable of ['CLUSTER_API_URL', 'OAUTH2_REDIRECT_URL', 'BACKEND_URL', 'FRONTEND_URL']) {
    if (!process.env[variable]) throw new Error(`${variable} required`)
    console.info(`process env  ${variable}=${process.env[variable]}`)
}

process
    .on('SIGINT', (signal) => {
        process.stdout.write('\n')
        console.info('process ' + signal)
        void stopServer()
    })
    .on('SIGTERM', (signal) => {
        console.info('process ' + signal)
        void stopServer()
    })
    .on('uncaughtException', (err) => {
        console.error('process uncaughtException', err)
        void stopServer()
    })
    .on('multipleResolves', (type, promise, reason) => {
        console.error('process multipleResolves', 'type', type, 'reason', reason)
        void stopServer()
    })
    .on('unhandledRejection', (reason, promise) => {
        console.error('process unhandledRejection', 'reason', reason)
        void stopServer()
    })
    .on('exit', function processExit(code) {
        console.info(`process exit${code ? `  code=${code}` : ''}`)
    })

void startServer(requestHandler)
