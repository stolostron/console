/* Copyright Contributors to the Open Cluster Management project */
import * as semver from 'semver'
import { SearchOperator } from '../ui-components/AcmSearchInput'

// handleStandardComparison uses localeCompare's API to evaluate string sort order. We assume values sorted earlier are "greater than"
export const handleStandardComparison = (valueOne: string, valueTwo: string, operator: SearchOperator) => {
  switch (operator) {
    case SearchOperator.Equals:
      return valueOne.localeCompare(valueTwo) === 0
    case SearchOperator.GreaterThan:
      return valueOne.localeCompare(valueTwo) < 0
    case SearchOperator.LessThan:
      return valueOne.localeCompare(valueTwo) > 0
    case SearchOperator.GreaterThanOrEqualTo:
      return valueOne.localeCompare(valueTwo) < 0 || valueOne.localeCompare(valueTwo) === 0
    case SearchOperator.LessThanOrEqualTo:
      return valueOne.localeCompare(valueTwo) > 0 || valueOne.localeCompare(valueTwo) === 0
    case SearchOperator.NotEquals:
      return valueOne.localeCompare(valueTwo) !== 0
    default:
      return false
  }
}

export const handleSemverOperatorComparison = (versionToCompare: string, input: string, operator: SearchOperator) => {
  const coercedInputVersion = semver.coerce(input)
  const coercedVersionToCompare = semver.coerce(versionToCompare)

  if (!coercedInputVersion || !coercedVersionToCompare) {
    // No valid semver in either case, so assume these are not equal
    return operator === SearchOperator.NotEquals
  }

  // if user enters partial semver, coerce will assume the missing components are 0
  // coerce is still useful in case the user enters more text than just a semver
  let inputVersion = `${coercedInputVersion.major}.${coercedInputVersion.minor}.${coercedInputVersion.patch}`
  if (!input.includes(inputVersion)) {
    inputVersion = `${coercedInputVersion.major}.${coercedInputVersion.minor}`
  }
  if (!input.includes(inputVersion)) {
    inputVersion = `${coercedInputVersion.major}`
  }

  switch (operator) {
    case SearchOperator.Equals:
      return semver.satisfies(coercedVersionToCompare, inputVersion)
    case SearchOperator.GreaterThan:
      return semver.satisfies(coercedVersionToCompare, `>${inputVersion}`)
    case SearchOperator.GreaterThanOrEqualTo:
      return semver.satisfies(coercedVersionToCompare, `>=${inputVersion}`)
    case SearchOperator.LessThan:
      return semver.satisfies(coercedVersionToCompare, `<${inputVersion}`)
    case SearchOperator.LessThanOrEqualTo:
      return semver.satisfies(coercedVersionToCompare, `<=${inputVersion}`)
    case SearchOperator.NotEquals:
      return !semver.satisfies(coercedVersionToCompare, inputVersion)
    default:
      return false
  }
}
