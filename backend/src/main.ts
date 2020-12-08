/* istanbul ignore file */
import { config } from 'dotenv'
import { requestHandler } from './app'
import { startServer, stopServer } from './server'

config()

console.log(`process start  NODE_ENV=${process.env.NODE_ENV}  nodeVersion=${process.versions.node}`)

for (const variable of ['CLUSTER_API_URL', 'OAUTH2_REDIRECT_URL', 'BACKEND_URL', 'FRONTEND_URL']) {
    if (!process.env[variable]) throw new Error(`${variable} required`)
    console.log(`environment  ${variable}=${process.env[variable]}`)
}

process
    .on('SIGINT', (signal) => {
        process.stdout.write('\n')
        console.log(signal)
        void stopServer()
    })
    .on('SIGTERM', (signal) => {
        console.log(signal)
        void stopServer()
    })
    .on('uncaughtException', (err) => {
        console.error(err)
        void stopServer()
    })
    // process.on('multipleResolves', (type, promise, reason) => {
    //     logger.error({ msg: 'process multipleResolves', type })
    //     void fastify.close()
    // })

    // process.on('unhandledRejection', (reason, promise) => {
    //     logger.error({ msg: 'process unhandledRejection', reason })
    //     void fastify.close()
    // })
    .on('exit', function processExit(code) {
        console.log(`process exit${code ? `  code:${code}` : ''}`)
    })

void startServer(requestHandler)
