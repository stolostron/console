/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateCredentialModal } from './CreateCredentialModal'

// mock for the translation function
jest.mock('../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'Add credential') return 'Add credential'
      return key
    },
  }),
}))

describe('CreateCredentialModal', () => {
  test('renders with default button text', () => {
    const mockHandleModalToggle = jest.fn()

    render(<CreateCredentialModal handleModalToggle={mockHandleModalToggle} />)

    // checks that the button is rendered with default text
    const button = screen.getByRole('button', { name: 'Add credential' })
    expect(button).toBeInTheDocument()
  })

  test('renders with custom button text', () => {
    const mockHandleModalToggle = jest.fn()
    const customText = 'Custom Button Text'

    render(<CreateCredentialModal handleModalToggle={mockHandleModalToggle} buttonText={customText} />)

    // checksthat the button is rendered with custom text
    const button = screen.getByRole('button', { name: customText })
    expect(button).toBeInTheDocument()
  })

  test('calls handleModalToggle when button is clicked', async () => {
    const mockHandleModalToggle = jest.fn()

    render(<CreateCredentialModal handleModalToggle={mockHandleModalToggle} />)

    // finds the button
    const button = screen.getByRole('button', { name: 'Add credential' })

    // clicks the button
    await userEvent.click(button)

    // verifies that handleModalToggle was called
    expect(mockHandleModalToggle).toHaveBeenCalledTimes(1)
  })

  test('has correct button styling', () => {
    const mockHandleModalToggle = jest.fn()

    render(<CreateCredentialModal handleModalToggle={mockHandleModalToggle} />)

    // finds the button
    const button = screen.getByRole('button', { name: 'Add credential' })

    // checks Patternfly classes
    expect(button).toHaveClass('pf-v5-c-button') // base button class
    expect(button).toHaveClass('pf-m-link') // link variant class
    expect(button).toHaveClass('pf-m-inline') // online class
  })

  test('is contained within a MenuFooter', () => {
    const mockHandleModalToggle = jest.fn()

    const { container } = render(<CreateCredentialModal handleModalToggle={mockHandleModalToggle} />)

    // check that the MenuFooter element exists
    const menuFooter = container.querySelector('.pf-v5-c-menu__footer')
    expect(menuFooter).toBeInTheDocument()
  })
})
