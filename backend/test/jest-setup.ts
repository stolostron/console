/* Copyright Contributors to the Open Cluster Management project */
import iconvLite from 'iconv-lite'

process.env.NODE_ENV = 'test'
process.env.LOG_LEVEL = 'silent'
process.env.CLUSTER_API_URL = 'https://example.com'
process.env.TOKEN = 'sa-token'
process.env.PUBLIC_FOLDER = '../frontend/public'

iconvLite.encodingExists('foo')
