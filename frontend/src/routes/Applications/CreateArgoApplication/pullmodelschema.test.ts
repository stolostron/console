/* Copyright Contributors to the Open Cluster Management project */

import Ajv from 'ajv'
import { addAjvKeywords } from '~/components/SyncEditor/validation'
import { APPLICATION_SET_GITOPS_MODEL_ANNOTATION } from '~/resources/application-set'
import { getApplicationModel } from '~/routes/Applications/helpers/resource-helper'
import schemas from './pullmodelschema.json'

const ajv = new Ajv({ allErrors: true })
addAjvKeywords(ajv)
const validate = ajv.compile(schemas[0].schema)

function applicationSet(annotations?: Record<string, string>, destination: Record<string, string> = {}) {
  return {
    apiVersion: 'argoproj.io/v1alpha1',
    kind: 'ApplicationSet',
    metadata: { name: 'guestbook', namespace: 'openshift-gitops' },
    spec: {
      generators: [{ list: { elements: [] } }],
      template: {
        metadata: { name: 'guestbook-{{name}}', ...(annotations && { annotations }) },
        spec: { project: 'default', destination: { namespace: 'guestbook', ...destination }, sources: [] },
      },
    },
  }
}

test('validates ManifestWork propagation metadata', () => {
  const resource = applicationSet(
    {
      'apps.open-cluster-management.io/ocm-managed-cluster': '{{name}}',
      'apps.open-cluster-management.io/ocm-managed-cluster-app-namespace': 'openshift-gitops',
      'argocd.argoproj.io/skip-reconcile': 'true',
    },
    { server: '{{server}}' }
  )
  expect(validate(resource)).toBe(true)
  expect(getApplicationModel(resource)).toBe('manifestwork')

  resource.spec.template.metadata.annotations!['apps.open-cluster-management.io/ocm-managed-cluster'] = ''
  expect(validate(resource)).toBe(false)
})

test.each([undefined, { 'example.com/team': 'application-team' }])(
  'validates identifiable Agent resources with optional template annotations: %j',
  (annotations) => {
    const resource = {
      ...applicationSet(annotations, { name: '{{name}}' }),
      metadata: {
        name: 'guestbook',
        namespace: 'openshift-gitops',
        annotations: { [APPLICATION_SET_GITOPS_MODEL_ANNOTATION]: 'agent' },
      },
    }
    expect(validate(resource)).toBe(true)
    expect(getApplicationModel(resource)).toBe('agent')
  }
)

test.each([undefined, {}, { [APPLICATION_SET_GITOPS_MODEL_ANNOTATION]: 'push' }])(
  'rejects named destinations without the Agent identity: %j',
  (annotations) => {
    const resource = applicationSet(undefined, { name: '{{name}}' })
    expect(validate({ ...resource, metadata: { ...resource.metadata, annotations } })).toBe(false)
  }
)

test.each<Record<string, string>>([{}, { server: '{{server}}' }, { name: '' }])(
  'rejects an Agent resource without a nonempty named destination: %j',
  (destination) => {
    const resource = applicationSet(undefined, destination)
    expect(
      validate({
        ...resource,
        metadata: { ...resource.metadata, annotations: { [APPLICATION_SET_GITOPS_MODEL_ANNOTATION]: 'agent' } },
      })
    ).toBe(false)
  }
)

test.each([undefined, { 'apps.open-cluster-management.io/ocm-managed-cluster': '{{name}}' }])(
  'rejects incomplete ManifestWork metadata without an Agent destination: %j',
  (annotations) => {
    expect(validate(applicationSet(annotations, { server: '{{server}}' }))).toBe(false)
  }
)
