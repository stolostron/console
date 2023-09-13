/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { useRecoilState, useSharedAtoms } from '../../../shared-recoil'
import { Policy } from '../../../resources/policy'
import { getPolicyRemediation } from './util'
import { cloneDeep } from 'lodash'

export function useAddRemediationPolicies() {
  const { policiesState, usePolicies } = useSharedAtoms()
  const policies = usePolicies()
  const [propaPolicies] = useRecoilState(policiesState)
  const filteredPolicies: Policy[] = useMemo(() => {
    const resultPolicies = policies.map((p) => {
      const policyName = p.metadata.name ?? ''
      const policyNamespace = p.metadata.namespace ?? ''
      const matchedPropagated: Policy[] = propaPolicies.filter(
        (p: Policy) => p.metadata.name === `${policyNamespace}.${policyName}`
      )
      const result = cloneDeep(p)
      result.remediationResult = getPolicyRemediation(p, matchedPropagated)
      return result
    })
    return resultPolicies
  }, [propaPolicies, policies])
  return filteredPolicies
}

export function usePropagatedPolicies(policy: Policy) {
  const { policiesState } = useSharedAtoms()
  const [propaPolicies] = useRecoilState(policiesState)
  const filteredPolicies: Policy[] = useMemo(() => {
    const policyName = policy.metadata.name ?? ''
    const policyNamespace = policy.metadata.namespace ?? ''
    const matchedPropagated: Policy[] = propaPolicies.filter(
      (p: Policy) => p.metadata.name === `${policyNamespace}.${policyName}`
    )
    return matchedPropagated
  }, [propaPolicies, policy])
  return filteredPolicies
}
