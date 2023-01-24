/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import { AcmIcon, AcmIconVariant } from './AcmIcons'

describe('AcmIcon', () => {
  Object.values(AcmIconVariant).forEach((icon) => {
    test(`has zero accessibility defects - ${icon}`, async () => {
      const { container } = render(<AcmIcon icon={icon} />)
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
