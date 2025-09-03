/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { RoleAssignmentStatusComponent } from './RoleAssignmentStatusComponent'
import userEvent from '@testing-library/user-event'

describe('RoleAssignmentStatusComponent', () => {
  describe('properly rendered', () => {
    it('Active', () => {
      // Act
      render(<RoleAssignmentStatusComponent status={{ name: 'x', status: 'Active' }} />)

      // Assert
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(
        screen
          .getByRole('img', {
            hidden: true,
          })
          .children[0].getAttribute('d')
      ).toBe(
        'M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z'
      )
    })

    it('Error', () => {
      // Act
      render(<RoleAssignmentStatusComponent status={{ name: 'x', status: 'Error', reason: 'whatever the reason' }} />)

      // Assert
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(
        screen
          .getByRole('img', {
            hidden: true,
          })
          .children[0].getAttribute('d')
      ).toBe(
        'M504 256c0 136.997-111.043 248-248 248S8 392.997 8 256C8 119.083 119.043 8 256 8s248 111.083 248 248zm-248 50c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z'
      )
      expect(screen.queryByText('whatever the reason')).not.toBeInTheDocument()
    })

    it('Pending', () => {
      // Act
      render(<RoleAssignmentStatusComponent status={{ name: 'x', status: 'Pending' }} />)

      // Assert
      expect(screen.getByText('Pending')).toBeInTheDocument()
      expect(
        screen.getByRole('progressbar', {
          name: /role assignment being applied/i,
        })
      ).toBeInTheDocument()
      expect(screen.queryByText('Role assignment is being applied')).not.toBeInTheDocument()
    })

    it('undefined', () => {
      // Act
      render(<RoleAssignmentStatusComponent />)

      // Assert
      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })
  })

  describe('tooltips', () => {
    it('Error', () => {
      // Arrange
      render(<RoleAssignmentStatusComponent status={{ name: 'x', status: 'Error', reason: 'whatever the reason' }} />)

      // Act
      userEvent.hover(screen.getByText('Error'))

      // Assert
      expect(screen.getByText('whatever the reason')).toBeInTheDocument()
    })

    it('Pending', () => {
      // Arrange
      render(<RoleAssignmentStatusComponent status={{ name: 'x', status: 'Pending', reason: 'whatever the reason' }} />)

      // Act
      userEvent.hover(screen.getByText('Pending'))

      // Assert
      expect(screen.getByText('Role assignment is being applied')).toBeInTheDocument()
    })
  })
})
