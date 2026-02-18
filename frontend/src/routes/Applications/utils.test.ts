/* Copyright Contributors to the Open Cluster Management project */

import { ApplicationKind, ApplicationSetKind, IResource } from '../../resources'
import { getLabels, isOCPAppResource } from './utils'
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
