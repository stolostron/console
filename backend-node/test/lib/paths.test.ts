/* Copyright Contributors to the Open Cluster Management project */
import { certFile, certsDir, configDir, envFilePath } from '../../src/lib/paths'

describe('paths', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.ENV_FILE
    delete process.env.CONFIG_DIR
    delete process.env.CERTS_DIR
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('uses defaults when env vars are unset', () => {
    expect(envFilePath()).toBe('.env')
    expect(configDir()).toBe('./config')
    expect(certsDir()).toBe('./certs')
    expect(certFile('tls.crt')).toBe('./certs/tls.crt')
  })

  it('uses env overrides when set', () => {
    process.env.ENV_FILE = '../backend/.env'
    process.env.CONFIG_DIR = '../backend/config'
    process.env.CERTS_DIR = '../backend/certs'

    expect(envFilePath()).toBe('../backend/.env')
    expect(configDir()).toBe('../backend/config')
    expect(certsDir()).toBe('../backend/certs')
    expect(certFile('tls.key')).toBe('../backend/certs/tls.key')
  })
})
