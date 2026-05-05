/* Copyright Contributors to the Open Cluster Management project */

const mockReadFileSync = jest.fn()
const mockWatchFile = jest.fn()

describe('getPlacementDebugCACertificate', () => {
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    jest.resetModules()
    mockReadFileSync.mockReset()
    mockWatchFile.mockReset()
    delete process.env.PLACEMENT_CA_BUNDLE_PATH
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    delete process.env.PLACEMENT_CA_BUNDLE_PATH
    process.env.NODE_ENV = originalNodeEnv
  })

  async function loadFn() {
    jest.doMock('node:fs', () => ({
      ...jest.requireActual<typeof import('node:fs')>('node:fs'),
      readFileSync: mockReadFileSync,
    }))
    jest.doMock('../../src/lib/fileWatch', () => ({
      watchFile: mockWatchFile,
      stopFileWatches: jest.fn(),
    }))
    const mod = await import('../../src/lib/serviceAccountToken')
    return mod.getPlacementDebugCACertificate
  }

  it('returns undefined when PLACEMENT_CA_BUNDLE_PATH is not set', async () => {
    const getPlacementDebugCACertificate = await loadFn()
    const result = getPlacementDebugCACertificate()
    expect(result).toBeUndefined()
    expect(mockReadFileSync).not.toHaveBeenCalled()
  })

  it('reads the CA file from the configured path', async () => {
    process.env.PLACEMENT_CA_BUNDLE_PATH = '/var/run/secrets/ocm-ca/ca-bundle.crt'
    const fakeCert = '-----BEGIN CERTIFICATE-----\nfake-ca-cert\n-----END CERTIFICATE-----'
    mockReadFileSync.mockReturnValue(fakeCert)

    const getPlacementDebugCACertificate = await loadFn()
    const result = getPlacementDebugCACertificate()

    expect(result).toEqual(fakeCert)
    expect(mockReadFileSync).toHaveBeenCalledWith('/var/run/secrets/ocm-ca/ca-bundle.crt', 'utf-8')
  })

  it('returns undefined and does not throw when file does not exist', async () => {
    process.env.PLACEMENT_CA_BUNDLE_PATH = '/nonexistent/ca-bundle.crt'
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT')
    })

    const getPlacementDebugCACertificate = await loadFn()
    const result = getPlacementDebugCACertificate()

    expect(result).toBeUndefined()
  })

  it('caches the certificate on subsequent calls', async () => {
    process.env.PLACEMENT_CA_BUNDLE_PATH = '/var/run/secrets/ocm-ca/ca-bundle.crt'
    const fakeCert = '-----BEGIN CERTIFICATE-----\ncached\n-----END CERTIFICATE-----'
    mockReadFileSync.mockReturnValue(fakeCert)

    const getPlacementDebugCACertificate = await loadFn()
    const first = getPlacementDebugCACertificate()
    const second = getPlacementDebugCACertificate()

    expect(first).toEqual(fakeCert)
    expect(second).toEqual(fakeCert)
    expect(mockReadFileSync).toHaveBeenCalledTimes(1)
  })

  it('invalidates cache when onChange callback fires', async () => {
    process.env.PLACEMENT_CA_BUNDLE_PATH = '/var/run/secrets/ocm-ca/ca-bundle.crt'
    process.env.NODE_ENV = 'production'
    const originalCert = '-----BEGIN CERTIFICATE-----\noriginal\n-----END CERTIFICATE-----'
    const rotatedCert = '-----BEGIN CERTIFICATE-----\nrotated\n-----END CERTIFICATE-----'
    mockReadFileSync.mockReturnValueOnce(originalCert).mockReturnValueOnce(rotatedCert)

    const getPlacementDebugCACertificate = await loadFn()
    const first = getPlacementDebugCACertificate()
    expect(first).toEqual(originalCert)

    expect(mockWatchFile).toHaveBeenCalledWith('/var/run/secrets/ocm-ca/ca-bundle.crt', expect.any(Function))
    const watchCall = mockWatchFile.mock.calls[0] as [string, () => void]
    const watchCallback = watchCall[1]
    watchCallback()

    const second = getPlacementDebugCACertificate()
    expect(second).toEqual(rotatedCert)
    expect(mockReadFileSync).toHaveBeenCalledTimes(2)
  })

  it('invokes the caller onChange callback on file change', async () => {
    process.env.PLACEMENT_CA_BUNDLE_PATH = '/var/run/secrets/ocm-ca/ca-bundle.crt'
    process.env.NODE_ENV = 'production'
    mockReadFileSync.mockReturnValue('cert-data')

    const getPlacementDebugCACertificate = await loadFn()
    const callerOnChange = jest.fn()
    getPlacementDebugCACertificate(callerOnChange)

    const watchCall = mockWatchFile.mock.calls[0] as [string, () => void]
    watchCall[1]()

    expect(callerOnChange).toHaveBeenCalledTimes(1)
  })

  it('does not set up file watching in development mode', async () => {
    process.env.PLACEMENT_CA_BUNDLE_PATH = '/var/run/secrets/ocm-ca/ca-bundle.crt'
    process.env.NODE_ENV = 'development'
    mockReadFileSync.mockReturnValue('cert-data')

    const getPlacementDebugCACertificate = await loadFn()
    getPlacementDebugCACertificate()

    expect(mockWatchFile).not.toHaveBeenCalled()
  })
})
