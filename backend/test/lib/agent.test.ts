/* Copyright Contributors to the Open Cluster Management project */
import { execFileSync } from 'node:child_process'
import { createServer, type Server } from 'node:https'
import { connect, type PeerCertificate, type TLSSocket } from 'node:tls'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Agent } from 'node:https'
import { getDefaultAgent, getInsightsAgent } from '../../src/lib/agent'

// Simulates an in-cluster service (e.g. the Insights Operator proxy) whose TLS certificate is
// signed by a private CA (standing in for OpenShift's service-ca), to verify that getInsightsAgent()
// trusts it while the unrelated getDefaultAgent() correctly does not.
//
// This connects with `tls.connect` directly (rather than `fetch`/`https.request`) because other
// test files' use of `nock` monkey-patches the shared, process-wide `http`/`https` modules for the
// lifetime of the Jest worker; going through that layer here would make the outcome depend on
// which test file happened to run first in this worker. `tls.connect` isn't touched by `nock`.
describe('agent', () => {
  let dir: string
  let server: Server
  let port: number

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'agent-test-'))
    const caKey = join(dir, 'ca.key')
    const caCrt = join(dir, 'ca.crt')
    const otherCaKey = join(dir, 'other-ca.key')
    const otherCaCrt = join(dir, 'other-ca.crt')
    const leafKey = join(dir, 'leaf.key')
    const leafCsr = join(dir, 'leaf.csr')
    const leafCrt = join(dir, 'leaf.crt')
    const extFile = join(dir, 'leaf.ext')

    execFileSync('openssl', [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-keyout',
      caKey,
      '-out',
      caCrt,
      '-days',
      '1',
      '-nodes',
      '-subj',
      '/CN=Test Service CA',
    ])
    // Unrelated CA used to stand in for the kube-apiserver ca.crt that getDefaultAgent() trusts,
    // to show that it doesn't happen to trust the service-ca above.
    execFileSync('openssl', [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-keyout',
      otherCaKey,
      '-out',
      otherCaCrt,
      '-days',
      '1',
      '-nodes',
      '-subj',
      '/CN=Test Kube API CA',
    ])
    execFileSync('openssl', [
      'req',
      '-newkey',
      'rsa:2048',
      '-keyout',
      leafKey,
      '-out',
      leafCsr,
      '-nodes',
      '-subj',
      '/CN=127.0.0.1',
    ])
    writeFileSync(extFile, 'subjectAltName=IP:127.0.0.1\n')
    execFileSync('openssl', [
      'x509',
      '-req',
      '-in',
      leafCsr,
      '-CA',
      caCrt,
      '-CAkey',
      caKey,
      '-CAcreateserial',
      '-out',
      leafCrt,
      '-days',
      '1',
      '-extfile',
      extFile,
    ])

    process.env.SERVICE_CA_CERT = Buffer.from(readFileSync(caCrt, 'utf-8')).toString('base64')
    process.env.CA_CERT = Buffer.from(readFileSync(otherCaCrt, 'utf-8')).toString('base64')

    server = createServer({ cert: readFileSync(leafCrt), key: readFileSync(leafKey) }, (_req, res) => {
      res.writeHead(200)
      res.end('ok')
    })

    return new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        port = (server.address() as { port: number }).port
        resolve()
      })
    })
  })

  afterAll(() => {
    delete process.env.SERVICE_CA_CERT
    delete process.env.CA_CERT
    rmSync(dir, { recursive: true, force: true })
    return new Promise<void>((resolve) => server.close(() => resolve()))
  })

  // rejectUnauthorized is set to false so the handshake always completes and we can inspect the
  // verification outcome via `authorized`/`authorizationError`, instead of racing an 'error' event
  // (which is what would fire on an untrusted cert with the default rejectUnauthorized: true).
  function handshake(agent: Agent): Promise<{ authorized: boolean; authorizationError: Error; cert: PeerCertificate }> {
    return new Promise((resolve, reject) => {
      const socket: TLSSocket = connect(
        {
          host: '127.0.0.1',
          port,
          ca: agent.options.ca,
          rejectUnauthorized: false,
        },
        () => {
          resolve({
            authorized: socket.authorized,
            authorizationError: socket.authorizationError,
            cert: socket.getPeerCertificate(),
          })
          socket.end()
        }
      )
      socket.on('error', reject)
    })
  }

  it('getInsightsAgent trusts a certificate signed by the cluster service-ca', async () => {
    const { authorized, authorizationError, cert } = await handshake(getInsightsAgent())
    expect(authorizationError).toBeNull()
    expect(authorized).toBe(true)
    expect(cert?.subject.CN).toEqual('127.0.0.1')
  })

  it('getDefaultAgent does not trust a certificate signed by the cluster service-ca', async () => {
    const { authorized, authorizationError } = await handshake(getDefaultAgent())
    expect(authorized).toBe(false)
    expect(authorizationError).toBeTruthy()
  })
})
