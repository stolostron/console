/* Copyright Contributors to the Open Cluster Management project */
import { fireEvent, render, screen } from '@testing-library/react'
import AvailabilityOptionsForm from './AvailabilityOptionsForm'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('AvailabilityOptionsForm', () => {
  const mockHandleChange = jest.fn()
  const defaultProps = {
    control: {
      active: {
        controllerAvailabilityPolicy: 'HighlyAvailable' as const,
        infrastructureAvailabilityPolicy: 'HighlyAvailable' as const,
      },
    },
    handleChange: mockHandleChange,
  }

  it('Controller availability policy should have HighlyAvailable checked by default', () => {
    render(<AvailabilityOptionsForm {...defaultProps} />)
    const haRadio = screen.getByTestId('controller-ha')
    expect(haRadio).toBeChecked()
  })

  it('Controller availability policy should allow switching to SingleReplica', () => {
    render(<AvailabilityOptionsForm {...defaultProps} />)

    const singleRadio = screen.getByTestId('controller-single')
    fireEvent.click(singleRadio)

    expect(mockHandleChange).toHaveBeenCalledWith({
      active: {
        ...defaultProps.control.active,
        controllerAvailabilityPolicy: 'SingleReplica',
      },
    })
  })

  it('Infrastructure availability policy should have HighlyAvailable checked by default', () => {
    render(<AvailabilityOptionsForm {...defaultProps} />)
    const haRadio = screen.getByTestId('infra-ha')
    expect(haRadio).toBeChecked()
  })

  it('Infrastructure availability policy should allow switching to SingleReplica', () => {
    render(<AvailabilityOptionsForm {...defaultProps} />)
    const singleRadio = screen.getByTestId('infra-single')
    fireEvent.click(singleRadio)

    expect(mockHandleChange).toHaveBeenCalledWith({
      active: {
        ...defaultProps.control.active,
        infrastructureAvailabilityPolicy: 'SingleReplica',
      },
    })
  })
})
