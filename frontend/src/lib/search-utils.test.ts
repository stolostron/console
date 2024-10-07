/* Copyright Contributors to the Open Cluster Management project */
import { SearchOperator } from '../ui-components/AcmSearchInput'
import { handleStandardComparison, handleSemverOperatorComparison } from './search-utils'

describe('search-utils basic string operator', () => {
  it('can determine equals', () => {
    expect(handleStandardComparison('Adam', 'Adam', SearchOperator.Equals)).toBeTruthy()
  })
  it('can determine greater', () => {
    expect(handleStandardComparison('Adam', 'Becky', SearchOperator.GreaterThan)).toBeTruthy()
  })
  it('can determine less', () => {
    expect(handleStandardComparison('David', 'Charlie', SearchOperator.LessThan)).toBeTruthy()
  })
  it('can determine greater than or equal to', () => {
    expect(handleStandardComparison('Adam', 'Adam', SearchOperator.GreaterThanOrEqualTo)).toBeTruthy()
    expect(handleStandardComparison('Adam', 'Becky', SearchOperator.GreaterThanOrEqualTo)).toBeTruthy()
  })
  it('can determine less than or equal to', () => {
    expect(handleStandardComparison('Adam', 'Adam', SearchOperator.LessThanOrEqualTo)).toBeTruthy()
    expect(handleStandardComparison('Eve', 'Adam', SearchOperator.LessThanOrEqualTo)).toBeTruthy()
  })
  it('can determine non-equals', () => {
    expect(handleStandardComparison('Adam', 'Eve', SearchOperator.Equals)).toBeFalsy()
  })
})

describe('search-utils sermver operator', () => {
  it('can determine greater than semver', () => {
    expect(handleSemverOperatorComparison('2.5.0', '2.0.0', SearchOperator.GreaterThan)).toBeTruthy()
  })
  it('can determine less than semver', () => {
    expect(handleSemverOperatorComparison('1.0.0', '1.5.0', SearchOperator.LessThan)).toBeTruthy()
  })
  it('can determine equals semver', () => {
    expect(handleSemverOperatorComparison('1.0.0', '1.0.0', SearchOperator.Equals)).toBeTruthy()
  })
  it('can determine greater than or equal to semver', () => {
    expect(handleSemverOperatorComparison('2.0.0', '2.0.0', SearchOperator.GreaterThanOrEqualTo)).toBeTruthy()
    expect(handleSemverOperatorComparison('2.5.0', '2.0.0', SearchOperator.GreaterThanOrEqualTo)).toBeTruthy()
  })
  it('can determine less than or equal to semver', () => {
    expect(handleSemverOperatorComparison('1.5.0', '1.5.0', SearchOperator.LessThanOrEqualTo)).toBeTruthy()
    expect(handleSemverOperatorComparison('1.0.0', '1.5.0', SearchOperator.LessThanOrEqualTo)).toBeTruthy()
  })
  it('can determine non-equal semver', () => {
    expect(handleSemverOperatorComparison('1.0.0', '1.5.0', SearchOperator.NotEquals)).toBeTruthy()
  })
  it('can coerce incomplete semver strings', () => {
    expect(handleSemverOperatorComparison('1.', '1.0.0', SearchOperator.Equals)).toBeTruthy()
  })
  it('can infer on incomplete semver equals', () => {
    expect(handleSemverOperatorComparison('1.0.0', '1.', SearchOperator.Equals)).toBeTruthy()
  })
  it('can infer on incomplete semver greater than', () => {
    expect(handleSemverOperatorComparison('2.5.0', '1.', SearchOperator.GreaterThan)).toBeTruthy()
  })
  it('can infer on incomplete semver greater than or equal to', () => {
    expect(handleSemverOperatorComparison('1.5.0', '1.', SearchOperator.GreaterThanOrEqualTo)).toBeTruthy()
  })
  it('can infer on incomplete semver less than', () => {
    expect(handleSemverOperatorComparison('1.0.0', '1.5', SearchOperator.LessThan)).toBeTruthy()
  })
  it('can infer on incomplete semver less than or equal to', () => {
    expect(handleSemverOperatorComparison('1.0.0', '2', SearchOperator.LessThanOrEqualTo)).toBeTruthy()
  })
  it('can infer on incomplete semver not equals', () => {
    expect(handleSemverOperatorComparison('1.0.0', '2.5', SearchOperator.NotEquals)).toBeTruthy()
  })
  it('can infer with incomplete semver form x.', () => {
    expect(handleSemverOperatorComparison('1.', '2.5.', SearchOperator.LessThan)).toBeTruthy()
  })
  it('can infer with incomplete semver form x.y.', () => {
    expect(handleSemverOperatorComparison('2.5.0', '2.5.', SearchOperator.Equals)).toBeTruthy()
  })
})
