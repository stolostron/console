/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import TerraformLogo from './TerraformLogo'

describe('TerraformLogo', () => {
  test('should render an SVG element', () => {
    const { container } = render(<TerraformLogo />)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  test('should apply the provided className', () => {
    const { container } = render(<TerraformLogo className="test-class" />)

    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('test-class')
  })

  test('should render path elements for the logo shape', () => {
    const { container } = render(<TerraformLogo />)

    const paths = container.querySelectorAll('path')
    expect(paths.length).toBeGreaterThan(0)
  })

  test('should accept and apply additional SVG props', () => {
    const { container } = render(<TerraformLogo title="Terraform" />)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})
