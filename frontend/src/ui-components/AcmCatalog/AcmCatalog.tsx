/* Copyright Contributors to the Open Cluster Management project */

import { AcmCatalogCard } from './AcmCatalogCard'
import { AcmCatalogGrid } from './AcmCatalogGrid'
import { CatalogItemAction, ICatalogCard } from './catalogTypes'

export function AcmCatalog({
  items,
  keyFn,
  itemToCardFn,
  cardWidth = 470,
  itemActions,
  showSelect = false,
  isSelected,
  selectItem,
  unselectItem,
}: Readonly<{
  items: ICatalogCard[]
  keyFn: (card: ICatalogCard) => string
  itemToCardFn: (card: ICatalogCard) => ICatalogCard
  cardWidth?: number
  itemActions?: CatalogItemAction[]
  showSelect?: boolean
  isSelected?: (card: ICatalogCard) => boolean
  selectItem?: (card: ICatalogCard) => void
  unselectItem?: (card: ICatalogCard) => void
}>) {
  return (
    <AcmCatalogGrid size={cardWidth}>
      {items.map((item) => {
        const selected = isSelected?.(item) ?? false
        return (
          <AcmCatalogCard
            key={keyFn(item)}
            card={itemToCardFn(item)}
            itemActions={itemActions}
            showSelect={showSelect}
            selected={selected}
            onSelect={() => (selected ? unselectItem?.(item) : selectItem?.(item))}
          />
        )
      })}
    </AcmCatalogGrid>
  )
}
