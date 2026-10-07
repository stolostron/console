/* Copyright Contributors to the Open Cluster Management project */

import i18next from 'i18next'
import GetHostedCard from './GetHostedCard'

const t = i18next.t.bind(i18next)

describe('GetHostedCard', () => {
  test('Return card data - Hypershift enabled', async () => {
    const hostedCard = GetHostedCard(() => {}, t, true)
    expect(hostedCard).toMatchSnapshot()
  })

  test('does not show an alert before the Hypershift status is loaded', () => {
    const hostedCard = GetHostedCard(() => {}, t, false, false)

    expect(hostedCard.alertTitle).toBeUndefined()
    expect(hostedCard.alertContent).toBeUndefined()
  })

  test('shows an alert when Hypershift is disabled after the status is loaded', () => {
    const hostedCard = GetHostedCard(() => {}, t, false, true)

    expect(hostedCard.alertTitle).toBe('Hosted control plane operator must be enabled in order to continue')
    expect(hostedCard.alertContent).toBeDefined()
  })
})
