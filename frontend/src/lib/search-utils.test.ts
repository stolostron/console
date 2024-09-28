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

const incompleteVersionData = {
  versionOneIncomplete: '1.',
  versionTwoIncomplete: '1.5',
  versionThreeIncomplete: '2',
  versionFourIncomplete: '2.5',
  versionFiveIncomplete: '2.5.',
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
  const {
    versionOneIncomplete,
    versionTwoIncomplete,
    versionThreeIncomplete,
    versionFourIncomplete,
    versionFiveIncomplete,
  } = incompleteVersionData

  it('can determine greater than semver', () => {
    expect(handleSemverOperatorComparison(versionFour, versionThree, SearchOperator.GreaterThan)).toBeTruthy()
  })
  it('can determine less than semver', () => {
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
  it('can infer on incomplete semver equals', () => {
    expect(handleSemverOperatorComparison(versionOne, versionOneIncomplete, SearchOperator.Equals)).toBeTruthy()
  })
  it('can infer on incomplete semver greater than', () => {
    expect(handleSemverOperatorComparison(versionTwo, versionOneIncomplete, SearchOperator.GreaterThan)).toBeTruthy()
  })
  it('can infer on incomplete semver greater than or equal to', () => {
    expect(
      handleSemverOperatorComparison(versionTwo, versionOneIncomplete, SearchOperator.GreaterThanOrEqualTo)
    ).toBeTruthy()
  })
  it('can infer on incomplete semver less than', () => {
    expect(handleSemverOperatorComparison(versionOne, versionTwoIncomplete, SearchOperator.LessThan)).toBeTruthy()
  })
  it('can infer on incomplete semver less than or equal to', () => {
    expect(
      handleSemverOperatorComparison(versionOne, versionThreeIncomplete, SearchOperator.LessThanOrEqualTo)
    ).toBeTruthy()
  })
  it('can infer on incomplete semver not equals', () => {
    expect(handleSemverOperatorComparison(versionOne, versionFourIncomplete, SearchOperator.NotEquals)).toBeTruthy()
  })
  it('can infer with incomplete semver form x.', () => {
    expect(
      handleSemverOperatorComparison(versionOneIncomplete, versionFiveIncomplete, SearchOperator.LessThan)
    ).toBeTruthy()
  })
  it('can infer with incomplete semver form x.y.', () => {
    expect(handleSemverOperatorComparison(versionFour, versionFiveIncomplete, SearchOperator.Equals)).toBeTruthy()
  })
})
