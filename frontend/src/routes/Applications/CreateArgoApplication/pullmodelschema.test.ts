/* Copyright Contributors to the Open Cluster Management project */

import Ajv from 'ajv'
import { addAjvKeywords } from '~/components/SyncEditor/validation'
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
  expect(
    validate(
      applicationSet(
        {
          'apps.open-cluster-management.io/ocm-managed-cluster': '{{name}}',
          'apps.open-cluster-management.io/ocm-managed-cluster-app-namespace': 'openshift-gitops',
          'argocd.argoproj.io/skip-reconcile': 'true',
        },
        { server: '{{server}}' }
      )
    )
  ).toBe(true)
})

test.each([undefined, { 'example.com/team': 'application-team' }])(
  'validates Agent destinations with optional annotations: %j',
  (annotations) => {
    expect(validate(applicationSet(annotations, { name: '{{name}}' }))).toBe(true)
  }
)

test.each([undefined, { 'apps.open-cluster-management.io/ocm-managed-cluster': '{{name}}' }])(
  'rejects incomplete ManifestWork metadata without an Agent destination: %j',
  (annotations) => {
    expect(validate(applicationSet(annotations, { server: '{{server}}' }))).toBe(false)
  }
)
