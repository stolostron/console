/* Copyright Contributors to the Open Cluster Management project */

import { fireEvent, render, screen } from '@testing-library/react'
import { AcmCatalogView } from './AcmCatalogView'
import { ICatalogCard } from './catalogTypes'

const keyFn = (card: ICatalogCard) => card.id
const itemToCardFn = (card: ICatalogCard) => card

test('renders cards, a custom section, and working back and cancel buttons', () => {
  const onBack = jest.fn()
  const onCancel = jest.fn()
  const onCardClick = jest.fn()
  render(
    <AcmCatalogView
      items={[{ id: 'aws', title: 'Amazon Web Services', onClick: onCardClick }]}
      itemKeyFn={keyFn}
      itemToCardFn={itemToCardFn}
      onBack={onBack}
      onCancel={onCancel}
      customCatalogSection={<div>Additional providers</div>}
    />
  )

  fireEvent.click(screen.getByText('Amazon Web Services'))
  fireEvent.click(screen.getByRole('button', { name: 'Back' }))
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

  expect(onCardClick).toHaveBeenCalledTimes(1)
  expect(onBack).toHaveBeenCalledTimes(1)
  expect(onCancel).toHaveBeenCalledTimes(1)
  expect(screen.getByText('Additional providers')).toBeInTheDocument()
})

test('renders the translated empty state', () => {
  render(<AcmCatalogView items={[]} itemKeyFn={keyFn} itemToCardFn={itemToCardFn} />)

  expect(screen.getByText('No items yet')).toBeInTheDocument()
  expect(screen.getByText('To get started, create an item')).toBeInTheDocument()
})

test('paginates catalogs larger than ten cards', () => {
  const cards = Array.from({ length: 11 }, (_, index) => ({
    id: `card-${index + 1}`,
    title: `Card ${index + 1}`,
    onClick: jest.fn(),
  }))
  render(<AcmCatalogView items={cards} itemKeyFn={keyFn} itemToCardFn={itemToCardFn} />)

  expect(screen.getByText('Card 1')).toBeInTheDocument()
  expect(screen.queryByText('Card 11')).not.toBeInTheDocument()
  fireEvent.click(screen.getByLabelText('Go to next page'))
  expect(screen.queryByText('Card 1')).not.toBeInTheDocument()
  expect(screen.getByText('Card 11')).toBeInTheDocument()
})
