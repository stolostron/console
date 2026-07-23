/* Copyright Contributors to the Open Cluster Management project */
import { execFileSync } from 'node:child_process'
import { createServer, type Server } from 'node:https'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import fetch from 'node-fetch'
import nock from 'nock'
import { getDefaultAgent, getInsightsAgent } from '../../src/lib/agent'

// Simulates an in-cluster service (e.g. the Insights Operator proxy) whose TLS certificate is
// signed by a private CA (standing in for OpenShift's service-ca), to verify that getInsightsAgent()
// trusts it while the unrelated getDefaultAgent() correctly does not.
describe('agent', () => {
  let dir: string
  let server: Server
  let port: number
  let caCertPem: string

  beforeAll(() => {
    // Other test files leave nock's real-network block in place for the rest of the worker
    // process, so explicitly allow it here since these tests hit a real local HTTPS server.
    nock.enableNetConnect('127.0.0.1')

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

    caCertPem = readFileSync(caCrt, 'utf-8')
    process.env.SERVICE_CA_CERT = Buffer.from(caCertPem).toString('base64')
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
    nock.disableNetConnect()
    rmSync(dir, { recursive: true, force: true })
    return new Promise<void>((resolve) => server.close(() => resolve()))
  })

  it('getInsightsAgent trusts a certificate signed by the cluster service-ca', async () => {
    const res = await fetch(`https://127.0.0.1:${port}/`, { agent: getInsightsAgent() })
    expect(res.status).toEqual(200)
  })

  it('getDefaultAgent does not trust a certificate signed by the cluster service-ca', async () => {
    await expect(fetch(`https://127.0.0.1:${port}/`, { agent: getDefaultAgent() })).rejects.toThrow(
      /unable to verify the first certificate/i
    )
  })
})
