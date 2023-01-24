/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
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
})
