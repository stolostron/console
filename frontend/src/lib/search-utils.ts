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

// for a given displayVersion string there is a distribution value a ' ' and a semver value, here we divide them and take the semver
export const handleSemverOperatorComparison = (versionOne: string, versionTwo: string, operator: SearchOperator) => {
  // Semver coerces the version to a valid semver version if possible, otherwise it returns the original value
  const coercedVersionOne = semver.valid(semver.coerce(versionOne)) ?? versionOne
  const coercedVersionTwo = semver.valid(semver.coerce(versionTwo)) ?? versionTwo

  const validInputSemvers = !!semver.valid(coercedVersionOne) && !!semver.valid(coercedVersionTwo)
  if (!validInputSemvers) {
    if (operator === SearchOperator.NotEquals) {
      return true
    }
    return false
  }
  switch (operator) {
    case SearchOperator.Equals:
      return semver.eq(coercedVersionOne, coercedVersionTwo)
    case SearchOperator.GreaterThan:
      return semver.gt(coercedVersionOne, coercedVersionTwo)
    case SearchOperator.LessThan:
      return semver.lt(coercedVersionOne, coercedVersionTwo)
    case SearchOperator.GreaterThanOrEqualTo:
      return semver.gte(coercedVersionOne, coercedVersionTwo)
    case SearchOperator.LessThanOrEqualTo:
      return semver.lte(coercedVersionOne, coercedVersionTwo)
    case SearchOperator.NotEquals:
      return !semver.eq(coercedVersionOne, coercedVersionTwo)
    default:
      return false
  }
}
