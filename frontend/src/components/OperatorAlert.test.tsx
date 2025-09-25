/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { OperatorAlert } from './OperatorAlert'

// Mock react-i18next
jest.mock('../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('OperatorAlert', () => {
  const defaultProps = {
    component: 'alert' as const,
    operatorName: 'Test Operator',
    message: 'Test message',
  }

  const renderOperatorAlert = (props = {}) => {
    return render(
      <MemoryRouter>
        <OperatorAlert {...defaultProps} {...props} />
      </MemoryRouter>
    )
  }

  it('should render as alert component with danger variant by default', () => {
    const { container } = renderOperatorAlert()

    expect(screen.getByText('Operator required')).toBeInTheDocument()
    expect(screen.getByText('Test message')).toBeInTheDocument()

    // Check for danger variant class in the alert container
    const alertElement = container.querySelector('.pf-m-danger')
    expect(alertElement).toBeInTheDocument()
  })

  it('should render as hint component with info variant', () => {
    const { container } = renderOperatorAlert({ component: 'hint' })

    expect(screen.getByText('Operator required')).toBeInTheDocument()
    expect(screen.getByText('Test message')).toBeInTheDocument()

    // Check for info variant class in the alert container
    const alertElement = container.querySelector('.pf-m-info')
    expect(alertElement).toBeInTheDocument()
  })

  it('should render upgrade title when isUpgrade is true', () => {
    renderOperatorAlert({ isUpgrade: true })

    expect(screen.getByText('Operator upgrade required')).toBeInTheDocument()
  })

  it('should render custom title when provided', () => {
    const customTitle = 'Custom Alert Title'
    renderOperatorAlert({ title: customTitle })

    expect(screen.getByText(customTitle)).toBeInTheDocument()
  })

  it('should render install operator link when not upgrade', () => {
    renderOperatorAlert()

    const installLink = screen.getByText('Install the operator')
    expect(installLink).toBeInTheDocument()

    const linkElement = installLink.closest('a')
    expect(linkElement).toHaveAttribute('href', '/operatorhub/all-namespaces?keyword=Test%20Operator')
    expect(linkElement).toHaveAttribute('target', '_blank')
  })

  it('should render view installed operators link when isUpgrade is true', () => {
    renderOperatorAlert({ isUpgrade: true })

    const upgradeLink = screen.getByText('View installed operators')
    expect(upgradeLink).toBeInTheDocument()

    const linkElement = upgradeLink.closest('a')
    expect(linkElement).toHaveAttribute(
      'href',
      '/k8s/all-namespaces/operators.coreos.com~v1alpha1~ClusterServiceVersion'
    )
    expect(linkElement).toHaveAttribute('target', '_blank')
  })

  it('should apply custom className when provided', () => {
    const customClass = 'custom-alert-class'
    const { container } = renderOperatorAlert({ className: customClass })

    // Check that the custom class is applied to the alert element
    const alertElement = container.querySelector(`.${customClass}`)
    expect(alertElement).toBeInTheDocument()
  })

  it('should encode operator name in URL correctly', () => {
    const operatorWithSpaces = 'OpenShift Virtualization Operator'
    renderOperatorAlert({ operatorName: operatorWithSpaces })

    const installLink = screen.getByText('Install the operator')
    const linkElement = installLink.closest('a')
    expect(linkElement).toHaveAttribute(
      'href',
      '/operatorhub/all-namespaces?keyword=OpenShift%20Virtualization%20Operator'
    )
  })

  it('should render without message when message is not provided', () => {
    renderOperatorAlert({ message: undefined })

    expect(screen.getByText('Operator required')).toBeInTheDocument()
    expect(screen.queryByText('Test message')).not.toBeInTheDocument()
  })

  it('should render external link icon in action button', () => {
    renderOperatorAlert()

    const button = screen.getByRole('button', { name: /Install the operator/ })
    expect(button).toBeInTheDocument()

    // Check that the button has the external link icon
    const icon = button.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })
})
