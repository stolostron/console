/* Copyright Contributors to the Open Cluster Management project */

process.env.NODE_ENV = 'test'
process.env.LOG_LEVEL = 'silent'
process.env.CLUSTER_API_URL = 'https://example.com'

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-var-requires
require('iconv-lite').encodingExists('foo')
