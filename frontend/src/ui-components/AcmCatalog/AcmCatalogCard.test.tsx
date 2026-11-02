/* Copyright Contributors to the Open Cluster Management project */

import { fireEvent, render, screen } from '@testing-library/react'
import { AcmCatalogCard } from './AcmCatalogCard'
import { CatalogCardItemType } from './catalogTypes'

test('renders card details, labels, and alerts', () => {
  render(
    <AcmCatalogCard
      card={{
        id: 'aws',
        title: 'Amazon Web Services',
        badge: 'Recommended',
        labels: [{ label: 'Saved credentials' }],
        items: [
          { type: CatalogCardItemType.Description, description: 'Create on AWS' },
          { type: CatalogCardItemType.List, title: 'Features', items: [{ text: 'Hosted control plane' }] },
        ],
        alertTitle: 'Release images unavailable',
        alertContent: 'Add an image set',
        alertVariant: 'info',
        onClick: jest.fn(),
      }}
    />
  )

  expect(screen.getByText('Amazon Web Services')).toBeInTheDocument()
  expect(screen.getByText('Recommended')).toBeInTheDocument()
  expect(screen.getByText('Saved credentials')).toBeInTheDocument()
  expect(screen.getByText('Create on AWS')).toBeInTheDocument()
  expect(screen.getByText('Hosted control plane')).toBeInTheDocument()
  expect(screen.getByText('Release images unavailable')).toBeInTheDocument()
  expect(screen.getByText('Add an image set')).toBeInTheDocument()
})

test('opens Learn more without selecting the card', () => {
  const onCardClick = jest.fn()
  const open = jest.spyOn(window, 'open').mockImplementation(() => null)
  render(
    <AcmCatalogCard
      card={{ id: 'aws', title: 'Amazon Web Services', learnMore: 'https://example.com', onClick: onCardClick }}
    />
  )

  fireEvent.click(screen.getByRole('button', { name: 'Learn more' }))

  expect(open).toHaveBeenCalledWith('https://example.com', '_blank')
  expect(onCardClick).not.toHaveBeenCalled()
  open.mockRestore()
})
