/* Copyright Contributors to the Open Cluster Management project */

import { fireEvent, render, screen } from '@testing-library/react'
import { PolicyCardDropdown } from './PolicyCardDropdown'

describe('PolicyCardDropdown', () => {
  test('renders toggle button when closed', async () => {
    const onOpenChange = jest.fn()
    render(<PolicyCardDropdown onView={() => {}} onOpenChange={onOpenChange} isOpen={false} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  test('dropdown menu is visible when isOpen is true', async () => {
    render(<PolicyCardDropdown onView={() => {}} onOpenChange={() => {}} isOpen={true} />)
    expect(screen.getByRole('menuitem', { name: 'View details' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument()
  })

  test('onOpenChange is called with true when toggle is clicked while closed', () => {
    const onOpenChange = jest.fn()
    render(<PolicyCardDropdown onView={() => {}} onOpenChange={onOpenChange} isOpen={false} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  test('onOpenChange is called with false when toggle is clicked while open', () => {
    const onOpenChange = jest.fn()
    render(<PolicyCardDropdown onView={() => {}} onOpenChange={onOpenChange} isOpen={true} />)
    const toggle = screen.getByRole('button', { expanded: true })
    fireEvent.click(toggle)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('onView is called when View details is clicked and menu closes', () => {
    const onView = jest.fn()
    const onOpenChange = jest.fn()
    render(<PolicyCardDropdown onView={onView} onOpenChange={onOpenChange} isOpen={true} />)
    fireEvent.click(screen.getByRole('menuitem', { name: 'View details' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onView).toHaveBeenCalled()
  })

  test('onEdit is called when Edit is clicked and user has permission', () => {
    const onEdit = jest.fn()
    const onOpenChange = jest.fn()
    render(<PolicyCardDropdown onView={() => {}} onEdit={onEdit} onOpenChange={onOpenChange} isOpen={true} />)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onEdit).toHaveBeenCalled()
  })

  test('onDelete is called when Delete is clicked and user has permission', () => {
    const onDelete = jest.fn()
    const onOpenChange = jest.fn()
    render(<PolicyCardDropdown onView={() => {}} onDelete={onDelete} onOpenChange={onOpenChange} isOpen={true} />)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onDelete).toHaveBeenCalled()
  })

  test('Edit menu item is disabled when onEdit is not provided', () => {
    render(<PolicyCardDropdown onView={() => {}} onOpenChange={() => {}} isOpen={true} />)
    const editItem = screen.getByRole('menuitem', { name: 'Edit' })
    expect(editItem).toHaveAttribute('aria-disabled', 'true')
  })

  test('Delete menu item is disabled when onDelete is not provided', () => {
    render(<PolicyCardDropdown onView={() => {}} onOpenChange={() => {}} isOpen={true} />)
    const deleteItem = screen.getByRole('menuitem', { name: 'Delete' })
    expect(deleteItem).toHaveAttribute('aria-disabled', 'true')
  })

  test('clicking disabled Edit does not throw', () => {
    render(<PolicyCardDropdown onView={() => {}} onOpenChange={() => {}} isOpen={true} />)
    const editItem = screen.getByRole('menuitem', { name: 'Edit' })
    expect(editItem).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(editItem)
  })
})
