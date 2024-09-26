/* Copyright Contributors to the Open Cluster Management project */

export const handleOperatorComparison = (value: string, selectedValue: string) => {
  return value.localeCompare(selectedValue) === 0
}
