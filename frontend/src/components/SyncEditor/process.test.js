/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import { processUser } from './process'

describe('Test process.ts', () => {
  afterAll(() => {
    jest.resetAllMocks()
  })

  const policyYamlWithUid =
    'apiVersion: policy.open-cluster-management.io/v1\n' +
    'kind: Policy\n' +
    'metadata:\n' +
    '  name: foobar\n' +
    '  namespace: default\n' +
    '  uid: 9f7de1f1-b46f-47df-8ef4-0930aecc5902\n' +
    'spec:\n' +
    '  disabled: false\n'

  const processUserWrapper = (monacoRef, yaml, editableUidSiblings) => {
    return processUser(monacoRef, yaml, [], [], false, [], [], [], false, [], yaml, editableUidSiblings)
  }

  it('should not have any protected ranges when Uid siblings are editable', () => {
    const monacoRef = { current: { Range: jest.fn() } }
    const { protectedRanges } = processUserWrapper(monacoRef, policyYamlWithUid, true)
    expect(protectedRanges).toEqual([])
  })

  it('should have protected ranges when Uid siblings are not editable', () => {
    const monacoRef = { current: { Range: jest.fn() } }
    const { protectedRanges } = processUserWrapper(monacoRef, policyYamlWithUid, false)
    expect(protectedRanges).toHaveLength(3) // name, namespace, and uid
  })
})
