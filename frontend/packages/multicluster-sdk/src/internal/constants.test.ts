/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable @typescript-eslint/no-require-imports */

describe('constants', () => {
  const originalBackendPath = process.env.REACT_APP_BACKEND_PATH
  const originalMode = process.env.MODE
  const originalPluginProxyPath = process.env.PLUGIN_PROXY_PATH
  const originalServerFlags = window.SERVER_FLAGS

  afterEach(() => {
    process.env.REACT_APP_BACKEND_PATH = originalBackendPath
    process.env.MODE = originalMode
    process.env.PLUGIN_PROXY_PATH = originalPluginProxyPath
    window.SERVER_FLAGS = originalServerFlags
    jest.resetModules()
  })

  describe('BACKEND_URL', () => {
    it('uses REACT_APP_BACKEND_PATH when set in standalone mode', () => {
      process.env.REACT_APP_BACKEND_PATH = '/multicloud'
      delete process.env.MODE
      delete process.env.PLUGIN_PROXY_PATH
      jest.resetModules()

      const { BACKEND_URL } = require('./constants')
      expect(BACKEND_URL).toBe('/multicloud')
    })

    it('prefixes PLUGIN_PROXY_PATH in OpenShift Console plugin mode', () => {
      process.env.REACT_APP_BACKEND_PATH = '/multicloud'
      process.env.MODE = 'plugin'
      process.env.PLUGIN_PROXY_PATH = '/api/proxy/plugin/acm/console'
      jest.resetModules()

      const { BACKEND_URL } = require('./constants')
      expect(BACKEND_URL).toBe('/api/proxy/plugin/acm/console/multicloud')
    })

    it('falls back to the OpenShift Console plugin proxy path when unset', () => {
      delete process.env.REACT_APP_BACKEND_PATH
      delete process.env.MODE
      delete process.env.PLUGIN_PROXY_PATH
      jest.resetModules()

      const { BACKEND_URL } = require('./constants')
      expect(BACKEND_URL).toBe('/api/proxy/plugin/mce/console/multicloud')
    })

    it('falls back when REACT_APP_BACKEND_PATH is empty', () => {
      process.env.REACT_APP_BACKEND_PATH = ''
      delete process.env.MODE
      delete process.env.PLUGIN_PROXY_PATH
      jest.resetModules()

      const { BACKEND_URL } = require('./constants')
      expect(BACKEND_URL).toBe('/api/proxy/plugin/mce/console/multicloud')
    })
  })

  describe('SERVER_FLAGS observability paths', () => {
    it('reads prometheus and alertmanager paths when SERVER_FLAGS is present', () => {
      window.SERVER_FLAGS = {
        prometheusBaseURL: '/api/prometheus',
        prometheusTenancyBaseURL: '/api/prometheus-tenancy',
        alertManagerBaseURL: '/api/alertmanager',
        alertmanagerUserWorkloadBaseURL: '/api/alertmanager-user-workload',
      }
      jest.resetModules()

      const {
        PROMETHEUS_BASE_PATH,
        PROMETHEUS_TENANCY_BASE_PATH,
        ALERTMANAGER_BASE_PATH,
        ALERTMANAGER_USER_WORKLOAD_BASE_PATH,
      } = require('./constants')

      expect(PROMETHEUS_BASE_PATH).toBe('/api/prometheus')
      expect(PROMETHEUS_TENANCY_BASE_PATH).toBe('/api/prometheus-tenancy')
      expect(ALERTMANAGER_BASE_PATH).toBe('/api/alertmanager')
      expect(ALERTMANAGER_USER_WORKLOAD_BASE_PATH).toBe('/api/alertmanager-user-workload')
    })

    it('leaves observability paths undefined when SERVER_FLAGS is absent', () => {
      delete window.SERVER_FLAGS
      jest.resetModules()

      const {
        PROMETHEUS_BASE_PATH,
        PROMETHEUS_TENANCY_BASE_PATH,
        ALERTMANAGER_BASE_PATH,
        ALERTMANAGER_USER_WORKLOAD_BASE_PATH,
      } = require('./constants')

      expect(PROMETHEUS_BASE_PATH).toBeUndefined()
      expect(PROMETHEUS_TENANCY_BASE_PATH).toBeUndefined()
      expect(ALERTMANAGER_BASE_PATH).toBeUndefined()
      expect(ALERTMANAGER_USER_WORKLOAD_BASE_PATH).toBeUndefined()
    })

    it('leaves observability paths undefined when SERVER_FLAGS omits them', () => {
      window.SERVER_FLAGS = {}
      jest.resetModules()

      const { PROMETHEUS_BASE_PATH, ALERTMANAGER_BASE_PATH } = require('./constants')

      expect(PROMETHEUS_BASE_PATH).toBeUndefined()
      expect(ALERTMANAGER_BASE_PATH).toBeUndefined()
    })
  })
})
