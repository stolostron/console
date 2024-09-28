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

export const handleSemverOperatorComparison = (
  versionToCompare: string,
  inputVersion: string,
  operator: SearchOperator
) => {
  const coerceVersion = (version: string) => semver.coerce(version) ?? version
  const coercedInputVersion = coerceVersion(inputVersion)
  const coercedVersionToCompare = coerceVersion(versionToCompare)
  const isValidSemver = (version: string | semver.SemVer) => semver.valid(version) !== null

  if (!isValidSemver(coercedInputVersion) || !isValidSemver(coercedVersionToCompare)) {
    return operator === SearchOperator.NotEquals
  }

  const useRange = !isValidSemver(inputVersion) && isValidSemver(coercedInputVersion)
  let safeInputValue = coercedInputVersion.toString()
  if (useRange) {
    const isMajorVersionAlone = !inputVersion.includes(
      `${semver.coerce(inputVersion)?.major}.${semver.coerce(inputVersion)?.minor}`
    )
    if (isMajorVersionAlone) {
      safeInputValue = safeInputValue.toString().split('.').slice(0, 1).join('.')
    } else {
      safeInputValue = safeInputValue.toString().split('.').slice(0, 2).join('.')
    }
  }
  const semverSatisfies = (range: string) => semver.satisfies(coercedVersionToCompare, range)
  const semverCompare = (compareMethod: (a: string | semver.SemVer, b: string | semver.SemVer) => boolean) =>
    compareMethod(coercedVersionToCompare, coercedInputVersion)

  switch (operator) {
    case SearchOperator.Equals:
      return useRange ? semverSatisfies(safeInputValue) : semverCompare(semver.eq)
    case SearchOperator.GreaterThan:
      return useRange ? semverSatisfies(`>${coercedInputVersion}`) : semverCompare(semver.gt)
    case SearchOperator.GreaterThanOrEqualTo:
      return useRange ? semverSatisfies(`>=${coercedInputVersion}`) : semverCompare(semver.gte)
    case SearchOperator.LessThan:
      return useRange ? semverSatisfies(`<${coercedInputVersion}`) : semverCompare(semver.lt)
    case SearchOperator.LessThanOrEqualTo:
      return useRange ? semverSatisfies(`<=${coercedInputVersion}`) : semverCompare(semver.lte)
    case SearchOperator.NotEquals:
      return useRange ? !semverSatisfies(safeInputValue) : !semverCompare(semver.eq)
    default:
      return false
  }
}
