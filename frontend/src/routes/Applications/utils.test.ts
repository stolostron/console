/* Copyright Contributors to the Open Cluster Management project */

import { sha256 } from 'js-sha256'
import { ApplicationKind, ApplicationSetKind, IResource } from '../../resources'
import { getApplicationId, getLabels, isOCPAppResource } from './utils'
import { ApplicationStatus } from './model/application-status'
import { OCPAppResource } from '../../resources/ocp-app-resource'

describe('Applications utils', () => {
  describe('getLabels', () => {
    it('returns empty object when resource has no label', () => {
      const resource: OCPAppResource<ApplicationStatus> = {
        apiVersion: 'apps/v1',
        kind: 'deployment',
        name: 'test',
        namespace: 'test-ns',
        label: '',
        metadata: { name: 'test', namespace: 'test-ns' },
      }
      expect(getLabels(resource)).toEqual({})
    })

    it('returns empty object when resource label is undefined', () => {
      const resource = {
        apiVersion: 'apps/v1',
        kind: 'deployment',
        name: 'test',
        namespace: 'test-ns',
        metadata: { name: 'test', namespace: 'test-ns' },
      } as OCPAppResource<ApplicationStatus>
      expect(getLabels({ ...resource, label: undefined! })).toEqual({})
    })

    it('parses single key=value', () => {
      const resource: OCPAppResource<ApplicationStatus> = {
        apiVersion: 'apps/v1',
        kind: 'deployment',
        name: 'test',
        namespace: 'test-ns',
        label: 'app=authentication-operator',
        metadata: { name: 'test', namespace: 'test-ns' },
      }
      expect(getLabels(resource)).toEqual({ app: 'authentication-operator' })
    })

    it('parses semicolon-separated labels into Record', () => {
      const resource: OCPAppResource<ApplicationStatus> = {
        apiVersion: 'apps/v1',
        kind: 'deployment',
        name: 'test',
        namespace: 'test-ns',
        label:
          'app.kubernetes.io/component=compute;app.kubernetes.io/managed-by=virt-operator;app.kubernetes.io/part-of=hyperconverged-cluster',
        metadata: { name: 'test', namespace: 'test-ns' },
      }
      expect(getLabels(resource)).toEqual({
        'app.kubernetes.io/component': 'compute',
        'app.kubernetes.io/managed-by': 'virt-operator',
        'app.kubernetes.io/part-of': 'hyperconverged-cluster',
      })
    })

    it('trims key and value', () => {
      const resource: OCPAppResource<ApplicationStatus> = {
        apiVersion: 'apps/v1',
        kind: 'deployment',
        name: 'test',
        namespace: 'test-ns',
        label: '  app = my-app  ;  tier = frontend  ',
        metadata: { name: 'test', namespace: 'test-ns' },
      }
      expect(getLabels(resource)).toEqual({
        app: 'my-app',
        tier: 'frontend',
      })
    })

    it('handles value containing "=" by splitting only on first "="', () => {
      const resource: OCPAppResource<ApplicationStatus> = {
        apiVersion: 'apps/v1',
        kind: 'deployment',
        name: 'test',
        namespace: 'test-ns',
        label: 'annotation=value=with=equals',
        metadata: { name: 'test', namespace: 'test-ns' },
      }
      expect(getLabels(resource)).toEqual({
        annotation: 'value=with=equals',
      })
    })

    it('skips segments without "="', () => {
      const resource: OCPAppResource<ApplicationStatus> = {
        apiVersion: 'apps/v1',
        kind: 'deployment',
        name: 'test',
        namespace: 'test-ns',
        label: 'valid=ok;noequals;another=value',
        metadata: { name: 'test', namespace: 'test-ns' },
      }
      expect(getLabels(resource)).toEqual({
        valid: 'ok',
        another: 'value',
      })
    })
  })

  describe('getApplicationId', () => {
    it('returns name-namespace-hash for resource with metadata and clusters', () => {
      const resource: IResource = {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: { name: 'my-app', namespace: 'my-ns' },
      }
      const clusters = ['cluster-1', 'cluster-2']
      const hash = sha256(JSON.stringify(clusters))
      expect(getApplicationId(resource, clusters)).toBe(`my-app-my-ns-${hash}`)
    })

    it('produces same id for same resource and clusters', () => {
      const resource: IResource = {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: { name: 'app', namespace: 'ns' },
      }
      const clusters = ['c1']
      expect(getApplicationId(resource, clusters)).toBe(getApplicationId(resource, clusters))
    })

    it('produces different id for different clusters', () => {
      const resource: IResource = {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: { name: 'app', namespace: 'ns' },
      }
      const id1 = getApplicationId(resource, ['cluster-a'])
      const id2 = getApplicationId(resource, ['cluster-b'])
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^app-ns-[a-f0-9]{64}$/)
      expect(id2).toMatch(/^app-ns-[a-f0-9]{64}$/)
    })

    it('handles empty clusters array', () => {
      const resource: IResource = {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: { name: 'app', namespace: 'ns' },
      }
      const hash = sha256(JSON.stringify([]))
      expect(getApplicationId(resource, [])).toBe(`app-ns-${hash}`)
    })

    it('handles resource with undefined metadata', () => {
      const resource: IResource = {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
      }
      const clusters = ['c1']
      const hash = sha256(JSON.stringify(clusters))
      expect(getApplicationId(resource, clusters)).toBe(`undefined-undefined-${hash}`)
    })
  })

  describe('isOCPAppResource', () => {
    it('returns true when resource has label property', () => {
      const resource = {
        apiVersion: 'apps/v1',
        kind: 'deployment',
        name: 'test',
        namespace: 'test-ns',
        label: 'app=test',
        metadata: { name: 'test', namespace: 'test-ns' },
      }
      expect(isOCPAppResource(resource)).toBe(true)
    })

    it('returns false when resource has no label property', () => {
      const resource: IResource = {
        apiVersion: 'app.k8s.io/v1beta1',
        kind: ApplicationKind,
        metadata: { name: 'app-0', namespace: 'ns-0' },
      }
      expect(isOCPAppResource(resource)).toBe(false)
    })

    it('returns false for ApplicationSet', () => {
      const resource: IResource = {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: ApplicationSetKind,
        metadata: { name: 'appset-0', namespace: 'ns-0' },
      }
      expect(isOCPAppResource(resource)).toBe(false)
    })
  })
})
