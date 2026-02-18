/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { AcmAlertList, AcmAlertListItem } from './AcmAlertList'

describe('AcmAlertList', () => {
  it('should render nothing when alerts array is empty', () => {
    const { container } = render(<AcmAlertList alerts={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('should render single alert', () => {
    const alerts: AcmAlertListItem[] = [
      {
        key: 'alert-1',
        variant: 'success',
        title: 'Success Alert',
        children: 'This is a success message',
      },
    ]

    render(<AcmAlertList alerts={alerts} />)

    expect(screen.getByText('Success Alert')).toBeInTheDocument()
    expect(screen.getByText('This is a success message')).toBeInTheDocument()
  })

  it('should render multiple alerts', () => {
    const alerts: AcmAlertListItem[] = [
      {
        key: 'alert-1',
        variant: 'success',
        title: 'Success Alert',
        children: 'Success message',
      },
      {
        key: 'alert-2',
        variant: 'warning',
        title: 'Warning Alert',
        children: 'Warning message',
      },
      {
        key: 'alert-3',
        variant: 'danger',
        title: 'Danger Alert',
        children: 'Error message',
      },
    ]

    render(<AcmAlertList alerts={alerts} />)

    expect(screen.getByText('Success Alert')).toBeInTheDocument()
    expect(screen.getByText('Warning Alert')).toBeInTheDocument()
    expect(screen.getByText('Danger Alert')).toBeInTheDocument()
  })

  it('should render inline alerts when isInline is true', () => {
    const alerts: AcmAlertListItem[] = [
      {
        key: 'alert-1',
        variant: 'info',
        title: 'Info Alert',
      },
    ]

    render(<AcmAlertList alerts={alerts} isInline />)

    expect(screen.getByText('Info Alert')).toBeInTheDocument()
  })

  it('should apply custom className and style to AlertGroup', () => {
    const alerts: AcmAlertListItem[] = [
      {
        key: 'alert-1',
        variant: 'info',
        title: 'Info Alert',
      },
    ]

    const { container } = render(
      <AcmAlertList alerts={alerts} className="custom-class" style={{ marginTop: '20px' }} />
    )

    const alertGroup = container.querySelector('[class*="alert-group"]')
    expect(alertGroup).toHaveClass('custom-class')
    expect(alertGroup).toHaveStyle({ marginTop: '20px' })
  })

  it('should pass through all AlertProps to individual alerts', () => {
    const alerts: AcmAlertListItem[] = [
      {
        key: 'alert-1',
        variant: 'info',
        title: 'Custom Alert',
        isExpandable: true,
        children: 'Expandable content',
      },
    ]

    render(<AcmAlertList alerts={alerts} />)

    expect(screen.getByText('Custom Alert')).toBeInTheDocument()
  })
})
