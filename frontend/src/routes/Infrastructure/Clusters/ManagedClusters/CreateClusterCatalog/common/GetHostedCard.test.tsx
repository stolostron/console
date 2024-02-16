/* Copyright Contributors to the Open Cluster Management project */

import i18next from 'i18next'
import GetHostedCard from './GetHostedCard'

const t = i18next.t.bind(i18next)

describe('GetHostedCard', () => {
  test('Return card data - Hypershift enabled', async () => {
    const hostedCard = GetHostedCard(() => {}, t, true)
    expect(hostedCard).toMatchSnapshot()
  })
})
