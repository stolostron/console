/* Copyright Contributors to the Open Cluster Management project */

import { Selector } from '@openshift-console/dynamic-plugin-sdk'
import { selectorToString } from './requirements'

describe('requirements', () => {
  describe('selectorToString', () => {
    describe('empty selectors', () => {
      it('should return empty string for undefined selector', () => {
        const result = selectorToString(undefined as any)
        expect(result).toBe('')
      })

      it('should return empty string for empty selector', () => {
        const result = selectorToString({})
        expect(result).toBe('')
      })

      it('should return empty string for selector with empty matchLabels and matchExpressions', () => {
        const selector: Selector = {
          matchLabels: {},
          matchExpressions: [],
        }
        const result = selectorToString(selector)
        expect(result).toBe('')
      })
    })

    describe('matchLabels conversion', () => {
      it('should convert single matchLabel to Equals requirement', () => {
        const selector: Selector = {
          matchLabels: {
            app: 'frontend',
          },
        }
        const result = selectorToString(selector)
        expect(result).toBe('app=frontend')
      })

      it('should convert multiple matchLabels to Equals requirements', () => {
        const selector: Selector = {
          matchLabels: {
            app: 'frontend',
            version: 'v1.0',
            env: 'production',
          },
        }
        const result = selectorToString(selector)
        expect(result).toBe('app=frontend,env=production,version=v1.0')
      })

      it('should sort matchLabels alphabetically', () => {
        const selector: Selector = {
          matchLabels: {
            zebra: 'last',
            alpha: 'first',
            beta: 'middle',
          },
        }
        const result = selectorToString(selector)
        expect(result).toBe('alpha=first,beta=middle,zebra=last')
      })
    })

    describe('matchExpressions operators', () => {
      it('should handle Equals operator', () => {
        const selector: Selector = {
          matchExpressions: [{ key: 'app', operator: 'Equals', values: ['frontend'] }],
        }
        const result = selectorToString(selector)
        expect(result).toBe('app=frontend')
      })

      it('should handle NotEquals operator', () => {
        const selector: Selector = {
          matchExpressions: [{ key: 'env', operator: 'NotEquals', values: ['test'] }],
        }
        const result = selectorToString(selector)
        expect(result).toBe('env!=test')
      })

      it('should handle Exists operator', () => {
        const selector: Selector = {
          matchExpressions: [{ key: 'app', operator: 'Exists', values: [] }],
        }
        const result = selectorToString(selector)
        expect(result).toBe('app')
      })

      it('should handle DoesNotExist operator', () => {
        const selector: Selector = {
          matchExpressions: [{ key: 'debug', operator: 'DoesNotExist', values: [] }],
        }
        const result = selectorToString(selector)
        expect(result).toBe('!debug')
      })

      it('should handle In operator with single value', () => {
        const selector: Selector = {
          matchExpressions: [{ key: 'tier', operator: 'In', values: ['frontend'] }],
        }
        const result = selectorToString(selector)
        expect(result).toBe('tier in (frontend)')
      })

      it('should handle In operator with multiple values', () => {
        const selector: Selector = {
          matchExpressions: [{ key: 'env', operator: 'In', values: ['staging', 'production'] }],
        }
        const result = selectorToString(selector)
        expect(result).toBe('env in (staging,production)')
      })

      it('should handle NotIn operator with single value', () => {
        const selector: Selector = {
          matchExpressions: [{ key: 'tier', operator: 'NotIn', values: ['backend'] }],
        }
        const result = selectorToString(selector)
        expect(result).toBe('tier notin (backend)')
      })

      it('should handle NotIn operator with multiple values', () => {
        const selector: Selector = {
          matchExpressions: [{ key: 'env', operator: 'NotIn', values: ['test', 'dev'] }],
        }
        const result = selectorToString(selector)
        expect(result).toBe('env notin (test,dev)')
      })

      it('should handle GreaterThan operator', () => {
        const selector: Selector = {
          matchExpressions: [{ key: 'priority', operator: 'GreaterThan', values: ['5'] }],
        }
        const result = selectorToString(selector)
        expect(result).toBe('priority > 5')
      })

      it('should handle LessThan operator', () => {
        const selector: Selector = {
          matchExpressions: [{ key: 'priority', operator: 'LessThan', values: ['10'] }],
        }
        const result = selectorToString(selector)
        expect(result).toBe('priority < 10')
      })

      it('should handle unknown operator gracefully', () => {
        const selector: Selector = {
          matchExpressions: [{ key: 'test', operator: 'UnknownOperator' as any, values: ['value'] }],
        }
        const result = selectorToString(selector)
        expect(result).toBe('')
      })
    })

    describe('edge cases for operators', () => {
      it('should handle Equals with missing values', () => {
        const selector: Selector = {
          matchExpressions: [{ key: 'app', operator: 'Equals', values: undefined as any }],
        }
        const result = selectorToString(selector)
        expect(result).toBe('app=undefined')
      })

      it('should handle Equals with empty values array', () => {
        const selector: Selector = {
          matchExpressions: [{ key: 'app', operator: 'Equals', values: [] }],
        }
        const result = selectorToString(selector)
        expect(result).toBe('app=undefined')
      })

      it('should handle NotEquals with missing values', () => {
        const selector: Selector = {
          matchExpressions: [{ key: 'env', operator: 'NotEquals', values: undefined as any }],
        }
        const result = selectorToString(selector)
        expect(result).toBe('env!=undefined')
      })

      it('should handle GreaterThan with missing values', () => {
        const selector: Selector = {
          matchExpressions: [{ key: 'priority', operator: 'GreaterThan', values: undefined as any }],
        }
        const result = selectorToString(selector)
        expect(result).toBe('priority > undefined')
      })

      it('should handle LessThan with missing values', () => {
        const selector: Selector = {
          matchExpressions: [{ key: 'priority', operator: 'LessThan', values: undefined as any }],
        }
        const result = selectorToString(selector)
        expect(result).toBe('priority < undefined')
      })

      it('should handle In operator with non-array values', () => {
        const selector: Selector = {
          matchExpressions: [{ key: 'tier', operator: 'In', values: 'frontend' as any }],
        }
        const result = selectorToString(selector)
        expect(result).toBe('tier in (frontend)')
      })

      it('should handle NotIn operator with non-array values', () => {
        const selector: Selector = {
          matchExpressions: [{ key: 'tier', operator: 'NotIn', values: 'backend' as any }],
        }
        const result = selectorToString(selector)
        expect(result).toBe('tier notin (backend)')
      })
    })

    describe('combination scenarios', () => {
      it('should combine matchLabels and matchExpressions', () => {
        const selector: Selector = {
          matchLabels: {
            app: 'frontend',
            version: 'v1',
          },
          matchExpressions: [
            { key: 'env', operator: 'In', values: ['staging', 'production'] },
            { key: 'debug', operator: 'DoesNotExist', values: [] },
          ],
        }
        const result = selectorToString(selector)
        expect(result).toBe('app=frontend,version=v1,env in (staging,production),!debug')
      })

      it('should handle multiple matchExpressions with different operators', () => {
        const selector: Selector = {
          matchExpressions: [
            { key: 'app', operator: 'Equals', values: ['frontend'] },
            { key: 'env', operator: 'NotEquals', values: ['test'] },
            { key: 'tier', operator: 'In', values: ['web', 'api'] },
            { key: 'debug', operator: 'DoesNotExist', values: [] },
            { key: 'priority', operator: 'GreaterThan', values: ['5'] },
          ],
        }
        const result = selectorToString(selector)
        expect(result).toBe('app=frontend,env!=test,tier in (web,api),!debug,priority > 5')
      })

      it('should preserve order of matchExpressions while sorting matchLabels', () => {
        const selector: Selector = {
          matchLabels: {
            zebra: 'z',
            alpha: 'a',
          },
          matchExpressions: [
            { key: 'second', operator: 'Exists', values: [] },
            { key: 'first', operator: 'Equals', values: ['value'] },
          ],
        }
        const result = selectorToString(selector)
        expect(result).toBe('alpha=a,zebra=z,second,first=value')
      })
    })

    describe('special characters and values', () => {
      it('should handle special characters in keys', () => {
        const selector: Selector = {
          matchLabels: {
            'app.kubernetes.io/name': 'my-app',
            'example.com/custom-label': 'value',
          },
        }
        const result = selectorToString(selector)
        expect(result).toBe('app.kubernetes.io/name=my-app,example.com/custom-label=value')
      })

      it('should handle special characters in values', () => {
        const selector: Selector = {
          matchLabels: {
            app: 'my-app-v1.0',
            path: '/some/path',
          },
        }
        const result = selectorToString(selector)
        expect(result).toBe('app=my-app-v1.0,path=/some/path')
      })

      it('should handle empty string values', () => {
        const selector: Selector = {
          matchLabels: {
            app: '',
            version: 'v1',
          },
        }
        const result = selectorToString(selector)
        expect(result).toBe('app=,version=v1')
      })

      it('should handle numeric-looking values as strings', () => {
        const selector: Selector = {
          matchLabels: {
            port: '8080',
            replicas: '3',
          },
        }
        const result = selectorToString(selector)
        expect(result).toBe('port=8080,replicas=3')
      })
    })

    describe('complex real-world scenarios', () => {
      it('should handle typical Kubernetes deployment selector', () => {
        const selector: Selector = {
          matchLabels: {
            app: 'nginx',
            'app.kubernetes.io/name': 'nginx',
            'app.kubernetes.io/version': '1.21',
          },
          matchExpressions: [
            { key: 'environment', operator: 'In', values: ['staging', 'production'] },
            { key: 'experimental', operator: 'DoesNotExist', values: [] },
          ],
        }
        const result = selectorToString(selector)
        expect(result).toBe(
          'app=nginx,app.kubernetes.io/name=nginx,app.kubernetes.io/version=1.21,environment in (staging,production),!experimental'
        )
      })

      it('should handle node selector requirements', () => {
        const selector: Selector = {
          matchExpressions: [
            { key: 'kubernetes.io/os', operator: 'Equals', values: ['linux'] },
            { key: 'kubernetes.io/arch', operator: 'In', values: ['amd64', 'arm64'] },
            { key: 'node-role.kubernetes.io/master', operator: 'DoesNotExist', values: [] },
            { key: 'node.kubernetes.io/memory-pressure', operator: 'NotEquals', values: ['true'] },
          ],
        }
        const result = selectorToString(selector)
        expect(result).toBe(
          'kubernetes.io/os=linux,kubernetes.io/arch in (amd64,arm64),!node-role.kubernetes.io/master,node.kubernetes.io/memory-pressure!=true'
        )
      })

      it('should handle priority-based selectors', () => {
        const selector: Selector = {
          matchLabels: {
            tier: 'critical',
          },
          matchExpressions: [
            { key: 'priority', operator: 'GreaterThan', values: ['100'] },
            { key: 'cost', operator: 'LessThan', values: ['1000'] },
          ],
        }
        const result = selectorToString(selector)
        expect(result).toBe('tier=critical,priority > 100,cost < 1000')
      })
    })
  })
})
