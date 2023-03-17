/* Copyright Contributors to the Open Cluster Management project */

import { V1CustomResourceDefinitionCondition } from '@kubernetes/client-node/dist/gen/model/v1CustomResourceDefinitionCondition'

export const checkForCondition = (
  condition: string,
  conditions: V1CustomResourceDefinitionCondition[],
  status?: string
) => conditions?.find((c) => c.type === condition)?.status === (status ?? 'True')

export const getConditionMessage = (condition: string, conditions: V1CustomResourceDefinitionCondition[]) => {
  const cond = conditions?.find((c) => c.type === condition)
  return cond?.message
}

export const getConditionReason = (condition: string, conditions: V1CustomResourceDefinitionCondition[]) => {
  const cond = conditions?.find((c) => c.type === condition)
  return cond?.reason
}

export const checkForRequirementsMetConditionFailureReason = (
  reason: string,
  conditions: V1CustomResourceDefinitionCondition[]
) => {
  const cond = conditions?.find((c) => c.type === 'RequirementsMet')
  return cond?.status === 'False' && cond?.reason === reason
}

export const checkCuratorLatestOperation = (condition: string, conditions: V1CustomResourceDefinitionCondition[]) => {
  const cond = conditions?.find((c) => c.message?.includes(condition))
  return cond?.status === 'False' && cond.reason === 'Job_has_finished'
}

export const checkCuratorLatestFailedOperation = (
  condition: string,
  conditions: V1CustomResourceDefinitionCondition[]
) => {
  const cond = conditions?.find((c) => c.message?.includes(condition))
  return cond?.status === 'True' && cond.reason === 'Job_failed'
}

export const checkCuratorConditionInProgress = (
  condition: string,
  conditions: V1CustomResourceDefinitionCondition[]
) => {
  const cond = conditions?.find((c) => c.type === condition)
  return cond?.status === 'False' && cond?.reason === 'Job_has_finished'
}

export const getCuratorConditionMessage = (condition: string, conditions: V1CustomResourceDefinitionCondition[]) => {
  const cond = conditions?.find((c) => c.type === condition)
  return cond?.message
}

export const checkCuratorConditionFailed = (condition: string, conditions: V1CustomResourceDefinitionCondition[]) => {
  const cond = conditions?.find((c) => c.type === condition)
  return cond?.status === 'True' && cond?.reason === 'Job_failed'
}

export const checkCuratorConditionDone = (condition: string, conditions: V1CustomResourceDefinitionCondition[]) => {
  const cond = conditions?.find((c) => c.type === condition)
  return cond?.status === 'True' && cond?.reason === 'Job_has_finished'
}
