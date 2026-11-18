/* Copyright Contributors to the Open Cluster Management project */

export const getLabels = (clusterSelector: any) => {
  return clusterSelector?.matchExpressions
    ?.map(({ key, operator, values }: { key: string; operator: string; values: string[] }) => {
      if (key && operator && (operator === 'DoesNotExist' || operator === 'Exists')) {
        return `${key} "${operator}"`
      }
      if (!key || !operator || !values) {
        return '#invalidExpr'
      }
      return `${key} "${operator}" ${values.join(', ')}`
    })
    .join('; ')
}

export const getMatchLabels = (clusterSelector: any) => {
  return Object.entries(clusterSelector?.matchLabels ? clusterSelector.matchLabels : {})
    .map(([key, value]) => {
      return `${key}=${value}`
    })
    .join('; ')
}
