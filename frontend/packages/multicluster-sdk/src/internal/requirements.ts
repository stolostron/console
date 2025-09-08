/* Copyright Contributors to the Open Cluster Management project */
import { MatchExpression, MatchLabels, Selector } from '@openshift-console/dynamic-plugin-sdk'

const toArray = (value: any) => (Array.isArray(value) ? value : [value])

const requirementToString = (requirement: MatchExpression): string => {
  if (requirement.operator === 'Equals') {
    return `${requirement.key}=${requirement.values?.[0]}`
  }

  if (requirement.operator === 'NotEquals') {
    return `${requirement.key}!=${requirement.values?.[0]}`
  }

  if (requirement.operator === 'Exists') {
    return requirement.key
  }

  if (requirement.operator === 'DoesNotExist') {
    return `!${requirement.key}`
  }

  if (requirement.operator === 'In') {
    return `${requirement.key} in (${toArray(requirement.values).join(',')})`
  }

  if (requirement.operator === 'NotIn') {
    return `${requirement.key} notin (${toArray(requirement.values).join(',')})`
  }

  if (requirement.operator === 'GreaterThan') {
    return `${requirement.key} > ${requirement.values?.[0]}`
  }

  if (requirement.operator === 'LessThan') {
    return `${requirement.key} < ${requirement.values?.[0]}`
  }

  return ''
}

const createEquals = (key: string, value: string): MatchExpression => ({
  key,
  operator: 'Equals',
  values: [value],
})

const toRequirements = (selector: Selector = {}): MatchExpression[] => {
  const requirements: MatchExpression[] = []
  const matchLabels: MatchLabels = selector.matchLabels || {}
  const { matchExpressions } = selector

  Object.keys(matchLabels || {})
    .sort((a, b) => a.localeCompare(b))
    .forEach((k: string) => {
      requirements.push(createEquals(k, matchLabels[k]))
    })
  ;(matchExpressions || []).forEach((me) => {
    requirements.push(me)
  })

  return requirements
}

export const selectorToString = (selector: Selector): string => {
  const requirements = toRequirements(selector)
  return requirements.map(requirementToString).join(',')
}
