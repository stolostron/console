/* Copyright Contributors to the Open Cluster Management project */

import { convertStringToQuery, getCookie } from './searchUtils'

describe('searchUtils', () => {
  describe('convertStringToQuery', () => {
    it('should handle empty string', () => {
      const result = convertStringToQuery('', 50)
      expect(result).toEqual({
        keywords: [],
        filters: [],
        limit: 50,
      })
    })

    it('should handle only keywords', () => {
      const result = convertStringToQuery('pod deployment service', 100)
      expect(result).toEqual({
        keywords: ['pod', 'deployment', 'service'],
        filters: [],
        limit: 100,
      })
    })

    it('should handle only filters', () => {
      const result = convertStringToQuery('kind:Pod namespace:default', 25)
      expect(result).toEqual({
        keywords: [],
        filters: [
          { property: 'kind', values: ['Pod'] },
          { property: 'namespace', values: ['default'] },
        ],
        limit: 25,
      })
    })

    it('should handle mixed keywords and filters', () => {
      const result = convertStringToQuery('my-app kind:Deployment namespace:production label:app=frontend', 75)
      expect(result).toEqual({
        keywords: ['my-app'],
        filters: [
          { property: 'kind', values: ['Deployment'] },
          { property: 'namespace', values: ['production'] },
          { property: 'label', values: ['app=frontend'] },
        ],
        limit: 75,
      })
    })

    it('should handle filters with comma-separated values', () => {
      const result = convertStringToQuery('kind:Pod,Service namespace:default,kube-system', 30)
      expect(result).toEqual({
        keywords: [],
        filters: [
          { property: 'kind', values: ['Pod', 'Service'] },
          { property: 'namespace', values: ['default', 'kube-system'] },
        ],
        limit: 30,
      })
    })

    it('should handle extra spaces and empty tokens', () => {
      const result = convertStringToQuery('  pod   kind:Deployment   namespace:default  ', 40)
      expect(result).toEqual({
        keywords: ['pod'],
        filters: [
          { property: 'kind', values: ['Deployment'] },
          { property: 'namespace', values: ['default'] },
        ],
        limit: 40,
      })
    })

    it('should handle filters with empty values', () => {
      const result = convertStringToQuery('kind: namespace:default', 20)
      expect(result).toEqual({
        keywords: [],
        filters: [
          { property: 'kind', values: [''] },
          { property: 'namespace', values: ['default'] },
        ],
        limit: 20,
      })
    })

    it('should handle filters with multiple colons', () => {
      const result = convertStringToQuery('annotation:app.kubernetes.io/name:my-app', 10)
      expect(result).toEqual({
        keywords: [],
        filters: [{ property: 'annotation', values: ['app.kubernetes.io/name:my-app'] }],
        limit: 10,
      })
    })

    it('should handle complex mixed scenario', () => {
      const result = convertStringToQuery(
        'frontend backend kind:Pod,Service namespace:prod,staging label:tier=web,api',
        200
      )
      expect(result).toEqual({
        keywords: ['frontend', 'backend'],
        filters: [
          { property: 'kind', values: ['Pod', 'Service'] },
          { property: 'namespace', values: ['prod', 'staging'] },
          { property: 'label', values: ['tier=web', 'api'] },
        ],
        limit: 200,
      })
    })
  })

  describe('getCookie', () => {
    // Mock document.cookie for testing
    const originalCookie = Object.getOwnPropertyDescriptor(document, 'cookie')

    afterEach(() => {
      // Restore original document.cookie
      if (originalCookie) {
        Object.defineProperty(document, 'cookie', originalCookie)
      }
    })

    it('should return undefined when document.cookie is undefined', () => {
      Object.defineProperty(document, 'cookie', {
        value: undefined,
        configurable: true,
      })

      const result = getCookie('testCookie')
      expect(result).toBeUndefined()
    })

    it('should return undefined when document.cookie is empty', () => {
      Object.defineProperty(document, 'cookie', {
        value: '',
        configurable: true,
      })

      const result = getCookie('testCookie')
      expect(result).toBeUndefined()
    })

    it('should return cookie value when cookie exists', () => {
      Object.defineProperty(document, 'cookie', {
        value: 'otherCookie=otherValue; testCookie=myValue; anotherCookie=anotherValue',
        configurable: true,
      })

      const result = getCookie('testCookie')
      expect(result).toBe('myValue')
    })

    it('should return undefined when cookie does not exist', () => {
      Object.defineProperty(document, 'cookie', {
        value: 'otherCookie=otherValue; anotherCookie=anotherValue',
        configurable: true,
      })

      const result = getCookie('nonExistentCookie')
      expect(result).toBeUndefined()
    })

    it('should handle cookie with additional semicolon content', () => {
      Object.defineProperty(document, 'cookie', {
        value: 'testCookie=myValue; path=/; domain=example.com',
        configurable: true,
      })

      const result = getCookie('testCookie')
      expect(result).toBe('myValue')
    })

    it('should handle cookie with empty value', () => {
      Object.defineProperty(document, 'cookie', {
        value: 'testCookie=; otherCookie=otherValue',
        configurable: true,
      })

      const result = getCookie('testCookie')
      expect(result).toBe('')
    })

    it('should handle cookie at the beginning of cookie string', () => {
      Object.defineProperty(document, 'cookie', {
        value: 'testCookie=firstValue; otherCookie=otherValue',
        configurable: true,
      })

      const result = getCookie('testCookie')
      expect(result).toBe('firstValue')
    })

    it('should handle cookie at the end of cookie string', () => {
      Object.defineProperty(document, 'cookie', {
        value: 'otherCookie=otherValue; testCookie=lastValue',
        configurable: true,
      })

      const result = getCookie('testCookie')
      expect(result).toBe('lastValue')
    })

    it('should handle cookie with special characters in value', () => {
      Object.defineProperty(document, 'cookie', {
        value: 'testCookie=value%20with%20spaces%26symbols; otherCookie=simple',
        configurable: true,
      })

      const result = getCookie('testCookie')
      expect(result).toBe('value%20with%20spaces%26symbols')
    })

    it('should return undefined when parts array has length of 1', () => {
      Object.defineProperty(document, 'cookie', {
        value: 'differentCookie=value',
        configurable: true,
      })

      const result = getCookie('testCookie')
      expect(result).toBeUndefined()
    })
  })
})
