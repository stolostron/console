/* Copyright Contributors to the Open Cluster Management project */
import { SearchOperator } from '../ui-components/AcmSearchInput'
import { handleStandardComparison, handleSemverOperatorComparison } from './search-utils'

const stringData = {
  stringOne: 'Adam',
  stringTwo: 'Becky',
  stringThree: 'Charlie',
  stringFour: 'David',
  stringFive: 'Eve',
}
const versionData = {
  versionOne: '1.0.0',
  versionTwo: '1.5.0',
  versionThree: '2.0.0',
  versionFour: '2.5.0',
  versionIncomplete: '1.',
}

describe('search-utils basic string operator', () => {
  const { stringOne, stringTwo, stringThree, stringFour, stringFive } = stringData
  it('can determine equals', () => {
    expect(handleStandardComparison(stringOne, stringOne, SearchOperator.Equals)).toBeTruthy()
  })
  it('can determine greater', () => {
    expect(handleStandardComparison(stringOne, stringTwo, SearchOperator.GreaterThan)).toBeTruthy()
  })
  it('can determine less', () => {
    expect(handleStandardComparison(stringFour, stringThree, SearchOperator.LessThan)).toBeTruthy()
  })
  it('can determine greater than or equal to', () => {
    expect(handleStandardComparison(stringOne, stringOne, SearchOperator.GreaterThanOrEqualTo)).toBeTruthy()
    expect(handleStandardComparison(stringOne, stringTwo, SearchOperator.GreaterThanOrEqualTo)).toBeTruthy()
  })
  it('can determine less than or equal to', () => {
    expect(handleStandardComparison(stringOne, stringOne, SearchOperator.LessThanOrEqualTo)).toBeTruthy()
    expect(handleStandardComparison(stringFive, stringOne, SearchOperator.LessThanOrEqualTo)).toBeTruthy()
  })
  it('can determine non-equals', () => {
    expect(handleStandardComparison(stringOne, stringFive, SearchOperator.Equals)).toBeFalsy()
  })
})

describe('search-utils sermver operator', () => {
  const { versionOne, versionTwo, versionThree, versionFour, versionIncomplete } = versionData
  it('can determine greater semver', () => {
    expect(handleSemverOperatorComparison(versionFour, versionThree, SearchOperator.GreaterThan)).toBeTruthy()
  })
  it('can determine less semver', () => {
    expect(handleSemverOperatorComparison(versionOne, versionTwo, SearchOperator.LessThan)).toBeTruthy()
  })
  it('can determine equals semver', () => {
    expect(handleSemverOperatorComparison(versionOne, versionOne, SearchOperator.Equals)).toBeTruthy()
  })
  it('can determine greater than or equal to semver', () => {
    expect(handleSemverOperatorComparison(versionThree, versionThree, SearchOperator.GreaterThanOrEqualTo)).toBeTruthy()
    expect(handleSemverOperatorComparison(versionFour, versionThree, SearchOperator.GreaterThanOrEqualTo)).toBeTruthy()
  })
  it('can determine less than or equal to semver', () => {
    expect(handleSemverOperatorComparison(versionTwo, versionTwo, SearchOperator.LessThanOrEqualTo)).toBeTruthy()
    expect(handleSemverOperatorComparison(versionOne, versionTwo, SearchOperator.LessThanOrEqualTo)).toBeTruthy()
  })
  it('can determine non-equal semver', () => {
    expect(handleSemverOperatorComparison(versionOne, versionTwo, SearchOperator.NotEquals)).toBeTruthy()
  })
  it('can coerce incomplete semver strings', () => {
    expect(handleSemverOperatorComparison(versionIncomplete, versionOne, SearchOperator.Equals)).toBeTruthy()
  })
})
