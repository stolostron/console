/* Copyright Contributors to the Open Cluster Management project */

import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { AcmInlineProvider } from './AcmInlineProvider'
import { Provider, ProviderLongTextMap } from '../'

describe('AcmInlineProvider', () => {
  Object.values(Provider).forEach((provider) => {
    test(`renders - ${provider}`, async () => {
      const { container, queryAllByText } = render(<AcmInlineProvider provider={provider} />)
      expect(queryAllByText(ProviderLongTextMap[provider])).toBeTruthy()
      expect(await axe(container)).toHaveNoViolations()
    })
  })

  test('iconOnly hides the long text and exposes an accessible label', async () => {
    const { container } = render(<AcmInlineProvider provider={Provider.aws} iconOnly />)
    expect(screen.queryByText(ProviderLongTextMap[Provider.aws])).not.toBeInTheDocument()
    expect(screen.getByLabelText(ProviderLongTextMap[Provider.aws])).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  test('iconOnly is keyboard focusable and shows the provider name in a tooltip on focus', async () => {
    const { container } = render(<AcmInlineProvider provider={Provider.aws} iconOnly />)
    await userEvent.tab()
    const icon = screen.getByRole('img', { name: ProviderLongTextMap[Provider.aws] })
    expect(icon).toHaveFocus()
    expect(await screen.findByRole('tooltip')).toHaveTextContent(ProviderLongTextMap[Provider.aws])
    expect(await axe(container)).toHaveNoViolations()
  })
})
