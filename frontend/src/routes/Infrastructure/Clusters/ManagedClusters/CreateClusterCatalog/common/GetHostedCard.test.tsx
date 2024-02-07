/* Copyright Contributors to the Open Cluster Management project */

import i18next from 'i18next'
import GetHostedCard from './GetHostedCard'

const t = i18next.t.bind(i18next)

describe('GetHostedCard', () => {
  test('Return card data - Hypershift enabled, CLI based', async () => {
    const hostedCard = GetHostedCard(() => {}, t, true, true)
    expect(hostedCard).toMatchSnapshot()
  })

  test('Return card data - Hypershift disabled, non-CLI based', async () => {
    const hostedCard = GetHostedCard(() => {}, t, false, false)
    expect(hostedCard).toMatchSnapshot()
  })
})
