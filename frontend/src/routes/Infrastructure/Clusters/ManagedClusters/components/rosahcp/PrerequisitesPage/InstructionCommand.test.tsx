/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import InstructionCommand from './InstructionCommand'

describe('InstructionCommand', () => {
  test('should render the command text', () => {
    render(<InstructionCommand>rosa create cluster</InstructionCommand>)

    expect(screen.getByDisplayValue('rosa create cluster')).toBeInTheDocument()
  })

  test('should render a ClipboardCopy component', () => {
    const { container } = render(<InstructionCommand>test command</InstructionCommand>)

    expect(container.querySelector('[class*="clipboard-copy"]')).toBeInTheDocument()
  })

  test('should apply the textAriaLabel prop', () => {
    render(<InstructionCommand textAriaLabel="Copyable command">some command</InstructionCommand>)

    expect(screen.getByLabelText('Copyable command')).toBeInTheDocument()
  })

  test('should apply the className prop', () => {
    const { container } = render(<InstructionCommand className="custom-class">test command</InstructionCommand>)

    const preElement = container.querySelector('pre')
    expect(preElement).toHaveClass('custom-class')
  })

  test('should render the input as read only', () => {
    render(<InstructionCommand>test command</InstructionCommand>)

    const input = screen.getByDisplayValue('test command')
    expect(input).toHaveAttribute('readonly')
  })

  test('should have no accessibility violations', async () => {
    const { container } = render(<InstructionCommand>test command</InstructionCommand>)

    expect(await axe(container)).toHaveNoViolations()
  })
})
