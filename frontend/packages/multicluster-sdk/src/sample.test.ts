/* Copyright Contributors to the Open Cluster Management project */
describe('Sample tests to check the jest setup', () => {
  it('passing test', () => {
    expect(1 + 1).toBe(2)
  })

  it.skip('failing test', () => {
    expect(1 + 1).toBe(1)
  })
})
